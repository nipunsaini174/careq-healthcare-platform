"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronDown, Users, Clock, TrendingUp, LogOut, Settings, Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { hospitalApi } from "@/services/hospitalApi";

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

export function AdminHeader({ onMenuClick = () => {} }: { onMenuClick?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const [hospitalName, setHospitalName] = useState<string>("Loading...");

  const fetchHospital = async () => {
    try {
      const hospital = await hospitalApi.getMyHospital();
      setHospitalName(hospital.hospital_name || "Hospital");
    } catch (e) {
      setHospitalName("Unknown Hospital");
    }
  };

  useEffect(() => {
    fetchHospital();

    const handleUpdate = () => fetchHospital();
    window.addEventListener("hospitalUpdated", handleUpdate);
    return () => window.removeEventListener("hospitalUpdated", handleUpdate);
  }, []);
  
  const pageTitle = pageLabels[pathname] || "MediCore Admin";
  const isDashboard = pathname === "/dashboard/admin";

  return (
    <header className="sticky top-0 z-50 flex-shrink-0 overflow-x-auto rounded-b-[24px] bg-gradient-to-br from-[#58D0A7] to-[#3AB58F] pb-4 pt-3 shadow-[0_30px_60px_rgba(0,0,0,0.12),0_10px_20px_rgba(0,0,0,0.08)] sm:rounded-b-[32px] sm:pb-6 sm:pt-4 lg:rounded-b-[40px]">
      <div className="absolute inset-0 pointer-events-none rounded-b-[inherit]" style={{ background: "radial-gradient(circle at center, rgba(255,255,255,0.15), transparent 70%)" }} />
      
      <div className="relative z-10 mx-auto w-full min-w-0 max-w-[1700px] px-4 sm:px-6 lg:px-8">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3 sm:mb-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <button
            type="button"
            aria-label="Open menu"
            onClick={onMenuClick}
            className="mt-1 rounded-xl bg-white/20 p-2 backdrop-blur-sm hover:bg-white/30 md:hidden"
          >
            <Menu className="h-5 w-5 text-white" />
          </button>
          <div className="min-w-0">
          <p className="truncate text-[11px] font-medium text-white/70">
            {hospitalName}
          </p>
          <h1 className="text-lg font-bold leading-tight text-white sm:text-xl lg:text-2xl">
            {pageTitle}
          </h1>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            href="/dashboard/admin/notifications"
            className="relative w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <Bell className="w-4 h-4 text-white" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-400 rounded-full border border-white animate-pulse" />
          </Link>

          <div className="relative">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 hover:bg-white/30 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-white/40 flex items-center justify-center">
                <span className="text-white" style={{ fontSize: "11px", fontWeight: 700 }}>
                  {user?.displayName ? user.displayName.slice(0, 2) : "AD"}
                </span>
              </div>
              <span className="hidden text-sm font-medium text-white sm:inline">
                {user?.displayName || "Dr. Admin"}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-white/70" />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                <div className="py-1">
                  <Link
                    href="/dashboard/admin/settings"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-gray-500" />
                    Account Settings
                  </Link>
                  <div className="h-[1px] bg-gray-100 my-1" />
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      if (confirm("Do you want to log out?")) logout();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-left"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic widgets — zero baseline when empty */}
      {isDashboard && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 xl:gap-4">
          {[
            { icon: Users, label: "Staff On Duty", value: "0", change: "0 today" },
            { icon: Clock, label: "Avg Wait Time", value: "0 min", change: "Live sync" },
            { icon: TrendingUp, label: "Bed Occupancy", value: "0%", change: "Live sync" },
          ].map((w) => {
            const Icon = w.icon;
            return (
              <div
                key={w.label}
                className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/30 bg-white/20 px-3 py-3 backdrop-blur-lg shadow-lg sm:px-4"
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
