"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Building2, Stethoscope, User, QrCode, Clock, Users } from "lucide-react";

import { patientApi } from "@/services/api/patientApi";

export default function VirtualWalkInToken() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const hosps = await patientApi.getHospitals();
        setHospitals(hosps.map((h: any) => ({
          id: h.id || h.hospital_id,
          name: h.name || h.hospital_name,
          distance: "2.5 km"
        })));
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);
  const [selectedHospital, setSelectedHospital] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [tokenGenerated, setTokenGenerated] = useState(false);

  const handleGenerateToken = () => {
    setTokenGenerated(true);
  };

  const selectableCls = (isSelected: boolean, available = true) =>
    `w-full p-4 rounded-2xl text-left transition-all border ${
      isSelected
        ? "bg-teal-500 dark:bg-emerald-600 text-white border-teal-500 dark:border-emerald-600 shadow-md shadow-teal-500/20 dark:shadow-emerald-600/30"
        : available
        ? "bg-white dark:bg-[#1A2332] text-gray-900 dark:text-white border-gray-100 dark:border-[#2A3A4E] hover:border-gray-200 dark:hover:border-[#3A4A5E]"
        : "bg-gray-100 dark:bg-[#0F1722] text-gray-400 dark:text-[#64748B] border-transparent cursor-not-allowed"
    }`;

  if (tokenGenerated) {
    return (
      <div className="min-h-full bg-gray-50 dark:bg-[#0B0F14] pb-6">
        {/* Header */}
        <div className="bg-gradient-to-br from-teal-400 to-teal-500 dark:from-[#064E3B] dark:via-[#047857] dark:to-[#065F46] pt-12 pb-8 px-6 rounded-b-[40px]">
          <motion.h1
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-2xl font-bold text-white mb-2"
          >
            Token Generated
          </motion.h1>
          <p className="text-white/80">Your virtual walk-in token is ready</p>
        </div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="px-6 -mt-4"
        >
          <div className="bg-white dark:bg-[#1A2332] border border-gray-100 dark:border-[#2A3A4E] rounded-3xl shadow-sm dark:shadow-black/20 p-6 mb-6">
            <div className="flex justify-center mb-6">
              <div className="w-48 h-48 bg-gray-100 dark:bg-[#0F1722] rounded-2xl flex items-center justify-center">
                <QrCode className="w-32 h-32 text-gray-400 dark:text-[#64748B]" />
              </div>
            </div>

            <div className="bg-teal-50 dark:bg-emerald-600/10 border border-teal-100 dark:border-emerald-500/20 rounded-2xl p-6 mb-6 text-center">
              <p className="text-sm text-gray-500 dark:text-[#94A3B8] mb-2">Your Token Number</p>
              <h1 className="text-5xl font-bold text-teal-600 dark:text-emerald-400 font-mono mb-2">T-142</h1>
              <p className="text-xs text-gray-500 dark:text-[#94A3B8]">Cardiology Department</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/15 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-xs text-gray-500 dark:text-[#94A3B8] mb-1">Ahead of You</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">3 Patients</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-50 dark:bg-purple-500/15 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-xs text-gray-500 dark:text-[#94A3B8] mb-1">Estimated Wait</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">~15 mins</p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-[#0F1722] border border-gray-100 dark:border-[#2A3A4E] rounded-2xl p-4">
              <p className="text-xs text-gray-500 dark:text-[#94A3B8] mb-2">Location</p>
              <p className="text-gray-900 dark:text-white font-medium mb-1">{selectedHospital || "Hospital Name"}</p>
              <p className="text-sm text-gray-600 dark:text-[#94A3B8]">{selectedDoctor || "Doctor Name"} — {selectedDepartment || "Department"}</p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <button
              onClick={() => router.push("/app/queue")}
              className="w-full bg-teal-500 dark:bg-emerald-600 text-white py-4 rounded-2xl font-medium shadow-sm shadow-teal-500/20 dark:shadow-emerald-600/30 hover:bg-teal-600 dark:hover:bg-emerald-500 transition-colors"
            >
              Track Queue
            </button>
            <button
              onClick={() => router.push("/app/home")}
              className="w-full bg-gray-100 dark:bg-[#1A2332] border dark:border-[#2A3A4E] text-gray-700 dark:text-[#CBD5E1] py-4 rounded-2xl font-medium hover:bg-gray-200 dark:hover:bg-[#223040] transition-colors"
            >
              Back to Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50 dark:bg-[#0B0F14] pb-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-400 to-teal-500 dark:from-[#064E3B] dark:via-[#047857] dark:to-[#065F46] pt-12 pb-8 px-6 rounded-b-[40px]">
        <motion.h1
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-2xl font-bold text-white mb-2"
        >
          Virtual Walk-In
        </motion.h1>
        <p className="text-white/80">Generate your queue token</p>
      </div>

      <div className="px-6 py-6">
        {/* Step 1: Select Hospital */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select Hospital</h3>
          <div className="space-y-3">
            {hospitals.map((hospital) => {
              const isSelected = selectedHospital === hospital.name;
              return (
                <button key={hospital.id} onClick={() => setSelectedHospital(hospital.name)} className={selectableCls(isSelected)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Building2 className="w-5 h-5 mr-3" />
                      <div>
                        <p className="font-medium">{hospital.name}</p>
                        <p className={`text-sm ${isSelected ? "text-white/80" : "text-gray-500 dark:text-[#94A3B8]"}`}>
                          {hospital.distance} away
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                        <span className="text-teal-600 dark:text-emerald-600 font-bold">✓</span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Step 2: Select Department */}
        {selectedHospital && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select Department</h3>
            <div className="space-y-3">
              {departments.map((dept) => {
                const isSelected = selectedDepartment === dept.name;
                return (
                  <button key={dept.id} onClick={() => setSelectedDepartment(dept.name)} className={selectableCls(isSelected)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Stethoscope className="w-5 h-5 mr-3" />
                        <div>
                          <p className="font-medium">{dept.name}</p>
                          <p className={`text-sm ${isSelected ? "text-white/80" : "text-gray-500 dark:text-[#94A3B8]"}`}>
                            {dept.queue} in queue · ~{dept.wait}
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                          <span className="text-teal-600 dark:text-emerald-600 font-bold">✓</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Step 3: Select Doctor */}
        {selectedDepartment && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select Doctor</h3>
            <div className="space-y-3">
              {doctors.map((doctor) => {
                const isSelected = selectedDoctor === doctor.name;
                return (
                  <button
                    key={doctor.id}
                    onClick={() => doctor.available && setSelectedDoctor(doctor.name)}
                    disabled={!doctor.available}
                    className={selectableCls(isSelected, doctor.available)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <User className="w-5 h-5 mr-3" />
                        <div>
                          <p className="font-medium">{doctor.name}</p>
                          <p
                            className={`text-sm ${
                              isSelected
                                ? "text-white/80"
                                : doctor.available
                                ? "text-green-600 dark:text-emerald-400"
                                : "text-gray-400 dark:text-[#64748B]"
                            }`}
                          >
                            {doctor.available ? "Available" : "Not Available"}
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                          <span className="text-teal-600 dark:text-emerald-600 font-bold">✓</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Generate Button */}
        {selectedDoctor && (
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            onClick={handleGenerateToken}
            className="w-full bg-teal-500 dark:bg-emerald-600 text-white py-4 rounded-2xl font-medium shadow-lg shadow-teal-500/20 dark:shadow-emerald-600/30 hover:bg-teal-600 dark:hover:bg-emerald-500 transition-colors"
          >
            Generate Token
          </motion.button>
        )}
      </div>
    </div>
  );
}

