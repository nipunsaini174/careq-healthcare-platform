"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, AlertTriangle, Info, AlertCircle, Users } from "lucide-react";
import api from "@/services/api";
import { toast } from "sonner";

export default function BroadcastPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("Info");
  const [targetAudience, setTargetAudience] = useState("PATIENT");
  const [isSending, setIsSending] = useState(false);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) {
      toast.error("Please fill out both title and message fields.");
      return;
    }

    setIsSending(true);
    try {
      const res = await api.post("/notifications/broadcast", {
        title,
        message,
        type,
        target: targetAudience,
      });

      if (res.data.success) {
        toast.success(`Broadcast sent to ${res.data.usersReached} users successfully!`);
        setTitle("");
        setMessage("");
        setType("Info");
        setTargetAudience("PATIENT");
      }
    } catch (err: any) {
      console.error("Broadcast error:", err);
      toast.error(err.response?.data?.error || "Failed to send broadcast");
    } finally {
      setIsSending(false);
    }
  };

  const typeConfig: Record<string, { bg: string; color: string; icon: any }> = {
    Info: { bg: "bg-blue-50 border-blue-200", color: "text-blue-600", icon: Info },
    Warning: { bg: "bg-orange-50 border-orange-200", color: "text-orange-600", icon: AlertTriangle },
    Emergency: { bg: "bg-red-50 border-red-200", color: "text-red-600", icon: AlertCircle },
  };

  const CurrentIcon = typeConfig[type].icon;

  return (
    <div className="flex flex-col gap-6 pt-4 max-w-3xl mx-auto w-full">
      {/* Page Header */}
      <div>
        <h1 className="text-gray-900" style={{ fontSize: "24px", fontWeight: 700 }}>
          Global Broadcast
        </h1>
        <p className="text-gray-500 mt-1" style={{ fontSize: "14px" }}>
          Send real-time alerts and notifications to connected users.
        </p>
      </div>

      {/* Broadcast Form */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8"
      >
        <form onSubmit={handleBroadcast} className="space-y-6">
          {/* Target Audience Selector */}
          <div>
            <label className="text-gray-700 font-semibold text-sm mb-2 block">
              Target Audience
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Users className="h-5 w-5 text-gray-400" />
              </div>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all appearance-none"
              >
                <option value="PATIENT">Patients Only</option>
                <option value="DOCTOR">Doctors Only</option>
                <option value="RECEPTIONIST">Receptionists Only</option>
                <option value="ALL">All Users (Patients, Doctors, Receptionists)</option>
              </select>
            </div>
          </div>

          {/* Notification Type Selector */}
          <div>
            <label className="text-gray-700 font-semibold text-sm mb-3 block">
              Alert Severity
            </label>
            <div className="grid grid-cols-3 gap-4">
              {Object.keys(typeConfig).map((t) => {
                const isSelected = type === t;
                const Icon = typeConfig[t].icon;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${
                      isSelected
                        ? `${typeConfig[t].bg} ${typeConfig[t].color} border-2`
                        : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-bold text-sm">{t}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title Field */}
          <div>
            <label className="text-gray-700 font-semibold text-sm mb-2 block">
              Broadcast Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., OPD Services Delayed"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
              required
            />
          </div>

          {/* Message Field */}
          <div>
            <label className="text-gray-700 font-semibold text-sm mb-2 block">
              Message Content
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here. This will be sent immediately to the selected audience..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all min-h-[150px] resize-y"
              required
            />
          </div>

          {/* Live Preview */}
          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Preview
            </h3>
            <div
              className={`p-4 rounded-xl border flex gap-3 items-start ${typeConfig[type].bg}`}
            >
              <div className={`mt-0.5 ${typeConfig[type].color}`}>
                <CurrentIcon className="w-5 h-5" />
              </div>
              <div>
                <h4 className={`font-bold text-sm ${typeConfig[type].color}`}>
                  {title || "Broadcast Title"}
                </h4>
                <p className="text-sm mt-1 text-gray-700 opacity-90 leading-relaxed">
                  {message || "The broadcast message will appear here."}
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSending}
            className={`w-full py-3.5 rounded-xl text-white flex items-center justify-center gap-2 transition-all shadow-md ${
              isSending ? "opacity-70 cursor-not-allowed" : "hover:opacity-90 hover:shadow-lg"
            }`}
            style={{
              background: "linear-gradient(135deg, #4F46E5, #6366F1)",
              fontWeight: 700,
            }}
          >
            {isSending ? (
              "Broadcasting..."
            ) : (
              <>
                <Send className="w-5 h-5" />
                Send Global Broadcast
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
