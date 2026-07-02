"use client";

import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  FileText,
  Pill,
  Receipt,
  FolderOpen,
  Upload,
  Download,
  Share2,
  Trash2,
} from "lucide-react";

export default function DigitalHealthLocker() {
  const router = useRouter();

  const sections = [
    {
      title: "Lab Reports",
      icon: FileText,
      color: "blue",
      count: 8,
      files: [
        { name: "Blood Test - Complete Hemogram", date: "June 15, 2026", size: "245 KB" },
        { name: "X-Ray Chest PA View", date: "June 10, 2026", size: "1.2 MB" },
        { name: "ECG Report", date: "June 5, 2026", size: "180 KB" },
      ],
    },
    {
      title: "Prescriptions",
      icon: Pill,
      color: "purple",
      count: 5,
      files: [
        { name: "General Consultation", date: "June 15, 2026", size: "156 KB" },
        { name: "Follow-up Visit", date: "June 8, 2026", size: "142 KB" },
      ],
    },
    {
      title: "Invoices",
      icon: Receipt,
      color: "orange",
      count: 4,
      files: [
        { name: "Consultation & Lab Tests", date: "June 15, 2026", size: "98 KB" },
        { name: "X-Ray & Consultation", date: "June 10, 2026", size: "102 KB" },
      ],
    },
    {
      title: "Medical Records",
      icon: FolderOpen,
      color: "green",
      count: 7,
      files: [
        { name: "Vaccination Record", date: "Jan 5, 2026", size: "215 KB" },
        { name: "Surgery Report 2024", date: "Nov 20, 2025", size: "2.5 MB" },
      ],
    },
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case "blue":
        return "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400";
      case "purple":
        return "bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400";
      case "orange":
        return "bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400";
      case "green":
        return "bg-green-50 text-green-600 dark:bg-emerald-500/15 dark:text-emerald-400";
      default:
        return "bg-gray-50 text-gray-600 dark:bg-[#223040] dark:text-[#94A3B8]";
    }
  };

  return (
    <div className="min-h-full bg-gray-50 dark:bg-[#0B0F14] pb-6">
      {/* Mobile Header */}
      <div className="lg:hidden bg-gradient-to-br from-teal-400 to-teal-500 dark:from-[#064E3B] dark:via-[#047857] dark:to-[#065F46] pt-12 pb-8 px-6 rounded-b-[40px]">
        <motion.h1
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-2xl font-bold text-white mb-2"
        >
          Health Locker
        </motion.h1>
        <p className="text-white/80">Your medical documents in one place</p>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Health Locker</h1>
        <p className="text-sm text-gray-500 dark:text-[#94A3B8] mt-1">Your medical documents in one place</p>
      </div>

      <div className="px-6 py-6 lg:px-0">
        {/* Upload Button */}
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full bg-white dark:bg-[#1A2332] border-2 border-dashed border-teal-500 dark:border-emerald-500/60 rounded-2xl p-6 flex items-center justify-center mb-6 hover:bg-teal-50/40 dark:hover:bg-emerald-500/5 transition-colors"
        >
          <Upload className="w-6 h-6 text-teal-600 dark:text-emerald-400 mr-3" />
          <span className="text-teal-600 dark:text-emerald-400 font-medium">Upload Document</span>
        </motion.button>

        {/* Sections */}
        <div className="space-y-4">
          {sections.map((section, sectionIndex) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={sectionIndex}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 + sectionIndex * 0.05 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 ${getColorClasses(section.color)} rounded-xl flex items-center justify-center mr-3`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-gray-900 dark:text-white font-semibold">{section.title}</h3>
                      <p className="text-xs text-gray-500 dark:text-[#94A3B8]">{section.count} files</p>
                    </div>
                  </div>
                  <button className="text-teal-600 dark:text-emerald-400 text-sm font-medium hover:underline">
                    View All
                  </button>
                </div>

                <div className="bg-white dark:bg-[#1A2332] border border-gray-100 dark:border-[#2A3A4E] rounded-2xl shadow-sm dark:shadow-black/20 overflow-hidden">
                  {section.files.map((file, fileIndex) => (
                    <div
                      key={fileIndex}
                      className={`p-4 ${fileIndex !== section.files.length - 1 ? "border-b border-gray-100 dark:border-[#2A3A4E]" : ""}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm text-gray-900 dark:text-white font-medium flex-1">{file.name}</h4>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-[#94A3B8]">
                          <span>{file.date}</span>
                          <span>•</span>
                          <span>{file.size}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="w-8 h-8 bg-blue-50 dark:bg-blue-500/15 rounded-lg flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-500/25 transition-colors">
                            <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </button>
                          <button className="w-8 h-8 bg-green-50 dark:bg-emerald-500/15 rounded-lg flex items-center justify-center hover:bg-green-100 dark:hover:bg-emerald-500/25 transition-colors">
                            <Share2 className="w-4 h-4 text-green-600 dark:text-emerald-400" />
                          </button>
                          <button className="w-8 h-8 bg-red-50 dark:bg-red-500/15 rounded-lg flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-500/25 transition-colors">
                            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Storage Info */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 bg-white dark:bg-[#1A2332] border border-gray-100 dark:border-[#2A3A4E] rounded-2xl p-4 shadow-sm dark:shadow-black/20"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-[#94A3B8]">Storage Used</span>
            <span className="text-sm text-gray-900 dark:text-white font-medium">4.8 GB / 10 GB</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-[#0F1722] rounded-full h-2">
            <div
              className="bg-teal-500 dark:bg-emerald-500 h-2 rounded-full transition-all"
              style={{ width: "48%" }}
            ></div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

