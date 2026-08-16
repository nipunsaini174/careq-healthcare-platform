import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useSocket } from '../contexts/SocketContext';

export function usePatients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/receptionist/patients');
      const rawList = response.data?.data || (Array.isArray(response.data) ? response.data : []);
      
      const mappedPatients = rawList.map(p => {
        let formattedDate = 'Never';
        if (p.lastVisit) {
          try {
            const dateObj = new Date(p.lastVisit);
            if (!isNaN(dateObj.getTime())) {
              formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            }
          } catch {
            formattedDate = 'Never';
          }
        }

        return {
          id: p.uhid || (p.patientId ? `UHID-${p.patientId}` : `UHID-${Math.floor(1000 + Math.random() * 9000)}`),
          patientId: String(p.patientId || p.patient_id || p.id || ''),
          name: p.name || p.full_name || 'Patient',
          phone: p.phone && p.phone !== 'null' ? p.phone : 'N/A',
          email: p.email && p.email !== 'null' ? p.email : 'N/A',
          age: p.age || null,
          gender: p.gender || 'Not Specified',
          bloodGroup: p.bloodGroup || p.blood_group || 'Unknown',
          lastVisit: formattedDate,
          totalVisits: p.totalVisits ?? (p.visits || 1),
          doctor: p.doctorName || p.doctor || 'Unassigned',
          status: p.status || p.patient_status || 'Active',
          billingStatus: p.billingStatus || p.billing_status || 'Paid',
        };
      });

      setPatients(mappedPatients);
    } catch (err) {
      console.error('Failed to fetch patients:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const { socket } = useSocket();

  useEffect(() => {
    fetchPatients();

    if (!socket) return;
    
    // Listen for new patients, appointments, or queue events to refresh directory
    socket.on('patient_created', fetchPatients);
    socket.on('patient_updated', fetchPatients);
    socket.on('patient_deleted', fetchPatients);
    socket.on('appointment_created', fetchPatients);
    socket.on('appointment_updated', fetchPatients);
    socket.on('queue_updated', fetchPatients);
    
    return () => {
      socket.off('patient_created', fetchPatients);
      socket.off('patient_updated', fetchPatients);
      socket.off('patient_deleted', fetchPatients);
      socket.off('appointment_created', fetchPatients);
      socket.off('appointment_updated', fetchPatients);
      socket.off('queue_updated', fetchPatients);
    };
  }, [socket, fetchPatients]);

  return { patients, loading, refreshPatients: fetchPatients, setPatients };
}
