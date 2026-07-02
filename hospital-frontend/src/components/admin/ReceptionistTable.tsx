"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MoreHorizontal, Clock, User } from "lucide-react";
import api from "@/services/api";
import { Receptionist } from "@/types";
import { useSocket } from "@/contexts/SocketContext";

const statusConfig: Record<string, { bg: string; color: string; dot: string }> = {
  Active: { bg: "#EEF9F5", color: "#16A34A", dot: "#22C55E" },
  Offline: { bg: "#F5F5F5", color: "#6B7280", dot: "#9CA3AF" },
};

export function ReceptionistTable() {
  const [receptionists, setReceptionists] = useState<Receptionist[]>([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  const fetchReceptionists = async () => {
    try {
      const res = await api.get<Receptionist[]>("/admin/receptionists");
      setReceptionists(res.data);
    } catch (err) {
      console.error("Failed to fetch receptionists:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceptionists();

    if (socket) {
      // Future-proofing if sockets are added for receptionists
      socket.on("receptionist_created", fetchReceptionists);
      socket.on("receptionist_updated", (updatedRec: Receptionist) => {
        setReceptionists((prev) =>
          prev.map((r) => (r.id === updatedRec.id ? updatedRec : r))
        );
      });
      socket.on("receptionist_deleted", fetchReceptionists);
    }

    return () => {
      if (socket) {
        socket.off("receptionist_created", fetchReceptionists);
        socket.off("receptionist_updated");
        socket.off("receptionist_deleted", fetchReceptionists);
      }
    };
  }, [socket]);

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-gray-900 text-lg font-bold">
          Receptionist Operations Monitor
        </h2>
        <span className="text-xs text-gray-400">
          {loading ? "Loading..." : `${receptionists.length} Registered`}
        </span>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-lg overflow-hidden min-h-[450px] flex flex-col">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-50" style={{ background: "#F9FAFB" }}>
              {["Receptionist", "Email", "Phone", "Shift", "Status", ""].map((h) => (
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
            {receptionists.map((rec, i) => {
              const sc = statusConfig[rec.status] || statusConfig.Offline;
              const shiftStart = new Date(rec.shift_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const shiftEnd = new Date(rec.shift_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <motion.tr
                  key={rec.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors"
                >
                  {/* Receptionist */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: "linear-gradient(135deg, #4F46E5, #6366F1)" }}
                      >
                        <span className="text-white" style={{ fontSize: "11px", fontWeight: 700 }}>
                          {rec.name.split(" ").slice(0, 2).map((n) => n[0]).join("")}
                        </span>
                      </div>
                      <span className="text-gray-800" style={{ fontSize: "13px", fontWeight: 600 }}>
                        {rec.name}
                      </span>
                    </div>
                  </td>
                  {/* Email */}
                  <td className="px-5 py-3 text-gray-500" style={{ fontSize: "12px" }}>{rec.email}</td>
                  {/* Phone */}
                  <td className="px-5 py-3 text-gray-500" style={{ fontSize: "12px" }}>{rec.phone || '—'}</td>
                  {/* Shift */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-gray-700" style={{ fontSize: "12px" }}>
                        {shiftStart} - {shiftEnd}
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
                      {rec.status}
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
            {receptionists.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-400">
                  No receptionists found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
