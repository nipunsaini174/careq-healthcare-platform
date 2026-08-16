import { useState, useEffect } from 'react';
import api from '../services/api';
import { useSocket } from '../contexts/SocketContext';

export function useQueue() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const response = await api.get('/receptionist/queue-activity?limit=50');
      const data = response.data.data || [];
      
      const now = new Date();
      const STANDARD_SLOT_MINS = 15;
      const formatTime = (d) => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

      const reversed = [...data]
        .filter(a => a.token !== null)
        .filter(a => {
          const ts = (a.token?.tokenStatus || '').toLowerCase();
          const as = (a.appointmentStatus || '').toLowerCase();
          return ts !== 'completed' && ts !== 'cancelled' && as !== 'completed' && as !== 'cancelled';
        })
        .reverse(); // FIFO order

      let runningTimeMs = now.getTime();
      const activeServing = reversed.find(a => mapStatus(a.token?.tokenStatus) === 'IN_CONSULTATION');
      if (activeServing) {
        const checkIn = activeServing.token?.checkInTime ? new Date(activeServing.token.checkInTime) : now;
        const elapsed = Math.max(0, Math.floor((now.getTime() - checkIn.getTime()) / 60000));
        const rem = Math.max(0, STANDARD_SLOT_MINS - elapsed);
        runningTimeMs = now.getTime() + (rem * 60000);
      }

      const mappedQueue = reversed.map((a, idx) => {
        const isCurrent = mapStatus(a.token?.tokenStatus) === 'IN_CONSULTATION';
        let estStart = now;
        let estEnd = new Date(now.getTime() + STANDARD_SLOT_MINS * 60000);
        let waitMins = 0;

        if (isCurrent) {
          estStart = a.token?.checkInTime ? new Date(a.token.checkInTime) : now;
          estEnd = new Date(estStart.getTime() + STANDARD_SLOT_MINS * 60000);
          waitMins = 0;
        } else {
          estStart = new Date(runningTimeMs);
          estEnd = new Date(runningTimeMs + STANDARD_SLOT_MINS * 60000);
          waitMins = Math.max(0, Math.round((runningTimeMs - now.getTime()) / 60000));
          runningTimeMs += (STANDARD_SLOT_MINS * 60000);
        }

        return {
          id: a.token.tokenId,
          appointmentId: a.appointmentId,
          patientId: a.patientUhid || a.patientId,
          patientName: a.patientName,
          tokenNumber: a.token.tokenCode || a.token.tokenId,
          status: mapStatus(a.token.tokenStatus),
          type: a.appointmentType || 'REGULAR',
          urgency: 'NORMAL',
          arrivalTime: a.appointmentDate,
          doctorName: a.doctorName,
          department: a.department,
          queuePosition: idx + 1,
          estimatedWaitMins: waitMins,
          scheduledStartTime: formatTime(estStart),
          scheduledEndTime: formatTime(estEnd),
          slotWindow: `${formatTime(estStart)} - ${formatTime(estEnd)}`,
          currentScore: (a.token.queuePosition || 1) * 10
        };
      });

      setQueue(mappedQueue);
    } catch (err) {
      console.error('Failed to fetch queue:', err);
    } finally {
      setLoading(false);
    }
  };

  const { socket } = useSocket();

  useEffect(() => {
    fetchQueue();

    const interval = setInterval(fetchQueue, 15000); // refresh every 15s to keep clock rolling
    
    if (!socket) {
      return () => clearInterval(interval);
    }
    
    socket.on('queue_updated', fetchQueue);
    socket.on('schedule_cascaded', fetchQueue);
    socket.on('consultation_completed', fetchQueue);
    socket.on('appointment_created', fetchQueue);
    socket.on('appointment_updated', fetchQueue);
    
    return () => {
      clearInterval(interval);
      socket.off('queue_updated', fetchQueue);
      socket.off('schedule_cascaded', fetchQueue);
      socket.off('consultation_completed', fetchQueue);
      socket.off('appointment_created', fetchQueue);
      socket.off('appointment_updated', fetchQueue);
    };
  }, [socket]);

  const addToken = () => {
    fetchQueue();
  };

  const updateTokenStatus = async (tokenId, newStatus) => {
    setQueue(prev => prev.map(token => 
      (token.id === tokenId || token.tokenNumber === tokenId) ? { ...token, status: newStatus } : token
    ));
    try {
      if (newStatus === 'COMPLETED' || newStatus === 'Completed') {
        await api.delete(`/receptionist/queue/${tokenId}`);
      }
    } catch (err) {
      console.error('Failed to update token status on server:', err);
    }
  };

  const removeToken = async (tokenId) => {
    if (!tokenId) return;
    try {
      // Optimistic update
      setQueue(prev => prev.filter(token => token.id !== tokenId && token.id !== String(tokenId) && token.tokenNumber !== tokenId));
      await api.delete(`/receptionist/queue/${tokenId}`);
    } catch (err) {
      console.error('Failed to remove token:', err);
    }
  };

  return { queue, loading, addToken, updateTokenStatus, removeToken, refreshQueue: fetchQueue };
}

function mapStatus(status) {
  if (!status) return 'WAITING';
  switch (status.toLowerCase()) {
    case 'scheduled':
    case 'waiting': return 'WAITING';
    case 'in progress':
    case 'in consultation': return 'IN_CONSULTATION';
    case 'completed': return 'COMPLETED';
    case 'cancelled': return 'CANCELLED_BY_PATIENT';
    default: return 'WAITING';
  }
}
