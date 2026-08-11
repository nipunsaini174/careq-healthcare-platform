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
      
      const mappedQueue = data
        .filter(a => a.token !== null) // Only show appointments with an active token
        .map(a => ({
          id: a.token.tokenId,
          patientId: a.patientUhid || a.patientId,
          patientName: a.patientName,
          tokenNumber: a.token.tokenCode || a.token.tokenId,
          status: mapStatus(a.token.tokenStatus),
          type: a.appointmentType || 'REGULAR',
          urgency: 'NORMAL',
          arrivalTime: a.appointmentDate,
          doctorName: a.doctorName,
          department: a.department,
          currentScore: (a.token.queuePosition || 1) * 10
        }))
        .reverse(); // Display in FIFO order (oldest first)

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

    // Fallback: refresh every 30s in case socket misses an event or connection drops
    const interval = setInterval(fetchQueue, 30000);
    
    if (!socket) {
      return () => clearInterval(interval);
    }
    
    socket.on('queue_updated', fetchQueue);
    socket.on('appointment_created', fetchQueue);
    socket.on('appointment_updated', fetchQueue);
    
    return () => {
      clearInterval(interval);
      socket.off('queue_updated', fetchQueue);
      socket.off('appointment_created', fetchQueue);
      socket.off('appointment_updated', fetchQueue);
    };
  }, [socket]);

  const addToken = () => {
    // This should ideally call a backend endpoint to generate a token
    // For now we just refresh
    fetchQueue();
  };

  const updateTokenStatus = async (tokenId, newStatus) => {
    // Ideally this calls a backend endpoint: api.put(`/tokens/${tokenId}/status`, { status: newStatus })
    // We update locally for immediate feedback
    setQueue(prev => prev.map(token => 
      token.id === tokenId ? { ...token, status: newStatus } : token
    ));
    // Note: To fully implement, we need a backend endpoint for this.
  };

  const removeToken = async (tokenId) => {
    try {
      await api.delete(`/receptionist/queue/${tokenId}`);
      // Optimistic update
      setQueue(prev => prev.filter(token => token.id !== tokenId));
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
