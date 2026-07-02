import { useState, useEffect } from 'react';
import api from '../services/api';

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
        }));

      setQueue(mappedQueue);
    } catch (err) {
      console.error('Failed to fetch queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    // In a real app, you would set up an interval or socket listener here
    const interval = setInterval(fetchQueue, 30000);
    return () => clearInterval(interval);
  }, []);

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

  return { queue, loading, addToken, updateTokenStatus, refreshQueue: fetchQueue };
}

function mapStatus(status) {
  if (!status) return 'WAITING';
  switch (status.toLowerCase()) {
    case 'scheduled':
    case 'waiting': return 'WAITING';
    case 'in progress':
    case 'in consultation': return 'IN_CONSULTATION';
    case 'completed': return 'COMPLETED';
    default: return 'WAITING';
  }
}
