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
  Phone,
  Home,
  FileText,
} from "lucide-react";

function AppointmentConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const doctorName = searchParams.get("doctorName") || "Dr. Sarah Johnson";
  const department = searchParams.get("department") || "Cardiology Specialist";
  const bookingType = searchParams.get("bookingType") || "self";
  const appointmentId = searchParams.get("appointmentId") || "APT-2024-6789";
  
  const hospitalName = searchParams.get("hospitalName") || "Hospital Name";
  
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
    displayDate = d.toLocaleDateString("en-US", { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
    const startTime = d.toLocaleTimeString("en-US", { hour: 'numeric', minute: '2-digit', hour12: true });
    d.setMinutes(d.getMinutes() + 30); // 30-min slot
    const endTime = d.toLocaleTimeString("en-US", { hour: 'numeric', minute: '2-digit', hour12: true });
    displayTime = `${startTime} - ${endTime}`;
  }

  return (
    <div className="min-h-full bg-gray-50 dark:bg-[#0B0F14] flex flex-col pb-6">
      {/* Success Header */}
      <div className="bg-gradient-to-br from-teal-400 to-teal-500 dark:from-[#064E3B] dark:via-[#047857] dark:to-[#065F46] pt-[calc(env(safe-area-inset-top)+2.5rem)] pb-8 px-6 rounded-b-[40px]">
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
          <p className="text-white/80 text-center text-sm">Your appointment has been successfully booked</p>
        </motion.div>
      </div>

      {/* Appointment Details — sits below the green hero with breathing
          room rather than overlapping it, so the tick + heading stay
          fully visible. */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex-1 px-6 mt-5"
      >
        <div className="bg-white dark:bg-[#1A2332] border border-gray-100 dark:border-[#2A3A4E] rounded-3xl shadow-sm dark:shadow-black/20 p-5 mb-5">
          {/* Appointment ID — compact pill, no longer dominates the card. */}
          <div className="bg-teal-50 dark:bg-emerald-600/10 rounded-xl px-4 py-2.5 mb-5 text-center border border-teal-100 dark:border-emerald-500/20">
            <p className="text-[11px] text-gray-500 dark:text-[#94A3B8] mb-0.5 uppercase tracking-wide">Appointment ID</p>
            <h3 className="text-base text-teal-600 dark:text-emerald-400 font-mono font-bold tracking-wide">{appointmentId}</h3>
          </div>

          {/* Doctor Info */}
          <div className="flex items-center mb-6 pb-6 border-b border-gray-100 dark:border-[#2A3A4E]">
            <div className="text-5xl mr-4">👨‍⚕️</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{doctorName}</h3>
              <p className="text-sm text-gray-600 dark:text-[#CBD5E1]">{department}</p>
              <p className="text-xs text-gray-500 dark:text-[#94A3B8] mt-1">{hospitalName}</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/15 rounded-xl flex items-center justify-center mr-4">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-[#94A3B8]">Date</p>
                <p className="text-gray-900 dark:text-white font-medium">{displayDate}</p>
              </div>
            </div>

            <div className="flex items-center">
              <div className="w-10 h-10 bg-purple-50 dark:bg-purple-500/15 rounded-xl flex items-center justify-center mr-4">
                <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-[#94A3B8]">Time</p>
                <p className="text-gray-900 dark:text-white font-medium">{displayTime}</p>
              </div>
            </div>

            <div className="flex items-center">
              <div className="w-10 h-10 bg-orange-50 dark:bg-orange-500/15 rounded-xl flex items-center justify-center mr-4">
                <MapPin className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-[#94A3B8]">Location</p>
                <p className="text-gray-900 dark:text-white font-medium">{hospitalName}, OPD Wing</p>
              </div>
            </div>

            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-50 dark:bg-emerald-500/15 rounded-xl flex items-center justify-center mr-4">
                <User className="w-5 h-5 text-green-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-[#94A3B8]">Patient</p>
                <p className="text-gray-900 dark:text-white font-medium">
                  {displayPatientName}{" "}
                  <span className="text-gray-500 dark:text-[#94A3B8] text-sm font-normal">({displayRelationship})</span>
                </p>
                {bookingType === "other" && (
                  <p className="text-xs text-gray-500 dark:text-[#94A3B8] mt-0.5">
                    {patientAge} yrs • {patientGender}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 mb-6">
          <button className="w-full bg-teal-500 dark:bg-emerald-600 text-white py-4 rounded-2xl font-medium flex items-center justify-center shadow-lg shadow-teal-500/25 dark:shadow-emerald-600/30 hover:bg-teal-600 dark:hover:bg-emerald-500 transition-colors">
            <Calendar className="w-5 h-5 mr-2" />
            Add to Calendar
          </button>

          <button
            onClick={() => router.push("/app/queue")}
            className="w-full border-2 border-teal-500 dark:border-emerald-500 text-teal-600 dark:text-emerald-400 py-4 rounded-2xl font-medium flex items-center justify-center hover:bg-teal-50 dark:hover:bg-emerald-500/10 transition-colors"
          >
            <Clock className="w-5 h-5 mr-2" />
            View Queue Status
          </button>

          <button
            onClick={() => router.push("/app/home")}
            className="w-full bg-gray-100 dark:bg-[#1A2332] border dark:border-[#2A3A4E] text-gray-700 dark:text-[#CBD5E1] py-4 rounded-2xl font-medium flex items-center justify-center hover:bg-gray-200 dark:hover:bg-[#223040] transition-colors"
          >
            <Home className="w-5 h-5 mr-2" />
            Back to Home
          </button>
        </div>

        {/* Reminder */}
        <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-2xl p-4 mb-6">
          <div className="flex items-start">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3 mt-1" />
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Reminder</p>
              <p className="text-xs text-gray-600 dark:text-[#94A3B8]">
                Please arrive 15 minutes early and bring your ABHA ID card and any previous medical records.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function AppointmentConfirmation() {
  return (
    <Suspense fallback={<div className="min-h-full bg-gray-50 dark:bg-[#0B0F14] flex items-center justify-center text-gray-500 dark:text-[#94A3B8]">Loading...</div>}>
      <AppointmentConfirmationContent />
    </Suspense>
  );
}
