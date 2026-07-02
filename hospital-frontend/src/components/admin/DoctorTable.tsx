"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MoreHorizontal, Clock, User } from "lucide-react";
import api from "@/services/api";
import { useSocket } from "@/contexts/SocketContext";
import { Doctor } from "@/types";

const statusConfig: Record<string, { bg: string; color: string; dot: string }> = {
  Active: { bg: "#EEF9F5", color: "#16A34A", dot: "#22C55E" },
  Busy: { bg: "#FFF4EC", color: "#EA580C", dot: "#F97316" },
  Offline: { bg: "#F5F5F5", color: "#6B7280", dot: "#9CA3AF" },
};

function delayColor(mins: number) {
  if (mins === 0) return "#22C55E";
  if (mins < 20) return "#EAB308";
  if (mins < 45) return "#F97316";
  return "#EF4444";
}

export function DoctorTable() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  const fetchDoctors = async () => {
    try {
      const res = await api.get<Doctor[]>("/doctors");
      setDoctors(res.data);
    } catch (err) {
      console.error("Failed to fetch doctors monitor:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();

    if (socket) {
      socket.on("doctor_created", fetchDoctors);
      socket.on("doctor_updated", (updatedDoc: Doctor) => {
        setDoctors((prev) =>
          prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d))
        );
      });
      socket.on("doctor_deleted", fetchDoctors);
    }

    return () => {
      if (socket) {
        socket.off("doctor_created", fetchDoctors);
        socket.off("doctor_updated");
        socket.off("doctor_deleted", fetchDoctors);
      }
    };
  }, [socket]);

  // Map doctors to match their current patient from seeded records or general default
  const getMockPatient = (docName: string) => {
    if (docName.includes("Sharma")) return "Amir Khan";
    if (docName.includes("Mehta")) return "Sarah Lin";
    if (docName.includes("Patel")) return "James Park";
    if (docName.includes("Nair")) return "Emma Cho";
    if (docName.includes("Gupta")) return "Peter Liu";
    if (docName.includes("Iyer")) return "Nina Torres";
    return "—";
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-gray-900 text-lg font-bold">
          Doctor Operations Monitor
        </h2>
        <span className="text-xs text-gray-400">
          {loading ? "Loading..." : `${doctors.length} Registered`}
        </span>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-lg overflow-hidden min-h-[450px] flex flex-col">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-50" style={{ background: "#F9FAFB" }}>
              {["Doctor", "Department", "Current Patient", "Patients Seen", "Delay", "Status", ""].map((h) => (
                <th
                  key={h}
                  className="text-left px-5 py-3 text-gray-400 text-xs font-semibold uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {doctors.map((doc, i) => {
              const sc = statusConfig[doc.status] || statusConfig.Offline;
              const currentPatient = doc.status === "Offline" ? "—" : getMockPatient(doc.name);
              
              return (
                <motion.tr
                  key={doc.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors"
                >
                  {/* Doctor */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: "linear-gradient(135deg, #58D0A7, #3AB58F)" }}
                      >
                        <span className="text-white" style={{ fontSize: "11px", fontWeight: 700 }}>
                          {doc.name.split(" ").slice(1).map((n) => n[0]).join("").slice(0, 2)}
                        </span>
                      </div>
                      <span className="text-gray-800" style={{ fontSize: "13px", fontWeight: 600 }}>
                        {doc.name}
                      </span>
                    </div>
                  </td>
                  {/* Dept */}
                  <td className="px-5 py-3 text-gray-500" style={{ fontSize: "12px" }}>{doc.dept}</td>
                  {/* Current patient */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-gray-700" style={{ fontSize: "13px" }}>{currentPatient}</span>
                    </div>
                  </td>
                  {/* Seen */}
                  <td className="px-5 py-3">
                    <span
                      className="px-2.5 py-1 rounded-lg"
                      style={{ background: "#EEF9F5", color: "#3AB58F", fontSize: "13px", fontWeight: 700 }}
                    >
                      {doc.patients}
                    </span>
                  </td>
                  {/* Delay */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" style={{ color: delayColor(doc.delay) }} />
                      <span style={{ color: delayColor(doc.delay), fontSize: "13px", fontWeight: 600 }}>
                        {doc.delay === 0 ? "On time" : `+${doc.delay} min`}
                      </span>
                    </div>
                  </td>
                  {/* Status */}
                  <td className="px-5 py-3">
                    <span
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full w-fit"
                      style={{ background: sc.bg, color: sc.color, fontSize: "12px", fontWeight: 600 }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc.dot }} />
                      {doc.status}
                    </span>
                  </td>
                  {/* Actions */}
                  <td className="px-5 py-3">
                    <button className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
                      <MoreHorizontal className="w-4 h-4 text-gray-400" />
                    </button>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
