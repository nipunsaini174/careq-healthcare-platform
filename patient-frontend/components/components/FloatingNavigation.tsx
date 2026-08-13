"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { LucideIcon } from "lucide-react";

export interface NavItem {
  id: string;
  path: string;
  icon: LucideIcon;
  label: string;
  badge?: number | boolean;
}

interface FloatingNavigationProps {
  items: NavItem[];
}

export function FloatingNavigation({ items }: FloatingNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (path: string) => {
    if (path === "/app/home" && (pathname === "/app" || pathname === "/app/")) {
      return true;
    }
    return pathname === path;
  };

  if (!mounted) return null;

  return (
    <div 
      className="absolute bottom-0 left-0 right-0 z-[100] pointer-events-none flex justify-center w-full pt-32 dark:bg-gradient-to-t dark:from-[#0B0F14] dark:via-[#0B0F14]/50 dark:to-transparent"
      style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}
    >
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative pointer-events-auto w-[calc(100vw-48px)] max-w-[340px] lg:w-auto h-[56px] lg:h-[76px] px-2 py-1.5 lg:p-2.5 rounded-full flex items-center justify-evenly gap-1 lg:gap-2 shadow-[0_20px_50px_rgba(15,23,42,0.12),0_8px_20px_rgba(15,23,42,0.08),0_2px_8px_rgba(15,23,42,0.04)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.4),0_10px_30px_rgba(16,185,129,0.05)] border border-[rgba(15,23,42,0.08)] border-t-[rgba(255,255,255,0.7)] border-b-[rgba(15,23,42,0.05)] dark:border-[#2A3A4E] dark:border-t-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.92)] dark:bg-[rgba(17,24,32,0.88)]"
        style={{
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        }}
      >
        {/* Light Mode Glow Separation Layer */}
        <div className="absolute inset-[-8px] -z-10 blur-[20px] bg-[radial-gradient(circle,rgba(20,184,166,0.08),transparent_70%)] dark:bg-[radial-gradient(circle,rgba(16,185,129,0.12),transparent_70%)] pointer-events-none rounded-full" />

        {items.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => router.push(item.path)}
              className="relative flex flex-col items-center justify-center w-[44px] h-[44px] lg:w-16 lg:h-[56px] rounded-full group outline-none"
            >
              {/* Hover Effect Background */}
              <div className="absolute inset-0 rounded-full bg-white/0 dark:group-hover:bg-white/5 transition-colors duration-200" />
              
              {/* Active Pill Background */}
              {active && (
                <motion.div
                  layoutId="activePill"
                  className="absolute inset-0 rounded-full bg-teal-100 dark:bg-emerald-500/15 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_2px_6px_rgba(20,184,166,0.2)] dark:shadow-[inset_0_1px_1px_rgba(16,185,129,0.1),0_2px_10px_rgba(16,185,129,0.2)]"
                  style={{
                    backdropFilter: "blur(12px)",
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                    mass: 0.8,
                  }}
                />
              )}

              {/* Icon and Micro-animations */}
              <motion.div
                className="relative z-10 flex flex-col items-center justify-center"
                whileHover={{ y: -2, scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                animate={{ scale: active ? 1.08 : 1 }}
                transition={{ duration: 0.2 }}
              >
                <div className="relative">
                  <Icon
                    className={`transition-colors duration-200 w-[18px] h-[18px] ${
                      active
                        ? "text-[#14B8A6] dark:text-[#10B981]"
                        : "text-[#64748B] group-hover:text-[#334155] dark:text-[#64748B] dark:group-hover:text-[#94A3B8]"
                    }`}
                    strokeWidth={active ? 2.5 : 2}
                  />
                  
                  {/* Notification Dot */}
                  {item.badge && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-2 h-2 rounded-full border-2 border-white/80"
                      style={{ background: "#EF4444" }}
                    />
                  )}
                </div>
                
                {/* Optional Label for Desktop or Tooltip alternative */}
                <span
                  className={`absolute -bottom-3.5 text-[9px] font-medium transition-all duration-300 ${
                    active
                      ? "text-teal-600 dark:text-emerald-400 opacity-100 translate-y-0"
                      : "text-slate-500 dark:text-[#94A3B8] opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0"
                  }`}
                >
                  {item.label}
                </span>
              </motion.div>
            </button>
          );
        })}
      </motion.div>
    </div>
  );
}
