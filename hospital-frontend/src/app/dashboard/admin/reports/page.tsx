"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from "recharts";
import { TrendingUp, Users, Activity, DollarSign, Download } from "lucide-react";
import { toast } from "sonner";
import { hospitalApi } from "@/services/hospitalApi";

const dailyPatients = [
  { day: "Mon", OPD: 142, Admitted: 38, Emergency: 12, Discharged: 45 },
  { day: "Tue", OPD: 158, Admitted: 42, Emergency: 9, Discharged: 51 },
  { day: "Wed", OPD: 135, Admitted: 35, Emergency: 15, Discharged: 39 },
  { day: "Thu", OPD: 170, Admitted: 48, Emergency: 11, Discharged: 58 },
  { day: "Fri", OPD: 189, Admitted: 52, Emergency: 17, Discharged: 62 },
  { day: "Sat", OPD: 121, Admitted: 30, Emergency: 8, Discharged: 34 },
  { day: "Sun", OPD: 88, Admitted: 22, Emergency: 6, Discharged: 25 },
];

const revenueData = [
  { month: "Jan", revenue: 1240000, expenses: 780000 },
  { month: "Feb", revenue: 1380000, expenses: 820000 },
  { month: "Mar", revenue: 1520000, expenses: 890000 },
  { month: "Apr", revenue: 1410000, expenses: 850000 },
  { month: "May", revenue: 1680000, expenses: 940000 },
  { month: "Jun", revenue: 1890000, expenses: 1020000 },
];

const deptDistribution = [
  { name: "Cardiology", value: 22, color: "#EF4444" },
  { name: "Orthopedics", value: 18, color: "#F97316" },
  { name: "Pediatrics", value: 15, color: "#22C55E" },
  { name: "Neurology", value: 12, color: "#6366F1" },
  { name: "Oncology", value: 10, color: "#8B5CF6" },
  { name: "Others", value: 23, color: "#3AB58F" },
];

const bedOccupancy = [
  { dept: "ICU", total: 20, occupied: 18 },
  { dept: "Cardiology", total: 40, occupied: 35 },
  { dept: "Orthopedics", total: 35, occupied: 28 },
  { dept: "Pediatrics", total: 30, occupied: 22 },
  { dept: "Neurology", total: 25, occupied: 19 },
  { dept: "General", total: 80, occupied: 58 },
];

const waitTimeData = [
  { time: "08:00", avg: 12 }, { time: "09:00", avg: 24 },
  { time: "10:00", avg: 38 }, { time: "11:00", avg: 45 },
  { time: "12:00", avg: 52 }, { time: "13:00", avg: 41 },
  { time: "14:00", avg: 35 }, { time: "15:00", avg: 29 },
  { time: "16:00", avg: 22 }, { time: "17:00", avg: 15 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-3">
        <p className="text-gray-600 mb-1" style={{ fontSize: "11px", fontWeight: 700 }}>{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ fontSize: "12px", color: p.color, fontWeight: 600 }}>
            {p.name}: {typeof p.value === 'number' && p.value > 10000 ? `₹${(p.value / 1000).toFixed(0)}K` : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ReportsAnalytics() {
  const [period, setPeriod] = useState("7D");
  const [mounted, setMounted] = useState(false);
  const [hospitalName, setHospitalName] = useState<string>("Loading...");

  useEffect(() => {
    setMounted(true);
    const fetchHospital = async () => {
      try {
        const hospital = await hospitalApi.getMyHospital();
        setHospitalName(hospital.hospital_name || "Hospital");
      } catch (e) {
        setHospitalName("Unknown Hospital");
      }
    };
    fetchHospital();
    const handleUpdate = () => fetchHospital();
    window.addEventListener("hospitalUpdated", handleUpdate);
    return () => window.removeEventListener("hospitalUpdated", handleUpdate);
  }, []);

  if (!mounted) {
    return <div className="p-10 text-center text-gray-400">Loading charts...</div>;
  }

  return (
    <div className="flex flex-col gap-5 pt-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900" style={{ fontSize: "20px", fontWeight: 700 }}>Reports & Analytics</h1>
          <p className="text-gray-500 mt-0.5" style={{ fontSize: "13px" }}>Executive overview · {hospitalName}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white rounded-xl border border-gray-200 p-1">
            {["7D", "30D", "3M", "YTD"].map((p) => (
              <button key={p} onClick={() => setPeriod(p)} className="px-3 py-1 rounded-lg transition-all text-xs font-bold cursor-pointer" style={{ background: period === p ? "linear-gradient(135deg, #58D0A7, #3AB58F)" : "transparent", color: period === p ? "white" : "#6B7280" }}>
                {p}
              </button>
            ))}
          </div>
          <button onClick={() => toast.success("Reports compiled and downloaded successfully!")} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all text-xs font-bold bg-white cursor-pointer">
            <Download className="w-3.5 h-3.5" /> Export Report
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Patients (Month)", value: "3,847", change: "+12.4%", icon: Users, color: "#3AB58F", bg: "#EEF9F5" },
          { label: "Revenue (Month)", value: "₹18.9L", change: "+8.7%", icon: DollarSign, color: "#6366F1", bg: "#EEF3FF" },
          { label: "Avg Wait Time", value: "34 min", change: "-6 min", icon: Activity, color: "#F97316", bg: "#FFF4EC" },
          { label: "Clinical Utilization", value: "91.4%", change: "+2.4%", icon: TrendingUp, color: "#CA8A04", bg: "#FEFCE8" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-gray-400" style={{ fontSize: "11px", fontWeight: 600 }}>{s.label}</p>
                <p className="text-gray-900 mt-1" style={{ fontSize: "24px", fontWeight: 700, lineHeight: 1.1 }}>{s.value}</p>
                <span className="text-[10px] font-bold text-green-500">{s.change} vs last month</span>
              </div>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
                <Icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-6 gap-6">
        {/* Patient Load Curve */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 col-span-4 h-80">
          <h3 className="text-gray-800 font-bold text-sm mb-4">Patient Traffic Statistics</h3>
          <ResponsiveContainer width="100%" height="85%">
            <AreaChart data={dailyPatients} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
              <defs>
                <linearGradient id="colorOPD" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3AB58F" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#3AB58F" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorAdmitted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis dataKey="day" stroke="#9CA3AF" fontSize={10} tickLine={false} />
              <YAxis stroke="#9CA3AF" fontSize={10} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px", fontWeight: 600 }} />
              <Area type="monotone" dataKey="OPD" stroke="#3AB58F" strokeWidth={2.5} fillOpacity={1} fill="url(#colorOPD)" />
              <Area type="monotone" dataKey="Admitted" stroke="#6366F1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAdmitted)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Specialty distribution pie chart */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 col-span-2 h-80 flex flex-col justify-between">
          <h3 className="text-gray-800 font-bold text-sm">Specialty Patient Load</h3>
          <div className="h-40 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={deptDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={60} paddingAngle={3} dataKey="value">
                  {deptDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-gray-900 font-bold text-xl leading-none">847</span>
              <span className="text-gray-400 text-[10px] mt-1">Total Patients</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-[10px] text-gray-500 font-semibold mt-2">
            {deptDistribution.map((d) => (
              <div key={d.name} className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="truncate">{d.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Flow Bar */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 col-span-3 h-80">
          <h3 className="text-gray-800 font-bold text-sm mb-4">Hospital Cashflow (Monthly)</h3>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={revenueData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis dataKey="month" stroke="#9CA3AF" fontSize={10} tickLine={false} />
              <YAxis stroke="#9CA3AF" fontSize={10} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px", fontWeight: 600 }} />
              <Bar dataKey="revenue" fill="#3AB58F" radius={[4, 4, 0, 0]} name="Revenue" />
              <Bar dataKey="expenses" fill="#F97316" radius={[4, 4, 0, 0]} name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Wait times trends line */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 col-span-3 h-80">
          <h3 className="text-gray-800 font-bold text-sm mb-4">Patient Average Wait Time (OPD)</h3>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={waitTimeData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis dataKey="time" stroke="#9CA3AF" fontSize={10} tickLine={false} />
              <YAxis stroke="#9CA3AF" fontSize={10} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="avg" stroke="#6366F1" strokeWidth={2.5} activeDot={{ r: 6 }} name="Wait Time (min)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
