"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  FileText,
  Pill,
  Receipt,
  Download,
  Share2,
  Eye,
  Calendar,
} from "lucide-react";
import { useLayout } from "@/contexts/LayoutContext";
import { usePeople } from "@/hooks/usePeople";
import { PeopleFilterBar, ALL_PEOPLE } from "@/components/people/PeopleFilterBar";

type TabType = "Reports" | "Prescriptions" | "Invoices";

export default function ReportsAndPrescriptions() {
  const router = useRouter();
  const { isMobileView } = useLayout();
  const { people } = usePeople();
  const [activeTab, setActiveTab] = useState<TabType>("Reports");
  const [selectedPersonId, setSelectedPersonId] = useState<string>(ALL_PEOPLE);

  // Each record is tagged with `personId` so it can be filtered by person.
  const reports = [
    {
      id: 1,
      name: "Blood Test - Complete Hemogram",
      doctor: "Dr. Sarah Johnson",
      date: "June 15, 2026",
      status: "Available",
      type: "Lab Report",
      personId: "self",
    },
    {
      id: 2,
      name: "X-Ray Chest PA View",
      doctor: "Dr. Michael Chen",
      date: "June 10, 2026",
      status: "Available",
      type: "Radiology",
      personId: "p_jane",
    },
    {
      id: 3,
      name: "ECG Report",
      doctor: "Dr. Sarah Johnson",
      date: "June 5, 2026",
      status: "Available",
      type: "Cardiology",
      personId: "p_aarav",
    },
  ];

  const prescriptions = [
    {
      id: 1,
      name: "General Consultation",
      doctor: "Dr. Sarah Johnson",
      date: "June 15, 2026",
      medications: 4,
      duration: "7 days",
      personId: "self",
    },
    {
      id: 2,
      name: "Follow-up Visit",
      doctor: "Dr. Priya Sharma",
      date: "June 8, 2026",
      medications: 2,
      duration: "14 days",
      personId: "p_aarav",
    },
  ];

  const invoices = [
    {
      id: 1,
      name: "Consultation & Lab Tests",
      doctor: "Dr. Sarah Johnson",
      date: "June 15, 2026",
      amount: "â‚¹1,450",
      status: "Paid",
      personId: "self",
    },
    {
      id: 2,
      name: "X-Ray & Consultation",
      doctor: "Dr. Michael Chen",
      date: "June 10, 2026",
      amount: "â‚¹850",
      status: "Paid",
      personId: "p_jane",
    },
  ];

  const matchesPerson = (item: { personId?: string }) =>
    selectedPersonId === ALL_PEOPLE || item.personId === selectedPersonId;

  const filteredReports = useMemo(() => reports.filter(matchesPerson), [selectedPersonId]);
  const filteredPrescriptions = useMemo(() => prescriptions.filter(matchesPerson), [selectedPersonId]);
  const filteredInvoices = useMemo(() => invoices.filter(matchesPerson), [selectedPersonId]);

  const tabs: TabType[] = ["Reports", "Prescriptions", "Invoices"];

  return (
    <div className="min-h-full bg-gray-50 dark:bg-[#0B0F14]">
      {/* Mobile Header */}
      <div className={`${isMobileView ? '' : 'lg:hidden'} bg-gradient-to-br from-teal-400 to-teal-500 dark:from-[#064E3B] dark:via-[#047857] dark:to-[#065F46] pt-12 pb-8 px-6 rounded-b-[40px]`}>
        <motion.h1
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-2xl text-white mb-2"
        >
          Medical Records
        </motion.h1>
        <p className="text-white/80">Access your health documents</p>
      </div>

      {/* Desktop Header */}
      <div className={`${isMobileView ? 'hidden' : 'hidden lg:block'} mb-6`}>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Medical Records</h1>
        <p className="text-sm text-gray-500 mt-1">Access your health documents</p>
      </div>

      {/* People Filter */}
      <div className="px-6 pt-5">
        <PeopleFilterBar people={people} selectedId={selectedPersonId} onSelect={setSelectedPersonId} className="pt-1" />
      </div>

      {/* Tabs */}
      <div className="px-6 py-4 overflow-x-auto">
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-all ${
                activeTab === tab
                  ? "bg-teal-500 dark:bg-emerald-600 text-white"
                  : "bg-white dark:bg-[#1A2332] text-gray-700 dark:text-[#94A3B8]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className={`px-6 pb-6 ${isMobileView ? '' : 'lg:px-0'}`}>
        {activeTab === "Reports" && (
          <div className="space-y-3">
            {filteredReports.length === 0 && (
              <p className="text-center text-gray-500 dark:text-[#94A3B8] py-10 text-sm">No reports for this person.</p>
            )}
            {filteredReports.map((report, index) => (
              <motion.div
                key={report.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-[#1A2332] rounded-2xl p-5 shadow-md dark:shadow-black/20"
              >
                <div className="flex items-start mb-4">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                    <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-gray-900 dark:text-white font-medium mb-1">
                      {report.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-[#94A3B8] mb-1">{report.doctor}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-[#94A3B8]">
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {report.date}
                      </span>
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                        {report.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => router.push("/app/report-viewer")}
                    className="flex items-center justify-center px-3 py-2 bg-teal-500 dark:bg-emerald-600 text-white rounded-xl text-sm"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </button>
                  <button className="flex items-center justify-center px-3 py-2 border border-gray-200 dark:border-[#2A3A4E] text-gray-700 dark:text-[#94A3B8] rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-[#223040] transition-colors">
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </button>
                  <button className="flex items-center justify-center px-3 py-2 border border-gray-200 dark:border-[#2A3A4E] text-gray-700 dark:text-[#94A3B8] rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-[#223040] transition-colors">
                    <Share2 className="w-4 h-4 mr-1" />
                    Share
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === "Prescriptions" && (
          <div className="space-y-3">
            {filteredPrescriptions.length === 0 && (
              <p className="text-center text-gray-500 dark:text-[#94A3B8] py-10 text-sm">No prescriptions for this person.</p>
            )}
            {filteredPrescriptions.map((prescription, index) => (
              <motion.div
                key={prescription.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-[#1A2332] rounded-2xl p-5 shadow-md dark:shadow-black/20"
              >
                <div className="flex items-start mb-4">
                  <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                    <Pill className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-gray-900 dark:text-white font-medium mb-1">
                      {prescription.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-[#94A3B8] mb-2">
                      {prescription.doctor}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-[#94A3B8]">
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {prescription.date}
                      </span>
                      <span>{prescription.medications} medications</span>
                      <span>{prescription.duration}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => router.push("/app/report-viewer")}
                    className="flex items-center justify-center px-3 py-2 bg-teal-500 dark:bg-emerald-600 text-white rounded-xl text-sm"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </button>
                  <button className="flex items-center justify-center px-3 py-2 border border-gray-200 dark:border-[#2A3A4E] text-gray-700 dark:text-[#94A3B8] rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-[#223040] transition-colors">
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </button>
                  <button className="flex items-center justify-center px-3 py-2 border border-gray-200 dark:border-[#2A3A4E] text-gray-700 dark:text-[#94A3B8] rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-[#223040] transition-colors">
                    <Share2 className="w-4 h-4 mr-1" />
                    Share
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === "Invoices" && (
          <div className="space-y-3">
            {filteredInvoices.length === 0 && (
              <p className="text-center text-gray-500 dark:text-[#94A3B8] py-10 text-sm">No invoices for this person.</p>
            )}
            {filteredInvoices.map((invoice, index) => (
              <motion.div
                key={invoice.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-[#1A2332] rounded-2xl p-5 shadow-md dark:shadow-black/20"
              >
                <div className="flex items-start mb-4">
                  <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/30 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                    <Receipt className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="text-gray-900 dark:text-white font-medium">
                        {invoice.name}
                      </h3>
                      <span className="text-lg text-gray-900 dark:text-white font-medium">
                        {invoice.amount}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-[#94A3B8] mb-2">{invoice.doctor}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-[#94A3B8]">
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {invoice.date}
                      </span>
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                        {invoice.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => router.push("/app/report-viewer")}
                    className="flex items-center justify-center px-3 py-2 bg-teal-500 dark:bg-emerald-600 text-white rounded-xl text-sm"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </button>
                  <button className="flex items-center justify-center px-3 py-2 border border-gray-200 dark:border-[#2A3A4E] text-gray-700 dark:text-[#94A3B8] rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-[#223040] transition-colors">
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </button>
                  <button className="flex items-center justify-center px-3 py-2 border border-gray-200 dark:border-[#2A3A4E] text-gray-700 dark:text-[#94A3B8] rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-[#223040] transition-colors">
                    <Share2 className="w-4 h-4 mr-1" />
                    Share
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

