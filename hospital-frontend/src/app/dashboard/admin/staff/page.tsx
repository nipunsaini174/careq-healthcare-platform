"use client";

import { WorkforceManagement } from "@/components/admin/WorkforceManagement";
import { motion } from "framer-motion";

export default function StaffPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Staff Management</h1>
        <p className="text-gray-500 mt-1">Manage hospital staff duty rosters and availability.</p>
      </div>
      <WorkforceManagement />
    </motion.div>
  );
}
