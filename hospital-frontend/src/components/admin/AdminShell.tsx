"use client";

import { useState } from "react";
import { Sidebar } from "@/components/admin/Sidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-dvh w-full min-w-0 bg-gray-50 dark:bg-gray-900">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-h-dvh min-w-0 flex-1 flex-col overflow-x-auto">
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="relative z-10 w-full min-w-0 max-w-[1700px] flex-1 mx-auto px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8 pt-4 sm:pt-6">
          {children}
        </main>
      </div>
    </div>
  );
}
