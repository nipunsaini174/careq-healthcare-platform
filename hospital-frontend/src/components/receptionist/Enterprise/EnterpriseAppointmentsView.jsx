"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Search, Plus, 
  MapPin, Clock, User, CheckCircle2, AlertCircle, X, Loader2, 
  Stethoscope, RefreshCw, Filter, Phone, Mail, UserCheck, Check
} from 'lucide-react';
import { useAppointments } from '@/hooks/useAppointments';
import api from '@/services/api';

export default function EnterpriseAppointmentsView() {
  const { 
    appointments, 
    loading, 
    refreshAppointments, 
    checkInAppointment, 
    cancelAppointment 
  } = useAppointments();

  // Calendar Date State
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date()); // default selected is today
  const [filterAllDates, setFilterAllDates] = useState(false);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedDoctorId, setSelectedDoctorId] = useState('ALL');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'timeline'

  // Doctors list for filters & booking
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);

  // Modals & Action States
  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedApptDetails, setSelectedApptDetails] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [checkingInId, setCheckingInId] = useState(null);

  // Booking Form State
  const [bookForm, setBookForm] = useState({
    patientName: '',
    patientPhone: '',
    patientEmail: '',
    doctorId: '',
    appointmentDate: new Date().toISOString().split('T')[0],
    timeSlot: '18:55',
    appointmentType: 'General Consultation',
  });

  // Dynamically generate slots starting from the current live time if today, or 09:00 AM if future date
  const availableBookingSlots = useMemo(() => {
    const isToday = bookForm.appointmentDate === new Date().toISOString().split('T')[0];
    const baseDate = new Date();
    if (!isToday) {
      baseDate.setHours(9, 0, 0, 0);
    }
    const slots = [];
    const STANDARD_SLOT_MINS = 15;
    let runningMs = baseDate.getTime();

    for (let i = 0; i < 16; i++) {
      const d = new Date(runningMs);
      const val = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      const label = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
      const endD = new Date(runningMs + STANDARD_SLOT_MINS * 60000);
      const endLabel = endD.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
      slots.push({ value: val, label: `${label} (${label} - ${endLabel})` });
      runningMs += STANDARD_SLOT_MINS * 60000;
    }
    return slots;
  }, [bookForm.appointmentDate]);

  // Fetch doctors & patients for dropdowns
  useEffect(() => {
    async function loadData() {
      try {
        const [docsRes, patsRes] = await Promise.all([
          api.get('/receptionist/doctors').catch(() => ({ data: [] })),
          api.get('/receptionist/patients').catch(() => ({ data: [] })),
        ]);
        const docs = docsRes.data?.data || (Array.isArray(docsRes.data) ? docsRes.data : []);
        const pats = patsRes.data?.data || (Array.isArray(patsRes.data) ? patsRes.data : []);
        setDoctors(docs);
        setPatients(pats);

        if (docs.length > 0) {
          setBookForm(prev => ({ ...prev, doctorId: String(docs[0].id || docs[0].doctor_id || '1') }));
        }
      } catch (err) {
        console.error('Failed to load doctors/patients for appointment form:', err);
      }
    }
    loadData();
  }, []);

  // Helper: Format date strings
  const formatDateKey = (d) => {
    const dateObj = new Date(d);
    if (isNaN(dateObj.getTime())) return '';
    return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
  };

  const selectedDateKey = formatDateKey(selectedDate);
  const todayKey = formatDateKey(new Date());

  // Map appointment counts per date for calendar dots
  const appointmentDatesMap = useMemo(() => {
    const map = {};
    appointments.forEach(a => {
      const key = formatDateKey(a.date);
      if (key) {
        map[key] = (map[key] || 0) + 1;
      }
    });
    return map;
  }, [appointments]);

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter(a => {
      // Date filter
      if (!filterAllDates) {
        const apptDateKey = formatDateKey(a.date);
        if (apptDateKey !== selectedDateKey) return false;
      }

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesSearch = 
          (a.patient || '').toLowerCase().includes(q) ||
          (a.patientUhid || '').toLowerCase().includes(q) ||
          (a.doctor || '').toLowerCase().includes(q) ||
          (a.tokenCode || '').toLowerCase().includes(q) ||
          (a.patientPhone || '').toLowerCase().includes(q) ||
          (a.type || '').toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      // Doctor filter
      if (selectedDoctorId !== 'ALL') {
        if (String(a.doctorId) !== String(selectedDoctorId)) return false;
      }

      // Status filter
      if (statusFilter !== 'ALL') {
        const s = (a.status || '').toLowerCase();
        if (statusFilter.toLowerCase() === 'completed') {
          if (s !== 'completed' && s !== 'checked out' && s !== 'done') return false;
        } else if (statusFilter.toLowerCase() === 'checked in') {
          if (s !== 'checked in' && s !== 'waiting') return false;
        } else if (statusFilter.toLowerCase() === 'in consultation') {
          if (s !== 'in consultation' && s !== 'in progress') return false;
        } else if (statusFilter.toLowerCase() === 'confirmed') {
          if (s !== 'confirmed' && s !== 'upcoming' && s !== 'scheduled') return false;
        } else if (statusFilter.toLowerCase() === 'cancelled') {
          if (s !== 'cancelled') return false;
        }
      }

      return true;
    });
  }, [appointments, filterAllDates, selectedDateKey, search, selectedDoctorId, statusFilter]);

  // Calendar calculation
  const calendarDays = useMemo(() => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days = [];

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        monthOffset: -1,
        dateKey: formatDateKey(new Date(year, month - 1, prevMonthDays - i)),
        currentMonth: false,
      });
    }

    // Current month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      days.push({
        day: d,
        monthOffset: 0,
        dateKey: formatDateKey(new Date(year, month, d)),
        currentMonth: true,
      });
    }

    // Next month padding to round up to complete weeks (multiple of 7)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      days.push({
        day: d,
        monthOffset: 1,
        dateKey: formatDateKey(new Date(year, month + 1, d)),
        currentMonth: false,
      });
    }

    return days;
  }, [currentMonthDate]);

  const handleSelectDay = (dayObj) => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth() + dayObj.monthOffset;
    const newSelected = new Date(year, month, dayObj.day);
    setSelectedDate(newSelected);
    setFilterAllDates(false);
  };

  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1));
  };

  const handleCheckIn = async (id, e) => {
    e.stopPropagation();
    try {
      setCheckingInId(id);
      await checkInAppointment(id);
    } catch (err) {
      alert("Failed to check in patient.");
    } finally {
      setCheckingInId(null);
    }
  };

  const handleCancel = async (id, e) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to cancel this appointment?")) return;
    try {
      await cancelAppointment(id);
    } catch {
      alert("Failed to cancel appointment.");
    }
  };

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    if (!bookForm.patientName.trim()) {
      alert("Please provide patient name.");
      return;
    }

    try {
      setSubmitting(true);
      
      const apptDate = new Date(`${bookForm.appointmentDate}T${bookForm.timeSlot}:00`);

      await api.post('/appointments', {
        patient_name: bookForm.patientName,
        patientName: bookForm.patientName,
        phone: bookForm.patientPhone || null,
        email: bookForm.patientEmail || null,
        doctor_id: bookForm.doctorId || '1',
        appointment_date: isNaN(apptDate.getTime()) ? new Date().toISOString() : apptDate.toISOString(),
        appointment_type: bookForm.appointmentType,
      });

      setShowBookModal(false);
      setBookForm({
        patientName: '',
        patientPhone: '',
        patientEmail: '',
        doctorId: doctors[0]?.id || '1',
        appointmentDate: new Date().toISOString().split('T')[0],
        timeSlot: '10:30',
        appointmentType: 'General Consultation',
      });

      await refreshAppointments();
    } catch (err) {
      console.error('Failed to book appointment:', err);
      alert('Failed to book appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Status Badge Component
  const renderStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed' || s === 'checked out' || s === 'done') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
          <CheckCircle2 size={12} className="text-emerald-600" />
          Completed
        </span>
      );
    }
    if (s === 'in consultation' || s === 'in progress' || s === 'serving') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200 animate-pulse shadow-xs">
          <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping"></span>
          In Consultation
        </span>
      );
    }
    if (s === 'checked in' || s === 'waiting') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 shadow-xs">
          <UserCheck size={12} className="text-blue-600" />
          Checked In
        </span>
      );
    }
    if (s === 'cancelled') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
          <X size={12} className="text-rose-600" />
          Cancelled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200">
        <Clock size={12} className="text-teal-600" />
        {status || 'Confirmed'}
      </span>
    );
  };

  const monthYearString = currentMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const selectedDateFormatted = selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="flex-1 min-w-0 overflow-x-auto overflow-y-auto bg-gray-50/50 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-[1600px] mx-auto min-w-0 space-y-6 pb-8 sm:space-y-8 sm:pb-12">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Appointments</h2>
            <p className="text-sm text-gray-500 mt-1">Manage scheduled consultations, real-time check-ins, and doctor completion status.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => {
                setSelectedDate(new Date());
                setCurrentMonthDate(new Date());
                setFilterAllDates(false);
              }}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors shadow-xs ${
                !filterAllDates && selectedDateKey === todayKey
                  ? 'bg-teal-50 border-teal-300 text-teal-700 font-bold'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <CalendarIcon size={16} />
              Today: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </button>

            <button 
              onClick={() => setFilterAllDates(!filterAllDates)}
              className={`px-3 py-2 border rounded-lg text-sm font-medium transition-colors shadow-xs ${
                filterAllDates
                  ? 'bg-teal-600 text-white border-teal-600 font-bold'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {filterAllDates ? 'Viewing All Dates' : 'View All Dates'}
            </button>

            <button 
              onClick={() => refreshAppointments()}
              title="Refresh Appointments"
              className="p-2 bg-white border border-gray-200 text-gray-600 hover:text-teal-600 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-xs transition-colors"
            >
              <RefreshCw size={16} />
            </button>

            <button 
              onClick={() => setShowBookModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 shadow-xs shadow-teal-600/20 transition-colors"
            >
              <Plus size={16} />
              Book Appointment
            </button>
          </div>
        </div>

        {/* Calendar and List Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* Left: Mini Calendar & Filters */}
          <div className="xl:col-span-4 lg:col-span-5 space-y-6">
            
            {/* Interactive Mini Calendar */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-900">{monthYearString}</h3>
                <div className="flex gap-1.5">
                  <button 
                    onClick={handlePrevMonth}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button 
                    onClick={handleNextMonth}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-gray-400 mb-2">
                <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium">
                {calendarDays.map((dayObj, idx) => {
                  const isSelected = !filterAllDates && dayObj.dateKey === selectedDateKey;
                  const isToday = dayObj.dateKey === todayKey;
                  const count = appointmentDatesMap[dayObj.dateKey] || 0;

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectDay(dayObj)}
                      className={`h-9 w-full rounded-lg flex flex-col items-center justify-center relative transition-all ${
                        isSelected
                          ? 'bg-teal-600 text-white font-bold shadow-xs shadow-teal-600/30'
                          : dayObj.currentMonth
                          ? isToday
                            ? 'bg-teal-50 text-teal-700 font-bold hover:bg-teal-100'
                            : 'text-gray-700 hover:bg-gray-100'
                          : 'text-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-xs leading-none">{dayObj.day}</span>
                      {count > 0 && (
                        <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                          isSelected ? 'bg-white' : 'bg-teal-500'
                        }`}></span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Doctor & Status Filters */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 space-y-5">
              <div>
                <h3 className="font-bold text-gray-900 mb-3 text-sm flex items-center justify-between">
                  <span>Filter by Doctor</span>
                  {selectedDoctorId !== 'ALL' && (
                    <button 
                      onClick={() => setSelectedDoctorId('ALL')}
                      className="text-xs text-teal-600 hover:underline font-normal"
                    >
                      Clear
                    </button>
                  )}
                </h3>
                <div className="space-y-2 text-xs max-h-48 overflow-y-auto pr-1">
                  <label className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                    selectedDoctorId === 'ALL' ? 'bg-teal-50 text-teal-900 font-bold' : 'hover:bg-gray-50 text-gray-700'
                  }`}>
                    <div className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        name="doctorFilter" 
                        checked={selectedDoctorId === 'ALL'} 
                        onChange={() => setSelectedDoctorId('ALL')}
                        className="text-teal-600 focus:ring-teal-500" 
                      />
                      <span>All Doctors</span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-semibold">{appointments.length}</span>
                  </label>

                  {doctors.map((doc, idx) => {
                    const docId = String(doc.id || doc.doctor_id || idx + 1);
                    const docName = doc.name || doc.fullName || (doc.users?.full_name ? `Dr. ${doc.users.full_name}` : `Doctor ${idx + 1}`);
                    const docCount = appointments.filter(a => String(a.doctorId) === docId).length;

                    return (
                      <label 
                        key={docId}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                          selectedDoctorId === docId ? 'bg-teal-50 text-teal-900 font-bold' : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <input 
                            type="radio" 
                            name="doctorFilter" 
                            checked={selectedDoctorId === docId} 
                            onChange={() => setSelectedDoctorId(docId)}
                            className="text-teal-600 focus:ring-teal-500" 
                          />
                          <span className="truncate">{docName}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-semibold">{docCount}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Status Filter Chips */}
              <div className="border-t border-gray-100 pt-4">
                <h3 className="font-bold text-gray-900 mb-2.5 text-sm">Status Filter</h3>
                <div className="flex flex-wrap gap-1.5">
                  {['ALL', 'Confirmed', 'Checked In', 'In Consultation', 'Completed', 'Cancelled'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                        statusFilter === status
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {status === 'ALL' ? 'All' : status}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Right: Appointments Schedule List */}
          <div className="xl:col-span-8 lg:col-span-7">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              
              {/* Schedule List Header */}
              <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-gray-50/70">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-bold text-gray-900 text-lg">
                      {filterAllDates ? 'All Scheduled Consultations' : `Schedule for ${selectedDateFormatted}`}
                    </h3>
                    <span className="px-2 py-0.5 bg-teal-100 text-teal-800 rounded-full text-xs font-bold">
                      {filteredAppointments.length}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">Real-time status updates from live consultations</p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Search Bar */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400">
                      <Search size={14} />
                    </div>
                    <input 
                      type="text" 
                      placeholder="Search patient, token, doctor..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-teal-500 w-48 sm:w-56 shadow-xs"
                    />
                    {search && (
                      <button onClick={() => setSearch('')} className="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-400 hover:text-gray-600">
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  {/* View Mode Toggle */}
                  <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-xs">
                    <button 
                      onClick={() => setViewMode('list')}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                        viewMode === 'list' ? 'bg-teal-50 text-teal-700' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      List View
                    </button>
                    <button 
                      onClick={() => setViewMode('timeline')}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                        viewMode === 'timeline' ? 'bg-teal-50 text-teal-700' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Timeline
                    </button>
                  </div>
                </div>
              </div>

              {/* Appointment Items */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-24 text-gray-500">
                  <Loader2 size={32} className="animate-spin text-teal-500 mb-4" />
                  <p className="font-medium">Loading schedule...</p>
                </div>
              ) : filteredAppointments.length === 0 ? (
                <div className="text-center py-20 px-4 text-gray-500">
                  <CalendarIcon size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="font-bold text-gray-800 text-base">No appointments scheduled</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                    {filterAllDates 
                      ? 'No appointments found in the system.' 
                      : `No appointments scheduled for ${selectedDateFormatted}.`}
                  </p>
                  <button 
                    onClick={() => setShowBookModal(true)}
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                  >
                    <Plus size={14} />
                    Schedule Appointment
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredAppointments.map((apt) => {
                    const isConfirmed = apt.status === 'Confirmed' || apt.status === 'Upcoming';
                    const isCompleted = (apt.status || '').toLowerCase() === 'completed';

                    return (
                      <div 
                        key={apt.id} 
                        onClick={() => setSelectedApptDetails(apt)}
                        className={`p-5 hover:bg-teal-50/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group cursor-pointer ${
                          isCompleted ? 'opacity-90 bg-gray-50/30' : ''
                        }`}
                      >
                        {/* Left Info: Time, Token, Patient, Doctor */}
                        <div className="flex items-start sm:items-center gap-4 sm:gap-6">
                          
                          {/* Time & Token Box */}
                          <div className="text-center w-24 flex-shrink-0 bg-gray-50 group-hover:bg-white p-2 rounded-xl border border-gray-100 transition-colors">
                            <p className="font-black text-gray-900 text-sm">{apt.time.split(' ')[0]}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">{apt.time.split(' ')[1] || 'AM'}</p>
                            {apt.tokenCode && (
                              <span className="inline-block mt-1 px-1.5 py-0.5 bg-teal-50 text-teal-700 text-[10px] font-extrabold rounded">
                                #{apt.tokenCode}
                              </span>
                            )}
                          </div>

                          <div className="hidden sm:block h-12 w-px bg-gray-200"></div>

                          {/* Patient & Doctor Details */}
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-gray-900 text-base group-hover:text-teal-700 transition-colors">
                                {apt.patient}
                              </h4>
                              {apt.patientUhid && (
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                  ({apt.patientUhid})
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-xs">
                              <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider border border-teal-100">
                                {apt.type}
                              </span>
                              <span className="text-gray-600 font-medium flex items-center gap-1.5">
                                <Stethoscope size={13} className="text-teal-600" />
                                {apt.doctor}
                              </span>
                              {apt.department && (
                                <span className="text-gray-400 text-[11px]">
                                  • {apt.department}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right Info: Status & Actions */}
                        <div className="flex items-center justify-between sm:justify-end gap-4 pl-28 sm:pl-0">
                          {renderStatusBadge(apt.status)}

                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            {isConfirmed && (
                              <button 
                                onClick={(e) => handleCheckIn(apt.id, e)}
                                disabled={checkingInId === apt.id}
                                className="flex items-center gap-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-xs shadow-teal-600/20 transition-colors disabled:opacity-50"
                              >
                                {checkingInId === apt.id ? <Loader2 size={12} className="animate-spin" /> : <UserCheck size={12} />}
                                Check-in
                              </button>
                            )}

                            {isConfirmed && (
                              <button 
                                onClick={(e) => handleCancel(apt.id, e)}
                                className="px-2.5 py-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 text-xs font-medium rounded-lg transition-colors"
                                title="Cancel appointment"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Modal: Book Appointment */}
        {showBookModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 relative max-h-[90vh] overflow-y-auto">
              <button 
                onClick={() => setShowBookModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100"
              >
                <X size={18} />
              </button>

              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900">Schedule Consultation</h3>
                <p className="text-xs text-gray-500 mt-1">Book a doctor appointment and reserve a live queue token.</p>
              </div>

              <form onSubmit={handleBookSubmit} className="space-y-4 text-xs">
                
                {/* Patient Name */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Patient Name *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Enter patient full name"
                    value={bookForm.patientName}
                    onChange={(e) => setBookForm({ ...bookForm, patientName: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg p-2.5 bg-gray-50 focus:bg-white focus:outline-none focus:border-teal-500"
                  />
                  {/* Quick Pick from registered directory */}
                  {patients.length > 0 && !bookForm.patientName && (
                    <div className="mt-1.5 flex flex-wrap gap-1 text-[10px]">
                      <span className="text-gray-400">Quick select:</span>
                      {patients.slice(0, 3).map((p, i) => (
                        <button
                          type="button"
                          key={i}
                          onClick={() => setBookForm({ 
                            ...bookForm, 
                            patientName: p.name, 
                            patientPhone: p.phone !== 'N/A' ? p.phone : '',
                            patientEmail: p.email !== 'N/A' ? p.email : '',
                          })}
                          className="text-teal-600 font-bold hover:underline"
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Phone Number</label>
                    <input 
                      type="text" 
                      placeholder="+91 98765 43210"
                      value={bookForm.patientPhone}
                      onChange={(e) => setBookForm({ ...bookForm, patientPhone: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg p-2.5 bg-gray-50 focus:bg-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Email</label>
                    <input 
                      type="email" 
                      placeholder="patient@email.com"
                      value={bookForm.patientEmail}
                      onChange={(e) => setBookForm({ ...bookForm, patientEmail: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg p-2.5 bg-gray-50 focus:bg-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                {/* Doctor Selection */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Select Doctor *</label>
                  <select 
                    value={bookForm.doctorId}
                    onChange={(e) => setBookForm({ ...bookForm, doctorId: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg p-2.5 bg-gray-50 focus:bg-white focus:outline-none focus:border-teal-500"
                  >
                    {doctors.map((doc, idx) => (
                      <option key={idx} value={doc.id || doc.doctor_id || idx + 1}>
                        {doc.name || doc.fullName || (doc.users?.full_name ? `Dr. ${doc.users.full_name}` : `Doctor ${idx + 1}`)} ({doc.specialization || 'General'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date & Time Slot */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Appointment Date *</label>
                    <input 
                      type="date" 
                      required
                      value={bookForm.appointmentDate}
                      onChange={(e) => setBookForm({ ...bookForm, appointmentDate: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg p-2.5 bg-gray-50 focus:bg-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Preferred Time Slot *</label>
                    <select 
                      value={bookForm.timeSlot}
                      onChange={(e) => setBookForm({ ...bookForm, timeSlot: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg p-2.5 bg-gray-50 focus:bg-white focus:outline-none focus:border-teal-500 font-semibold text-xs"
                    >
                      {availableBookingSlots.map((s, idx) => (
                        <option key={idx} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Consultation Type */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Consultation Type</label>
                  <select 
                    value={bookForm.appointmentType}
                    onChange={(e) => setBookForm({ ...bookForm, appointmentType: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg p-2.5 bg-gray-50 focus:bg-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="General Consultation">General Consultation</option>
                    <option value="Follow-up">Follow-up Visit</option>
                    <option value="New Consult">New Patient Consult</option>
                    <option value="Routine Check">Routine Check-up</option>
                    <option value="Specialist Referral">Specialist Referral</option>
                  </select>
                </div>

                <div className="pt-4 flex items-center justify-end gap-2 border-t border-gray-100">
                  <button 
                    type="button"
                    onClick={() => setShowBookModal(false)}
                    className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium shadow-xs disabled:opacity-50"
                  >
                    {submitting && <Loader2 size={14} className="animate-spin" />}
                    {submitting ? 'Booking...' : 'Confirm Appointment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Appointment & Patient Details */}
        {selectedApptDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 relative">
              <button 
                onClick={() => setSelectedApptDetails(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 text-xl font-bold">
                  {(selectedApptDetails.patient || 'P').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-gray-900">{selectedApptDetails.patient}</h3>
                    {selectedApptDetails.tokenCode && (
                      <span className="px-2 py-0.5 bg-teal-100 text-teal-800 text-xs font-black rounded-md">
                        #{selectedApptDetails.tokenCode}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">
                    {selectedApptDetails.patientUhid || 'Registered Patient'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-gray-400 font-medium mb-1 flex items-center gap-1.5"><Clock size={12} /> Schedule</p>
                  <p className="text-gray-900 font-bold">{selectedApptDetails.time}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-gray-400 font-medium mb-1 flex items-center gap-1.5"><Stethoscope size={12} /> Doctor</p>
                  <p className="text-gray-900 font-bold truncate">{selectedApptDetails.doctor}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-gray-400 font-medium mb-1 flex items-center gap-1.5"><Phone size={12} /> Contact</p>
                  <p className="text-gray-900 font-bold">{selectedApptDetails.patientPhone || 'N/A'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-gray-400 font-medium mb-1 flex items-center gap-1.5"><Mail size={12} /> Email</p>
                  <p className="text-gray-900 font-bold truncate">{selectedApptDetails.patientEmail || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs mb-6">
                <div>
                  <p className="text-gray-400 font-medium">Consultation Status</p>
                  <p className="text-gray-800 font-semibold">{selectedApptDetails.type}</p>
                </div>
                <div>
                  {renderStatusBadge(selectedApptDetails.status)}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                {selectedApptDetails.status === 'Confirmed' && (
                  <button 
                    onClick={(e) => {
                      handleCheckIn(selectedApptDetails.id, e);
                      setSelectedApptDetails(null);
                    }}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl text-xs shadow-xs"
                  >
                    Check In Patient
                  </button>
                )}
                <button 
                  onClick={() => setSelectedApptDetails(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
