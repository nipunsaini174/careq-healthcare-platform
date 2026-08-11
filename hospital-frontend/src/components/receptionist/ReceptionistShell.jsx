"use client";

import { useState } from "react";
import EnterpriseSidebar from "@/components/receptionist/Enterprise/EnterpriseSidebar";
import EnterpriseHeader from "@/components/receptionist/Enterprise/EnterpriseHeader";

export default function ReceptionistShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-dvh w-full min-w-0 bg-gray-50 font-sans text-gray-900">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <EnterpriseSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
        <EnterpriseHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="relative min-h-0 w-full min-w-0 flex-1 overflow-x-auto overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
