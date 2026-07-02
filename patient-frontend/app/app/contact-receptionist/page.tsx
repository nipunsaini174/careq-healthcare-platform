"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Phone, MessageSquare, ChevronDown, Send, Info, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import { patientApi, type ApiAppointment } from "@/services/api/patientApi";

export default function ContactReceptionist() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<ApiAppointment[]>([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await patientApi.getAppointments();
        if (cancelled) return;
        // Receptionist contact only makes sense for currently-active bookings.
        const upcoming = list.filter((a) => a.status === "Upcoming");
        setAppointments(upcoming);
        if (upcoming.length > 0) {
          setSelectedAppointmentId(upcoming[0].id);
        }
      } catch (_e) {
        if (!cancelled) setAppointments([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedAppointment = appointments.find(a => a.id === selectedAppointmentId) || appointments[0];
  const hospitalPhone = "+1 (555) 123-4567";

  return (
    <div className="min-h-full bg-gray-50 dark:bg-[#0B0F14] pb-6">
      {/* Header */}
      <div className="bg-white dark:bg-[#1A2332] pt-14 pb-6 px-6 shadow-sm sticky top-0 z-30">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-[#223040] rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-[#94A3B8]" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Help & Support</h1>
          <div className="w-10"></div>
        </div>

        {/* Desk Selector */}
        <div className="relative z-50">
          <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">Select Appointment</p>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center justify-between bg-gray-50 dark:bg-[#223040] border border-gray-200 dark:border-[#2A3A4E] p-4 rounded-2xl active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {selectedAppointment ? (selectedAppointment.doctorName.startsWith('Dr.') ? selectedAppointment.doctorName : `Dr. ${selectedAppointment.doctorName}`) : 'No Appointments'}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className={`w-2 h-2 rounded-full ${selectedAppointment ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <p className="text-xs text-gray-500 dark:text-[#94A3B8]">
                    {selectedAppointment ? `${selectedAppointment.department} Reception` : 'Offline'}
                  </p>
                </div>
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                  onClick={() => setIsDropdownOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#223040] rounded-2xl shadow-xl border border-gray-100 dark:border-[#2A3A4E] z-50 max-h-[300px] overflow-y-auto"
                >
                  {appointments.length > 0 ? appointments.map((apt) => (
                    <button
                      key={apt.id}
                      onClick={() => {
                        setSelectedAppointmentId(apt.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-4 border-b border-gray-50 dark:border-[#2A3A4E]/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors text-left ${selectedAppointmentId === apt.id ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                    >
                      <div>
                        <p className={`font-medium ${selectedAppointmentId === apt.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-200'}`}>
                          {apt.doctorName.startsWith('Dr.') ? apt.doctorName : `Dr. ${apt.doctorName}`}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-[#94A3B8] mt-0.5">{apt.department} • {apt.date}</p>
                      </div>
                      {selectedAppointmentId === apt.id && (
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      )}
                    </button>
                  )) : (
                    <div className="p-4 text-sm text-gray-500 text-center">No upcoming appointments found</div>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="p-6 space-y-6 relative z-10">
        {/* Quick Call Action */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white dark:bg-[#1A2332] rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-[#2A3A4E] flex items-center justify-between"
        >
          <div>
            <p className="text-sm text-gray-500 dark:text-[#94A3B8] mb-1">Direct Line</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white tracking-wide">{hospitalPhone}</p>
          </div>
          <a href={`tel:${hospitalPhone}`} className="w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform">
            <Phone className="w-6 h-6" />
          </a>
        </motion.div>

        {/* Messaging Section */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-[#1A2332] rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-[#2A3A4E]"
        >
          <div className="flex items-center gap-2 mb-6">
            <MessageSquare className="w-5 h-5 text-blue-500" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Send a Message</h2>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/10 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Messages are monitored during regular business hours. For medical emergencies, please call 911 immediately.
            </p>
          </div>

          <div className="space-y-4">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="How can we help you today?"
              className="w-full bg-gray-50 dark:bg-[#223040] border border-gray-200 dark:border-[#2A3A4E] rounded-2xl p-4 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 dark:text-white"
            ></textarea>
            
            <button 
              className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                message.trim().length > 0 
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md active:scale-[0.98]' 
                : 'bg-gray-100 dark:bg-[#223040] text-gray-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-5 h-5" />
              Send Message
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
