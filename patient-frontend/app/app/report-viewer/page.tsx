"use client";

import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Download, Share2, Printer, Save, ArrowLeft, FileText, User } from "lucide-react";
import { useProfile } from "../../../hooks/useAppData";

export default function ReportViewer() {
  const router = useRouter();
  const { data: profile } = useProfile();

  const ghostBtn =
    "bg-white dark:bg-[#1A2332] border-2 border-gray-200 dark:border-[#2A3A4E] text-gray-700 dark:text-[#CBD5E1] py-4 rounded-2xl font-medium flex items-center justify-center hover:bg-gray-50 dark:hover:bg-[#223040] transition-colors";

  return (
    <div className="min-h-full bg-gray-50 dark:bg-[#0B0F14] pb-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-400 to-teal-500 dark:from-[#064E3B] dark:via-[#047857] dark:to-[#065F46] pt-12 pb-6 px-6 rounded-b-[40px]">
        <div className="flex items-center mb-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mr-4 hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Blood Test Report</h1>
            <p className="text-white/80 text-sm">Complete Hemogram</p>
          </div>
        </div>
      </div>

      {/* PDF Preview */}
      <div className="px-6 py-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white dark:bg-[#1A2332] border border-gray-100 dark:border-[#2A3A4E] rounded-3xl shadow-sm dark:shadow-black/20 overflow-hidden mb-6"
        >
          {/* Document Preview */}
          <div className="bg-gray-100 dark:bg-[#0F1722] p-8">
            <div className="bg-white dark:bg-[#1A2332] border border-gray-100 dark:border-[#2A3A4E] rounded-2xl p-6 shadow-sm">
              {/* Report Header */}
              <div className="border-b border-gray-200 dark:border-[#2A3A4E] pb-4 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      Hospital Name
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-[#94A3B8]">Laboratory Services</p>
                  </div>
                  <div className="w-16 h-16 bg-teal-50 dark:bg-emerald-600/10 rounded-2xl flex items-center justify-center">
                    <FileText className="w-8 h-8 text-teal-600 dark:text-emerald-400" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-[#94A3B8]">Patient Name</p>
                    <p className="text-gray-900 dark:text-white font-medium">{profile?.full_name || "Patient"}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-[#94A3B8]">Report ID</p>
                    <p className="text-gray-900 dark:text-white font-medium">RPT-2024-6789</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-[#94A3B8]">Date</p>
                    <p className="text-gray-900 dark:text-white font-medium">June 15, 2026</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-[#94A3B8]">Doctor</p>
                    <p className="text-gray-900 dark:text-white font-medium">Dr. Sarah Johnson</p>
                  </div>
                </div>
              </div>

              {/* Test Results */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Complete Blood Count (CBC)
                </h3>
                <div className="space-y-3">
                  {[
                    { test: "Hemoglobin", value: "14.5", unit: "g/dL", range: "13.0-17.0", status: "normal" },
                    { test: "WBC Count", value: "7,800", unit: "/\u00b5L", range: "4,000-11,000", status: "normal" },
                    { test: "Platelet Count", value: "250,000", unit: "/\u00b5L", range: "150,000-450,000", status: "normal" },
                    { test: "RBC Count", value: "5.2", unit: "million/\u00b5L", range: "4.5-5.5", status: "normal" },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-[#2A3A4E]"
                    >
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 dark:text-white font-medium">{item.test}</p>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-900 dark:text-white font-medium">
                          {item.value} {item.unit}
                        </span>
                        <span className="text-gray-500 dark:text-[#94A3B8] w-32 text-right">
                          {item.range}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.status === "normal"
                              ? "bg-green-100 text-green-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                              : "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"
                          }`}
                        >
                          {item.status === "normal" ? "Normal" : "Abnormal"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Doctor's Notes */}
              <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-2xl p-4">
                <h4 className="text-sm text-gray-900 dark:text-white font-semibold mb-2">Doctor's Notes</h4>
                <p className="text-sm text-gray-600 dark:text-[#CBD5E1]">
                  All values are within normal range. No immediate concerns. Continue with current medication and maintain a healthy diet.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3 mb-3"
        >
          <button className="bg-teal-500 dark:bg-emerald-600 text-white py-4 rounded-2xl font-medium flex items-center justify-center shadow-sm shadow-teal-500/20 dark:shadow-emerald-600/30 hover:bg-teal-600 dark:hover:bg-emerald-500 transition-colors">
            <Download className="w-5 h-5 mr-2" />
            Download
          </button>
          <button className={ghostBtn}>
            <Share2 className="w-5 h-5 mr-2" />
            Share
          </button>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-2 gap-3"
        >
          <button className={ghostBtn}>
            <Printer className="w-5 h-5 mr-2" />
            Print
          </button>
          <button onClick={() => router.push("/app/health-locker")} className={ghostBtn}>
            <Save className="w-5 h-5 mr-2" />
            Save to Locker
          </button>
        </motion.div>
      </div>
    </div>
  );
}

