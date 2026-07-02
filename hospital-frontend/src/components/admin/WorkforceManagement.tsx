"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Stethoscope,
  UserCheck,
  HeartPulse,
  Calendar,
  Clock,
  Plus,
  ChevronDown,
  MoreHorizontal
} from "lucide-react";
import api from "@/services/api";
import { useSocket } from "@/contexts/SocketContext";
import { Doctor } from "@/types";

type Tab = "Doctors" | "Receptionists" | "Nurses";

interface StaffMember {
  name: string;
  role: string;
  shift: string;
  dept: string;
  avail: string;
  leave: string;
}

const tabIcons: Record<Tab, typeof Stethoscope> = {
  Doctors: Stethoscope,
  Receptionists: UserCheck,
  Nurses: HeartPulse,
};

const shiftColors: Record<string, { bg: string; color: string }> = {
  Morning: { bg: "#FFF4EC", color: "#EA580C" },
  Afternoon: { bg: "#FEFCE8", color: "#CA8A04" },
  Evening: { bg: "#EEF3FF", color: "#4F46E5" },
  Night: { bg: "#1E1B4B", color: "#A5B4FC" },
};

const availColors: Record<string, { bg: string; color: string; dot: string }> = {
  "On Duty": { bg: "#EEF9F5", color: "#16A34A", dot: "#22C55E" },
  "Off Duty": { bg: "#F5F5F5", color: "#6B7280", dot: "#9CA3AF" },
  "On Leave": { bg: "#FEF3F2", color: "#DC2626", dot: "#EF4444" },
};

export function WorkforceManagement() {
  const [activeTab, setActiveTab] = useState<Tab>("Doctors");
  const [dynamicDoctors, setDynamicDoctors] = useState<Doctor[]>([]);
  const { socket } = useSocket();

  const fetchDoctors = async () => {
    try {
      const res = await api.get<Doctor[]>("/doctors");
      setDynamicDoctors(res.data);
    } catch (err) {
      console.error("Failed to fetch workforce doctors:", err);
    }
  };

  useEffect(() => {
    fetchDoctors();

    if (socket) {
      socket.on("doctor_created", fetchDoctors);
      socket.on("doctor_updated", fetchDoctors);
      socket.on("doctor_deleted", fetchDoctors);
    }

    return () => {
      if (socket) {
        socket.off("doctor_created", fetchDoctors);
        socket.off("doctor_updated", fetchDoctors);
        socket.off("doctor_deleted", fetchDoctors);
      }
    };
  }, [socket]);

  // Receptionists & Nurses are static since they don't have separate DB tables
  const staticStaff: Record<Exclude<Tab, "Doctors">, StaffMember[]> = {
    Receptionists: [
      { name: "Kavya Menon", role: "Front Desk", shift: "Morning", dept: "OPD", avail: "On Duty", leave: "—" },
      { name: "Rohan Das", role: "Billing Exec", shift: "Afternoon", dept: "Billing", avail: "On Duty", leave: "—" },
      { name: "Preethi Nair", role: "Registration", shift: "Morning", dept: "OPD", avail: "On Duty", leave: "Jun 20" },
      { name: "Aakash Jain", role: "Discharge Clerk", shift: "Evening", dept: "Wards", avail: "Off Duty", leave: "—" },
    ],
    Nurses: [
      { name: "Sister Mary Thomas", role: "Head Nurse", shift: "Morning", dept: "ICU", avail: "On Duty", leave: "—" },
      { name: "Nurse Divya Singh", role: "Staff Nurse", shift: "Afternoon", dept: "Cardiology", avail: "On Duty", leave: "—" },
      { name: "Nurse Pooja Verma", role: "Staff Nurse", shift: "Evening", dept: "Orthopedics", avail: "On Leave", leave: "Jun 16–19" },
      { name: "Nurse Farida Banu", role: "ICU Nurse", shift: "Night", dept: "ICU", avail: "On Duty", leave: "—" },
      { name: "Nurse Shalini Rao", role: "Triage Nurse", shift: "Morning", dept: "Emergency", avail: "On Duty", leave: "—" },
    ],
  };

  // Convert Doctors table results to StaffMember format
  const mappedDoctors: StaffMember[] = dynamicDoctors.map((doc) => {
    // Map shift based on schedule
    let shift = "Morning";
    if (doc.schedule.includes("10:00") || doc.schedule.includes("Afternoon")) shift = "Afternoon";
    else if (doc.schedule.includes("11:00") || doc.schedule.includes("Evening")) shift = "Evening";

    return {
      name: doc.name,
      role: doc.qualification.split(",")[0] || "Medical Officer",
      shift,
      dept: doc.dept,
      avail: doc.status === "Offline" ? "Off Duty" : "On Duty",
      leave: doc.status === "Offline" ? "—" : "—",
    };
  });

  const getStaffList = (): StaffMember[] => {
    if (activeTab === "Doctors") return mappedDoctors;
    return staticStaff[activeTab];
  };

  const getOnDutyCount = (tab: Tab): number => {
    if (tab === "Doctors") {
      return dynamicDoctors.filter((d) => d.status !== "Offline").length;
    }
    return staticStaff[tab as Exclude<Tab, "Doctors">].filter((s) => s.avail === "On Duty").length;
  };

  const getTotalCount = (tab: Tab): number => {
    if (tab === "Doctors") return dynamicDoctors.length;
    return staticStaff[tab as Exclude<Tab, "Doctors">].length;
  };

  const staff = getStaffList();
  const Icon = tabIcons[activeTab];

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-gray-900 text-lg font-bold">
          Staff & Workforce Management
        </h2>
        <button
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-white transition-all duration-200 hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #58D0A7, #3AB58F)", fontSize: "12px", fontWeight: 600 }}
        >
          <Plus className="w-3.5 h-3.5" /> Add Staff
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-5 mb-4">
        {(["Doctors", "Receptionists", "Nurses"] as Tab[]).map((t) => {
          const TIcon = tabIcons[t];
          const onDuty = getOnDutyCount(t);
          const total = getTotalCount(t);
          const isActive = t === activeTab;
          return (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className="flex items-center gap-3 p-6 rounded-2xl border transition-all duration-200 text-left border-2 cursor-pointer"
              style={{
                background: isActive ? "linear-gradient(135deg, #58D0A7, #3AB58F)" : "white",
                borderColor: isActive ? "#3AB58F" : "#F3F4F6",
                boxShadow: isActive ? "0 4px 20px rgba(58,181,143,0.3)" : "0 1px 4px rgba(0,0,0,0.05)",
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: isActive ? "rgba(255,255,255,0.25)" : "#EEF9F5" }}
              >
                <TIcon className="w-5 h-5" style={{ color: isActive ? "white" : "#3AB58F" }} />
              </div>
              <div>
                <p style={{ fontSize: "13px", fontWeight: 700, color: isActive ? "white" : "#1F2937" }}>{t}</p>
                <p style={{ fontSize: "11px", color: isActive ? "rgba(255,255,255,0.75)" : "#6B7280" }}>
                  {onDuty}/{total} on duty
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Staff table */}
      <div className="bg-white rounded-3xl p-6 shadow-lg overflow-hidden">
        {/* Filter row */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50" style={{ background: "#F9FAFB" }}>
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4" style={{ color: "#3AB58F" }} />
            <span className="text-gray-700" style={{ fontSize: "13px", fontWeight: 600 }}>{activeTab}</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors" style={{ fontSize: "12px" }}>
              <Calendar className="w-3.5 h-3.5" /> Shift Management <ChevronDown className="w-3 h-3" />
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors" style={{ fontSize: "12px" }}>
              <Clock className="w-3.5 h-3.5" /> Leave Management <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-50">
              {["Name", "Role", "Shift", "Department", "Availability", "Leave", ""].map((h) => (
                <th
                  key={h}
                  className="text-left px-5 py-3 text-gray-400"
                  style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {staff.map((s, i) => {
              const sc = availColors[s.avail] || availColors["Off Duty"];
              const sh = shiftColors[s.shift] || shiftColors.Morning;
              return (
                <motion.tr
                  key={s.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-5 py-3">
                    <span className="text-gray-800" style={{ fontSize: "13px", fontWeight: 600 }}>{s.name}</span>
                  </td>
                  <td className="px-5 py-3 text-gray-500" style={{ fontSize: "12px" }}>{s.role}</td>
                  <td className="px-5 py-3">
                    <span className="px-2.5 py-0.5 rounded-lg" style={{ background: sh.bg, color: sh.color, fontSize: "11px", fontWeight: 600 }}>
                      {s.shift}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500" style={{ fontSize: "12px" }}>{s.dept}</td>
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full w-fit" style={{ background: sc.bg, color: sc.color, fontSize: "11px", fontWeight: 600 }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc.dot }} />
                      {s.avail}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500" style={{ fontSize: "12px" }}>{s.leave}</td>
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
