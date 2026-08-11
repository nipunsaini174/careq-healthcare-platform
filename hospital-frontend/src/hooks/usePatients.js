import { useState, useEffect } from 'react';
import api from '../services/api';
import { useSocket } from '../contexts/SocketContext';

export function usePatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await api.get('/receptionist/patients');
      const data = response.data.data || [];
      
      const mappedPatients = data.map(p => ({
        id: p.uhid || p.patientId,
        name: p.name,
        phone: p.phone,
        email: p.email,
        lastVisit: p.lastVisit ? new Date(p.lastVisit).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never',
        totalVisits: p.totalVisits,
        doctor: p.doctorName,
        status: p.status,
        billingStatus: p.billingStatus
      }));

      setPatients(mappedPatients);
    } catch (err) {
      console.error('Failed to fetch patients:', err);
    } finally {
      setLoading(false);
    }
  };

  const { socket } = useSocket();

  useEffect(() => {
    fetchPatients();

    if (!socket) return;
    
    // Listen for new patients or appointments to refresh the directory
    socket.on('patient_created', fetchPatients);
    socket.on('appointment_created', fetchPatients);
    socket.on('appointment_updated', fetchPatients);
    
    return () => {
      socket.off('patient_created', fetchPatients);
      socket.off('appointment_created', fetchPatients);
      socket.off('appointment_updated', fetchPatients);
    };
  }, [socket]);

  return { patients, loading, refreshPatients: fetchPatients, setPatients };
}
