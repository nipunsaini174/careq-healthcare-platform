"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { QK } from "@/contexts/AppDataProvider";
import { patientApi } from "@/services/api/patientApi";
import {
  Home,
  Calendar,
  Clock,
  FileText,
  User,
  Settings,
  Bell,
  Search,
  TestTubes,
} from "lucide-react";
import { motion } from "motion/react";
import { FloatingNavigation } from "../FloatingNavigation";
import { BrandLogo } from "@/components/BrandLogo";
import { useHydrated } from "@/hooks/useHydrated";

interface DesktopAppShellProps {
  children: React.ReactNode;
}

const sidebarItems = [
  { path: "/app/home", icon: Home, label: "Dashboard" },
  { path: "/app/book", icon: Calendar, label: "Appointments" },
  { path: "/app/queue", icon: Clock, label: "Queue" },
  { path: "/app/reports", icon: FileText, label: "Reports" },
  { path: "/app/lab-reports", icon: TestTubes, label: "Lab Reports" },
  { path: "/app/profile", icon: User, label: "Profile" },
  { path: "/app/settings", icon: Settings, label: "Settings" },
];

const mobileNavItems = [
  { path: "/app/home", icon: Home, label: "Home" },
  { path: "/app/book", icon: Calendar, label: "Book" },
  { path: "/app/queue", icon: Clock, label: "Queue" },
  { path: "/app/reports", icon: FileText, label: "Reports" },
  { path: "/app/profile", icon: User, label: "Profile" },
];

export function DesktopAppShell({ children }: DesktopAppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const hydrated = useHydrated();

  const { data: profile } = useQuery({
    queryKey: QK.profile,
    queryFn: patientApi.getProfile,
    // Profile comes from the JWT + an API round-trip; defer until the
    // client has mounted so SSR and hydration render the same placeholder.
    enabled: hydrated,
  });

  const profileInitials =
    profile?.full_name
      ? profile.full_name
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .substring(0, 2)
          .toUpperCase()
      : null;

  const isActive = (path: string) => {
    if (path === "/app/home" && (pathname === "/app" || pathname === "/app/")) return true;
    return pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B0F14]">
      {/* ==================== DESKTOP TOP HEADER ==================== */}
      <header className="hidden lg:flex fixed top-0 left-0 right-0 h-16 bg-white dark:bg-[#111820] border-b border-gray-200 dark:border-[#2A3A4E] z-50 items-center px-6">
        {/* Logo */}
        <div
          className="flex items-center gap-2.5 cursor-pointer mr-8"
          onClick={() => router.push("/app/home")}
        >
          <BrandLogo width={120} />
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md">
          <div className="flex items-center bg-gray-100 dark:bg-[#1A2332] rounded-xl px-4 py-2.5">
            <Search className="w-4 h-4 text-gray-400 mr-3" />
            <input
              type="text"
              placeholder="Search doctors, departments, records..."
              className="bg-transparent outline-none text-sm text-gray-700 dark:text-[#94A3B8] w-full placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4 ml-auto">
          <button
            onClick={() => router.push("/app/notifications")}
            className="relative w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#1A2332] flex items-center justify-center hover:bg-gray-200 dark:hover:bg-[#223040] transition-colors"
          >
            <Bell className="w-5 h-5 text-gray-600 dark:text-[#94A3B8]" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <div
            className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#1A2332] rounded-xl px-3 py-2 transition-colors"
            onClick={() => router.push("/app/profile")}
          >
            <div className="w-9 h-9 bg-gradient-to-br from-teal-400 to-teal-500 dark:from-emerald-600 dark:to-emerald-700 rounded-full flex items-center justify-center text-sm text-white font-medium uppercase">
              {hydrated && profileInitials ? (
                profileInitials
              ) : (
                <span className="w-4 h-4 rounded-full bg-white/30 animate-pulse" aria-hidden />
              )}
            </div>
            <div className="text-left min-w-[7rem]">
              <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight">
                {hydrated && profile?.full_name ? profile.full_name : "\u00A0"}
              </p>
              <p className="text-[11px] text-gray-500 leading-tight">Patient</p>
            </div>
          </div>
        </div>
      </header>

      {/* ==================== DESKTOP LEFT SIDEBAR ==================== */}
      <aside className="hidden lg:flex fixed top-16 left-0 bottom-0 w-64 bg-white dark:bg-[#111820] border-r border-gray-200 dark:border-[#2A3A4E] flex-col z-40">
        <nav className="flex-1 px-3 py-6">
          <div className="space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? "bg-teal-500/10 text-teal-500 dark:bg-emerald-500/10 dark:text-emerald-400"
                      : "text-gray-600 dark:text-[#94A3B8] hover:bg-gray-100 dark:hover:bg-[#1A2332] hover:text-gray-900 dark:hover:text-[#F1F5F9]"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? "text-teal-500 dark:text-emerald-400" : ""}`} />
                  <span>{item.label}</span>
                  {active && (
                    <motion.div
                      layoutId="sidebarActive"
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-500 dark:bg-emerald-400"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </aside>

      {/* ==================== MAIN CONTENT AREA ==================== */}
      <main className="lg:ml-64 lg:mt-16 min-h-screen">
        <div className="max-w-md mx-auto lg:max-w-[1600px] lg:mx-auto lg:px-8 lg:py-6 relative">
          {children}
        </div>
      </main>

      {/* ==================== MOBILE BOTTOM NAV (small screens only) ==================== */}
      <div className="lg:hidden">
        <FloatingNavigation
          items={mobileNavItems.map((item) => ({
            id: item.path,
            path: item.path,
            icon: item.icon,
            label: item.label,
          }))}
        />
      </div>
    </div>
  );
}
