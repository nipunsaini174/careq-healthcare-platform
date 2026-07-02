"use client";

import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  UserPlus,
  Stethoscope,
  Activity,
  Beaker,
  CheckCircle,
  FileText,
  Clock,
  CheckCheck,
} from "lucide-react";

export default function PatientJourneyTracker() {
  const router = useRouter();

  const journeySteps = [
    {
      icon: UserPlus,
      title: "Registration",
      status: "completed",
      time: "09:45 AM",
      description: "Check-in completed",
    },
    {
      icon: Stethoscope,
      title: "Consultation",
      status: "completed",
      time: "10:30 AM",
      description: "Doctor consultation done",
    },
    {
      icon: Activity,
      title: "Lab Queue",
      status: "current",
      time: "11:00 AM",
      description: "Token L-45 â€¢ Position: 2nd",
    },
    {
      icon: Beaker,
      title: "Sample Processing",
      status: "pending",
      time: "",
      description: "Blood & urine samples",
    },
    {
      icon: CheckCircle,
      title: "Report Verification",
      status: "pending",
      time: "",
      description: "Results verification",
    },
    {
      icon: FileText,
      title: "Report Ready",
      status: "pending",
      time: "",
      description: "Available for download",
    },
    {
      icon: CheckCheck,
      title: "Completed",
      status: "pending",
      time: "",
      description: "Visit completed",
    },
  ];

  return (
    <div className="min-h-full bg-gray-50 dark:bg-[#0B0F14] pb-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-400 to-teal-500 dark:from-[#064E3B] dark:via-[#047857] dark:to-[#065F46] pt-12 pb-8 px-6 rounded-b-[40px]">
        <motion.h1
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-2xl font-bold text-white mb-2"
        >
          Patient Journey
        </motion.h1>
        <p className="text-white/80">Track your hospital visit progress</p>
      </div>

      <div className="px-6 py-6">
        {/* Current Status Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-[#1A2332] border border-gray-100 dark:border-[#2A3A4E] rounded-3xl shadow-sm dark:shadow-black/20 p-6 mb-6"
        >
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-teal-50 dark:bg-emerald-600/10 rounded-2xl flex items-center justify-center mr-4">
              <Activity className="w-6 h-6 text-teal-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-[#94A3B8]">Current Stage</p>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Lab Queue</h3>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center bg-blue-50 dark:bg-blue-500/10 rounded-2xl p-3">
              <p className="text-xs text-gray-600 dark:text-[#94A3B8] mb-1">Token</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white font-mono">L-45</p>
            </div>
            <div className="text-center bg-purple-50 dark:bg-purple-500/10 rounded-2xl p-3">
              <p className="text-xs text-gray-600 dark:text-[#94A3B8] mb-1">Position</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">2nd</p>
            </div>
            <div className="text-center bg-orange-50 dark:bg-orange-500/10 rounded-2xl p-3">
              <p className="text-xs text-gray-600 dark:text-[#94A3B8] mb-1">Wait</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">~10m</p>
            </div>
          </div>
        </motion.div>

        {/* Journey Timeline */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-[#1A2332] border border-gray-100 dark:border-[#2A3A4E] rounded-3xl shadow-sm dark:shadow-black/20 p-6 mb-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Journey Timeline</h3>

          <div className="space-y-6">
            {journeySteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="flex items-start">
                  <div className="relative">
                    {step.status === "completed" ? (
                      <div className="w-12 h-12 bg-green-500 dark:bg-emerald-600 rounded-full flex items-center justify-center">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    ) : step.status === "current" ? (
                      <div className="w-12 h-12 bg-teal-500 dark:bg-emerald-500 rounded-full flex items-center justify-center animate-pulse">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 dark:bg-[#223040] rounded-full flex items-center justify-center">
                        <Icon className="w-6 h-6 text-gray-400 dark:text-[#64748B]" />
                      </div>
                    )}

                    {index < journeySteps.length - 1 && (
                      <div
                        className={`absolute left-6 top-12 w-0.5 h-12 -ml-px ${
                          step.status === "completed"
                            ? "bg-green-500 dark:bg-emerald-600"
                            : "bg-gray-200 dark:bg-[#2A3A4E]"
                        }`}
                      ></div>
                    )}
                  </div>

                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4
                        className={`font-medium ${
                          step.status === "current"
                            ? "text-teal-600 dark:text-emerald-400"
                            : step.status === "completed"
                            ? "text-gray-900 dark:text-white"
                            : "text-gray-400 dark:text-[#64748B]"
                        }`}
                      >
                        {step.title}
                      </h4>
                      {step.time && (
                        <span className="text-xs text-gray-500 dark:text-[#94A3B8]">{step.time}</span>
                      )}
                    </div>
                    <p
                      className={`text-sm ${
                        step.status === "current"
                          ? "text-teal-600 dark:text-emerald-400"
                          : step.status === "completed"
                          ? "text-gray-600 dark:text-[#CBD5E1]"
                          : "text-gray-400 dark:text-[#64748B]"
                      }`}
                    >
                      {step.description}
                    </p>

                    {step.status === "current" && (
                      <div className="mt-2 bg-teal-50 dark:bg-emerald-600/10 border border-teal-100 dark:border-emerald-500/20 rounded-lg p-3">
                        <p className="text-xs text-gray-700 dark:text-[#CBD5E1] mb-2">
                          You'll be called soon
                        </p>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 text-teal-600 dark:text-emerald-400 mr-2" />
                          <span className="text-xs text-teal-600 dark:text-emerald-400 font-medium">
                            Estimated: 10 minutes
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <button
            onClick={() => router.push("/app/reports")}
            className="w-full bg-teal-500 dark:bg-emerald-600 text-white py-4 rounded-2xl font-medium shadow-sm shadow-teal-500/20 dark:shadow-emerald-600/30 hover:bg-teal-600 dark:hover:bg-emerald-500 transition-colors"
          >
            View Reports
          </button>

          <button className="w-full bg-white dark:bg-[#1A2332] border-2 border-gray-200 dark:border-[#2A3A4E] text-gray-700 dark:text-[#CBD5E1] py-4 rounded-2xl font-medium hover:bg-gray-50 dark:hover:bg-[#223040] transition-colors">
            Download Summary
          </button>
        </motion.div>
      </div>
    </div>
  );
}

