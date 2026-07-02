"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Calendar, Clock, User, Activity, ChevronDown, ChevronUp } from "lucide-react";
import { usePeople } from "@/hooks/usePeople";
import { getPersonByName } from "@/lib/people";
import { PeopleFilterBar, ALL_PEOPLE } from "@/components/people/PeopleFilterBar";
import { patientApi, type ApiAppointment } from "@/services/api/patientApi";

export default function AppointmentsPage() {
  const router = useRouter();
  const { people } = usePeople();
  const [appointments, setAppointments] = useState<ApiAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<string>(ALL_PEOPLE);

  // Always reflect the backend's view of this user's appointments — no dummy
  // seeding, so brand-new accounts genuinely show the empty state.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await patientApi.getAppointments();
        if (!cancelled) setAppointments(list);
      } catch (e) {
        if (!cancelled) setAppointments([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Resolve a person id for each appointment, falling back to a name match for
  // legacy records that pre-date the people feature.
  const resolvePersonId = (apt: any): string => {
    if (apt.personId) return apt.personId;
    if (apt.bookingType === "self") return "self";
    return getPersonByName(apt.patientName)?.id || "";
  };

  const filteredAppointments = useMemo(() => {
    if (selectedPersonId === ALL_PEOPLE) return appointments;
    return appointments.filter((apt) => resolvePersonId(apt) === selectedPersonId);
  }, [appointments, selectedPersonId]);

  return (
    <div className="min-h-full bg-gray-50 dark:bg-[#0B0F14] pb-6">
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-br from-teal-400 to-teal-500 dark:from-[#064E3B] dark:via-[#047857] dark:to-[#065F46] pt-12 pb-12 px-6 rounded-b-[40px] text-white z-40 shadow-lg shadow-teal-900/20">
        <div className="flex items-center mb-6">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mr-4 backdrop-blur-sm transition-colors hover:bg-white/30"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-2xl font-bold">My Appointments</h1>
        </div>
        <p className="text-white/80 text-sm font-medium">Manage your upcoming and past visits</p>
      </div>

      {/* Background Gradient Depth */}
      <div className="fixed top-0 left-0 right-0 h-64 bg-gradient-to-b from-gray-200/80 to-transparent dark:from-gray-900/80 pointer-events-none z-0"></div>

      {/* People Filter */}
      <div className="mt-5 px-4 relative z-10">
        <PeopleFilterBar
          people={people}
          selectedId={selectedPersonId}
          onSelect={setSelectedPersonId}
          className="pt-1"
        />
      </div>

      {/* Main Content */}
      <div className="mt-4 px-4 relative z-10 space-y-4">
        {isLoading ? (
          <div className="bg-white dark:bg-[#1A2332] rounded-[1.5rem] p-8 text-center shadow-sm border border-gray-100 dark:border-[#2A3A4E]">
            <p className="text-gray-500 dark:text-[#94A3B8] text-sm">Loading your appointments…</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="bg-white dark:bg-[#1A2332] rounded-[1.5rem] p-8 text-center shadow-sm border border-gray-100 dark:border-[#2A3A4E]">
            <Calendar className="w-12 h-12 text-gray-300 dark:text-[#64748B] mx-auto mb-4" />
            <h3 className="text-gray-900 dark:text-white font-bold mb-1 text-lg">No Appointments</h3>
            <p className="text-gray-500 dark:text-[#94A3B8] text-sm mb-4">
              {selectedPersonId === ALL_PEOPLE
                ? "You haven't booked any appointments yet."
                : "No appointments found for this person."}
            </p>
            {selectedPersonId === ALL_PEOPLE && (
              <button
                onClick={() => router.push("/app/book")}
                className="inline-flex items-center gap-2 bg-teal-500 dark:bg-emerald-600 hover:bg-teal-600 dark:hover:bg-emerald-500 text-white px-5 py-2.5 rounded-full text-sm font-bold transition-colors active:scale-95"
              >
                <Calendar className="w-4 h-4" /> Book Your First Appointment
              </button>
            )}
          </div>
        ) : (
          filteredAppointments.map((apt, index) => {
            const isUpcoming = apt.status === "Upcoming";
            // For testing purposes, we treat all upcoming appointments as if they are "Today" so the Live Queue buttons show up.
            const isToday = isUpcoming;

            return (
              <motion.div
                key={apt.id + index}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setExpandedId(expandedId === apt.id ? null : apt.id)}
                className="bg-white dark:bg-[#1A2332] rounded-[1.5rem] shadow-sm border border-gray-100 dark:border-[#2A3A4E] p-5 overflow-hidden cursor-pointer hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-gray-500 dark:text-[#94A3B8] bg-gray-100 dark:bg-[#223040] px-2 py-1 rounded-md">{apt.id}</span>
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md ${
                      isUpcoming ? "bg-teal-50 dark:bg-emerald-900/30 text-teal-600 dark:text-emerald-400" : "bg-gray-100 dark:bg-[#223040] text-gray-500 dark:text-[#94A3B8]"
                    }`}>
                      {apt.status}
                    </span>
                    {apt.patientName && apt.relationship && apt.relationship !== "Self" && (
                      <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                        {apt.patientName.split(" ")[0]} · {apt.relationship}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isUpcoming && isToday && (
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-50 dark:bg-emerald-900/30 border border-green-100 dark:border-emerald-800/30">
                         <span className="relative flex h-1.5 w-1.5">
                           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                           <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500 dark:bg-emerald-500"></span>
                         </span>
                         <span className="text-[10px] font-bold text-green-700 dark:text-emerald-400 uppercase tracking-wider">Today</span>
                      </div>
                    )}
                    {expandedId === apt.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>

                <div className="flex items-start mb-2">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mr-4 shrink-0">
                    <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{apt.doctorName}</h3>
                    {expandedId === apt.id ? (
                      <p className="text-sm text-gray-500 dark:text-[#94A3B8] font-medium">{apt.department}</p>
                    ) : (
                      <div className="flex items-center text-sm mt-1 text-gray-500 dark:text-[#94A3B8]">
                        <Calendar className="w-3.5 h-3.5 mr-1.5" />
                        <span>{apt.date}</span>
                      </div>
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {expandedId === apt.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-2">
                        <div className="grid grid-cols-2 gap-3 mb-5 p-3 bg-gray-50 dark:bg-[#223040] rounded-xl border border-gray-100/50 dark:border-[#2A3A4E]">
                          <div className="flex items-center text-sm">
                            <Calendar className="w-4 h-4 text-gray-400 dark:text-[#64748B] mr-2" />
                            <span className="text-gray-700 dark:text-white font-medium">{apt.date}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <Clock className="w-4 h-4 text-gray-400 dark:text-[#64748B] mr-2" />
                            <span className="text-gray-700 dark:text-white font-medium">{apt.time || "10:30 AM"}</span>
                          </div>
                          <div className="flex items-center text-sm col-span-2">
                            <User className="w-4 h-4 text-gray-400 dark:text-[#64748B] mr-2" />
                            <span className="text-gray-700 dark:text-white font-medium text-xs">Patient: {apt.patientName || "John Doe"}</span>
                          </div>
                        </div>

                        {isUpcoming && isToday && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/app/queue?appointmentId=${apt.id}`);
                            }}
                            className="w-full bg-teal-500 dark:bg-emerald-600 hover:bg-[#4bc29a] dark:hover:bg-emerald-500 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors active:scale-95 shadow-sm"
                          >
                            <Activity className="w-5 h-5" />
                            View Live Queue
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  );
}
