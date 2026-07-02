"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

export interface NavItem {
  id: string;
  path?: string; // Optional for string-based tabs
  icon: LucideIcon;
  label: string;
  badge?: number | boolean;
  onClick?: () => void;
}

interface FloatingNavigationProps {
  items: NavItem[];
  activeItemId?: string; // If provided, uses this to determine active state instead of URL
}

export function FloatingNavigation({ items, activeItemId }: FloatingNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (item: NavItem) => {
    if (activeItemId !== undefined) {
      return item.id === activeItemId;
    }
    if (item.path === "/dashboard" && (pathname === "/dashboard" || pathname === "/dashboard/")) {
      return true;
    }
    return pathname === item.path;
  };

  if (!mounted) return null;

  return (
    <div 
      className="absolute z-[100] pointer-events-none flex justify-center w-full"
      style={{ bottom: "max(16px, env(safe-area-inset-bottom))" }}
    >
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative pointer-events-auto w-[calc(100vw-32px)] max-w-[380px] lg:w-auto h-[64px] lg:h-[76px] px-2 py-1.5 lg:p-2.5 rounded-full flex items-center justify-evenly gap-1.5 lg:gap-2 shadow-[0_20px_50px_rgba(15,23,42,0.12),0_8px_20px_rgba(15,23,42,0.08),0_2px_8px_rgba(15,23,42,0.04)] dark:shadow-[0_25px_60px_rgba(15,23,42,0.18),0_10px_30px_rgba(15,23,42,0.08)] border border-[rgba(15,23,42,0.08)] border-t-[rgba(255,255,255,0.7)] border-b-[rgba(15,23,42,0.05)] dark:border-white/15 bg-[rgba(255,255,255,0.92)] dark:bg-[rgba(255,255,255,0.12)] max-[390px]:scale-[0.92] max-[390px]:origin-bottom"
        style={{
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        }}
      >
        {/* Light Mode Glow Separation Layer */}
        <div className="absolute inset-[-8px] -z-10 blur-[20px] bg-[radial-gradient(circle,rgba(20,184,166,0.08),transparent_70%)] dark:hidden pointer-events-none rounded-full" />
        {items.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.onClick) {
                  item.onClick();
                } else if (item.path) {
                  router.push(item.path);
                }
              }}
              className="relative flex flex-col items-center justify-center w-12 h-[48px] lg:w-16 lg:h-[56px] rounded-full group outline-none"
            >
              {/* Hover Effect Background */}
              <div className="absolute inset-0 rounded-full bg-white/0 dark:group-hover:bg-white/5 transition-colors duration-200" />
              
              {/* Active Pill Background */}
              {active && (
                <motion.div
                  layoutId="activePill"
                  className="absolute inset-0 rounded-full bg-[#ECFDF5] dark:bg-[rgba(20,184,166,0.22)] border border-[rgba(20,184,166,0.15)] dark:border-transparent shadow-[0_4px_12px_rgba(20,184,166,0.15)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.15)]"
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
                    className={`transition-colors duration-200 w-[20px] h-[20px] lg:w-[24px] lg:h-[24px] ${
                      active
                        ? "text-[#14B8A6]"
                        : "text-[#64748B] group-hover:text-[#334155] dark:text-[rgba(255,255,255,0.65)] dark:group-hover:text-[rgba(255,255,255,0.65)]"
                    }`}
                    strokeWidth={active ? 2.5 : 2}
                  />
                  
                  {/* Notification Dot */}
                  {item.badge && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white/80"
                      style={{ background: "#EF4444" }}
                    />
                  )}
                </div>
                
                {/* Optional Label for Desktop or Tooltip alternative */}
                <span
                  className={`text-[10px] mt-1 font-medium transition-colors duration-200 ${
                    active 
                      ? "text-[#14B8A6] opacity-100" 
                      : "text-[#64748B] dark:text-[rgba(255,255,255,0.65)] opacity-0 group-hover:opacity-100"
                  } lg:hidden`}
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
