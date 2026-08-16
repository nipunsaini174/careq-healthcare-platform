import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useSocket } from '../contexts/SocketContext';

export function useAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/appointments');
      const list = response.data?.data || (Array.isArray(response.data) ? response.data : []);
      
      const mapped = list.map(a => ({
        id: String(a.id || a.appointment_id || ''),
        patientId: String(a.patientId || a.patient_id || ''),
        patient: a.patientName || a.patient || 'Patient',
        patientPhone: a.patientPhone || a.phone || 'N/A',
        patientEmail: a.patientEmail || a.email || 'N/A',
        patientUhid: a.patientUhid || (a.patientId ? `UHID-${a.patientId}` : 'N/A'),
        doctorId: String(a.doctorId || a.doctor_id || ''),
        doctor: a.doctorName || a.doctor || 'Doctor',
        department: a.department || 'General OPD',
        time: a.timeSlot || '10:00 AM',
        date: a.appointmentDate || new Date().toISOString(),
        status: a.status || 'Confirmed',
        type: a.type || 'Consultation',
        tokenCode: a.tokenCode || (a.id ? `A-${String(a.id).padStart(3, '0')}` : 'A-001'),
        queuePosition: a.queuePosition || null,
        tokenStatus: a.tokenStatus || null,
      }));

      setAppointments(mapped);
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkInAppointment = async (id) => {
    try {
      await api.patch(`/appointments/${id}/check-in`);
      setAppointments(prev => prev.map(a => a.id === String(id) ? { ...a, status: 'Checked In' } : a));
    } catch (err) {
      console.error('Check-in failed:', err);
      throw err;
    }
  };

  const cancelAppointment = async (id) => {
    try {
      await api.patch(`/appointments/${id}/cancel`);
      setAppointments(prev => prev.map(a => a.id === String(id) ? { ...a, status: 'Cancelled' } : a));
    } catch (err) {
      console.error('Cancel appointment failed:', err);
      throw err;
    }
  };

  const { socket } = useSocket();

  useEffect(() => {
    fetchAppointments();

    if (!socket) return;

    const handleAppointmentUpdated = (payload) => {
      if (!payload) return;
      const targetId = String(payload.appointmentId || payload.id || '');
      const newStatus = payload.status || (payload.tokenStatus === 'COMPLETED' ? 'Completed' : undefined);

      if (targetId && newStatus) {
        setAppointments(prev => prev.map(a => a.id === targetId ? { ...a, status: newStatus } : a));
      } else {
        fetchAppointments();
      }
    };

    const handleConsultationCompleted = (payload) => {
      const targetId = payload?.appointmentId ? String(payload.appointmentId) : null;
      if (targetId) {
        setAppointments(prev => prev.map(a => a.id === targetId ? { ...a, status: 'Completed' } : a));
      } else {
        fetchAppointments();
      }
    };

    // Socket listeners for real-time changes
    socket.on('appointment_created', fetchAppointments);
    socket.on('appointment_updated', handleAppointmentUpdated);
    socket.on('appointment_cancelled', handleAppointmentUpdated);
    socket.on('consultation_completed', handleConsultationCompleted);
    socket.on('schedule_cascaded', fetchAppointments);
    socket.on('queue_updated', fetchAppointments);
    socket.on('token_status_changed', fetchAppointments);

    // Keep live appointment clock aligned
    const interval = setInterval(fetchAppointments, 15000);

    return () => {
      clearInterval(interval);
      socket.off('appointment_created', fetchAppointments);
      socket.off('appointment_updated', handleAppointmentUpdated);
      socket.off('appointment_cancelled', handleAppointmentUpdated);
      socket.off('consultation_completed', handleConsultationCompleted);
      socket.off('schedule_cascaded', fetchAppointments);
      socket.off('queue_updated', fetchAppointments);
      socket.off('token_status_changed', fetchAppointments);
    };
  }, [socket, fetchAppointments]);

  return {
    appointments,
    loading,
    refreshAppointments: fetchAppointments,
    checkInAppointment,
    cancelAppointment,
    setAppointments,
  };
}
