"use client";

import React from "react";
import {
  Home,
  Calendar,
  Clock,
  FileText,
  User,
} from "lucide-react";
import { FloatingNavigation } from "../FloatingNavigation";

interface MobileAppShellProps {
  children: React.ReactNode;
}

const mobileNavItems = [
  { path: "/app/home", icon: Home, label: "Home" },
  { path: "/app/book", icon: Calendar, label: "Book" },
  { path: "/app/queue", icon: Clock, label: "Queue" },
  { path: "/app/reports", icon: FileText, label: "Reports" },
  { path: "/app/profile", icon: User, label: "Profile" },
];

export function MobileAppShell({ children }: MobileAppShellProps) {
  return (
    <div className="w-full h-full flex flex-col bg-gray-50 dark:bg-[#0B0F14] relative overflow-hidden">
      {/* Scrollable content */}
      <main className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
        <div className="w-full relative">
          {children}
        </div>
      </main>

      {/* Floating Navigation — always inside the mobile container */}
      <FloatingNavigation
        items={mobileNavItems.map((item) => ({
          id: item.path,
          path: item.path,
          icon: item.icon,
          label: item.label,
        }))}
      />
    </div>
  );
}
