"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { FileText, Upload, Save, Send } from "lucide-react";

export default function PreConsultationForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    symptoms: "",
    duration: "",
    medication: "",
    history: "",
  });
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const handleSubmit = () => {
    router.push("/app/home");
  };

  const inputCls =
    "w-full bg-gray-50 dark:bg-[#0F1722] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#64748B] rounded-2xl px-4 py-3 outline-none border-2 border-transparent focus:border-teal-500 dark:focus:border-emerald-500 transition-colors";
  const labelCls = "text-sm text-gray-700 dark:text-[#CBD5E1] mb-2 block font-medium";

  return (
    <div className="min-h-full bg-gray-50 dark:bg-[#0B0F14] pb-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-400 to-teal-500 dark:from-[#064E3B] dark:via-[#047857] dark:to-[#065F46] pt-12 pb-8 px-6 rounded-b-[40px]">
        <motion.h1
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-2xl font-bold text-white mb-2"
        >
          Pre-Consultation Form
        </motion.h1>
        <p className="text-white/80">Help your doctor prepare</p>
      </div>

      <div className="px-6 py-6">
        {/* Form */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-[#1A2332] border border-gray-100 dark:border-[#2A3A4E] rounded-3xl shadow-sm dark:shadow-black/20 p-6 mb-6"
        >
          <div className="mb-6">
            <label className={labelCls}>Current Symptoms *</label>
            <textarea
              placeholder="Describe your symptoms..."
              value={formData.symptoms}
              onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
              rows={4}
              className={`${inputCls} resize-none`}
            />
          </div>

          <div className="mb-6">
            <label className={labelCls}>Duration</label>
            <select
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              className={inputCls}
            >
              <option value="">Select duration</option>
              <option value="1-2 days">1-2 days</option>
              <option value="3-7 days">3-7 days</option>
              <option value="1-2 weeks">1-2 weeks</option>
              <option value="More than 2 weeks">More than 2 weeks</option>
            </select>
          </div>

          <div className="mb-6">
            <label className={labelCls}>Current Medication</label>
            <textarea
              placeholder="List any medications you're currently taking..."
              value={formData.medication}
              onChange={(e) => setFormData({ ...formData, medication: e.target.value })}
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </div>

          <div className="mb-6">
            <label className={labelCls}>Relevant Medical History</label>
            <textarea
              placeholder="Any allergies, chronic conditions, or past surgeries..."
              value={formData.history}
              onChange={(e) => setFormData({ ...formData, history: e.target.value })}
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </div>
        </motion.div>

        {/* Upload Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-[#1A2332] border border-gray-100 dark:border-[#2A3A4E] rounded-3xl shadow-sm dark:shadow-black/20 p-6 mb-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upload Documents</h3>

          <button
            onClick={() => setUploadedFiles([...uploadedFiles, "Report_" + Date.now() + ".pdf"])}
            className="w-full border-2 border-dashed border-gray-300 dark:border-[#2A3A4E] rounded-2xl p-6 flex flex-col items-center justify-center hover:border-teal-500 dark:hover:border-emerald-500 hover:bg-teal-50/40 dark:hover:bg-emerald-500/5 transition-colors mb-4"
          >
            <div className="w-12 h-12 bg-teal-50 dark:bg-emerald-600/10 rounded-2xl flex items-center justify-center mb-3">
              <Upload className="w-6 h-6 text-teal-600 dark:text-emerald-400" />
            </div>
            <p className="text-gray-900 dark:text-white font-medium mb-1">Upload Files</p>
            <p className="text-sm text-gray-500 dark:text-[#94A3B8]">Reports, Prescriptions, or Scans</p>
          </button>

          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-[#94A3B8] mb-2">Uploaded Files</p>
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-50 dark:bg-[#0F1722] border border-gray-100 dark:border-[#2A3A4E] rounded-2xl p-3"
                >
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 text-teal-600 dark:text-emerald-400 mr-3" />
                    <span className="text-sm text-gray-900 dark:text-white">{file}</span>
                  </div>
                  <button
                    onClick={() => setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))}
                    className="text-red-500 dark:text-red-400 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <button
            onClick={handleSubmit}
            className="w-full bg-teal-500 dark:bg-emerald-600 text-white py-4 rounded-2xl font-medium flex items-center justify-center shadow-sm shadow-teal-500/20 dark:shadow-emerald-600/30 hover:bg-teal-600 dark:hover:bg-emerald-500 transition-colors"
          >
            <Send className="w-5 h-5 mr-2" />
            Submit to Doctor
          </button>

          <button className="w-full bg-gray-100 dark:bg-[#1A2332] border dark:border-[#2A3A4E] text-gray-700 dark:text-[#CBD5E1] py-4 rounded-2xl font-medium flex items-center justify-center hover:bg-gray-200 dark:hover:bg-[#223040] transition-colors">
            <Save className="w-5 h-5 mr-2" />
            Save Draft
          </button>
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-2xl p-4"
        >
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Why fill this?</p>
          <p className="text-xs text-gray-600 dark:text-[#94A3B8]">
            Providing this information helps your doctor prepare better and saves time during consultation.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

