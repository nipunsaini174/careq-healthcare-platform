"use client";

import { KpiCards } from "@/components/admin/KpiCards";
import { ReceptionistTable } from "@/components/admin/ReceptionistTable";
import { QueueSidebar } from "@/components/admin/QueueSidebar";
import { motion } from "framer-motion";

export default function DashboardPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-8"
    >
      {/* KPI Overviews */}
      <KpiCards />

      {/* Main Workspace: 70/30 Split */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-10 xl:gap-6 2xl:gap-8">
        <div className="flex flex-col gap-4 xl:col-span-7 xl:gap-6 2xl:gap-8">
          <ReceptionistTable />
        </div>

        <div className="xl:col-span-3">
          <QueueSidebar />
        </div>
      </div>

    </motion.div>
  );
}
