"use client";

import React, { useEffect, useState, useRef } from 'react';
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
  UserCircle
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

  // Doctor & Patients state
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [queue, setQueue] = useState<Patient[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [activePatient, setActivePatient] = useState<Patient | null>(null);

  // App UI State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'queue' | 'patients' | 'reports' | 'profile'>('dashboard');
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

  // 1. Initial Data Load
  const fetchDoctor = async () => {
    try {
      const res = await api.get<Doctor>('/doctors/profile');
      setDoctor(res.data);
      reset({
        name: res.data.name,
        credentials: res.data.credentials,
        department: res.data.department,
        room: res.data.room,
        focus: res.data.focus,
        bio: res.data.bio,
        awards: res.data.awards
      });
    } catch (err) {
      console.error('Error fetching doctor profile', err);
    }
  };

  const fetchQueue = async () => {
    try {
      const res = await api.get<Patient[]>('/patients/queue');
      setQueue(res.data);

      // Extract active patient if any IN_CONSULTATION is found
      const active = res.data.find(p => p.status === 'IN_CONSULTATION');
      if (active) {
        setActivePatient(active);
        setNotesInput(active.history[0]?.note || '');
      } else {
        setActivePatient(null);
      }
    } catch (err) {
      console.error('Error fetching queue', err);
    }
  };

  const fetchPatients = async () => {
    try {
      const res = await api.get<Patient[]>('/patients/registry');
      setPatients(res.data);
    } catch (err) {
      console.error('Error fetching registry', err);
    }
  };

  useEffect(() => {
    fetchDoctor();
    fetchQueue();
    fetchPatients();
  }, []);

  // 2. Real-time WebSockets synchronization
  useEffect(() => {
    if (!socket) return;

    socket.on('doctor:update', (updatedDoctor: Doctor) => {
      setDoctor(updatedDoctor);
    });

    socket.on('doctor:statusChange', (status: 'AVAILABLE' | 'BREAK' | 'EMERGENCY') => {
      if (doctor) {
        setDoctor(prev => prev ? { ...prev, clinicStatus: status } : null);
      }
    });

    socket.on('queue:update', () => {
      fetchQueue();
      fetchPatients();
    });

    return () => {
      socket.off('doctor:update');
      socket.off('doctor:statusChange');
      socket.off('queue:update');
    };
  }, [socket, doctor]);

  // 3. Header clock and session timer loops
  useEffect(() => {
    const timer = setInterval(() => {
      if (doctor?.clinicStatus === 'BREAK') return; // Pause session timer on breaks
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

  // Format Helper: 00:00:00
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
    try {
      const res = await api.put<Doctor>('/doctor/status', { status: nextStatus });
      setDoctor(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // 5. Emergency Warning Alert state
  const toggleEmergencyMode = async () => {
    if (!doctor) return;
    const nextStatus = doctor.clinicStatus === 'EMERGENCY' ? 'AVAILABLE' : 'EMERGENCY';
    try {
      const res = await api.put<Doctor>('/doctor/status', { status: nextStatus });
      setDoctor(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // 6. Patient Consultation Lifecycle
  const handleCallNext = async () => {
    setLoadingActivePatient(true);
    try {
      const res = await api.post('/patients/call-next');
      // Briefly trigger transition loading
      setTimeout(() => {
        setLoadingActivePatient(false);
        fetchQueue();
      }, 450);
    } catch (err) {
      console.error(err);
      setLoadingActivePatient(false);
    }
  };

  const handleSaveDraftNotes = () => {
    alert("Draft clinical notes saved locally.");
  };

  const handleCompleteConsultation = async () => {
    if (!activePatient) return;
    try {
      await api.post(`/patients/${activePatient.id}/complete`, {
        diagnosis: diagnosisInput,
        notes: notesInput
      });
      alert(`Consultation Completed for: ${activePatient.name}. EMR synchronization complete.`);
      setNotesInput('');
      setDiagnosisInput('Clinical Assessment');
      fetchQueue();
    } catch (err) {
      console.error(err);
    }
  };

  // 7. Profile Save Form Submit
  const handleSaveProfileSettings = async (data: ProfileFormData) => {
    try {
      const res = await api.put('/doctors/profile', data);
      setDoctor(res.data);
      alert("Workstation configuration updated successfully.");
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      router.push('/login');
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  const handleResetProfileSettings = async () => {
    if (window.confirm("Reset profile details to workstation default?")) {
      const defaults = {
        name: 'Dr. Patel, MD',
        credentials: 'MD, FACC - Harvard Medical School',
        department: 'Cardiology Dept.',
        room: 'Room 402',
        focus: 'Interventional Cardiology & Electrophysiology',
        bio: 'Dedicated cardiologist with 15+ years of experience specializing in cardiovascular diagnostics, cardiac catheterization, and preventative heart care.',
        awards: "American Heart Association Distinguished Fellow (2025)\nClinical Excellence Laureate (2024)\nMemorial Health Lifetime Achievement Award (2022)"
      };
      try {
        const res = await api.put('/doctors/profile', defaults);
        setDoctor(res.data);
        reset(defaults);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // 8. Queue filter mapping
  const getFilteredQueue = () => {
    let list = [...queue].filter(p => p.status !== 'COMPLETED' && p.status !== 'IN_CONSULTATION');

    if (queueSearch) {
      const query = queueSearch.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.id.toLowerCase().includes(query) ||
        p.reasonForVisit.toLowerCase().includes(query)
      );
    }

    if (queueFilterType !== 'ALL') {
      list = list.filter(p => p.visitType === queueFilterType);
    }

    if (queueFilterPriority !== 'ALL') {
      list = list.filter(p => p.priority === queueFilterPriority);
    }

    // Sorting - high priority first under Emergency Mode
    if (doctor?.clinicStatus === 'EMERGENCY') {
      list.sort((a, b) => {
        if (a.priority === 'HIGH' && b.priority !== 'HIGH') return -1;
        if (a.priority !== 'HIGH' && b.priority === 'HIGH') return 1;
        return a.waitTimeMinutes - b.waitTimeMinutes;
      });
    }

    return list;
  };

  // 9. Patients registry list mapping
  const getFilteredPatients = () => {
    if (!globalSearch) return patients;
    const query = globalSearch.toLowerCase();
    return patients.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.id.toLowerCase().includes(query)
    );
  };

  // Stats calculation
  const completedCount = patients.filter(p => p.status === 'COMPLETED').length;
  const waitingCount = queue.filter(p => p.status === 'WAITING' || p.status === 'NEXT').length;
  const totalInQueue = queue.length;
  const emergenciesCount = queue.filter(p => p.priority === 'HIGH' && p.status !== 'COMPLETED').length + (doctor?.clinicStatus === 'EMERGENCY' ? 1 : 0);

  const totalAppts = completedCount + totalInQueue + (activePatient ? 1 : 0);
  const completionRate = totalAppts > 0 ? Math.round((completedCount / totalAppts) * 100) : 0;
  const remainingCount = totalInQueue + (activePatient ? 1 : 0);

  // SVG Radial stroke offset calculation
  const strokeOffset = 226 - (226 * completionRate) / 100;

  return (
    <div className={`doctor-dashboard flex h-screen overflow-hidden bg-bg-app text-text-primary font-sans ${theme === 'dark' ? 'dark-theme' : ''}`}>
      
      {/* Emergency Flash Banner */}
      {doctor?.clinicStatus === 'EMERGENCY' && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-red-600 text-white font-bold py-2 px-4 flex items-center justify-center gap-2 animate-pulse text-xs tracking-wider">
          <AlertTriangle className="w-4 h-4" />
          EMERGENCY CLINIC MODE ACTIVE • REGISTERING SYSTEM ALERT • ELEVATING CASE PRIORITIES
        </div>
      )}

      {/* LEFT SIDEBAR (STICKY NAVIGATION) */}
      <aside className={`bg-white dark:bg-[#0F172A] border-r border-gray-100 dark:border-[#1E293B] flex flex-col flex-shrink-0 font-sans transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-[260px]'}`}>
        {/* Logo Brand Header */}
        <SidebarBrand appName="MediCore" role="DOCTOR PORTAL" collapsed={sidebarCollapsed} />

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {!sidebarCollapsed && (
            <p className="text-gray-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mb-4 px-2 transition-colors duration-200">Main Menu</p>
          )}

          {[
            { id: 'dashboard', label: 'Dashboard', icon: ClipboardList },
            { id: 'queue', label: 'Live Queue', icon: Users, badge: totalInQueue },
            { id: 'patients', label: 'Patient Records', icon: FileText },
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
                    ? 'bg-green-50 dark:bg-teal-500/10 text-green-600 dark:text-teal-400 font-semibold'
                    : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/50 hover:text-gray-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-green-600 dark:text-teal-400' : 'text-gray-500 dark:text-slate-500'} />
                {!sidebarCollapsed && <span>{item.label}</span>}
                {isActive && !sidebarCollapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-teal-400 shadow-[0_0_8px_rgba(34,197,94,0.6)] dark:shadow-[0_0_8px_rgba(45,212,191,0.8)]" />
                )}
                {'badge' in item && item.badge !== undefined && item.badge > 0 && !sidebarCollapsed && (
                  <span className="ml-auto text-xs bg-green-100 dark:bg-teal-500/20 text-green-700 dark:text-teal-400 px-2 py-0.5 rounded-full font-semibold">
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
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/50 mb-3 transition-colors duration-200">
              <div className="w-9 h-9 rounded-full bg-green-600 dark:bg-teal-600 flex items-center justify-center text-white font-bold text-sm">
                {doctor.name?.charAt(0) || 'D'}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{doctor.name}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{doctor.department}</p>
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
        <header className="bg-bg-card border-b border-border-color px-8 py-5 flex items-center justify-between z-10">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{greeting}, {doctor?.name?.split(',')[0]}</h1>
            <div className="flex items-center gap-2 text-xs text-text-secondary mt-1">
              <span>{headerDate}</span>
              <span className="w-1 h-1 rounded-full bg-text-muted" />
              <span>{doctor?.department}</span>
              <span className="w-1 h-1 rounded-full bg-text-muted" />
              <span>{doctor?.room}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Availability Badge Dropdown */}
            {doctor && (
              <button
                onClick={toggleBreakState}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold shadow-sm transition-all duration-200 ${
                  doctor.clinicStatus === 'AVAILABLE'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : doctor.clinicStatus === 'BREAK'
                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${
                  doctor.clinicStatus === 'AVAILABLE' ? 'bg-emerald-500 animate-pulse' : doctor.clinicStatus === 'BREAK' ? 'bg-amber-500' : 'bg-red-500'
                }`} />
                <span>{doctor.clinicStatus === 'AVAILABLE' ? 'Available' : doctor.clinicStatus === 'BREAK' ? 'On Break' : 'Emergency Mode'}</span>
              </button>
            )}

            {/* Session Timer */}
            <div className="flex items-center gap-2 text-xs text-text-secondary border border-border-color px-3.5 py-1.5 rounded-full bg-bg-app">
              <Clock className="w-4 h-4 text-text-secondary" />
              <span>Session: <strong className="text-text-primary">{formatTimer(sessionSeconds)}</strong></span>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-border-color hover:bg-primary/5 transition-all text-text-secondary hover:text-text-primary"
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
                <div className="col-span-2 flex flex-col gap-8">
                  
                  {/* ACTIVE CONSULTATION CARD */}
                  <div className="bg-bg-card rounded-2xl border border-border-color p-6 shadow-sm">
                    <div className="flex justify-between items-center border-b border-border-color pb-4 mb-5">
                      <div className="flex items-center gap-2">
                        <User className="w-5 h-5 text-primary" />
                        <h2 className="font-bold text-lg">Current Active Consultation</h2>
                      </div>
                      {activePatient && (
                        <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                          {activePatient.visitType}
                        </span>
                      )}
                    </div>

                    {loadingActivePatient ? (
                      <div className="py-12 flex flex-col items-center justify-center gap-4">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-text-secondary">Retrieving next clinical EMR profile...</span>
                      </div>
                    ) : activePatient ? (
                      <div className="flex flex-col gap-6">
                        
                        {/* Patient Identity details */}
                        <div className="flex justify-between items-start bg-bg-app p-4 rounded-xl border border-border-color">
                          <div>
                            <h3 className="text-xl font-bold">{activePatient.name}</h3>
                            <div className="flex items-center gap-2 text-xs text-text-secondary mt-1">
                              <span>{activePatient.age} Yrs • {activePatient.gender}</span>
                              <span className="w-1 h-1 rounded-full bg-text-muted" />
                              <span>ID: {activePatient.id}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs bg-emerald-500/10 text-emerald-600 px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                              In Session
                            </span>
                            <span className="text-xs text-text-secondary block mt-1">{activePatient.waitTime}</span>
                          </div>
                        </div>

                        {/* Medical Focus Alerts */}
                        <div className="grid grid-cols-2 gap-6">
                          <div className="bg-bg-app/50 p-4 rounded-xl border border-border-color/60">
                            <span className="text-xs font-bold text-text-secondary block mb-1">Reason for Visit</span>
                            <p className="text-sm font-medium">{activePatient.reasonForVisit}</p>
                          </div>
                          
                          <div className="bg-bg-app/50 p-4 rounded-xl border border-border-color/60">
                            <span className="text-xs font-bold text-text-secondary block mb-2">Clinical Risks & Alerts</span>
                            <div className="flex flex-wrap gap-1.5">
                              {activePatient.alerts.split(',').filter(Boolean).map((alert, idx) => {
                                const isAllergy = alert.toLowerCase().includes('allergy');
                                return (
                                  <span key={idx} className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${
                                    isAllergy
                                      ? 'bg-red-500/10 border-red-500/20 text-red-500'
                                      : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                                  }`}>
                                    {alert}
                                  </span>
                                );
                              })}
                              {!activePatient.alerts && (
                                <span className="text-xs text-text-secondary">No alerts recorded</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Progress Steps */}
                        <div className="flex justify-between items-center py-2 px-6 relative mt-2">
                          <div className="absolute top-1/2 left-0 right-0 h-1 bg-border-color -translate-y-1/2 z-0" />
                          <div className="absolute top-1/2 left-0 right-1/2 h-1 bg-primary -translate-y-1/2 z-0" />

                          {['Check-in', 'Vitals', 'Assessment', 'Prescribe'].map((step, idx) => {
                            const isCompleted = idx < 2;
                            const isActive = idx === 2;
                            return (
                              <div key={idx} className="flex flex-col items-center gap-1.5 z-10">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-bold text-xs ${
                                  isCompleted
                                    ? 'bg-primary border-primary text-white'
                                    : isActive
                                    ? 'bg-white border-primary text-primary'
                                    : 'bg-white border-border-color text-text-secondary'
                                }`}>
                                  {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
                                </div>
                                <span className={`text-xs font-bold ${isActive ? 'text-primary' : 'text-text-secondary'}`}>{step}</span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Notes Input Area */}
                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Clinical Consultation Notes</label>
                          <textarea
                            value={notesInput}
                            onChange={(e) => setNotesInput(e.target.value)}
                            placeholder="State current vitals, assessment findings, and diagnostic conclusions..."
                            rows={4}
                            className="bg-bg-app border border-border-color rounded-xl p-3.5 text-sm focus:outline-none focus:border-primary transition"
                          />
                        </div>

                        {/* Footer button controls */}
                        <div className="flex items-center justify-end gap-3 pt-2">
                          <button
                            onClick={() => setSelectedEMRPatient(activePatient)}
                            className="flex items-center gap-2 border border-border-color hover:bg-primary/5 px-4 py-2.5 rounded-xl text-sm font-semibold transition"
                          >
                            <FileText className="w-4 h-4" />
                            View EMR File
                          </button>
                          <button
                            onClick={handleSaveDraftNotes}
                            className="border border-border-color hover:bg-primary/5 px-4 py-2.5 rounded-xl text-sm font-semibold transition"
                          >
                            Save Draft
                          </button>
                          <button
                            onClick={handleCompleteConsultation}
                            className="flex items-center gap-2 bg-primary text-white hover:bg-primary-hover px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-primary/25 transition"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Complete Consultation
                          </button>
                        </div>

                      </div>
                    ) : (
                      <div className="py-16 flex flex-col items-center justify-center text-center gap-4">
                        <div className="bg-bg-app p-4 rounded-full text-text-secondary border border-border-color">
                          <ClipboardList className="w-8 h-8" />
                        </div>
                        <div>
                          <h3 className="font-bold text-base">All consultations completed</h3>
                          <p className="text-xs text-text-secondary mt-1">The clinic workstation queue is empty. Click "Call Next" to initiate session.</p>
                        </div>
                        <button
                          onClick={handleCallNext}
                          className="bg-primary text-white hover:bg-primary-hover px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-primary/25 transition mt-2"
                        >
                          Call Next Patient
                        </button>
                      </div>
                    )}
                  </div>

                </div>

                {/* Right Columns (35%) */}
                <div className="flex flex-col gap-8">
                  
                  {/* KPI Overview Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    
                    {/* Waiting Patients */}
                    <div className="bg-bg-card border border-border-color rounded-2xl p-4 shadow-sm flex flex-col gap-2">
                      <div className="flex justify-between items-center text-text-secondary">
                        <span className="text-xs font-semibold">Waiting Patients</span>
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{waitingCount}</div>
                        <span className="text-xxs text-emerald-500 font-bold">-12m wait avg</span>
                      </div>
                    </div>

                    {/* Completed */}
                    <div className="bg-bg-card border border-border-color rounded-2xl p-4 shadow-sm flex flex-col gap-2">
                      <div className="flex justify-between items-center text-text-secondary">
                        <span className="text-xs font-semibold">Completed</span>
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{completedCount}</div>
                        <span className="text-xxs text-primary font-bold">+78% vs target</span>
                      </div>
                    </div>

                    {/* Active Queue */}
                    <div className="bg-bg-card border border-border-color rounded-2xl p-4 shadow-sm flex flex-col gap-2">
                      <div className="flex justify-between items-center text-text-secondary">
                        <span className="text-xs font-semibold">Active Queue</span>
                        <Activity className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{totalInQueue}</div>
                        <span className="text-xxs text-text-secondary font-bold">Normal Load</span>
                      </div>
                    </div>

                    {/* Emergencies */}
                    <div className="bg-bg-card border border-border-color rounded-2xl p-4 shadow-sm flex flex-col gap-2">
                      <div className="flex justify-between items-center text-text-secondary">
                        <span className="text-xs font-semibold">Emergencies</span>
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div>
                        <div className={`text-2xl font-bold ${emergenciesCount > 0 ? 'text-red-500' : ''}`}>{emergenciesCount}</div>
                        <span className={`text-xxs font-bold ${emergenciesCount > 0 ? 'text-red-500 animate-pulse' : 'text-text-secondary'}`}>
                          {emergenciesCount > 0 ? 'Action Required' : 'Standard Level'}
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Quick Action Control */}
                  <div className="bg-bg-card border border-border-color rounded-2xl p-6 shadow-sm">
                    <h2 className="font-bold text-lg border-b border-border-color pb-3 mb-4 flex items-center gap-2">
                      <Settings className="w-4.5 h-4.5 text-primary" />
                      Quick Action Control
                    </h2>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={handleCallNext}
                        className="flex flex-col items-center justify-center p-4 rounded-xl border border-border-color hover:bg-primary/5 transition font-semibold text-xs gap-2"
                      >
                        <Play className="w-5 h-5 text-primary" />
                        Call Next
                      </button>

                      <button
                        onClick={toggleBreakState}
                        className="flex flex-col items-center justify-center p-4 rounded-xl border border-border-color hover:bg-primary/5 transition font-semibold text-xs gap-2"
                      >
                        <RotateCcw className="w-5 h-5 text-amber-500" />
                        {doctor?.clinicStatus === 'BREAK' ? 'Resume Session' : 'Start Break'}
                      </button>

                      <button
                        onClick={toggleEmergencyMode}
                        className="flex flex-col items-center justify-center p-4 rounded-xl border border-border-color hover:bg-red-500/5 hover:border-red-300 transition font-semibold text-xs gap-2 col-span-2 text-red-500"
                      >
                        <AlertTriangle className="w-5 h-5" />
                        Toggle Emergency
                      </button>
                    </div>
                  </div>

                  {/* Today's Session Summary */}
                  <div className="bg-bg-card border border-border-color rounded-2xl p-6 shadow-sm">
                    <h2 className="font-bold text-lg border-b border-border-color pb-3 mb-4">Today's Session Summary</h2>
                    
                    <div className="flex items-center gap-6">
                      {/* Radial Progress Circle */}
                      <div className="relative w-20 h-20 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90">
                          <circle className="text-border-color" strokeWidth="6" stroke="currentColor" fill="transparent" r="34" cx="40" cy="40" />
                          <circle
                            className="text-primary transition-all duration-500"
                            strokeWidth="6"
                            strokeDasharray="213.6"
                            strokeDashoffset={strokeOffset}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r="34"
                            cx="40"
                            cy="40"
                          />
                        </svg>
                        <span className="absolute text-sm font-bold text-text-primary">{completionRate}%</span>
                      </div>

                      <div className="flex-1 flex flex-col gap-1.5 text-xs">
                        <div className="flex justify-between border-b border-border-color/40 pb-1">
                          <span className="text-text-secondary font-medium">Total Appointments</span>
                          <span className="font-bold">{totalAppts}</span>
                        </div>
                        <div className="flex justify-between border-b border-border-color/40 pb-1">
                          <span className="text-text-secondary font-medium">Completed</span>
                          <span className="font-bold">{completedCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary font-medium">Remaining</span>
                          <span className="font-bold">{remainingCount}</span>
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
                className="bg-bg-card rounded-2xl border border-border-color p-6 shadow-sm"
              >
                <div className="flex justify-between items-center border-b border-border-color pb-4 mb-6">
                  <div>
                    <h2 className="font-bold text-lg">Active Patient Waiting Queue</h2>
                    <p className="text-xs text-text-secondary mt-1">Showing {getFilteredQueue().length} pending patients in clinic queue.</p>
                  </div>
                </div>

                {/* Filters Row */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      type="text"
                      placeholder="Search by name, ID or symptom..."
                      value={queueSearch}
                      onChange={(e) => setQueueSearch(e.target.value)}
                      className="w-full bg-bg-app border border-border-color rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary transition"
                    />
                  </div>

                  <select
                    value={queueFilterType}
                    onChange={(e) => setQueueFilterType(e.target.value)}
                    className="bg-bg-app border border-border-color rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                  >
                    <option value="ALL">All Visit Types</option>
                    <option value="Consultation">Consultation</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Urgent">Urgent</option>
                  </select>

                  <select
                    value={queueFilterPriority}
                    onChange={(e) => setQueueFilterPriority(e.target.value)}
                    className="bg-bg-app border border-border-color rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
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
                        <th className="pb-3 pl-4">Pos</th>
                        <th className="pb-3">Patient Name</th>
                        <th className="pb-3">Visit Type</th>
                        <th className="pb-3">Wait Time</th>
                        <th className="pb-3">Priority</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right pr-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm font-medium">
                      {getFilteredQueue().map((patient, idx) => (
                        <tr key={patient.id} className="border-b border-border-color/60 hover:bg-bg-app/40 transition">
                          <td className="py-4 pl-4 text-text-secondary">{idx + 1}</td>
                          <td className="py-4">
                            <div>
                              <div className="font-bold text-text-primary">{patient.name}</div>
                              <div className="text-xxs text-text-secondary mt-0.5">{patient.age} Yrs • {patient.gender}</div>
                            </div>
                          </td>
                          <td className="py-4">
                            <span className="text-xs bg-bg-app px-2.5 py-1 border border-border-color rounded-full">
                              {patient.visitType}
                            </span>
                          </td>
                          <td className="py-4 text-text-secondary">{patient.waitTime}</td>
                          <td className="py-4">
                            <span className={`text-xxs font-bold px-2 py-0.5 rounded ${
                              patient.priority === 'HIGH'
                                ? 'bg-red-500/15 text-red-500'
                                : patient.priority === 'MEDIUM'
                                ? 'bg-amber-500/15 text-amber-500'
                                : 'bg-emerald-500/15 text-emerald-500'
                            }`}>
                              {patient.priority}
                            </span>
                          </td>
                          <td className="py-4">
                            <span className={`text-xxs font-bold px-2 py-0.5 rounded-full ${
                              patient.status === 'NEXT' ? 'bg-primary/20 text-primary' : 'bg-bg-app border border-border-color text-text-secondary'
                            }`}>
                              {patient.status}
                            </span>
                          </td>
                          <td className="py-4 text-right pr-4">
                            <button
                              onClick={() => setSelectedEMRPatient(patient)}
                              className="p-1.5 rounded-lg border border-border-color hover:bg-primary/5 text-text-secondary hover:text-text-primary transition"
                              title="EMR Files"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {getFilteredQueue().length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-text-secondary">
                            No patients found matching the criteria in queue.
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
                <div className="bg-bg-card rounded-2xl border border-border-color p-6 shadow-sm flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-bold text-lg">Registered Patients Database</h2>
                    <p className="text-xs text-text-secondary mt-1">Search or select a patient to pull their full Electronic Medical Record file.</p>
                  </div>
                  <div className="relative w-72">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      type="text"
                      placeholder="Search registry by name or ID..."
                      value={globalSearch}
                      onChange={(e) => setGlobalSearch(e.target.value)}
                      className="w-full bg-bg-app border border-border-color rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  {getFilteredPatients().map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedEMRPatient(p)}
                      className="bg-bg-card border border-border-color hover:border-primary/55 rounded-2xl p-5 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between h-44"
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-base">{p.name}</h4>
                          <span className="text-xxs text-text-muted font-mono">{p.id}</span>
                        </div>
                        <span className="text-xs text-text-secondary mt-0.5 block">{p.age} Yrs • {p.gender}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 border-t border-b border-border-color/40 py-2.5 my-2.5 text-xs">
                        <div>
                          <span className="text-xxs text-text-secondary block font-semibold">Blood Group</span>
                          <span className="font-bold text-text-primary">{p.bloodGroup}</span>
                        </div>
                        <div>
                          <span className="text-xxs text-text-secondary block font-semibold">Weight</span>
                          <span className="font-bold text-text-primary">{p.weight}</span>
                        </div>
                      </div>

                      <div className="text-xxs text-text-secondary truncate">
                        <strong>Contact:</strong> {p.phone}
                      </div>
                    </div>
                  ))}
                  {getFilteredPatients().length === 0 && (
                    <div className="col-span-3 text-center py-12 text-text-secondary bg-bg-card rounded-2xl border border-border-color">
                      No registered patients found.
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* TAB 4: WORKSTATION PROFILE SETTINGS */}
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-3 gap-8"
              >
                {/* Left Panel - Bio Badge Info */}
                <div className="bg-bg-card border border-border-color rounded-2xl p-5 shadow-sm flex flex-col gap-4">
                  <div className="flex flex-col items-center text-center gap-2 border-b border-border-color/60 pb-4 relative">
                    
                    <div className="w-20 h-20 bg-primary/10 text-primary flex items-center justify-center text-2xl font-black rounded-[1.25rem] relative group mt-2">
                      {doctor?.name?.replace(/^Dr\.\s+/i, '')?.split(' ')[0]?.[0]}
                      {doctor?.name?.replace(/^Dr\.\s+/i, '')?.split(' ')[1]?.[0]}
                      
                      <button 
                        type="button"
                        onClick={() => alert('Avatar upload feature coming soon!')}
                        className="absolute -bottom-2 -right-2 bg-primary text-white p-1.5 rounded-xl shadow-md border-2 border-white hover:scale-105 transition-transform"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="mt-2">
                      <h3 className="font-extrabold text-lg text-text-primary">{doctor?.name}</h3>
                      <p className="text-xs font-semibold text-text-secondary mt-0.5">{doctor?.department}</p>
                      <span className="text-xs bg-bg-app border border-border-color px-2.5 py-1 rounded-lg mt-2 inline-block font-bold text-text-secondary shadow-sm">
                        {doctor?.room}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 px-1 mt-6">
                    <div className="bg-white border border-border-color/60 rounded-2xl p-4 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-[14px] flex items-center justify-center shrink-0">
                        <Target className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex flex-col gap-1.5 mt-0.5">
                        <span className="font-extrabold text-primary uppercase tracking-wider text-[11px] block">Clinical Focus</span>
                        <p className="font-semibold text-text-primary text-[13px]">{doctor?.focus}</p>
                      </div>
                    </div>
                    
                    <div className="bg-white border border-border-color/60 rounded-2xl p-4 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-[14px] flex items-center justify-center shrink-0">
                        <GraduationCap className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex flex-col gap-1.5 mt-0.5">
                        <span className="font-extrabold text-primary uppercase tracking-wider text-[11px] block">Education & Credentials</span>
                        <p className="font-semibold text-text-primary text-[13px]">{doctor?.credentials}</p>
                      </div>
                    </div>
                    
                    <div className="bg-white border border-border-color/60 rounded-2xl p-4 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-[14px] flex items-center justify-center shrink-0">
                        <UserCircle className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex flex-col gap-1.5 mt-0.5">
                        <span className="font-extrabold text-primary uppercase tracking-wider text-[11px] block">Biography</span>
                        <p className="text-text-secondary leading-relaxed font-semibold italic text-[13px]">"{doctor?.bio}"</p>
                      </div>
                    </div>

                    <div className="bg-white border border-border-color/60 rounded-2xl p-4 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-[14px] flex items-center justify-center shrink-0">
                        <Award className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex flex-col gap-1.5 mt-0.5">
                        <span className="font-extrabold text-primary uppercase tracking-wider text-[11px] block">Awards & Honors</span>
                        <ul className="list-disc pl-4 flex flex-col gap-1 text-text-primary font-semibold text-[13px]">
                          {doctor?.awards?.split('\n').filter(a => a && a.trim() !== 'null').map((award, idx) => (
                            <li key={idx}>{award}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Panel - Edit Form Fields */}
                <div className="col-span-2 bg-bg-card border border-border-color rounded-2xl p-6 shadow-sm">
                  <h2 className="font-bold text-lg border-b border-border-color pb-3.5 mb-5 flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-primary" />
                    Edit Workstation Info
                  </h2>

                  <form onSubmit={handleSubmit(handleSaveProfileSettings)} className="flex flex-col gap-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-text-secondary">Doctor Full Name</label>
                        <input
                          type="text"
                          {...register('name')}
                          className="bg-bg-app border border-border-color rounded-xl px-3 py-2 text-sm focus:outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-text-secondary">Credentials / Degrees</label>
                        <input
                          type="text"
                          {...register('credentials')}
                          className="bg-bg-app border border-border-color rounded-xl px-3 py-2 text-sm focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-text-secondary">Department</label>
                        <input
                          type="text"
                          {...register('department')}
                          className="bg-bg-app border border-border-color rounded-xl px-3 py-2 text-sm focus:outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-text-secondary">Room Number</label>
                        <input
                          type="text"
                          {...register('room')}
                          className="bg-bg-app border border-border-color rounded-xl px-3 py-2 text-sm focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-text-secondary">Specialization & Clinical Focus</label>
                      <input
                        type="text"
                        {...register('focus')}
                        className="bg-bg-app border border-border-color rounded-xl px-3 py-2 text-sm focus:outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-text-secondary">Biography</label>
                      <textarea
                        {...register('bio')}
                        rows={3}
                        className="bg-bg-app border border-border-color rounded-xl p-3 text-sm focus:outline-none resize-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-text-secondary">Awards & Honors (One per line)</label>
                      <textarea
                        {...register('awards')}
                        rows={3}
                        className="bg-bg-app border border-border-color rounded-xl p-3 text-sm focus:outline-none"
                      />
                    </div>

                    <div className="flex justify-end gap-3 border-t border-border-color pt-4 mt-2">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex items-center gap-2 border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 px-4 py-2.5 rounded-xl text-sm font-semibold transition mr-auto"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                      <button
                        type="button"
                        onClick={handleResetProfileSettings}
                        className="border border-border-color hover:bg-primary/5 px-4 py-2.5 rounded-xl text-sm font-semibold transition"
                      >
                        Reset Profile
                      </button>
                      <button
                        type="submit"
                        className="bg-primary text-white hover:bg-primary-hover px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-primary/25 transition"
                      >
                        Save Profile Details
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </main>

      <FloatingNavigation
        activeItemId={activeTab}
        items={[
          { id: 'dashboard', label: 'Dashboard', icon: ClipboardList, onClick: () => setActiveTab('dashboard') },
          { id: 'queue', label: 'Queue', icon: Users, badge: totalInQueue > 0 ? totalInQueue : undefined, onClick: () => setActiveTab('queue') },
          { id: 'patients', label: 'Patients', icon: FileText, onClick: () => setActiveTab('patients') },
          { id: 'reports', label: 'Reports', icon: Award, onClick: () => setActiveTab('reports') },
          { id: 'profile', label: 'Profile', icon: User, onClick: () => setActiveTab('profile') },
        ]}
      />

      {/* SELECTED EMR RECORD DETAILS MODAL */}
      <AnimatePresence>
        {selectedEMRPatient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-bg-card rounded-2xl border border-border-color max-w-lg w-full overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-border-color flex justify-between items-center bg-bg-app/50">
                <h3 className="font-bold text-base">Electronic Medical Record File</h3>
                <button
                  onClick={() => setSelectedEMRPatient(null)}
                  className="p-1 hover:bg-primary/5 rounded-lg text-text-secondary hover:text-text-primary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto max-h-[70vh] flex flex-col gap-5">
                {/* Patient Summary Card */}
                <div className="border-b border-border-color/60 pb-4">
                  <h4 className="text-xl font-bold text-text-primary">{selectedEMRPatient.name}</h4>
                  <p className="text-xs text-text-secondary mt-1">
                    {selectedEMRPatient.age} Yrs • {selectedEMRPatient.gender} • Blood Group: {selectedEMRPatient.bloodGroup} • Weight: {selectedEMRPatient.weight}
                  </p>
                </div>

                {/* Vitals Logs details */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Vitals Records</span>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="bg-bg-app p-3 rounded-xl border border-border-color text-center">
                      <span className="text-xxs text-text-secondary block font-bold">BP</span>
                      <span className="font-bold text-text-primary text-sm mt-1 block">
                        {selectedEMRPatient.id === '#PT-8422' ? '124/82' : '118/74'}
                      </span>
                      <span className="text-xxs text-emerald-500 font-bold mt-1 block">Normal</span>
                    </div>

                    <div className="bg-bg-app p-3 rounded-xl border border-border-color text-center">
                      <span className="text-xxs text-text-secondary block font-bold">HR</span>
                      <span className="font-bold text-text-primary text-sm mt-1 block">
                        {selectedEMRPatient.id === '#PT-8422' ? '88 bpm' : '72 bpm'}
                      </span>
                      <span className="text-xxs text-emerald-500 font-bold mt-1 block">Normal</span>
                    </div>

                    <div className="bg-bg-app p-3 rounded-xl border border-border-color text-center col-span-2">
                      <span className="text-xxs text-text-secondary block font-bold">Symptom</span>
                      <span className="font-bold text-text-primary text-xxs truncate mt-1.5 block">
                        {selectedEMRPatient.reasonForVisit}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Patient Clinical History logs */}
                <div className="flex flex-col gap-2.5">
                  <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Clinical History & Diagnosis Log</span>
                  <div className="flex flex-col gap-2">
                    {selectedEMRPatient.history && selectedEMRPatient.history.length > 0 ? (
                      selectedEMRPatient.history.map((log) => (
                        <div key={log.id} className="bg-bg-app border border-border-color rounded-xl p-4 flex flex-col gap-1">
                          <div className="flex justify-between items-center">
                            <strong className="text-xs text-text-primary font-bold">{log.diagnosis}</strong>
                            <span className="text-xxs text-text-muted">{log.date}</span>
                          </div>
                          <p className="text-xs text-text-secondary leading-relaxed mt-0.5">{log.note}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-text-muted py-2 italic">No previous history records logged.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-border-color bg-bg-app/40 flex justify-end">
                <button
                  onClick={() => setSelectedEMRPatient(null)}
                  className="bg-primary text-white hover:bg-primary-hover px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-primary/25 transition"
                >
                  Close File
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
