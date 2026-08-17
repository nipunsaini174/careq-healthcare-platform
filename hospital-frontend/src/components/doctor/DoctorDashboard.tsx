"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useTheme } from './contexts/ThemeContext';
import { useSocket } from './contexts/SocketContext';
import api from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  User,
  Users,
  Clock,
  Search,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Award,
  X,
  Sun,
  Moon,
  Volume2,
  Play,
  RotateCcw,
  Check,
  ChevronRight,
  ClipboardList,
  Settings,
  LogOut,
  Camera,
  Target,
  GraduationCap,
  UserCircle,
  Stethoscope,
  Pill,
  Sparkles,
  Calendar,
  Phone,
  Mail,
  ShieldAlert,
  BrainCircuit,
  Loader2,
  ArrowRight,
  Copy,
  HeartPulse,
  RefreshCw,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth';

import { SidebarBrand } from '../shared/SidebarBrand';
import { FloatingNavigation } from '../shared/FloatingNavigation';

import { Doctor, Patient, ConsultationHistory } from './types';

export default function DashboardPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { socket, connected } = useSocket();

  // All doctors in hospital for switcher
  const [allDoctors, setAllDoctors] = useState<any[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('1');

  // Doctor & Patients state
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [queue, setQueue] = useState<Patient[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [completedPatientsList, setCompletedPatientsList] = useState<any[]>([]);
  const [activePatient, setActivePatient] = useState<Patient | null>(null);

  // Stats from backend
  const [serverTotalWaiting, setServerTotalWaiting] = useState<number>(0);
  const [serverTotalCompleted, setServerTotalCompleted] = useState<number>(0);
  const [serverTotalPatientsToday, setServerTotalPatientsToday] = useState<number>(0);

  // App UI State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'queue' | 'patients' | 'predictor' | 'profile'>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [loadingActivePatient, setLoadingActivePatient] = useState<boolean>(false);

  // Form inputs
  const [notesInput, setNotesInput] = useState<string>('');
  const [diagnosisInput, setDiagnosisInput] = useState<string>('Clinical Assessment');

  // Search/Filters state
  const [queueSearch, setQueueSearch] = useState<string>('');
  const [queueFilterType, setQueueFilterType] = useState<string>('ALL');
  const [queueFilterPriority, setQueueFilterPriority] = useState<string>('ALL');
  const [globalSearch, setGlobalSearch] = useState<string>('');

  // Selected EMR patient details modal
  const [selectedEMRPatient, setSelectedEMRPatient] = useState<Patient | null>(null);

  // AI Clinical Risk Predictor State
  const [calcForm, setCalcForm] = useState({
    diagnosis: 'Diabetes',
    severity: 'Moderate',
    chiefComplaint: '',
    symptoms: '',
    symptomsDuration: '3-7 days',
    daysSinceLastVisit: 14 as number | null,
    isFirstVisit: false,
    testName: 'HbA1c',
    testValue: 8.5,
    testAbnormal: true,
    medicationChanged: true,
    previousMissedFollowup: true,
  });
  const [calcResult, setCalcResult] = useState<any>(null);
  const [calcLoading, setCalcLoading] = useState<boolean>(false);
  const [copiedPlan, setCopiedPlan] = useState<boolean>(false);

  const handleRunDoctorPrediction = async (customPayload?: any) => {
    try {
      setCalcLoading(true);
      const payload = customPayload || calcForm;
      const res = await api.post('/retention/predict-followup', payload);
      if (res.data?.data) {
        setCalcResult(res.data.data);
        return res.data.data;
      }
    } catch (err) {
      console.error('Doctor follow-up prediction failed:', err);
    } finally {
      setCalcLoading(false);
    }
    return null;
  };

  const populatePredictorFromPatient = (p: Patient) => {
    let inferredDiag = 'Diabetes';
    const complaint = `${p.chiefComplaint || ''} ${p.reasonForVisit || ''} ${p.symptoms || ''}`.toLowerCase();
    if (complaint.includes('hypertension') || complaint.includes('bp') || complaint.includes('pressure')) inferredDiag = 'Hypertension';
    else if (complaint.includes('migraine') || complaint.includes('headache')) inferredDiag = 'Migraine';
    else if (complaint.includes('asthma') || complaint.includes('breath') || complaint.includes('chest') || complaint.includes('cough')) inferredDiag = 'Asthma';
    else if (complaint.includes('thyroid')) inferredDiag = 'Thyroid Disorder';
    else if (complaint.includes('cardiac') || complaint.includes('heart') || complaint.includes('angina')) inferredDiag = 'Cardiac Condition';
    else if (complaint.includes('diabetes') || complaint.includes('sugar')) inferredDiag = 'Diabetes';

    const updated = {
      diagnosis: inferredDiag,
      severity: p.severity || (p.priority === 'HIGH' ? 'High' : 'Moderate'),
      chiefComplaint: p.chiefComplaint || p.reasonForVisit || '',
      symptoms: p.symptoms || '',
      symptomsDuration: p.symptomsDuration || '3-7 days',
      daysSinceLastVisit: p.daysSinceLastVisit ?? 14,
      isFirstVisit: !!p.isFirstVisit,
      testName: inferredDiag === 'Diabetes' ? 'HbA1c' : inferredDiag === 'Hypertension' ? 'Blood Pressure' : 'CBC / Vitals',
      testValue: inferredDiag === 'Diabetes' ? 8.5 : inferredDiag === 'Hypertension' ? 145 : 12.0,
      testAbnormal: p.priority === 'HIGH' || !!p.severity?.toLowerCase().includes('high'),
      medicationChanged: true,
      previousMissedFollowup: (p.daysSinceLastVisit || 0) > 30,
    };
    setCalcForm(updated);
    handleRunDoctorPrediction(updated);
  };

  const applyRecommendationToNotes = () => {
    if (!calcResult) return;
    const recText = `\n[AI Follow-up Assessment]: Recommended interval ${calcResult.recommendedFollowup?.replace('_', ' ')} (${calcResult.priorityTier} Priority, Score ${calcResult.priorityScore}/100).\nClinical Rationale: ${calcResult.clinicalReason}\nDoctor Action: ${calcResult.doctorAlert || calcResult.receptionistAction}`;
    setNotesInput(prev => prev ? `${prev}\n${recText}` : recText.trim());
    alert('AI Follow-up assessment plan added to active consultation notes!');
  };

  type ProfileFormData = {
    name: string;
    credentials: string;
    department: string;
    room: string;
    focus: string;
    bio: string;
    awards: string;
  };

  const { register, handleSubmit, reset } = useForm<ProfileFormData>();

  // Session timer (clock countdown)
  const [sessionSeconds, setSessionSeconds] = useState<number>(9912); // 2h 45m 12s
  const [headerDate, setHeaderDate] = useState<string>('');
  const [greeting, setGreeting] = useState<string>('Good Morning');

  // 1. Fetch all doctors for selection
  const fetchDoctorsList = async () => {
    try {
      const res = await api.get('/doctors').catch(() => ({ data: [] }));
      const docs = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setAllDoctors(docs);
    } catch (err) {
      console.error('Error fetching doctors list', err);
    }
  };

  // 2. Fetch active doctor profile
  const fetchDoctor = async (docId?: string) => {
    try {
      const idToFetch = docId || selectedDoctorId || '1';
      const res = await api.get(`/doctors/profile?doctorId=${idToFetch}`).catch(() => null);
      if (res?.data) {
        const docData = {
          id: String(res.data.id || idToFetch),
          name: res.data.name?.startsWith('Dr.') ? res.data.name : `Dr. ${res.data.name || 'John Doe'}`,
          credentials: res.data.credentials || 'MD, FACC - Cardiology Specialist',
          department: res.data.department || 'Cardiology',
          room: res.data.room || res.data.opd || 'OPD-1',
          focus: res.data.focus || 'Interventional Cardiology',
          bio: res.data.bio || 'Dedicated clinical specialist.',
          awards: res.data.awards || 'Clinical Excellence Laureate',
          theme: 'light',
          clinicStatus: (res.data.clinicStatus || 'AVAILABLE') as 'AVAILABLE' | 'BREAK' | 'EMERGENCY',
        };
        setDoctor(docData);
        setSelectedDoctorId(docData.id);
        reset({
          name: docData.name,
          credentials: docData.credentials,
          department: docData.department,
          room: docData.room,
          focus: docData.focus,
          bio: docData.bio,
          awards: docData.awards,
        });
      }
    } catch (err) {
      console.error('Error fetching doctor profile', err);
    }
  };

  // 3. Fetch Live Queue for the selected doctor
  const fetchQueue = useCallback(async (docIdOverride?: string) => {
    try {
      const docId = docIdOverride || selectedDoctorId || doctor?.id || '1';
      const queueRes = await api.get(`/queue/doctor?doctorId=${docId}`).catch(() => ({ data: null }));

      const queueData = queueRes.data;

      if (!queueData) return;

      setServerTotalWaiting(queueData.totalWaiting ?? 0);
      setServerTotalCompleted(queueData.totalCompleted ?? 0);
      setServerTotalPatientsToday(queueData.totalPatientsToday ?? 0);

      const mappedQueue: Patient[] = [];
      let foundActive: Patient | null = null;

      // 1. Active In-Consultation Patient
      if (queueData.currentServing) {
        const cs = queueData.currentServing;

        foundActive = {
          id: String(cs.tokenId || cs.tokenCode),
          uhid: cs.uhid || `UHID-${cs.patientId || '1001'}`,
          tokenCode: cs.tokenCode || `#${cs.tokenId}`,
          name: cs.patientName || 'Patient',
          age: cs.age ? Number(cs.age) : 38,
          gender: cs.gender || 'Male',
          bloodGroup: cs.bloodGroup || 'B+',
          weight: '68 kg',
          phone: cs.patientPhone || 'N/A',
          email: cs.patientEmail || 'N/A',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          visitType: cs.visitType || 'OPD Consultation',
          waitTime: `${cs.elapsedMinutes || 0}m in session`,
          waitTimeMinutes: cs.elapsedMinutes || 0,
          priority: cs.priority || 'MEDIUM',
          status: 'IN_CONSULTATION',
          reasonForVisit: cs.chiefComplaint || 'Consultation & Follow-up',
          alerts: cs.allergies && cs.allergies !== 'No known allergies' ? cs.allergies : '',
          chiefComplaint: cs.chiefComplaint,
          symptoms: cs.symptoms,
          symptomsDuration: cs.symptomsDuration,
          severity: cs.severity,
          isFirstVisit: cs.isFirstVisit,
          daysSinceLastVisit: cs.daysSinceLastVisit,
          medications: cs.medications,
          medicalHistory: cs.medicalHistory,
          allergies: cs.allergies,
          intakeNotes: cs.intakeNotes,
          history: [
            {
              id: 'H1',
              patientId: String(cs.tokenId),
              date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              diagnosis: 'Clinical Consultation',
              note: cs.intakeNotes || 'Patient vitals stable. Undergoing consultation.'
            }
          ]
        };
        mappedQueue.push(foundActive);
      }

      // 2. Waiting Queue Patients
      if (Array.isArray(queueData.waitingQueue)) {
        queueData.waitingQueue.forEach((w: any, idx: number) => {
          const isNext = idx === 0 && !foundActive;

          mappedQueue.push({
            id: String(w.tokenId || w.tokenCode),
            uhid: w.uhid || `UHID-${w.patientId || '1001'}`,
            tokenCode: w.tokenCode || `#${w.tokenId}`,
            name: w.patientName,
            age: w.age ? Number(w.age) : 34 + idx * 4,
            gender: w.gender || (idx % 2 === 0 ? 'Female' : 'Male'),
            bloodGroup: w.bloodGroup || 'O+',
            weight: '72 kg',
            phone: w.patientPhone || 'N/A',
            email: w.patientEmail || 'N/A',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
            visitType: w.visitType || 'General Consultation',
            waitTime: w.slotWindow || `${w.estimatedWaitTime}m wait`,
            waitTimeMinutes: w.estimatedWaitTime,
            priority: w.priority || ((w.priorityScore > 50 || w.tokenType === 'EMERGENCY') ? 'HIGH' : 'MEDIUM'),
            status: isNext ? 'NEXT' : 'WAITING',
            reasonForVisit: w.chiefComplaint || 'Consultation & Follow-up',
            alerts: w.allergies && w.allergies !== 'No known allergies' ? w.allergies : '',
            chiefComplaint: w.chiefComplaint,
            symptoms: w.symptoms,
            symptomsDuration: w.symptomsDuration,
            severity: w.severity,
            isFirstVisit: w.isFirstVisit,
            daysSinceLastVisit: w.daysSinceLastVisit,
            medications: w.medications,
            medicalHistory: w.medicalHistory,
            allergies: w.allergies,
            intakeNotes: w.intakeNotes,
            history: []
          });
        });
      }

      if (Array.isArray(queueData.completedPatients)) {
        setCompletedPatientsList(queueData.completedPatients);
      }

      setQueue(mappedQueue);
      setActivePatient(foundActive);
      if (foundActive && !notesInput) {
        setNotesInput(foundActive.history[0]?.note || '');
      }
    } catch (err) {
      console.error('Error fetching doctor live queue:', err);
    }
  }, [selectedDoctorId, doctor?.id, notesInput]);

  const fetchPatients = async () => {
    try {
      const res = await api.get('/receptionist/patients').catch(() => api.get('/patients'));
      const list = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      const mapped = list.map((p: any, idx: number) => ({
        id: String(p.id || p.uhid || `P-${idx + 1}`),
        uhid: p.uhid || `UHID-${p.id || idx + 1}`,
        name: p.name || p.full_name || 'Patient',
        age: Number(p.age || 35),
        gender: p.gender || 'Not Specified',
        bloodGroup: p.blood || p.blood_group || 'O+',
        weight: '70 kg',
        phone: p.phone || 'N/A',
        email: p.email || 'N/A',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        visitType: p.dept || 'General',
        waitTime: 'Completed',
        waitTimeMinutes: 0,
        priority: 'MEDIUM' as const,
        status: (p.status === 'Active' ? 'COMPLETED' : 'WAITING'),
        reasonForVisit: 'General Checkup & Consultation',
        alerts: '',
        history: []
      }));
      setPatients(mapped);
    } catch (err) {
      console.error('Error fetching registry', err);
    }
  };

  useEffect(() => {
    fetchDoctorsList();
    fetchDoctor('1');
    fetchQueue('1');
    fetchPatients();
  }, []);

  // When selected doctor changes, re-fetch profile & queue
  const handleSelectDoctor = (newDocId: string) => {
    setSelectedDoctorId(newDocId);
    const found = allDoctors.find(d => String(d.id || d.doctor_id) === newDocId);
    if (found) {
      setDoctor({
        id: String(found.id || found.doctor_id),
        name: found.name?.startsWith('Dr.') ? found.name : `Dr. ${found.name || 'Doctor'}`,
        credentials: found.qualification || found.credentials || 'Specialist',
        department: found.dept || found.department || 'General',
        room: found.opd || found.room || 'OPD-1',
        focus: found.focus || found.specialization || '',
        bio: found.bio || '',
        awards: found.awards || '',
        theme: 'light',
        clinicStatus: 'AVAILABLE',
      });
    } else {
      fetchDoctor(newDocId);
    }
    fetchQueue(newDocId);
  };

  // 2. Real-time WebSockets synchronization
  useEffect(() => {
    if (!socket) return;

    const handleQueueSync = () => {
      fetchQueue(selectedDoctorId);
      fetchPatients();
    };

    socket.on('doctor:update', handleQueueSync);
    socket.on('doctor:statusChange', handleQueueSync);
    socket.on('queue:update', handleQueueSync);
    socket.on('queue_updated', handleQueueSync);
    socket.on('consultation_started', handleQueueSync);
    socket.on('consultation_completed', handleQueueSync);
    socket.on('schedule_cascaded', handleQueueSync);
    socket.on('token_status_changed', handleQueueSync);
    socket.on('token_created', handleQueueSync);
    socket.on('token_generated', handleQueueSync);
    socket.on('appointment_created', handleQueueSync);
    socket.on('appointment_updated', handleQueueSync);
    socket.on('patient_updated', handleQueueSync);
    socket.on('emergency_triggered', handleQueueSync);

    const interval = setInterval(() => fetchQueue(selectedDoctorId), 8000);

    return () => {
      clearInterval(interval);
      socket.off('doctor:update', handleQueueSync);
      socket.off('doctor:statusChange', handleQueueSync);
      socket.off('queue:update', handleQueueSync);
      socket.off('queue_updated', handleQueueSync);
      socket.off('consultation_started', handleQueueSync);
      socket.off('consultation_completed', handleQueueSync);
      socket.off('schedule_cascaded', handleQueueSync);
      socket.off('token_status_changed', handleQueueSync);
      socket.off('token_created', handleQueueSync);
      socket.off('token_generated', handleQueueSync);
      socket.off('appointment_created', handleQueueSync);
      socket.off('appointment_updated', handleQueueSync);
      socket.off('patient_updated', handleQueueSync);
      socket.off('emergency_triggered', handleQueueSync);
    };
  }, [socket, selectedDoctorId, fetchQueue]);

  // 3. Header clock and session timer loops
  useEffect(() => {
    const timer = setInterval(() => {
      if (doctor?.clinicStatus === 'BREAK') return;
      setSessionSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [doctor]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const optionsDate: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      setHeaderDate(now.toLocaleDateString('en-US', optionsDate));

      const hour = now.getHours();
      if (hour < 12) setGreeting('Good Morning');
      else if (hour < 17) setGreeting('Good Afternoon');
      else setGreeting('Good Evening');
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  // 4. Availability Status Toggle
  const toggleBreakState = async () => {
    if (!doctor) return;
    const nextStatus = doctor.clinicStatus === 'BREAK' ? 'AVAILABLE' : 'BREAK';
    setDoctor(prev => prev ? { ...prev, clinicStatus: nextStatus } : null);
    try {
      await api.put(`/doctors/${doctor.id}`, { status: nextStatus }).catch(() => {});
    } catch (err) {
      console.error(err);
    }
  };

  // 5. Emergency Warning Alert state
  const toggleEmergencyMode = async () => {
    if (!doctor) return;
    const nextStatus = doctor.clinicStatus === 'EMERGENCY' ? 'AVAILABLE' : 'EMERGENCY';
    setDoctor(prev => prev ? { ...prev, clinicStatus: nextStatus } : null);
    try {
      await api.put(`/doctors/${doctor.id}`, { status: nextStatus }).catch(() => {});
    } catch (err) {
      console.error(err);
    }
  };

  // 6. Patient Consultation Lifecycle
  const handleCallNext = async () => {
    setLoadingActivePatient(true);
    try {
      const docId = selectedDoctorId || doctor?.id || '1';
      await api.post('/queue/call-next', { doctorId: Number(docId) });
      await fetchQueue(docId);
    } catch (err: any) {
      console.error('Error calling next patient:', err);
    } finally {
      setLoadingActivePatient(false);
    }
  };

  const handleStartConsultationForPatient = async (patientId: string) => {
    setLoadingActivePatient(true);
    try {
      await api.put(`/queue/${patientId}/status`, { status: 'IN_PROGRESS' });
      await fetchQueue(selectedDoctorId);
    } catch (err: any) {
      console.error('Error starting patient consultation:', err);
    } finally {
      setLoadingActivePatient(false);
    }
  };

  const handleSaveDraftNotes = () => {
    alert('Draft clinical consultation notes saved.');
  };

  const handleCompleteConsultation = async () => {
    if (!activePatient) return;
    try {
      await api.put(`/queue/${activePatient.id}/complete`, {
        diagnosis: diagnosisInput,
        notes: notesInput
      });
      setNotesInput('');
      setDiagnosisInput('Clinical Assessment');
      await fetchQueue(selectedDoctorId);
    } catch (err: any) {
      console.error('Error completing consultation:', err);
    }
  };

  // Profile Save
  const onSaveProfile = async (data: ProfileFormData) => {
    try {
      await api.put('/doctors/profile', data);
      await fetchDoctor(selectedDoctorId);
      alert('Doctor profile details updated successfully!');
    } catch (err) {
      console.error('Failed to update doctor profile', err);
    }
  };

  // 8. Queue Filtered list mapping
  const getFilteredQueue = () => {
    let list = [...queue];

    if (queueSearch) {
      const query = queueSearch.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.id.toLowerCase().includes(query) ||
        p.uhid?.toLowerCase().includes(query) ||
        p.tokenCode?.toLowerCase().includes(query) ||
        p.chiefComplaint?.toLowerCase().includes(query) ||
        p.reasonForVisit.toLowerCase().includes(query)
      );
    }

    if (queueFilterType !== 'ALL') {
      list = list.filter(p => p.visitType.toLowerCase().includes(queueFilterType.toLowerCase()));
    }

    if (queueFilterPriority !== 'ALL') {
      list = list.filter(p => p.priority === queueFilterPriority);
    }

    return list;
  };

  // 9. Patients registry list mapping
  const getFilteredPatients = () => {
    if (!globalSearch) return patients;
    const query = globalSearch.toLowerCase();
    return patients.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.id.toLowerCase().includes(query) ||
      p.uhid?.toLowerCase().includes(query)
    );
  };

  // Stats calculation
  const waitingPatientsList = queue.filter(p => p.status === 'WAITING' || p.status === 'NEXT' || p.status === 'Scheduled');
  const waitingCount = waitingPatientsList.length > 0 ? waitingPatientsList.length : serverTotalWaiting;
  const completedCount = completedPatientsList.length > 0 ? completedPatientsList.length : serverTotalCompleted;
  const totalInQueue = queue.length;
  const totalPatientsToday = Math.max(serverTotalPatientsToday, completedCount + waitingCount + (activePatient ? 1 : 0));
  const emergenciesCount = queue.filter(p => p.priority === 'HIGH' && p.status !== 'COMPLETED').length + (doctor?.clinicStatus === 'EMERGENCY' ? 1 : 0);

  const completionRate = totalPatientsToday > 0 ? Math.round((completedCount / totalPatientsToday) * 100) : 0;
  const strokeOffset = 226 - (226 * completionRate) / 100;

  const nextWaitingPatient = waitingPatientsList[0];

  return (
    <div className={`doctor-dashboard flex h-screen overflow-hidden bg-bg-app text-text-primary font-sans ${theme === 'dark' ? 'dark-theme' : ''}`}>
      
      {/* Emergency Flash Banner */}
      {doctor?.clinicStatus === 'EMERGENCY' && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-red-600 text-white font-bold py-2 px-4 flex items-center justify-center gap-2 animate-pulse text-xs tracking-wider">
          <AlertTriangle className="w-4 h-4" />
          EMERGENCY CLINIC MODE ACTIVE • PRIORITY TRIAGE ENGAGED
        </div>
      )}

      {/* LEFT SIDEBAR (STICKY NAVIGATION) */}
      <aside className={`bg-white dark:bg-[#0F172A] border-r border-gray-100 dark:border-[#1E293B] flex flex-col flex-shrink-0 font-sans transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-[260px]'}`}>
        {/* Logo Brand Header */}
        <SidebarBrand appName="CareQ" role="DOCTOR PORTAL" collapsed={sidebarCollapsed} />

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {!sidebarCollapsed && (
            <p className="text-gray-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mb-4 px-2 transition-colors duration-200">Main Menu</p>
          )}

          {[
            { id: 'dashboard', label: 'Dashboard', icon: ClipboardList },
            { id: 'queue', label: 'Live Queue', icon: Users, badge: waitingCount },
            { id: 'patients', label: 'Patient Records', icon: FileText },
            { id: 'predictor', label: 'AI Risk Predictor', icon: BrainCircuit },
            { id: 'profile', label: 'My Profile', icon: User },
          ].map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as typeof activeTab)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
                  isActive
                    ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 font-semibold'
                    : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/50 hover:text-gray-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-teal-600 dark:text-teal-400' : 'text-gray-500 dark:text-slate-500'} />
                {!sidebarCollapsed && <span>{item.label}</span>}
                {isActive && !sidebarCollapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-500 dark:bg-teal-400 shadow-[0_0_8px_rgba(20,184,166,0.8)]" />
                )}
                {'badge' in item && item.badge !== undefined && item.badge > 0 && !sidebarCollapsed && (
                  <span className="ml-auto text-xs bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-400 px-2 py-0.5 rounded-full font-semibold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile & Collapse */}
        <div className="p-4 border-t border-gray-100 dark:border-[#1E293B] transition-colors duration-200">
          {!sidebarCollapsed && doctor && (
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/50 mb-3 transition-colors duration-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                  {doctor.name?.replace(/^Dr\.\s*/i, '').charAt(0) || 'D'}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-bold text-gray-800 dark:text-white truncate">{doctor.name}</p>
                  <p className="text-[10px] text-teal-600 dark:text-teal-400 truncate">{doctor.department} • {doctor.room}</p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="flex items-center justify-center w-full py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/50 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 transition-all duration-200 text-xs font-semibold"
          >
            <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${sidebarCollapsed ? '' : 'rotate-180'}`} />
            {!sidebarCollapsed && <span className="ml-2">Collapse Navigation</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* TOP HEADER */}
        <header className="bg-bg-card border-b border-border-color px-8 py-4 flex items-center justify-between z-10">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{greeting}, {doctor?.name?.split(',')[0]}</h1>
            <div className="flex items-center gap-2 text-xs text-text-secondary mt-0.5">
              <span>{headerDate}</span>
              <span className="w-1 h-1 rounded-full bg-text-muted" />
              <span className="font-semibold text-teal-600 dark:text-teal-400">{doctor?.department}</span>
              <span className="w-1 h-1 rounded-full bg-text-muted" />
              <span>{doctor?.room}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Doctor Switcher Dropdown */}
            {allDoctors.length > 0 && (
              <div className="flex items-center gap-1.5 bg-bg-app border border-border-color rounded-xl px-2.5 py-1.5 text-xs">
                <Stethoscope className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span className="text-[11px] text-text-secondary font-semibold">Doctor:</span>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => handleSelectDoctor(e.target.value)}
                  className="bg-transparent font-bold text-text-primary text-xs outline-none cursor-pointer"
                >
                  {allDoctors.map((doc) => (
                    <option key={doc.id || doc.doctor_id} value={String(doc.id || doc.doctor_id)} className="bg-white dark:bg-[#1A2332] text-gray-900 dark:text-white">
                      {doc.name} ({doc.dept || doc.specialization || 'General'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Availability Badge */}
            {doctor && (
              <button
                onClick={toggleBreakState}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold shadow-xs transition-all ${
                  doctor.clinicStatus === 'AVAILABLE'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                    : doctor.clinicStatus === 'BREAK'
                    ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                    : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${
                  doctor.clinicStatus === 'AVAILABLE' ? 'bg-emerald-500 animate-pulse' : doctor.clinicStatus === 'BREAK' ? 'bg-amber-500' : 'bg-red-500'
                }`} />
                <span>{doctor.clinicStatus === 'AVAILABLE' ? 'Available' : doctor.clinicStatus === 'BREAK' ? 'On Break' : 'Emergency Mode'}</span>
              </button>
            )}

            {/* Session Timer */}
            <div className="flex items-center gap-2 text-xs text-text-secondary border border-border-color px-3 py-1.5 rounded-full bg-bg-app">
              <Clock className="w-3.5 h-3.5 text-text-secondary" />
              <span>Session: <strong className="text-text-primary">{formatTimer(sessionSeconds)}</strong></span>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-border-color hover:bg-primary/5 transition-all text-text-secondary hover:text-text-primary"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* CONTAINER SCROLL CONTENT */}
        <div className="flex-1 overflow-y-auto p-8">
          
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-3 gap-8"
              >
                {/* Left Columns (65%) */}
                <div className="col-span-2 flex flex-col gap-6">
                  
                  {/* ACTIVE CONSULTATION CARD */}
                  <div className="bg-bg-card rounded-2xl border border-border-color p-6 shadow-xs">
                    <div className="flex justify-between items-center border-b border-border-color pb-4 mb-4">
                      <div className="flex items-center gap-2">
                        <User className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                        <h2 className="font-bold text-lg">Current Active Consultation</h2>
                      </div>
                      {activePatient && (
                        <span className="text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 px-3 py-1 rounded-full">
                          Token: {activePatient.tokenCode || activePatient.id} • {activePatient.visitType}
                        </span>
                      )}
                    </div>

                    {loadingActivePatient ? (
                      <div className="py-12 flex flex-col items-center justify-center gap-4">
                        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-text-secondary">Retrieving next clinical EMR profile...</span>
                      </div>
                    ) : activePatient ? (
                      <div className="flex flex-col gap-5">
                        
                        {/* Patient Identity details */}
                        <div className="flex justify-between items-start bg-bg-app p-4 rounded-xl border border-border-color">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-xl font-bold">{activePatient.name}</h3>
                              <span className="text-xs font-mono font-bold px-2 py-0.5 bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 rounded-md">
                                {activePatient.tokenCode || activePatient.id}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-text-secondary mt-1">
                              <span>{activePatient.age} Yrs • {activePatient.gender}</span>
                              <span className="w-1 h-1 rounded-full bg-text-muted" />
                              <span>Blood: <strong>{activePatient.bloodGroup}</strong></span>
                              <span className="w-1 h-1 rounded-full bg-text-muted" />
                              <span>UHID: {activePatient.uhid || activePatient.id}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 border border-emerald-500/20">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                              In Consultation
                            </span>
                            <span className="text-xs text-text-secondary block mt-1">{activePatient.waitTime}</span>
                          </div>
                        </div>

                        {/* PRE-CONSULTATION INTAKE FORM SUMMARY (Filled at Booking) */}
                        {(activePatient.chiefComplaint || activePatient.symptoms || activePatient.daysSinceLastVisit !== null) && (
                          <div className="bg-gradient-to-r from-teal-50/70 to-blue-50/70 dark:from-teal-950/30 dark:to-blue-950/30 border border-teal-200/80 dark:border-teal-800/50 rounded-xl p-4 space-y-2.5">
                            <div className="flex items-center justify-between border-b border-teal-200/50 dark:border-teal-800/40 pb-2">
                              <h4 className="text-xs font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1.5 uppercase tracking-wider">
                                <FileText className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                                Patient Intake Form & Visit Timeline
                              </h4>
                              <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-white/80 dark:bg-teal-900/50 px-2 py-0.5 rounded-full">
                                {activePatient.isFirstVisit ? '⭐ First Visit' : `🔄 Last visited ${activePatient.daysSinceLastVisit || 7}d ago`}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div>
                                <span className="text-[10px] font-bold text-text-secondary block">CHIEF COMPLAINT:</span>
                                <p className="font-semibold text-text-primary">{activePatient.chiefComplaint || activePatient.reasonForVisit}</p>
                                {activePatient.symptomsDuration && (
                                  <span className="text-[11px] text-purple-700 dark:text-purple-300 font-medium">
                                    Duration: {activePatient.symptomsDuration} (Severity: {activePatient.severity || 'Moderate'})
                                  </span>
                                )}
                              </div>

                              <div>
                                <span className="text-[10px] font-bold text-text-secondary block">MEDICATIONS & ALLERGIES:</span>
                                <p className="text-[11px] text-text-primary">
                                  💊 Meds: <span className="font-medium">{activePatient.medications || 'None reported'}</span>
                                </p>
                                <p className="text-[11px] text-red-600 dark:text-red-400 font-medium">
                                  ⚠️ Allergies: {activePatient.allergies || 'No known allergies'}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Progress Steps */}
                        <div className="flex justify-between items-center py-2 px-6 relative mt-1">
                          <div className="absolute top-1/2 left-0 right-0 h-1 bg-border-color -translate-y-1/2 z-0" />
                          <div className="absolute top-1/2 left-0 right-1/2 h-1 bg-teal-500 -translate-y-1/2 z-0" />

                          {['Check-in', 'Vitals', 'Assessment', 'Prescribe'].map((step, idx) => {
                            const isCompleted = idx < 2;
                            const isActive = idx === 2;
                            return (
                              <div key={idx} className="flex flex-col items-center gap-1.5 z-10">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 font-bold text-xs ${
                                  isCompleted
                                    ? 'bg-teal-500 border-teal-500 text-white'
                                    : isActive
                                    ? 'bg-white dark:bg-[#1A2332] border-teal-500 text-teal-600 dark:text-teal-400'
                                    : 'bg-white dark:bg-[#1A2332] border-border-color text-text-secondary'
                                }`}>
                                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                                </div>
                                <span className={`text-[11px] font-bold ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-text-secondary'}`}>{step}</span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Notes Input Area */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Clinical Consultation Notes</label>
                          <textarea
                            value={notesInput}
                            onChange={(e) => setNotesInput(e.target.value)}
                            placeholder="Record diagnosis, prescription, lab investigations, or clinical assessment notes..."
                            rows={3}
                            className="bg-bg-app border border-border-color rounded-xl p-3 text-xs focus:outline-none focus:border-teal-500 transition"
                          />
                        </div>

                        {/* Footer button controls */}
                        <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
                          <button
                            onClick={() => {
                              populatePredictorFromPatient(activePatient);
                              setActiveTab('predictor');
                            }}
                            className="flex items-center gap-1.5 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/50 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-700/60 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
                          >
                            <BrainCircuit className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                            AI Predict Follow-up
                          </button>
                          <button
                            onClick={() => setSelectedEMRPatient(activePatient)}
                            className="flex items-center gap-2 border border-border-color hover:bg-teal-50 dark:hover:bg-teal-950/30 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            View EMR File
                          </button>
                          <button
                            onClick={handleSaveDraftNotes}
                            className="border border-border-color hover:bg-bg-app px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
                          >
                            Save Draft
                          </button>
                          <button
                            onClick={handleCompleteConsultation}
                            className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700 px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-teal-500/20 transition cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Complete Consultation & Checkout
                          </button>
                        </div>

                      </div>
                    ) : (
                      <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
                        <div className="bg-bg-app p-4 rounded-full text-text-secondary border border-border-color">
                          <ClipboardList className="w-8 h-8 text-teal-600 dark:text-teal-400" />
                        </div>
                        <div>
                          <h3 className="font-bold text-base">Workstation Ready</h3>
                          {nextWaitingPatient ? (
                            <p className="text-xs text-text-secondary mt-1">
                              Next in queue: <strong className="text-text-primary">{nextWaitingPatient.name}</strong> (Token: <strong className="text-teal-600 dark:text-teal-400">{nextWaitingPatient.tokenCode}</strong>) — {nextWaitingPatient.reasonForVisit}
                            </p>
                          ) : (
                            <p className="text-xs text-text-secondary mt-1">All current patient consultations are completed. Queue is clear.</p>
                          )}
                        </div>
                        <button
                          onClick={handleCallNext}
                          disabled={loadingActivePatient}
                          className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700 px-6 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-teal-500/25 transition mt-2 flex items-center gap-2 cursor-pointer"
                        >
                          <Play className="w-4 h-4" />
                          {nextWaitingPatient ? `Call Next Patient (${nextWaitingPatient.tokenCode || 'Queue #1'})` : 'Call Next Patient'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* LIVE QUEUE PREVIEW ON DASHBOARD */}
                  <div className="bg-bg-card rounded-2xl border border-border-color p-5 shadow-xs">
                    <div className="flex items-center justify-between border-b border-border-color pb-3 mb-3">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        <h3 className="font-bold text-sm">Today&apos;s Live Queue for {doctor?.name}</h3>
                      </div>
                      <button
                        onClick={() => setActiveTab('queue')}
                        className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline"
                      >
                        View Full Queue ({waitingCount}) →
                      </button>
                    </div>

                    <div className="space-y-2">
                      {waitingPatientsList.slice(0, 3).map((p, idx) => (
                        <div key={p.id} className="flex items-center justify-between p-3 bg-bg-app rounded-xl border border-border-color">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold text-xs flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs">{p.name}</span>
                                <span className="text-[10px] font-mono bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 px-1.5 py-0.5 rounded font-bold">
                                  {p.tokenCode || p.id}
                                </span>
                              </div>
                              <p className="text-[10px] text-text-secondary">
                                {p.chiefComplaint || p.reasonForVisit} • {p.age}y/{p.gender}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-text-secondary font-medium">{p.waitTime}</span>
                            <button
                              onClick={() => handleStartConsultationForPatient(p.id)}
                              className="px-2.5 py-1 rounded-lg bg-teal-500 hover:bg-teal-600 text-white font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
                            >
                              <Play className="w-3 h-3" /> Call
                            </button>
                          </div>
                        </div>
                      ))}

                      {waitingPatientsList.length === 0 && (
                        <p className="text-xs text-text-secondary text-center py-4">No patients currently waiting in queue.</p>
                      )}
                    </div>
                  </div>

                </div>

                {/* Right Columns (35%) */}
                <div className="flex flex-col gap-6">
                  
                  {/* KPI Overview Grid */}
                  <div className="grid grid-cols-2 gap-3.5">
                    
                    {/* Waiting Patients */}
                    <div className="bg-bg-card border border-border-color rounded-2xl p-4 shadow-xs flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-text-secondary">
                        <span className="text-xs font-semibold">Waiting in Queue</span>
                        <Users className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">{waitingCount}</div>
                        <span className="text-[10px] text-text-secondary font-medium">Estimated wait: ~{waitingCount * 15}m</span>
                      </div>
                    </div>

                    {/* Completed */}
                    <div className="bg-bg-card border border-border-color rounded-2xl p-4 shadow-xs flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-text-secondary">
                        <span className="text-xs font-semibold">Completed Today</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{completedCount}</div>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Consultations done</span>
                      </div>
                    </div>

                    {/* Total Patients Today */}
                    <div className="bg-bg-card border border-border-color rounded-2xl p-4 shadow-xs flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-text-secondary">
                        <span className="text-xs font-semibold">Total Patients Today</span>
                        <Activity className="w-4 h-4 text-blue-500" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{totalPatientsToday}</div>
                        <span className="text-[10px] text-text-secondary font-medium">Scheduled & Walk-ins</span>
                      </div>
                    </div>

                    {/* Emergencies */}
                    <div className="bg-bg-card border border-border-color rounded-2xl p-4 shadow-xs flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-text-secondary">
                        <span className="text-xs font-semibold">Emergencies / High</span>
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      </div>
                      <div>
                        <div className={`text-2xl font-bold ${emergenciesCount > 0 ? 'text-red-500' : ''}`}>{emergenciesCount}</div>
                        <span className={`text-[10px] font-bold ${emergenciesCount > 0 ? 'text-red-500 animate-pulse' : 'text-text-secondary'}`}>
                          {emergenciesCount > 0 ? 'Priority Triage' : 'Standard Level'}
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Quick Action Control */}
                  <div className="bg-bg-card border border-border-color rounded-2xl p-5 shadow-xs">
                    <h2 className="font-bold text-sm border-b border-border-color pb-2.5 mb-3 flex items-center gap-2">
                      <Settings className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      Workstation Control
                    </h2>
                    
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        onClick={handleCallNext}
                        className="flex flex-col items-center justify-center p-3 rounded-xl border border-border-color hover:bg-teal-50 dark:hover:bg-teal-950/30 transition font-bold text-xs gap-1.5 cursor-pointer text-teal-700 dark:text-teal-300"
                      >
                        <Play className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        Call Next Patient
                      </button>

                      <button
                        onClick={toggleBreakState}
                        className="flex flex-col items-center justify-center p-3 rounded-xl border border-border-color hover:bg-amber-50 dark:hover:bg-amber-950/30 transition font-bold text-xs gap-1.5 cursor-pointer text-amber-700 dark:text-amber-300"
                      >
                        <RotateCcw className="w-4 h-4 text-amber-500" />
                        {doctor?.clinicStatus === 'BREAK' ? 'Resume Session' : 'Start Break'}
                      </button>

                      <button
                        onClick={toggleEmergencyMode}
                        className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/30 transition font-bold text-xs gap-1 col-span-2 text-red-500 cursor-pointer"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        {doctor?.clinicStatus === 'EMERGENCY' ? 'Disable Emergency Mode' : 'Trigger Emergency Priority'}
                      </button>
                    </div>
                  </div>

                  {/* Today's Session Summary */}
                  <div className="bg-bg-card border border-border-color rounded-2xl p-5 shadow-xs">
                    <h2 className="font-bold text-sm border-b border-border-color pb-2.5 mb-3">Today&apos;s OPD Performance</h2>
                    
                    <div className="flex items-center gap-5">
                      {/* Radial Progress Circle */}
                      <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                        <svg className="w-full h-full -rotate-90">
                          <circle className="text-border-color" strokeWidth="5" stroke="currentColor" fill="transparent" r="28" cx="32" cy="32" />
                          <circle
                            className="text-teal-500 transition-all duration-500"
                            strokeWidth="5"
                            strokeDasharray="176"
                            strokeDashoffset={176 - (176 * completionRate) / 100}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r="28"
                            cx="32"
                            cy="32"
                          />
                        </svg>
                        <span className="absolute text-xs font-bold text-text-primary">{completionRate}%</span>
                      </div>

                      <div className="flex-1 flex flex-col gap-1 text-xs">
                        <div className="flex justify-between border-b border-border-color/40 pb-0.5">
                          <span className="text-text-secondary font-medium">Total Booked:</span>
                          <span className="font-bold">{totalPatientsToday}</span>
                        </div>
                        <div className="flex justify-between border-b border-border-color/40 pb-0.5">
                          <span className="text-text-secondary font-medium">Completed:</span>
                          <span className="font-bold text-emerald-600">{completedCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary font-medium">Remaining:</span>
                          <span className="font-bold text-teal-600">{waitingCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

            {/* TAB 2: ACTIVE QUEUE */}
            {activeTab === 'queue' && (
              <motion.div
                key="queue"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="bg-bg-card rounded-2xl border border-border-color p-6 shadow-xs"
              >
                <div className="flex justify-between items-center border-b border-border-color pb-4 mb-5">
                  <div>
                    <h2 className="font-bold text-lg">Active Patient Queue — {doctor?.name} ({doctor?.department})</h2>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Showing {getFilteredQueue().length} pending patient tokens in live queue.
                    </p>
                  </div>
                  <button
                    onClick={handleCallNext}
                    className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" /> Call Next in Line
                  </button>
                </div>

                {/* Filters Row */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      type="text"
                      placeholder="Search by name, token ID or complaint..."
                      value={queueSearch}
                      onChange={(e) => setQueueSearch(e.target.value)}
                      className="w-full bg-bg-app border border-border-color rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-teal-500 transition"
                    />
                  </div>

                  <select
                    value={queueFilterType}
                    onChange={(e) => setQueueFilterType(e.target.value)}
                    className="bg-bg-app border border-border-color rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">All Visit Types</option>
                    <option value="Consultation">OPD Consultation</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Urgent">Emergency</option>
                  </select>

                  <select
                    value={queueFilterPriority}
                    onChange={(e) => setQueueFilterPriority(e.target.value)}
                    className="bg-bg-app border border-border-color rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">All Priorities</option>
                    <option value="HIGH">High Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="LOW">Low Priority</option>
                  </select>
                </div>

                {/* Queue Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border-color text-xxs uppercase tracking-wider text-text-secondary font-bold">
                        <th className="pb-3 pl-3">Queue #</th>
                        <th className="pb-3">Token</th>
                        <th className="pb-3">Patient Details</th>
                        <th className="pb-3">Chief Complaint & Symptoms</th>
                        <th className="pb-3">Visit Timeline</th>
                        <th className="pb-3">Wait Time</th>
                        <th className="pb-3">Priority</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right pr-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs font-medium">
                      {getFilteredQueue().map((patient, idx) => (
                        <tr key={patient.id} className="border-b border-border-color/60 hover:bg-bg-app/40 transition">
                          <td className="py-3.5 pl-3 text-text-secondary font-bold">#{idx + 1}</td>
                          <td className="py-3.5 font-mono font-bold text-teal-600 dark:text-teal-400">
                            {patient.tokenCode || patient.id}
                          </td>
                          <td className="py-3.5">
                            <div>
                              <div className="font-bold text-text-primary">{patient.name}</div>
                              <div className="text-[10px] text-text-secondary">
                                {patient.age} Yrs • {patient.gender} • UHID: {patient.uhid}
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 max-w-[200px]">
                            <p className="font-semibold text-text-primary truncate">{patient.chiefComplaint || patient.reasonForVisit}</p>
                            {patient.symptomsDuration && (
                              <p className="text-[10px] text-text-secondary truncate">
                                {patient.symptomsDuration} (Severity: {patient.severity || 'Moderate'})
                              </p>
                            )}
                          </td>
                          <td className="py-3.5">
                            <span className="text-[11px] font-semibold text-text-primary">
                              {patient.isFirstVisit ? '⭐ First Visit' : `Last: ${patient.daysSinceLastVisit || 7}d ago`}
                            </span>
                          </td>
                          <td className="py-3.5 text-text-secondary">{patient.waitTime}</td>
                          <td className="py-3.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              patient.priority === 'HIGH'
                                ? 'bg-red-500/15 text-red-500'
                                : patient.priority === 'MEDIUM'
                                ? 'bg-amber-500/15 text-amber-500'
                                : 'bg-emerald-500/15 text-emerald-500'
                            }`}>
                              {patient.priority}
                            </span>
                          </td>
                          <td className="py-3.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              patient.status === 'IN_CONSULTATION'
                                ? 'bg-emerald-100 text-emerald-700'
                                : patient.status === 'NEXT'
                                ? 'bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300'
                                : 'bg-bg-app border border-border-color text-text-secondary'
                            }`}>
                              {patient.status}
                            </span>
                          </td>
                          <td className="py-3.5 text-right pr-3">
                            <div className="flex items-center justify-end gap-1.5">
                              {patient.status !== 'IN_CONSULTATION' && (
                                <button
                                  onClick={() => handleStartConsultationForPatient(patient.id)}
                                  className="px-2.5 py-1 rounded-lg bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                  title="Call this patient into consultation"
                                >
                                  <Play className="w-3 h-3" /> Call
                                </button>
                              )}
                              <button
                                onClick={async () => {
                                  try {
                                    await api.put(`/queue/${patient.id}/emergency`);
                                    await fetchQueue(selectedDoctorId);
                                  } catch (e) {
                                    console.error(e);
                                  }
                                }}
                                className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-500 transition cursor-pointer"
                                title="Mark Priority Emergency"
                              >
                                <AlertTriangle className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setSelectedEMRPatient(patient)}
                                className="p-1.5 rounded-lg border border-border-color hover:bg-teal-50 dark:hover:bg-teal-950 text-text-secondary hover:text-teal-600 transition cursor-pointer"
                                title="View Intake & EMR Details"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {getFilteredQueue().length === 0 && (
                        <tr>
                          <td colSpan={9} className="py-12 text-center text-text-secondary">
                            No patients found matching the criteria in doctor&apos;s queue.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* TAB 3: PATIENTS DIRECTORY */}
            {activeTab === 'patients' && (
              <motion.div
                key="patients"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-6"
              >
                <div className="bg-bg-card rounded-2xl border border-border-color p-6 shadow-xs flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-bold text-lg">Hospital Patient Directory & Consultation History</h2>
                    <p className="text-xs text-text-secondary mt-0.5">Search or select a patient to pull their full Clinical Intake & EHR record.</p>
                  </div>
                  <div className="relative w-72">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      type="text"
                      placeholder="Search by name, phone or UHID..."
                      value={globalSearch}
                      onChange={(e) => setGlobalSearch(e.target.value)}
                      className="w-full bg-bg-app border border-border-color rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-teal-500 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {getFilteredPatients().map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedEMRPatient(p)}
                      className="bg-bg-card border border-border-color hover:border-teal-500 rounded-2xl p-4 transition-all cursor-pointer shadow-xs hover:shadow-md"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold text-sm flex items-center justify-center">
                          {p.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm">{p.name}</h4>
                          <p className="text-[11px] text-text-secondary">{p.age} Yrs • {p.gender} • Blood: {p.bloodGroup}</p>
                        </div>
                      </div>
                      <div className="text-[11px] text-text-secondary border-t border-border-color/60 pt-2 flex justify-between">
                        <span>UHID: <strong>{p.uhid || p.id}</strong></span>
                        <span className="text-teal-600 dark:text-teal-400 font-semibold">View Record →</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* TAB: AI CLINICAL RISK & FOLLOW-UP PREDICTOR */}
            {activeTab === 'predictor' && (
              <motion.div
                key="predictor"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-6"
              >
                {/* Header Banner */}
                <div className="bg-bg-card border border-border-color rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-600 dark:text-teal-400 shadow-2xs shrink-0">
                      <BrainCircuit size={28} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl font-black text-text-primary">AI Clinical Risk & Follow-up Predictor</h2>
                        <span className="bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 border border-teal-200 dark:border-teal-800">
                          <Sparkles size={10} /> 500 Records Trained
                        </span>
                        <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          Doctor Decision Support
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary font-medium mt-1">
                        Predicts optimal follow-up timeline, clinical risk tier, and staff outreach urgency using longitudinal patient parameters.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRunDoctorPrediction()}
                      disabled={calcLoading}
                      className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-teal-500/20 disabled:opacity-50 cursor-pointer"
                    >
                      {calcLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      Re-run Prediction
                    </button>
                  </div>
                </div>

                {/* Quick-Fill From Active Patient & Queue */}
                <div className="bg-bg-card border border-border-color rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-text-secondary">
                    <User className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>Quick-Fill from Live Patients:</span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {activePatient && (
                      <button
                        onClick={() => populatePredictorFromPatient(activePatient)}
                        className="px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-xs font-bold hover:bg-teal-100 dark:hover:bg-teal-900/60 transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        In-Consultation: {activePatient.name} ({activePatient.tokenCode || activePatient.id})
                      </button>
                    )}

                    {waitingPatientsList.slice(0, 3).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => populatePredictorFromPatient(p)}
                        className="px-2.5 py-1.5 rounded-xl bg-bg-app border border-border-color hover:border-teal-500 text-text-primary text-xs font-medium transition cursor-pointer"
                      >
                        {p.name} ({p.tokenCode || p.id})
                      </button>
                    ))}

                    <button
                      onClick={() => {
                        const resetVal = {
                          diagnosis: 'Diabetes',
                          severity: 'Moderate',
                          chiefComplaint: '',
                          symptoms: '',
                          symptomsDuration: '3-7 days',
                          daysSinceLastVisit: 14,
                          isFirstVisit: false,
                          testName: 'HbA1c',
                          testValue: 8.5,
                          testAbnormal: true,
                          medicationChanged: true,
                          previousMissedFollowup: true,
                        };
                        setCalcForm(resetVal);
                        handleRunDoctorPrediction(resetVal);
                      }}
                      className="px-2.5 py-1.5 rounded-xl border border-border-color text-text-secondary hover:text-text-primary text-xs font-medium transition cursor-pointer"
                    >
                      Reset Form
                    </button>
                  </div>
                </div>

                {/* 2-Column Prediction Workbench */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Left Column: Form Controls (7 Cols) */}
                  <div className="lg:col-span-7 bg-bg-card rounded-2xl border border-border-color p-6 shadow-xs flex flex-col gap-4">
                    <div className="border-b border-border-color pb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Stethoscope className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        <h3 className="font-bold text-sm">Clinical Diagnostic & Longitudinal Parameters</h3>
                      </div>
                      <span className="text-[11px] text-text-secondary">All fields feed the ML Decision Matrix</span>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleRunDoctorPrediction();
                      }}
                      className="space-y-4 text-xs"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-text-secondary font-bold mb-1">Primary Clinical Diagnosis</label>
                          <select
                            value={calcForm.diagnosis}
                            onChange={(e) => setCalcForm({ ...calcForm, diagnosis: e.target.value })}
                            className="w-full bg-bg-app border border-border-color rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-teal-500 cursor-pointer"
                          >
                            <option value="Diabetes">Diabetes Mellitus (Type 2 / Type 1)</option>
                            <option value="Hypertension">Essential Hypertension</option>
                            <option value="Migraine">Migraine & Chronic Headache</option>
                            <option value="Asthma">Bronchial Asthma / COPD</option>
                            <option value="Thyroid Disorder">Thyroid Disorder (Hypo/Hyper)</option>
                            <option value="Cardiac Condition">Ischemic Heart Disease / Angina</option>
                            <option value="Renal Disorder">Chronic Kidney Disease (CKD)</option>
                            <option value="General Consultation">General Clinical / Post-Op</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-text-secondary font-bold mb-1">Clinical Severity Level</label>
                          <select
                            value={calcForm.severity}
                            onChange={(e) => setCalcForm({ ...calcForm, severity: e.target.value })}
                            className="w-full bg-bg-app border border-border-color rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-teal-500 cursor-pointer"
                          >
                            <option value="High">High / Severe Presentation</option>
                            <option value="Moderate">Moderate Presentation</option>
                            <option value="Low">Low / Mild Presentation</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-text-secondary font-bold mb-1">Chief Complaint & Symptoms</label>
                          <input
                            type="text"
                            value={calcForm.chiefComplaint}
                            onChange={(e) => setCalcForm({ ...calcForm, chiefComplaint: e.target.value })}
                            placeholder="e.g. Uncontrolled blood sugar, fatigue, polyuria"
                            className="w-full bg-bg-app border border-border-color rounded-xl p-2.5 text-xs focus:outline-none focus:border-teal-500"
                          />
                        </div>

                        <div>
                          <label className="block text-text-secondary font-bold mb-1">Symptoms Duration</label>
                          <select
                            value={calcForm.symptomsDuration}
                            onChange={(e) => setCalcForm({ ...calcForm, symptomsDuration: e.target.value })}
                            className="w-full bg-bg-app border border-border-color rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-teal-500 cursor-pointer"
                          >
                            <option value="1-2 days">1-2 days (Acute onset)</option>
                            <option value="3-7 days">3-7 days</option>
                            <option value="1-2 weeks">1-2 weeks</option>
                            <option value="More than 2 weeks">More than 2 weeks (Subacute / Chronic)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-text-secondary font-bold mb-1">Days Since Last Hospital Visit</label>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              min="0"
                              disabled={calcForm.isFirstVisit}
                              value={calcForm.isFirstVisit ? 0 : (calcForm.daysSinceLastVisit ?? 0)}
                              onChange={(e) => setCalcForm({ ...calcForm, daysSinceLastVisit: parseInt(e.target.value, 10) || 0 })}
                              className="w-full bg-bg-app border border-border-color rounded-xl p-2.5 text-xs focus:outline-none focus:border-teal-500 disabled:opacity-50"
                            />
                            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-text-secondary whitespace-nowrap cursor-pointer">
                              <input
                                type="checkbox"
                                checked={calcForm.isFirstVisit}
                                onChange={(e) => setCalcForm({ ...calcForm, isFirstVisit: e.target.checked })}
                                className="rounded text-teal-600"
                              />
                              First Visit
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="block text-text-secondary font-bold mb-1">Diagnostic Test & Lab Value</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={calcForm.testName}
                              onChange={(e) => setCalcForm({ ...calcForm, testName: e.target.value })}
                              placeholder="Test (e.g. HbA1c)"
                              className="w-1/2 bg-bg-app border border-border-color rounded-xl p-2.5 text-xs focus:outline-none focus:border-teal-500"
                            />
                            <input
                              type="number"
                              step="0.1"
                              value={calcForm.testValue}
                              onChange={(e) => setCalcForm({ ...calcForm, testValue: parseFloat(e.target.value) || 0 })}
                              placeholder="Value"
                              className="w-1/2 bg-bg-app border border-border-color rounded-xl p-2.5 text-xs focus:outline-none focus:border-teal-500"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-text-secondary font-bold mb-1">Lab Value Status</label>
                          <select
                            value={calcForm.testAbnormal ? 'yes' : 'no'}
                            onChange={(e) => setCalcForm({ ...calcForm, testAbnormal: e.target.value === 'yes' })}
                            className="w-full bg-bg-app border border-border-color rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-teal-500 cursor-pointer"
                          >
                            <option value="yes">Abnormal / Out of Range</option>
                            <option value="no">Normal / Expected Range</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-text-secondary font-bold mb-1">Medication Changed?</label>
                          <select
                            value={calcForm.medicationChanged ? 'yes' : 'no'}
                            onChange={(e) => setCalcForm({ ...calcForm, medicationChanged: e.target.value === 'yes' })}
                            className="w-full bg-bg-app border border-border-color rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-teal-500 cursor-pointer"
                          >
                            <option value="yes">Yes (New Rx / Dose Adjusted)</option>
                            <option value="no">No (Unchanged)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-text-secondary font-bold mb-1">Prior Missed Follow-up?</label>
                          <select
                            value={calcForm.previousMissedFollowup ? 'yes' : 'no'}
                            onChange={(e) => setCalcForm({ ...calcForm, previousMissedFollowup: e.target.value === 'yes' })}
                            className="w-full bg-bg-app border border-border-color rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-teal-500 cursor-pointer"
                          >
                            <option value="yes">Yes (History of Non-adherence)</option>
                            <option value="no">No (Compliant)</option>
                          </select>
                        </div>
                      </div>

                      <div className="pt-2 flex justify-end">
                        <button
                          type="submit"
                          disabled={calcLoading}
                          className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-teal-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {calcLoading ? <Loader2 size={16} className="animate-spin" /> : <BrainCircuit size={16} />}
                          Run AI Follow-up & Risk Prediction
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Right Column: AI Intelligence & Recommendations (5 Cols) */}
                  <div className="lg:col-span-5 flex flex-col gap-4">
                    {calcResult ? (
                      <div className="bg-bg-card rounded-2xl border border-teal-500/40 p-6 shadow-md flex flex-col gap-5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

                        {/* Top Status */}
                        <div className="flex items-center justify-between border-b border-border-color pb-3">
                          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                            Model Prediction Result
                          </span>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            calcResult.priorityTier === 'CRITICAL'
                              ? 'bg-red-500 text-white animate-pulse'
                              : calcResult.priorityTier === 'HIGH'
                              ? 'bg-amber-500 text-black'
                              : calcResult.priorityTier === 'MEDIUM'
                              ? 'bg-blue-500 text-white'
                              : 'bg-emerald-500 text-white'
                          }`}>
                            {calcResult.priorityTier} RISK ({calcResult.priorityScore}/100)
                          </span>
                        </div>

                        {/* Big Recommendation Card */}
                        <div className="p-4 rounded-xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-bold uppercase text-teal-800 dark:text-teal-400 block tracking-wider">
                              Recommended Follow-up Window
                            </span>
                            <h3 className="text-2xl font-black text-teal-900 dark:text-teal-200 mt-0.5">
                              {calcResult.recommendedFollowup?.replace('_', ' ') || '7 DAYS'}
                            </h3>
                            <p className="text-[11px] text-teal-700 dark:text-teal-300 mt-0.5">
                              Target clinical re-evaluation in ~{calcResult.recommendedDays || 7} days
                            </p>
                          </div>
                          <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                            {calcResult.recommendedDays || 7}d
                          </div>
                        </div>

                        {/* Clinical Rationale */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold uppercase text-text-secondary tracking-wider block">
                            Clinical Rationale & Evidence
                          </span>
                          <div className="bg-bg-app border border-border-color rounded-xl p-3.5 text-xs font-medium text-text-primary leading-relaxed">
                            {calcResult.clinicalReason}
                          </div>
                        </div>

                        {/* Doctor Next Step & Action Workflow */}
                        <div className="grid grid-cols-1 gap-2.5 text-xs">
                          {calcResult.doctorAlert && (
                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-amber-800 dark:text-amber-200">
                              <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 block mb-0.5">Doctor Action</span>
                              <p className="font-semibold">{calcResult.doctorAlert}</p>
                            </div>
                          )}

                          <div className="bg-bg-app border border-border-color rounded-xl p-3 text-text-secondary">
                            <span className="text-[10px] uppercase font-bold text-teal-600 dark:text-teal-400 block mb-0.5">Receptionist / Outreach Action</span>
                            <p className="font-medium text-text-primary">{calcResult.receptionistAction}</p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2 pt-2 border-t border-border-color">
                          <button
                            onClick={applyRecommendationToNotes}
                            className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <FileText size={14} />
                            Apply to Active Consultation Notes
                          </button>

                          <button
                            onClick={() => {
                              const planText = `Patient Clinical AI Recommendation:\n- Follow-up: ${calcResult.recommendedFollowup?.replace('_', ' ')}\n- Priority: ${calcResult.priorityTier} (${calcResult.priorityScore}/100)\n- Clinical Reason: ${calcResult.clinicalReason}\n- Protocol: ${calcResult.receptionistAction}`;
                              navigator.clipboard?.writeText(planText);
                              setCopiedPlan(true);
                              setTimeout(() => setCopiedPlan(false), 2000);
                            }}
                            className="w-full py-2 bg-bg-app hover:bg-border-color/30 border border-border-color rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer text-text-secondary hover:text-text-primary"
                          >
                            {copiedPlan ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                            {copiedPlan ? 'Copied to Clipboard!' : 'Copy Assessment Summary'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-bg-card rounded-2xl border border-border-color p-8 shadow-xs flex flex-col items-center justify-center text-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                          <BrainCircuit size={24} />
                        </div>
                        <h4 className="font-bold text-sm">Ready to Predict</h4>
                        <p className="text-xs text-text-secondary max-w-xs">
                          Fill in the clinical parameters on the left or select a live queue patient to calculate recommended follow-up interval and risk score.
                        </p>
                        <button
                          onClick={() => handleRunDoctorPrediction()}
                          disabled={calcLoading}
                          className="mt-2 px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
                        >
                          {calcLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                          Run Sample Prediction
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              </motion.div>
            )}

            {/* TAB 4: PROFILE */}
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="bg-bg-card rounded-2xl border border-border-color p-8 max-w-2xl shadow-xs"
              >
                <h2 className="text-xl font-bold mb-1">Doctor Profile & OPD Settings</h2>
                <p className="text-xs text-text-secondary mb-6">Manage your clinical credentials, department room allocations, and bio.</p>

                <form onSubmit={handleSubmit(onSaveProfile)} className="space-y-4 text-xs">
                  <div>
                    <label className="font-bold block mb-1">Full Name</label>
                    <input {...register('name')} className="w-full bg-bg-app border border-border-color rounded-xl p-2.5 text-xs focus:outline-none focus:border-teal-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold block mb-1">Department</label>
                      <input {...register('department')} className="w-full bg-bg-app border border-border-color rounded-xl p-2.5 text-xs focus:outline-none focus:border-teal-500" />
                    </div>
                    <div>
                      <label className="font-bold block mb-1">OPD Room</label>
                      <input {...register('room')} className="w-full bg-bg-app border border-border-color rounded-xl p-2.5 text-xs focus:outline-none focus:border-teal-500" />
                    </div>
                  </div>
                  <div>
                    <label className="font-bold block mb-1">Qualifications / Credentials</label>
                    <input {...register('credentials')} className="w-full bg-bg-app border border-border-color rounded-xl p-2.5 text-xs focus:outline-none focus:border-teal-500" />
                  </div>
                  <div>
                    <label className="font-bold block mb-1">Clinical Bio</label>
                    <textarea {...register('bio')} rows={3} className="w-full bg-bg-app border border-border-color rounded-xl p-2.5 text-xs focus:outline-none focus:border-teal-500" />
                  </div>
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl shadow-xs transition"
                  >
                    Save Changes
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>

      {/* PATIENT EMR MODAL */}
      {selectedEMRPatient && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-bg-card border border-border-color rounded-3xl p-6 max-w-lg w-full shadow-2xl relative">
            <button
              onClick={() => setSelectedEMRPatient(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-bg-app text-text-secondary"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold mb-1">Patient Clinical File: {selectedEMRPatient.name}</h3>
            <p className="text-xs text-text-secondary mb-4">UHID: {selectedEMRPatient.uhid || selectedEMRPatient.id} • {selectedEMRPatient.age}y/{selectedEMRPatient.gender} • Blood: {selectedEMRPatient.bloodGroup}</p>

            <div className="space-y-3 text-xs bg-bg-app p-4 rounded-2xl border border-border-color">
              <div>
                <span className="font-bold text-text-secondary block">Chief Complaint:</span>
                <p className="font-semibold text-text-primary">{selectedEMRPatient.chiefComplaint || selectedEMRPatient.reasonForVisit}</p>
              </div>

              {selectedEMRPatient.symptomsDuration && (
                <div>
                  <span className="font-bold text-text-secondary block">Duration & Severity:</span>
                  <p className="text-text-primary">{selectedEMRPatient.symptomsDuration} (Severity: {selectedEMRPatient.severity || 'Moderate'})</p>
                </div>
              )}

              <div>
                <span className="font-bold text-text-secondary block">Visit History:</span>
                <p className="text-text-primary">
                  {selectedEMRPatient.isFirstVisit ? '⭐ First-Time Hospital Visit' : `🔄 Last visited ${selectedEMRPatient.daysSinceLastVisit || 7} days ago`}
                </p>
              </div>

              <div>
                <span className="font-bold text-text-secondary block">Ongoing Medications:</span>
                <p className="text-text-primary">{selectedEMRPatient.medications || 'None reported'}</p>
              </div>

              <div>
                <span className="font-bold text-text-secondary block">Allergies & History:</span>
                <p className="text-red-500 font-semibold">{selectedEMRPatient.allergies || 'No known allergies'}</p>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSelectedEMRPatient(null)}
                className="bg-teal-500 text-white font-bold px-4 py-2 rounded-xl text-xs"
              >
                Close File
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
