"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useProfile, useAppointments, useCancelAppointment } from "@/hooks/useAppData";
import {
  Clock,
  Users,
  RefreshCw,
  Bell,
  X,
  Activity,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  User,
  MapPin,
} from "lucide-react";
import { useLayout } from "@/contexts/LayoutContext";
import { patientApi, type ApiAppointment } from "@/services/api/patientApi";

export default function MyQueue() {
  const router = useRouter();
  const { isMobileView } = useLayout();
  const [isServingExpanded, setIsServingExpanded] = useState(false);
  const [activeAppointmentId, setActiveAppointmentId] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<ApiAppointment[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelDone, setCancelDone] = useState(false);

  const { data: allAppointments = [] } = useAppointments();
  const cancelMutation = useCancelAppointment();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const initialAptId = params.get("appointmentId");
      if (initialAptId && !activeAppointmentId) setActiveAppointmentId(initialAptId);
    }

    const upcoming = allAppointments.filter((a) => a.status === "Upcoming");
    setAppointments(upcoming);
    
    if (!activeAppointmentId && upcoming.length > 0) {
      // If we don't have an active one, pick the first one
      setActiveAppointmentId(upcoming[0].id);
    } else if (activeAppointmentId && upcoming.length > 0 && !upcoming.some(a => a.id === activeAppointmentId)) {
      // If the currently active one is no longer 'Upcoming' (e.g. cancelled/completed), switch to the first available
      setActiveAppointmentId(upcoming[0].id);
    }
  }, [allAppointments, activeAppointmentId]);

  const handleConfirmCancel = async () => {
    if (!activeAppointmentId) return;
    setIsCancelling(true);
    try {
      await cancelMutation.mutateAsync(activeAppointmentId);
    } catch (e) {
      console.error("Failed to cancel appointment", e);
    }
    setIsCancelling(false);
    setCancelDone(true);
    await new Promise((r) => setTimeout(r, 1200));
    router.push("/app/appointments");
  };

  const activeApt = appointments.find(a => a.id === activeAppointmentId) || appointments[0];
  const tokenDisplay = activeApt ? activeApt.id.replace("APT-", "T-") : "T-142";
  const doctorDisplay = activeApt ? activeApt.doctorName : "Dr. Sarah Johnson";
  const departmentDisplay = activeApt ? activeApt.department : "Cardiology Department";
  const { data: profile } = useProfile();
  const patientDisplay = activeApt ? `${activeApt.patientName} (${activeApt.relationship})` : (profile?.full_name ? `${profile.full_name} (Self)` : "Patient (Self)");

  return (
    <div className="min-h-full bg-gray-50 dark:bg-[#0B0F14] pb-6">
      {/* Digital Ticket Header */}
      <div className="bg-gradient-to-br from-teal-400 to-teal-500 dark:from-[#064E3B] dark:via-[#047857] dark:to-[#065F46] pt-[calc(env(safe-area-inset-top)+3.5rem)] pb-8 px-6 rounded-b-[2.5rem] shadow-md text-white relative z-20">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          {/* Top Row (Identity) */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-white/80 text-xs font-medium uppercase tracking-wider mb-1">Your Token</p>
              <h1 className="text-[32px] font-extrabold tracking-tight mb-1 drop-shadow-sm">{tokenDisplay}</h1>
              <p className="text-white/90 text-sm font-medium">{departmentDisplay}</p>
            </div>
            <div className="px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold flex items-center gap-2 border border-white/20 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
              </span>
              <span className="tracking-wide uppercase text-white shadow-sm">Live</span>
            </div>
          </div>

          {/* Stats Strip */}
          <div className="grid grid-cols-3 gap-2 bg-black/10 p-2 rounded-2xl backdrop-blur-md border border-white/10 items-center text-center">
            <div className="py-1">
              <p className="text-white/70 text-[10px] uppercase tracking-wider mb-0.5">Ahead</p>
              <p className="text-xl font-bold">2</p>
            </div>
            <div className="py-1 border-x border-white/10">
              <p className="text-white/70 text-[10px] uppercase tracking-wider mb-0.5">Wait</p>
              <p className="text-xl font-bold">15m</p>
            </div>
            <div className="bg-white/25 rounded-xl py-2 shadow-sm border border-white/30 transform scale-105 mx-1">
              <p className="text-white/90 text-[10px] uppercase tracking-wider font-semibold mb-0.5">Arrive By</p>
              <p className="text-lg font-bold">10:15 AM</p>
            </div>
          </div>

          {/* Appointment Selector — below the stats strip so it never clips under the notch */}
          {appointments.length > 1 && (
            <>
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                    onClick={() => setIsDropdownOpen(false)}
                  />
                )}
              </AnimatePresence>

              <div className="relative mt-3 z-50">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-1.5 text-teal-50 text-xs bg-black/15 px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/20 active:scale-95 transition-all"
                >
                  {doctorDisplay} (10:30 AM)
                  {isDropdownOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-[#1A2332] rounded-2xl shadow-xl z-50 overflow-hidden border border-gray-100 dark:border-[#2A3A4E]"
                    >
                      {appointments.map((apt) => (
                        <button
                          key={apt.id}
                          onClick={() => {
                            setActiveAppointmentId(apt.id);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#223040] transition-colors ${
                            activeAppointmentId === apt.id ? "bg-teal-50 dark:bg-emerald-900/30" : ""
                          }`}
                        >
                          <div>
                            <p className={`text-sm font-bold ${activeAppointmentId === apt.id ? "text-teal-700 dark:text-emerald-400" : "text-gray-900 dark:text-white"}`}>
                              {apt.doctorName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-[#94A3B8]">{apt.department} • {apt.id.replace("APT-", "T-")}</p>
                          </div>
                          {activeAppointmentId === apt.id && (
                            <div className="w-2 h-2 rounded-full bg-teal-500 dark:bg-emerald-600"></div>
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="mt-6 px-4 relative z-10 space-y-4">
        {/* Current Serving */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-[#1A2332] rounded-[1.5rem] shadow-sm border border-gray-100 dark:border-[#2A3A4E] p-3 overflow-hidden"
        >
          <div 
            className="flex items-center justify-between mb-2 cursor-pointer"
            onClick={() => setIsServingExpanded(!isServingExpanded)}
          >
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mr-3">
                <Activity className="w-5 h-5 text-green-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-[#94A3B8] font-medium">Currently Serving</p>
                <h3 className="text-base text-gray-900 dark:text-white font-bold">{tokenDisplay.replace("T-", "T-") /* Ensure correct format */}</h3>
              </div>
            </div>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 dark:bg-[#223040] text-gray-500 dark:text-[#94A3B8] transition-colors hover:bg-gray-100 dark:hover:bg-[#2A3A4E]">
              {isServingExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>

          <AnimatePresence initial={false} mode="popLayout">
            {isServingExpanded ? (
              <motion.div
                key="expanded"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="overflow-hidden w-full"
              >
                <div className="pt-3 border-t border-gray-100 dark:border-[#2A3A4E] space-y-4">
                  {/* Patient Info */}
                  <div className="flex items-start">
                    <User className="w-5 h-5 text-gray-400 dark:text-[#64748B] mr-3 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-[#94A3B8] uppercase tracking-wider font-medium mb-0.5">Patient</p>
                      <p className="text-sm text-gray-900 dark:text-white font-medium">{patientDisplay.split(' (')[0]} <span className="text-gray-500 dark:text-[#94A3B8] font-normal">({patientDisplay.split(' (')[1] || "Self)"}</span></p>
                    </div>
                  </div>

                  {/* Doctor Info */}
                  <div className="flex items-start">
                    <User className="w-5 h-5 text-gray-400 dark:text-[#64748B] mr-3 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-[#94A3B8] uppercase tracking-wider font-medium mb-0.5">Doctor</p>
                      <div className="flex items-center">
                        <p className="text-sm text-gray-900 dark:text-white font-medium mr-2">{doctorDisplay}</p>
                        <div className="flex items-center">
                          <span className="w-1.5 h-1.5 bg-green-500 dark:bg-emerald-500 rounded-full mr-1.5"></span>
                          <span className="text-[10px] font-bold text-green-600 dark:text-emerald-400 uppercase tracking-wider">Available</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Location Info */}
                  <div className="flex items-start">
                    <MapPin className="w-5 h-5 text-gray-400 dark:text-[#64748B] mr-3 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-[#94A3B8] uppercase tracking-wider font-medium mb-0.5">Location</p>
                      <p className="text-sm text-gray-900 dark:text-white font-medium">Hospital Name, Room 3A</p>
                      <p className="text-xs text-gray-500 dark:text-[#94A3B8]">{departmentDisplay}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="collapsed"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="bg-blue-50/50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-100/50 dark:border-blue-900/30 mt-2 overflow-hidden w-full cursor-pointer"
                onClick={() => setIsServingExpanded(true)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-800 dark:text-white">{doctorDisplay}</span>
                  <div className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-green-500 dark:bg-emerald-500 rounded-full mr-1.5"></span>
                    <span className="text-[10px] font-medium text-green-600 dark:text-emerald-400 uppercase tracking-wider">Available</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-[#94A3B8] mb-1">
                  Patient: {patientDisplay}
                </p>
                <p className="text-xs text-gray-500 dark:text-[#94A3B8]">
                  Room 3A • {departmentDisplay}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Queue Progress Timeline */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-[#1A2332] rounded-[1.5rem] shadow-sm border border-gray-100 dark:border-[#2A3A4E] p-3"
        >
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Queue Timeline</h3>

          <div className="space-y-4">
            {/* Patient Ahead 1 */}
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-50/80 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-4 border border-blue-100 dark:border-blue-800/30">
                <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">140</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-gray-800 dark:text-white text-sm font-medium">Token 140</span>
                  <span className="text-[10px] px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full font-medium">
                    In Progress
                  </span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-[#2A3A4E] rounded-full h-1.5">
                  <div className="bg-green-500 dark:bg-emerald-500 h-1.5 rounded-full" style={{ width: "80%" }}></div>
                </div>
              </div>
            </div>

            {/* Patient Ahead 2 */}
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gray-50 dark:bg-[#223040] rounded-full flex items-center justify-center mr-4 border border-gray-100 dark:border-[#2A3A4E]">
                <span className="text-gray-600 dark:text-[#94A3B8] font-bold text-sm">141</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-gray-800 dark:text-white text-sm font-medium">Token 141</span>
                  <span className="text-[10px] px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full font-medium">
                    Waiting
                  </span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-[#2A3A4E] rounded-full h-1.5">
                  <div className="bg-yellow-500 h-1.5 rounded-full" style={{ width: "20%" }}></div>
                </div>
              </div>
            </div>

            {/* Your Token */}
            <div className="flex items-center bg-teal-500 dark:bg-emerald-600/10 rounded-2xl p-3 border border-teal-500/20">
              <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center mr-4 shadow-sm shadow-teal-500/30">
                <span className="text-white font-bold text-sm">{tokenDisplay.replace("T-", "")}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-900 dark:text-white font-bold text-sm">Your Turn</span>
                  <span className="text-[10px] px-2 py-0.5 bg-teal-500 dark:bg-emerald-600 text-white rounded-full font-medium">
                    Upcoming
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-[#94A3B8]">~15 minutes remaining</p>
              </div>
            </div>
          </div>
        </motion.div>



        {/* Action Buttons (Small) */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-3 gap-3"
        >
          <button className="bg-white dark:bg-[#1A2332] rounded-xl p-3 shadow-sm border border-gray-100 dark:border-[#2A3A4E] flex flex-col items-center hover:bg-gray-50 dark:hover:bg-[#223040] transition-colors active:scale-95">
            <RefreshCw className="w-5 h-5 text-blue-500 dark:text-blue-400 mb-1.5" />
            <span className="text-[11px] text-gray-600 dark:text-[#94A3B8] font-medium">Refresh</span>
          </button>
          <button className="bg-white dark:bg-[#1A2332] rounded-xl p-3 shadow-sm border border-gray-100 dark:border-[#2A3A4E] flex flex-col items-center hover:bg-gray-50 dark:hover:bg-[#223040] transition-colors active:scale-95">
            <Bell className="w-5 h-5 text-purple-500 dark:text-purple-400 mb-1.5" />
            <span className="text-[11px] text-gray-600 dark:text-[#94A3B8] font-medium">Notify Me</span>
          </button>
          <button
            onClick={() => setShowCancelDialog(true)}
            className="bg-white dark:bg-[#1A2332] rounded-xl p-3 shadow-sm border border-gray-100 dark:border-[#2A3A4E] flex flex-col items-center hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors active:scale-95"
          >
            <X className="w-5 h-5 text-red-500 dark:text-red-400 mb-1.5" />
            <span className="text-[11px] text-red-500 dark:text-red-400 font-medium">Cancel</span>
          </button>
        </motion.div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <AnimatePresence>
        {showCancelDialog && (
          <>
            {/* Backdrop — closes dialog on tap */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => !isCancelling && setShowCancelDialog(false)}
            />

            {/* Centered dialog card */}
            <motion.div
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.88, opacity: 0 }}
              transition={{ type: "spring", damping: 26, stiffness: 320 }}
              className="fixed inset-0 z-50 flex items-center justify-center px-6 pointer-events-none"
            >
              <div
                className="w-full max-w-sm bg-white dark:bg-[#1A2332] rounded-3xl px-6 pt-7 pb-6 shadow-2xl pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {cancelDone ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center py-4 gap-3"
                  >
                    <div className="w-14 h-14 bg-green-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-green-500 dark:text-emerald-400" />
                    </div>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">Appointment Cancelled</p>
                    <p className="text-sm text-gray-500 dark:text-[#94A3B8] text-center">Redirecting to your appointments…</p>
                  </motion.div>
                ) : (
                  <>
                    {/* Icon */}
                    <div className="flex items-center justify-center mb-4">
                      <div className="w-14 h-14 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                        <X className="w-7 h-7 text-red-500 dark:text-red-400" />
                      </div>
                    </div>

                    <h2 className="text-lg font-bold text-gray-900 dark:text-white text-center mb-1">
                      Cancel Appointment?
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-[#94A3B8] text-center mb-5">
                      You are about to cancel your appointment with{" "}
                      <span className="font-semibold text-gray-700 dark:text-white">{doctorDisplay}</span>.
                    </p>

                    {/* Trust score warning */}
                    <div className="bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-700/30 rounded-2xl p-4 mb-6 flex gap-3">
                      <span className="text-amber-500 text-lg mt-0.5">⚠️</span>
                      <div>
                        <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">Trust Score Notice</p>
                        <p className="text-xs text-amber-600 dark:text-amber-300/80 leading-relaxed">
                          Repeatedly cancelling appointments lowers your{" "}
                          <span className="font-semibold">Trust Score</span>. A lower score may affect your queue priority and booking access in the future.
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowCancelDialog(false)}
                        className="flex-1 py-3.5 rounded-2xl border border-gray-200 dark:border-[#2A3A4E] text-sm font-semibold text-gray-700 dark:text-white bg-gray-50 dark:bg-[#223040] active:scale-95 transition-all"
                      >
                        Keep
                      </button>
                      <button
                        onClick={handleConfirmCancel}
                        disabled={isCancelling}
                        className="flex-1 py-3.5 rounded-2xl bg-red-500 text-white text-sm font-semibold shadow-sm shadow-red-500/30 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                        {isCancelling ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Cancelling…
                          </>
                        ) : (
                          "Yes, Cancel"
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

