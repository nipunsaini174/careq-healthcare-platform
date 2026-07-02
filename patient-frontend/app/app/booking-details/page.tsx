"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { ArrowLeft, User, Users, Plus, Check } from "lucide-react";
import { patientApi } from "../../../services/api/patientApi";
import { usePeople } from "@/hooks/usePeople";
import { getPersonById } from "@/lib/people";
import { PersonAvatar } from "@/components/people/PersonAvatar";
import { AddPersonSheet } from "@/components/people/AddPersonSheet";

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

  const [bookingType, setBookingType] = useState<"self" | "other">("self");
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [showAddPerson, setShowAddPerson] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  /**
   * Back nav should land the user back on the doctor list they came
   * from — same hospital, same department — not at the start of the
   * booking flow. `router.back()` would do the right thing for a clean
   * linear history but breaks on hard-reloads, deep-links from search,
   * or any time the back stack has been pruned, so we build the
   * destination explicitly from the URL context.
   *
   * Three cases by available context:
   *   1. hospitalId + department (came from the hospital → dept doctor
   *      list): restore the hierarchy view at that exact step via
   *      ?hospitalId=…&specialty=…
   *   2. department only (came from the flat "Browse Doctors" view or
   *      from search): land on the flat list pre-filtered by specialty.
   *   3. neither: open the flat doctor list as a sensible default.
   */
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

      const payload = {
        doctorId: doctorId || 1, // Fallback
        department: department || "General",
        bookingType,
        patientName: personName,
        patientAge: bookingType === "other" ? person?.age : undefined,
        patientGender: bookingType === "other" ? person?.gender : undefined,
        relationship: finalRel,
      };

      const newApt = await patientApi.bookAppointment(payload);

      // Source of truth is the backend now (GET /patients/appointments).
      // Pages re-fetch on mount, so we just forward to the confirmation
      // screen — no localStorage mirroring required.

      const query = new URLSearchParams();
      query.set("appointmentId", `APT-${newApt.appointment_id}`);
      query.set("doctorName", doctorName || "");
      query.set("department", department || "");
      query.set("hospitalName", hospitalName || "");
      query.set("bookingType", bookingType);
      
      if (newApt.appointment_date) {
        query.set("appointmentDate", newApt.appointment_date);
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

  return (
    <div className="min-h-full bg-gray-50 dark:bg-[#0B0F14]">
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-400 to-teal-500 dark:from-[#064E3B] dark:via-[#047857] dark:to-[#065F46] pt-12 pb-8 px-6 rounded-b-[40px]">
        <button
          onClick={handleBack}
          className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-6"
          aria-label="Back to doctor list"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-2xl text-white mb-2"
        >
          Booking Details
        </motion.h1>
        <p className="text-white/80 text-sm">Who is this appointment for?</p>
      </div>

      <div className="px-6 py-5 space-y-4">
        {/* Toggle Options */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setBookingType("self")}
            className={`p-3 rounded-2xl border-2 flex items-center justify-center gap-2 transition-all ${
              bookingType === "self"
                ? "border-teal-500 bg-teal-500 dark:bg-emerald-600/5"
                : "border-gray-200 bg-white dark:border-[#2A3A4E] dark:bg-[#1A2332]"
            }`}
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
              bookingType === "self" ? "bg-teal-500 dark:bg-emerald-600 text-white" : "bg-gray-100 dark:bg-[#223040] text-gray-400 dark:text-[#94A3B8]"
            }`}>
              <User className="w-5 h-5" />
            </div>
            <span className={`font-medium ${bookingType === "self" ? "text-teal-500 dark:text-emerald-400" : "text-gray-600 dark:text-[#94A3B8]"}`}>
              Myself
            </span>
          </button>

          <button
            onClick={() => setBookingType("other")}
            className={`p-3 rounded-2xl border-2 flex items-center justify-center gap-2 transition-all ${
              bookingType === "other"
                ? "border-teal-500 bg-teal-500 dark:bg-emerald-600/5"
                : "border-gray-200 bg-white dark:border-[#2A3A4E] dark:bg-[#1A2332]"
            }`}
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
              bookingType === "other" ? "bg-teal-500 dark:bg-emerald-600 text-white" : "bg-gray-100 dark:bg-[#223040] text-gray-400 dark:text-[#94A3B8]"
            }`}>
              <Users className="w-5 h-5" />
            </div>
            <span className={`font-medium ${bookingType === "other" ? "text-teal-500 dark:text-emerald-400" : "text-gray-600 dark:text-[#94A3B8]"}`}>
              Someone Else
            </span>
          </button>
        </div>

        {/* Select / add a family member for "Someone Else" */}
        {bookingType === "other" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700 dark:text-[#94A3B8]">Select family member</p>
              <button
                onClick={() => setShowAddPerson(true)}
                className="text-xs font-semibold text-teal-500 dark:text-emerald-400"
              >
                Add New
              </button>
            </div>

            {dependents.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-[#64748B]">
                No saved family members yet. Add one to continue.
              </p>
            )}

            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
              {dependents.map((person) => {
                const active = selectedPersonId === person.id;
                return (
                  <button
                    key={person.id}
                    onClick={() => setSelectedPersonId(person.id)}
                    className={`w-[88px] shrink-0 rounded-2xl border-2 px-2.5 py-3 text-center transition-all ${
                      active
                        ? "border-teal-500 dark:border-emerald-500 bg-teal-50 dark:bg-emerald-600/10"
                        : "border-gray-200 dark:border-[#2A3A4E] bg-white dark:bg-[#1A2332]"
                    }`}
                  >
                    <PersonAvatar person={person} size={42} ring={active} className="mx-auto mb-2" />
                    <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{person.name.split(" ")[0]}</p>
                    <p className="text-[10px] text-gray-500 dark:text-[#94A3B8] truncate">{person.relationship}</p>
                  </button>
                );
              })}
              <button
                onClick={() => setShowAddPerson(true)}
                className="w-[88px] shrink-0 rounded-2xl border-2 border-dashed border-gray-300 dark:border-[#2A3A4E] px-2.5 py-3 text-center text-gray-500 dark:text-[#94A3B8] hover:border-teal-500 hover:text-teal-500 dark:hover:border-emerald-500 dark:hover:text-emerald-400 transition-colors"
              >
                <div className="w-[42px] h-[42px] rounded-full bg-gray-100 dark:bg-[#223040] flex items-center justify-center mx-auto mb-2">
                  <Plus className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold">Add</p>
                <p className="text-[10px]">Person</p>
              </button>
            </div>

            {selectedPersonId && (
              <div className="rounded-2xl bg-white dark:bg-[#1A2332] border border-gray-100 dark:border-[#2A3A4E] px-3 py-2.5 flex items-center gap-2">
                {(() => {
                  const person = dependents.find((p) => p.id === selectedPersonId);
                  if (!person) return null;
                  return (
                    <>
                      <Check className="w-4 h-4 text-teal-500 dark:text-emerald-400" />
                      <p className="text-xs text-gray-600 dark:text-[#94A3B8] truncate">
                        Booking for <span className="font-semibold text-gray-900 dark:text-white">{person.name}</span>
                        <span> ({person.relationship})</span>
                      </p>
                    </>
                  );
                })()}
              </div>
            )}
          </motion.div>
        )}

        {/* Summary Card */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4">
          <p className="text-sm text-gray-600 dark:text-[#94A3B8] mb-2">Booking Appointment with</p>
          <p className="text-gray-900 dark:text-white font-medium">{doctorName || "Selected Doctor"}</p>
          <p className="text-sm text-gray-500 dark:text-[#94A3B8]">{department}</p>
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={isLoading}
          className="w-full bg-teal-500 dark:bg-emerald-600 text-white py-4 rounded-2xl font-medium shadow-lg mt-4 disabled:opacity-70 flex items-center justify-center"
        >
          {isLoading ? "Booking..." : "Confirm Details"}
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
    <Suspense fallback={<div className="min-h-full flex items-center justify-center">Loading...</div>}>
      <BookingDetailsContent />
    </Suspense>
  );
}
