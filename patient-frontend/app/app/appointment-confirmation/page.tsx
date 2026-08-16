"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { useProfile } from "@/hooks/useAppData";
import {
  CheckCircle,
  Calendar,
  Clock,
  MapPin,
  User,
  Home,
  FileText,
  Sparkles,
  Pill,
  Activity,
  ShieldCheck,
  Bot,
} from "lucide-react";

function AppointmentConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const doctorName = searchParams.get("doctorName") || "Dr. Sarah Johnson";
  const department = searchParams.get("department") || "Cardiology Specialist";
  const bookingType = searchParams.get("bookingType") || "self";
  const appointmentId = searchParams.get("appointmentId") || "APT-2024-6789";
  const hospitalName = searchParams.get("hospitalName") || "CareQ Hospital";

  // Intake Form Data passed from Booking
  const chiefComplaint = searchParams.get("chiefComplaint");
  const severity = searchParams.get("severity");
  const duration = searchParams.get("duration");
  const isFirstVisit = searchParams.get("isFirstVisit") === "true";
  const daysSinceLastVisit = searchParams.get("daysSinceLastVisit");
  const medications = searchParams.get("medications");
  const allergies = searchParams.get("allergies");

  // For "other" booking type
  const { data: profile } = useProfile();
  const patientName = searchParams.get("patientName") || profile?.full_name || "Patient";
  const patientAge = searchParams.get("patientAge") || "35";
  const patientGender = searchParams.get("patientGender") || "Male";
  const relationship = searchParams.get("relationship") || "Self";

  const displayPatientName = bookingType === "self" ? "You" : patientName;
  const displayRelationship = bookingType === "self" ? "Self" : relationship;

  const rawDate = searchParams.get("appointmentDate");
  let displayDate = "Tomorrow, June 17, 2026";
  let displayTime = "10:30 AM - 11:00 AM";

  if (rawDate) {
    const d = new Date(rawDate);
    displayDate = d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const startTime = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    d.setMinutes(d.getMinutes() + 30); // 30-min slot
    const endTime = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    displayTime = `${startTime} - ${endTime}`;
  }

  return (
    <div className="min-h-full bg-gray-50 dark:bg-[#0B0F14] flex flex-col pb-10">
      {/* Success Header */}
      <div className="bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-700 dark:from-[#064E3B] dark:via-[#047857] dark:to-[#065F46] pt-[calc(env(safe-area-inset-top)+2.5rem)] pb-8 px-6 rounded-b-[40px] shadow-lg shadow-teal-900/15">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="flex flex-col items-center"
        >
          <div className="w-14 h-14 bg-white dark:bg-[#0B0F14] rounded-full flex items-center justify-center mb-3 shadow-md">
            <CheckCircle className="w-8 h-8 text-teal-500 dark:text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Appointment Confirmed!</h1>
          <p className="text-teal-100 text-center text-xs font-medium">
            Your appointment & pre-consultation intake are registered
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex-1 px-5 mt-5 space-y-4 max-w-2xl mx-auto w-full"
      >
        {/* Appointment Card */}
        <div className="bg-white dark:bg-[#1A2332] border border-gray-100 dark:border-[#2A3A4E] rounded-3xl shadow-xs p-5">
          {/* Appointment ID */}
          <div className="bg-teal-50 dark:bg-emerald-600/10 rounded-2xl px-4 py-2.5 mb-4 text-center border border-teal-100 dark:border-emerald-500/20">
            <p className="text-[10px] text-gray-500 dark:text-[#94A3B8] mb-0.5 uppercase tracking-wider font-bold">
              Appointment Token ID
            </p>
            <h3 className="text-base text-teal-700 dark:text-emerald-400 font-mono font-bold tracking-wide">
              {appointmentId}
            </h3>
          </div>

          {/* Doctor Info */}
          <div className="flex items-center mb-4 pb-4 border-b border-gray-100 dark:border-[#2A3A4E]">
            <div className="text-4xl mr-3.5">🩺</div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">{doctorName}</h3>
              <p className="text-xs text-teal-700 dark:text-emerald-400 font-medium">{department}</p>
              <p className="text-[11px] text-gray-500 dark:text-[#94A3B8]">{hospitalName}</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div className="flex items-center">
              <div className="w-9 h-9 bg-blue-50 dark:bg-blue-500/15 rounded-xl flex items-center justify-center mr-3 shrink-0">
                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 dark:text-[#94A3B8] font-semibold">Date</p>
                <p className="text-gray-900 dark:text-white font-bold">{displayDate}</p>
              </div>
            </div>

            <div className="flex items-center">
              <div className="w-9 h-9 bg-purple-50 dark:bg-purple-500/15 rounded-xl flex items-center justify-center mr-3 shrink-0">
                <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 dark:text-[#94A3B8] font-semibold">Scheduled Time</p>
                <p className="text-gray-900 dark:text-white font-bold">{displayTime}</p>
              </div>
            </div>

            <div className="flex items-center">
              <div className="w-9 h-9 bg-orange-50 dark:bg-orange-500/15 rounded-xl flex items-center justify-center mr-3 shrink-0">
                <MapPin className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 dark:text-[#94A3B8] font-semibold">Location</p>
                <p className="text-gray-900 dark:text-white font-bold">{hospitalName}, OPD Wing</p>
              </div>
            </div>

            <div className="flex items-center">
              <div className="w-9 h-9 bg-green-50 dark:bg-emerald-500/15 rounded-xl flex items-center justify-center mr-3 shrink-0">
                <User className="w-4 h-4 text-green-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 dark:text-[#94A3B8] font-semibold">Patient</p>
                <p className="text-gray-900 dark:text-white font-bold">
                  {displayPatientName}{" "}
                  <span className="text-gray-500 dark:text-[#94A3B8] font-normal">
                    ({displayRelationship})
                  </span>
                </p>
                {bookingType === "other" && (
                  <p className="text-[10px] text-gray-500 dark:text-[#94A3B8]">
                    {patientAge} yrs • {patientGender}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* INTAKE FORM SUMMARY CARD */}
        {/* ======================================================== */}
        <div className="bg-white dark:bg-[#1A2332] border border-gray-100 dark:border-[#2A3A4E] rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
              <FileText className="w-4 h-4 text-teal-600 dark:text-emerald-400" />
              Submitted Intake & Visit Timeline
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-teal-50 dark:bg-emerald-950/40 text-teal-700 dark:text-emerald-400 text-[10px] font-bold border border-teal-200 dark:border-emerald-800">
              Synced with AI
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 bg-gray-50 dark:bg-[#111820] rounded-2xl border border-gray-100 dark:border-[#2A3A4E]">
              <p className="text-[10px] text-gray-500 dark:text-[#94A3B8] font-bold mb-0.5">
                VISIT HISTORY & TIMELINE:
              </p>
              <p className="text-gray-800 dark:text-gray-200 font-semibold">
                {isFirstVisit
                  ? "⭐ First-time hospital visit"
                  : `🔄 Revisit — Last visited ${daysSinceLastVisit || "7"} days ago`}
              </p>
            </div>

            {chiefComplaint && (
              <div className="p-3 bg-gray-50 dark:bg-[#111820] rounded-2xl border border-gray-100 dark:border-[#2A3A4E]">
                <p className="text-[10px] text-gray-500 dark:text-[#94A3B8] font-bold mb-0.5">
                  CHIEF COMPLAINT:
                </p>
                <p className="text-gray-800 dark:text-gray-200 font-semibold">{chiefComplaint}</p>
                {(duration || severity) && (
                  <div className="flex items-center gap-2 mt-1.5 text-[11px]">
                    {duration && (
                      <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-medium">
                        Duration: {duration}
                      </span>
                    )}
                    {severity && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-medium">
                        Severity: {severity}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {(medications || allergies) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {medications && (
                  <div className="p-2.5 bg-gray-50 dark:bg-[#111820] rounded-xl border border-gray-100 dark:border-[#2A3A4E]">
                    <p className="text-[10px] text-gray-500 dark:text-[#94A3B8] font-bold">MEDICATIONS:</p>
                    <p className="text-gray-800 dark:text-gray-200 text-[11px] truncate">{medications}</p>
                  </div>
                )}
                {allergies && (
                  <div className="p-2.5 bg-gray-50 dark:bg-[#111820] rounded-xl border border-gray-100 dark:border-[#2A3A4E]">
                    <p className="text-[10px] text-gray-500 dark:text-[#94A3B8] font-bold">ALLERGIES:</p>
                    <p className="text-gray-800 dark:text-gray-200 text-[11px] truncate">{allergies}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* CareQ AI Feature Card */}
        <div className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/40 dark:to-emerald-950/30 border border-teal-200/80 dark:border-teal-800/50 rounded-3xl p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1">
              CareQ AI Assistant is Ready
              <Sparkles className="w-3 h-3 text-amber-500" />
            </h4>
            <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-0.5">
              You can ask CareQ AI anytime: <span className="italic font-semibold">&quot;Maine kitne dino pehle visit kiya tha?&quot;</span> or <span className="italic font-semibold">&quot;Form me kya details bhari thi?&quot;</span> and it will summarize everything for you!
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <button
            onClick={() => router.push("/app/queue")}
            className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white py-3.5 rounded-2xl font-bold text-xs shadow-md shadow-teal-500/25 dark:shadow-emerald-900/40 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
          >
            <Clock className="w-4 h-4" />
            View Live Queue Status
          </button>

          <button
            onClick={() => router.push("/app/home")}
            className="w-full bg-white dark:bg-[#1A2332] border border-gray-200 dark:border-[#2A3A4E] text-gray-700 dark:text-[#CBD5E1] py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-[#223040] transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function AppointmentConfirmation() {
  return (
    <Suspense
      fallback={
        <div className="min-h-full bg-gray-50 dark:bg-[#0B0F14] flex items-center justify-center text-gray-500 dark:text-[#94A3B8]">
          Loading confirmation...
        </div>
      }
    >
      <AppointmentConfirmationContent />
    </Suspense>
  );
}
