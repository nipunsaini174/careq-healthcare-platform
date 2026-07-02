"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Upload, File, X, CheckCircle, Image as ImageIcon } from "lucide-react";
import { useLayout } from "@/contexts/LayoutContext";
import { usePeople } from "@/hooks/usePeople";

export default function LabReportUpload() {
  const router = useRouter();
  const { isMobileView } = useLayout();
  const { people } = usePeople();
  const [personId, setPersonId] = useState("self");
  const [testType, setTestType] = useState("");
  const [labName, setLabName] = useState("");
  const [testDate, setTestDate] = useState("");
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Mock API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1500);
  };

  if (isSuccess) {
    return (
      <div className="min-h-full bg-gray-50 dark:bg-[#0B0F14] flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white dark:bg-[#1A2332] rounded-3xl p-8 text-center max-w-sm w-full shadow-lg"
        >
          <div className="w-20 h-20 bg-green-50 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Report Uploaded
          </h2>
          <p className="text-gray-500 mb-8">
            Your lab report has been submitted successfully.
          </p>
          <button
            onClick={() => router.push("/app/home")}
            className="w-full bg-teal-500 dark:bg-emerald-600 text-white py-3 rounded-xl font-medium hover:bg-[#4bc29a] transition-colors"
          >
            Back to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50 dark:bg-[#0B0F14]">
      {/* Mobile Header */}
      <div className={`${isMobileView ? '' : 'lg:hidden'} bg-gradient-to-br from-teal-400 to-teal-500 dark:from-[#064E3B] dark:via-[#047857] dark:to-[#065F46] pt-12 pb-8 px-6 rounded-b-[40px]`}>
        <motion.h1
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-2xl text-white mb-2"
        >
          Upload Lab Report
        </motion.h1>
        <p className="text-white/80">Submit your lab reports securely</p>
      </div>

      {/* Desktop Header */}
      <div className={`${isMobileView ? 'hidden' : 'hidden lg:block'} mb-6`}>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Upload Lab Report</h1>
        <p className="text-sm text-gray-500 mt-1">Submit diagnostic reports before your consultation</p>
      </div>

      <div className={`px-6 py-6 ${isMobileView ? '' : 'lg:px-0'}`}>
        <form onSubmit={handleSubmit} className="max-w-2xl">
          <div className="bg-white dark:bg-[#1A2332] rounded-2xl shadow-sm border border-gray-100 dark:border-[#2A3A4E] p-6 lg:p-8 space-y-6">

            {/* Patient (who this report is for) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[#94A3B8] mb-2">
                Patient
              </label>
              <select
                value={personId}
                onChange={(e) => setPersonId(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#223040] dark:text-white rounded-xl px-4 py-3 outline-none border border-gray-200 dark:border-[#2A3A4E] focus:border-teal-500"
              >
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.isSelf ? `${p.name} (You)` : `${p.name} (${p.relationship})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Test Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[#94A3B8] mb-2">
                Test Type
              </label>
              <select
                required
                value={testType}
                onChange={(e) => setTestType(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#223040] dark:text-white rounded-xl px-4 py-3 outline-none border border-gray-200 dark:border-[#2A3A4E] focus:border-teal-500"
              >
                <option value="">Select test type...</option>
                <option value="Blood Test">Blood Test (CBC, Thyroid, Lipid, etc.)</option>
                <option value="X-Ray">X-Ray</option>
                <option value="CT Scan">CT Scan</option>
                <option value="MRI">MRI</option>
                <option value="ECG">ECG</option>
                <option value="Ultrasound">Ultrasound</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className={`grid grid-cols-1 ${isMobileView ? '' : 'md:grid-cols-2'} gap-6`}>
              {/* Lab Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-[#94A3B8] mb-2">
                  Lab / Diagnostic Center
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. SRL Diagnostics"
                  value={labName}
                  onChange={(e) => setLabName(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#223040] dark:text-white rounded-xl px-4 py-3 outline-none border border-gray-200 dark:border-[#2A3A4E] focus:border-teal-500"
                />
              </div>

              {/* Date of Test */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-[#94A3B8] mb-2">
                  Date of Test
                </label>
                <input
                  required
                  type="date"
                  value={testDate}
                  onChange={(e) => setTestDate(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#223040] dark:text-white rounded-xl px-4 py-3 outline-none border border-gray-200 dark:border-[#2A3A4E] focus:border-teal-500"
                />
              </div>
            </div>

            {/* Upload Zone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[#94A3B8] mb-2">
                Upload Reports
              </label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
                  isDragging
                    ? "border-teal-500 bg-teal-50 dark:bg-emerald-600/5"
                    : "border-gray-200 dark:border-[#2A3A4E] hover:bg-gray-50 dark:hover:bg-[#223040]/50"
                }`}
              >
                <div className="w-16 h-16 bg-teal-50 dark:bg-emerald-600/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-teal-600 dark:text-emerald-400" />
                </div>
                <p className="text-gray-900 dark:text-white font-medium mb-1">
                  Drag & drop your files here
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Support for PDF, JPG, PNG (Max 10MB)
                </p>
                <label className="inline-block bg-white dark:bg-[#223040] border border-gray-200 dark:border-[#2A3A4E] text-gray-700 dark:text-white px-6 py-2.5 rounded-xl font-medium cursor-pointer hover:bg-gray-50 dark:hover:bg-[#223040] transition-colors">
                  Browse Files
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              {/* File Previews */}
              {files.length > 0 && (
                <div className="mt-4 space-y-3">
                  {files.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-gray-50 dark:bg-[#223040] p-3 rounded-xl border border-gray-100 dark:border-[#2A3A4E]"
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-white dark:bg-gray-700 rounded-lg flex items-center justify-center mr-3">
                          {file.type.includes("image") ? (
                            <ImageIcon className="w-5 h-5 text-blue-500" />
                          ) : (
                            <File className="w-5 h-5 text-red-500" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[#94A3B8] mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="E.g. Fasting sample..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-gray-50 dark:bg-[#223040] dark:text-white rounded-xl px-4 py-3 outline-none border border-gray-200 dark:border-[#2A3A4E] focus:border-teal-500"
              ></textarea>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || files.length === 0}
              className={`w-full py-4 rounded-xl font-medium transition-all flex items-center justify-center ${
                isSubmitting || files.length === 0
                  ? "bg-gray-200 dark:bg-[#223040] text-gray-400 cursor-not-allowed"
                  : "bg-teal-500 dark:bg-emerald-600 text-white hover:bg-[#4bc29a] shadow-lg hover:shadow-xl"
              }`}
            >
              {isSubmitting ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                "Submit Report"
              )}
            </button>

          </div>
        </form>
      </div>
    </div>
  );
}

