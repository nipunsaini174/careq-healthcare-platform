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
      <div className="grid grid-cols-10 gap-8">
        {/* Left Column: Primary Operational Workspace */}
        <div className="col-span-7 flex flex-col gap-8">
          <ReceptionistTable />
        </div>

        {/* Right Column: Live Context */}
        <div className="col-span-3">
          <QueueSidebar />
        </div>
      </div>

    </motion.div>
  );
}
