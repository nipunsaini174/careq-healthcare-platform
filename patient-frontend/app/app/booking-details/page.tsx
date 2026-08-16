"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  User,
  Users,
  Plus,
  Check,
  Calendar,
  Clock,
  Activity,
  AlertCircle,
  FileText,
  Pill,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { patientApi } from "../../../services/api/patientApi";
import { usePeople } from "@/hooks/usePeople";
import { getPersonById } from "@/lib/people";
import { PersonAvatar } from "@/components/people/PersonAvatar";
import { AddPersonSheet } from "@/components/people/AddPersonSheet";

const COMMON_CHIEF_COMPLAINTS = [
  "Routine Checkup / Consultation",
  "Fever & Body Pain",
  "Severe Cough & Breathing Trouble",
  "Chest Pain / Discomfort",
  "Knee / Joint Pain & Swelling",
  "Severe Headache / Migraine",
  "Stomach Pain & Acidity",
  "Skin Rash / Allergy",
];

const PRESET_VISIT_DAYS = [
  { label: "3 Days ago", days: 3 },
  { label: "7 Days ago (1 wk)", days: 7 },
  { label: "15 Days ago (2 wks)", days: 15 },
  { label: "30 Days ago (1 mo)", days: 30 },
  { label: "60 Days ago (2 mo)", days: 60 },
  { label: "90+ Days ago (3 mo+)", days: 90 },
];

function BookingDetailsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const doctorId = searchParams.get("doctorId");
  const doctorName = searchParams.get("doctorName");
  const department = searchParams.get("department");
  const hospitalId = searchParams.get("hospitalId");
  const hospitalName = searchParams.get("hospitalName");

  const { people } = usePeople();
  const self = people.find((p) => p.isSelf);
  const dependents = people.filter((p) => !p.isSelf);

  // Booking beneficiary state
  const [bookingType, setBookingType] = useState<"self" | "other">("self");
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [showAddPerson, setShowAddPerson] = useState(false);

  // Clinical Intake & Visit History Form State
  const [isFirstVisit, setIsFirstVisit] = useState<boolean>(true);
  const [selectedDaysPreset, setSelectedDaysPreset] = useState<number | null>(7);
  const [customDays, setCustomDays] = useState<string>("");

  const [chiefComplaint, setChiefComplaint] = useState<string>("");
  const [duration, setDuration] = useState<string>("3-7 days");
  const [severity, setSeverity] = useState<"Mild" | "Moderate" | "Severe">("Moderate");
  const [medications, setMedications] = useState<string>("");
  const [medicalHistory, setMedicalHistory] = useState<string>("");
  const [allergies, setAllergies] = useState<string>("");
  const [intakeNotes, setIntakeNotes] = useState<string>("");

  const [isLoading, setIsLoading] = useState(false);

  const handleBack = () => {
    const params = new URLSearchParams();
    if (hospitalId && department) {
      params.set("hospitalId", hospitalId);
      params.set("specialty", department);
    } else if (department) {
      params.set("view", "doctors");
      params.set("specialty", department);
    } else {
      params.set("view", "doctors");
    }
    router.push(`/app/book?${params.toString()}`);
  };

  const handleContinue = async () => {
    try {
      setIsLoading(true);

      const person = bookingType === "self" ? self : getPersonById(selectedPersonId);

      if (bookingType === "other" && !person) {
        alert("Please select or add a person for this appointment.");
        setIsLoading(false);
        return;
      }

      const personName = person?.name || "You";
      const finalRel = bookingType === "self" ? "Self" : person?.relationship || "Other";

      const finalDaysSinceLastVisit = !isFirstVisit
        ? customDays
          ? parseInt(customDays, 10)
          : selectedDaysPreset || 7
        : null;

      const finalChiefComplaint = chiefComplaint.trim() || "General Medical Consultation";

      const payload = {
        doctorId: doctorId || 1,
        department: department || "General",
        bookingType,
        patientName: personName,
        patientAge: bookingType === "other" ? person?.age : undefined,
        patientGender: bookingType === "other" ? person?.gender : undefined,
        relationship: finalRel,

        // Intake Form Details for AI and Doctor Grounding
        chief_complaint: finalChiefComplaint,
        symptoms: finalChiefComplaint,
        symptoms_duration: duration,
        severity,
        is_first_visit: isFirstVisit,
        days_since_last_visit: finalDaysSinceLastVisit,
        current_medications: medications.trim() || "None reported",
        medical_history: medicalHistory.trim() || "None reported",
        allergies: allergies.trim() || "No known allergies",
        intake_notes: intakeNotes.trim() || undefined,
      };

      const newApt = await patientApi.bookAppointment(payload);

      const rawAptId =
        (newApt as any)?.data?.appointment_id ||
        (newApt as any)?.appointment_id ||
        (newApt as any)?.id ||
        Date.now().toString().slice(-4);
      const cleanAptId = String(rawAptId).startsWith("APT-") ? String(rawAptId) : `APT-${rawAptId}`;

      const query = new URLSearchParams();
      query.set("appointmentId", cleanAptId);
      query.set("doctorName", doctorName || "");
      query.set("department", department || "");
      query.set("hospitalName", hospitalName || "");
      query.set("bookingType", bookingType);
      query.set("chiefComplaint", finalChiefComplaint);
      query.set("severity", severity);
      query.set("duration", duration);
      query.set("isFirstVisit", isFirstVisit ? "true" : "false");
      if (finalDaysSinceLastVisit !== null) {
        query.set("daysSinceLastVisit", String(finalDaysSinceLastVisit));
      }
      if (medications.trim()) query.set("medications", medications.trim());
      if (allergies.trim()) query.set("allergies", allergies.trim());

      const aptDate =
        (newApt as any)?.data?.appointment_date ||
        (newApt as any)?.appointment_date ||
        (newApt as any)?.isoDate;
      if (aptDate) {
        query.set("appointmentDate", aptDate);
      }

      if (bookingType === "other" && person) {
        query.set("patientName", person.name);
        query.set("patientAge", person.age || "");
        query.set("patientGender", person.gender || "");
        query.set("relationship", person.relationship || "");
      }

      router.push(`/app/appointment-confirmation?${query.toString()}`);
    } catch (error) {
      console.error("Failed to book appointment", error);
      alert("Failed to book appointment. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputCls =
    "w-full bg-gray-50 dark:bg-[#0F1722] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#64748B] rounded-2xl px-4 py-3 outline-none border border-gray-200 dark:border-[#2A3A4E] focus:border-teal-500 dark:focus:border-emerald-500 transition-colors text-sm";
  const labelCls = "text-xs text-gray-700 dark:text-[#CBD5E1] mb-1.5 block font-semibold flex items-center gap-1.5";

  return (
    <div className="min-h-full bg-gray-50 dark:bg-[#0B0F14] pb-10">
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-700 dark:from-[#064E3B] dark:via-[#047857] dark:to-[#065F46] pt-12 pb-8 px-6 rounded-b-[40px] shadow-lg shadow-teal-900/15">
        <button
          onClick={handleBack}
          className="w-10 h-10 bg-white/20 hover:bg-white/30 transition-colors rounded-xl flex items-center justify-center mb-5 text-white"
          aria-label="Back to doctor list"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-2xl font-bold text-white mb-1"
        >
          Appointment & Intake Form
        </motion.h1>
        <p className="text-teal-100 text-xs font-medium">
          Fill your visit details to help CareQ AI & your doctor prepare
        </p>
      </div>

      <div className="px-5 py-5 space-y-5 max-w-2xl mx-auto">
        {/* ======================================================== */}
        {/* SECTION 1: WHO IS THIS APPOINTMENT FOR? */}
        {/* ======================================================== */}
        <div className="bg-white dark:bg-[#1A2332] border border-gray-100 dark:border-[#2A3A4E] rounded-3xl p-5 shadow-xs">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-teal-600 dark:text-emerald-400" />
            1. Patient Profile
          </h2>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <button
              onClick={() => setBookingType("self")}
              className={`p-3 rounded-2xl border-2 flex items-center justify-center gap-2.5 transition-all ${
                bookingType === "self"
                  ? "border-teal-500 bg-teal-50/50 dark:bg-emerald-500/10 dark:border-emerald-500"
                  : "border-gray-200 bg-white dark:border-[#2A3A4E] dark:bg-[#111820]"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  bookingType === "self"
                    ? "bg-teal-500 dark:bg-emerald-600 text-white"
                    : "bg-gray-100 dark:bg-[#223040] text-gray-400 dark:text-[#94A3B8]"
                }`}
              >
                <User className="w-4 h-4" />
              </div>
              <span
                className={`text-xs font-bold ${
                  bookingType === "self"
                    ? "text-teal-600 dark:text-emerald-400"
                    : "text-gray-600 dark:text-[#94A3B8]"
                }`}
              >
                Myself
              </span>
            </button>

            <button
              onClick={() => setBookingType("other")}
              className={`p-3 rounded-2xl border-2 flex items-center justify-center gap-2.5 transition-all ${
                bookingType === "other"
                  ? "border-teal-500 bg-teal-50/50 dark:bg-emerald-500/10 dark:border-emerald-500"
                  : "border-gray-200 bg-white dark:border-[#2A3A4E] dark:bg-[#111820]"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  bookingType === "other"
                    ? "bg-teal-500 dark:bg-emerald-600 text-white"
                    : "bg-gray-100 dark:bg-[#223040] text-gray-400 dark:text-[#94A3B8]"
                }`}
              >
                <Users className="w-4 h-4" />
              </div>
              <span
                className={`text-xs font-bold ${
                  bookingType === "other"
                    ? "text-teal-600 dark:text-emerald-400"
                    : "text-gray-600 dark:text-[#94A3B8]"
                }`}
              >
                Someone Else
              </span>
            </button>
          </div>

          {bookingType === "other" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-3 pt-2"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-700 dark:text-[#94A3B8]">
                  Select Family Member / Dependent:
                </p>
                <button
                  onClick={() => setShowAddPerson(true)}
                  className="text-xs font-bold text-teal-600 dark:text-emerald-400 hover:underline"
                >
                  + Add New
                </button>
              </div>

              {dependents.length === 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-xl">
                  No saved family members yet. Tap &quot;+ Add New&quot; to add a dependent.
                </p>
              )}

              <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
                {dependents.map((person) => {
                  const active = selectedPersonId === person.id;
                  return (
                    <button
                      key={person.id}
                      onClick={() => setSelectedPersonId(person.id)}
                      className={`w-[84px] shrink-0 rounded-2xl border-2 px-2 py-2.5 text-center transition-all ${
                        active
                          ? "border-teal-500 dark:border-emerald-500 bg-teal-50 dark:bg-emerald-600/10"
                          : "border-gray-200 dark:border-[#2A3A4E] bg-white dark:bg-[#111820]"
                      }`}
                    >
                      <PersonAvatar person={person} size={36} ring={active} className="mx-auto mb-1.5" />
                      <p className="text-[11px] font-bold text-gray-900 dark:text-white truncate">
                        {person.name.split(" ")[0]}
                      </p>
                      <p className="text-[9px] text-gray-500 dark:text-[#94A3B8] truncate">{person.relationship}</p>
                    </button>
                  );
                })}
              </div>

              {selectedPersonId && (
                <div className="rounded-xl bg-teal-50 dark:bg-emerald-950/20 border border-teal-200 dark:border-emerald-800/40 p-2.5 flex items-center gap-2">
                  <Check className="w-4 h-4 text-teal-600 dark:text-emerald-400 shrink-0" />
                  <p className="text-xs text-gray-700 dark:text-gray-200">
                    Booking for{" "}
                    <span className="font-bold text-teal-700 dark:text-emerald-300">
                      {dependents.find((p) => p.id === selectedPersonId)?.name}
                    </span>{" "}
                    ({dependents.find((p) => p.id === selectedPersonId)?.relationship})
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* ======================================================== */}
        {/* SECTION 2: VISIT HISTORY & DAYS SINCE LAST VISIT */}
        {/* ======================================================== */}
        <div className="bg-white dark:bg-[#1A2332] border border-gray-100 dark:border-[#2A3A4E] rounded-3xl p-5 shadow-xs">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            2. Hospital Visit History
          </h2>
          <p className="text-xs text-gray-500 dark:text-[#94A3B8] mb-3.5">
            CareQ AI uses your visit gap to schedule optimal follow-up intervals & check chronic retention.
          </p>

          <label className={labelCls}>Is this your first visit to CareQ Hospital?</label>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              type="button"
              onClick={() => setIsFirstVisit(true)}
              className={`p-3 rounded-2xl border-2 text-center text-xs font-bold transition-all ${
                isFirstVisit
                  ? "border-blue-500 bg-blue-50/60 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300"
                  : "border-gray-200 dark:border-[#2A3A4E] text-gray-600 dark:text-[#94A3B8] bg-white dark:bg-[#111820]"
              }`}
            >
              ⭐ Yes, First Time Visit
            </button>

            <button
              type="button"
              onClick={() => setIsFirstVisit(false)}
              className={`p-3 rounded-2xl border-2 text-center text-xs font-bold transition-all ${
                !isFirstVisit
                  ? "border-teal-500 bg-teal-50/60 dark:bg-emerald-500/10 text-teal-700 dark:text-emerald-300"
                  : "border-gray-200 dark:border-[#2A3A4E] text-gray-600 dark:text-[#94A3B8] bg-white dark:bg-[#111820]"
              }`}
            >
              🔄 No, Revisit / Follow-up
            </button>
          </div>

          {!isFirstVisit && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-3 pt-1"
            >
              <label className={labelCls}>
                <Clock className="w-3.5 h-3.5 text-teal-500" />
                How many days/weeks since your last hospital visit?
              </label>

              {/* Preset chips */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PRESET_VISIT_DAYS.map((preset) => {
                  const active = selectedDaysPreset === preset.days && !customDays;
                  return (
                    <button
                      key={preset.days}
                      type="button"
                      onClick={() => {
                        setSelectedDaysPreset(preset.days);
                        setCustomDays("");
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-left ${
                        active
                          ? "bg-teal-500 text-white border-teal-500 shadow-xs"
                          : "bg-gray-50 dark:bg-[#111820] text-gray-700 dark:text-[#CBD5E1] border-gray-200 dark:border-[#2A3A4E] hover:border-teal-300"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              {/* Custom days input */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="number"
                  placeholder="Or enter custom number of days (e.g. 21)"
                  value={customDays}
                  onChange={(e) => {
                    setCustomDays(e.target.value);
                    setSelectedDaysPreset(null);
                  }}
                  className={inputCls}
                  min={1}
                  max={365}
                />
                {customDays && (
                  <span className="text-xs font-bold text-teal-600 dark:text-emerald-400 whitespace-nowrap">
                    days ago
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* ======================================================== */}
        {/* SECTION 3: CHIEF COMPLAINT & SYMPTOMS */}
        {/* ======================================================== */}
        <div className="bg-white dark:bg-[#1A2332] border border-gray-100 dark:border-[#2A3A4E] rounded-3xl p-5 shadow-xs">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            3. Chief Complaints & Symptoms
          </h2>
          <p className="text-xs text-gray-500 dark:text-[#94A3B8] mb-3.5">
            Describe what symptoms you are experiencing so the AI Copilot can brief the consulting doctor.
          </p>

          {/* Quick Suggestion Chips */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {COMMON_CHIEF_COMPLAINTS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setChiefComplaint(item)}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                  chiefComplaint === item
                    ? "bg-purple-600 text-white border-purple-600 font-semibold"
                    : "bg-gray-50 dark:bg-[#111820] text-gray-700 dark:text-[#CBD5E1] border-gray-200 dark:border-[#2A3A4E] hover:border-purple-300"
                }`}
              >
                + {item}
              </button>
            ))}
          </div>

          <div className="mb-4">
            <label className={labelCls}>Chief Complaint / Main Reason for Visit *</label>
            <textarea
              placeholder="E.g., Severe knee pain and stiffness for past 4 days, trouble climbing stairs..."
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              rows={2}
              className={`${inputCls} resize-none`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
            <div>
              <label className={labelCls}>Symptoms Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className={inputCls}
              >
                <option value="Less than 2 days">&lt; 2 Days (Acute)</option>
                <option value="3-7 days">3 - 7 Days</option>
                <option value="1-2 weeks">1 - 2 Weeks</option>
                <option value="2-4 weeks">2 - 4 Weeks</option>
                <option value="More than 1 month">&gt; 1 Month (Chronic)</option>
              </select>
            </div>

            <div>
              <label className={labelCls}>Severity Level</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { level: "Mild", color: "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800" },
                  { level: "Moderate", color: "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800" },
                  { level: "Severe", color: "text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800" },
                ].map((s) => {
                  const active = severity === s.level;
                  return (
                    <button
                      key={s.level}
                      type="button"
                      onClick={() => setSeverity(s.level as any)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        active
                          ? `${s.color} ring-2 ring-offset-1 ring-teal-500`
                          : "border-gray-200 dark:border-[#2A3A4E] text-gray-500 dark:text-gray-400 bg-white dark:bg-[#111820]"
                      }`}
                    >
                      {s.level}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECTION 4: MEDICATIONS, PAST HISTORY & ALLERGIES */}
        {/* ======================================================== */}
        <div className="bg-white dark:bg-[#1A2332] border border-gray-100 dark:border-[#2A3A4E] rounded-3xl p-5 shadow-xs">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Pill className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            4. Medications & Medical Background
          </h2>

          <div className="space-y-3.5">
            <div>
              <label className={labelCls}>
                Current Ongoing Medications (if any)
              </label>
              <input
                type="text"
                placeholder="E.g., Metformin 500mg (BD), Telmisartan 40mg (OD), or None"
                value={medications}
                onChange={(e) => setMedications(e.target.value)}
                className={inputCls}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>
                  Past Medical History / Chronic Conditions
                </label>
                <input
                  type="text"
                  placeholder="E.g., Diabetes, Hypertension, Asthma, None"
                  value={medicalHistory}
                  onChange={(e) => setMedicalHistory(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>
                  <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                  Known Drug / Food Allergies
                </label>
                <input
                  type="text"
                  placeholder="E.g., Penicillin, Sulfa Drugs, Dust, No Allergies"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Additional Notes for Doctor (Optional)</label>
              <input
                type="text"
                placeholder="E.g., Bringing past CT Scan & Blood reports from 2025"
                value={intakeNotes}
                onChange={(e) => setIntakeNotes(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* Doctor Summary Card */}
        <div className="bg-gradient-to-r from-teal-50 to-blue-50 dark:from-teal-950/30 dark:to-blue-950/30 border border-teal-200/70 dark:border-teal-800/40 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-gray-500 dark:text-[#94A3B8] font-bold uppercase tracking-wider">
              Booking Consultation With
            </p>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              {doctorName || "Assigned Specialist"}
            </h3>
            <p className="text-xs text-teal-700 dark:text-emerald-400 font-medium">
              {department} • {hospitalName || "CareQ Hospital"}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center text-lg shadow-sm">
            🩺
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleContinue}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-teal-500/25 dark:shadow-emerald-900/40 transition-all active:scale-[0.99] disabled:opacity-70 flex items-center justify-center gap-2 cursor-pointer"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Booking & Linking Intake Form...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              Confirm Appointment & Submit Intake
            </span>
          )}
        </button>
      </div>

      <AddPersonSheet
        open={showAddPerson}
        onClose={() => setShowAddPerson(false)}
        onSaved={(person) => setSelectedPersonId(person.id)}
      />
    </div>
  );
}

export default function BookingDetails() {
  return (
    <Suspense
      fallback={
        <div className="min-h-full flex items-center justify-center text-gray-500">
          Loading booking details...
        </div>
      }
    >
      <BookingDetailsContent />
    </Suspense>
  );
}
