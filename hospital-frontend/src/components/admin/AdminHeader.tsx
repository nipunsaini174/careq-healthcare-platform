"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Search, ChevronDown, Users, Clock, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const pageLabels: Record<string, string> = {
  "/dashboard/admin": "Command Center",
  "/dashboard/admin/patients": "Patient Management",
  "/dashboard/admin/doctors": "Doctors",
  "/dashboard/admin/appointments": "Appointments",
  "/dashboard/admin/billing": "Billing & Finance",
  "/dashboard/admin/reports": "Reports & Analytics",
  "/dashboard/admin/notifications": "Notifications",
  "/dashboard/admin/settings": "Settings",
};

export function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  
  const pageTitle = pageLabels[pathname] || "MediCore Admin";
  const isDashboard = pathname === "/dashboard/admin";

  return (
    <header className="sticky top-0 z-50 pt-4 pb-6 flex-shrink-0 bg-gradient-to-br from-[#58D0A7] to-[#3AB58F] rounded-b-[40px] shadow-[0_30px_60px_rgba(0,0,0,0.12),0_10px_20px_rgba(0,0,0,0.08)] overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none rounded-b-[40px]" style={{ background: "radial-gradient(circle at center, rgba(255,255,255,0.15), transparent 70%)" }} />
      
      {/* Content wrapper to ensure it sits above the glow */}
      <div className="relative z-10 max-w-[1700px] mx-auto w-full px-8">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-white/70" style={{ fontSize: "11px", fontWeight: 500 }}>
            St. Mary's General Hospital
          </p>
          <h1 className="text-white text-2xl font-bold leading-tight">
            {pageTitle}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-white/80" />
            <input
              type="text"
              placeholder="Search patients, doctors..."
              className="bg-transparent text-white placeholder-white/60 outline-none w-44 text-sm"
            />
          </div>

          <Link
            href="/dashboard/admin/notifications"
            className="relative w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <Bell className="w-4 h-4 text-white" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-400 rounded-full border border-white animate-pulse" />
          </Link>

          <button 
            onClick={() => { if(confirm("Do you want to log out?")) logout(); }}
            className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 hover:bg-white/30 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-white/40 flex items-center justify-center">
              <span className="text-white" style={{ fontSize: "11px", fontWeight: 700 }}>
                {user?.displayName ? user.displayName.slice(0, 2) : "AD"}
              </span>
            </div>
            <span className="text-white text-sm font-medium">
              {user?.displayName || "Dr. Admin"}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-white/70" />
          </button>
        </div>
      </div>

      {/* Glassmorphism widgets — only on dashboard */}
      {isDashboard && (
        <div className="flex gap-4">
          {[
            { icon: Users, label: "Staff On Duty", value: "128", change: "+4 today" },
            { icon: Clock, label: "Avg Wait Time", value: "34 min", change: "-6 min vs yesterday" },
            { icon: TrendingUp, label: "Bed Occupancy", value: "87.3%", change: "+2.1% this week" },
          ].map((w) => {
            const Icon = w.icon;
            return (
              <div
                key={w.label}
                className="flex items-center gap-3 px-4 py-3 flex-1 bg-white/20 backdrop-blur-lg border border-white/30 rounded-2xl shadow-lg"
              >
                <div className="w-9 h-9 rounded-xl bg-white/25 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-white/70" style={{ fontSize: "11px", fontWeight: 500 }}>{w.label}</p>
                  <p className="text-white" style={{ fontSize: "17px", fontWeight: 700, lineHeight: 1.2 }}>{w.value}</p>
                  <p className="text-white/60" style={{ fontSize: "10px" }}>{w.change}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>
    </header>
  );
}
