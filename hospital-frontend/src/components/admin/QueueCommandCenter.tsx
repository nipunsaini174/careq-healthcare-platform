"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PauseCircle,
  XCircle,
  AlertTriangle,
  ArrowUpCircle,
  ArrowLeftRight,
  UserPlus,
  Megaphone,
  CheckCircle2,
} from "lucide-react";
import { useSocket } from "@/contexts/SocketContext";
import { toast } from "sonner";

const actions = [
  {
    icon: PauseCircle,
    label: "Pause Queue",
    desc: "Temporarily halt new entries",
    color: "#F97316",
    bg: "#FFF4EC",
    hoverBorder: "#F97316",
  },
  {
    icon: XCircle,
    label: "Close Queue",
    desc: "Stop accepting patients",
    color: "#EF4444",
    bg: "#FEF3F2",
    hoverBorder: "#EF4444",
  },
  {
    icon: AlertTriangle,
    label: "Emergency Slot",
    desc: "Add priority emergency entry",
    color: "#DC2626",
    bg: "#FEE2E2",
    hoverBorder: "#DC2626",
  },
  {
    icon: ArrowUpCircle,
    label: "Walk-in Capacity",
    desc: "Increase walk-in allowance",
    color: "#6366F1",
    bg: "#EEF3FF",
    hoverBorder: "#6366F1",
  },

];

export function QueueCommandCenter() {
  const [activated, setActivated] = useState<string | null>(null);
  const { socket } = useSocket();

  useEffect(() => {
    if (socket) {
      socket.on("queue_command_success", (data: { action: string }) => {
        setActivated(data.action);
        toast.success(`${data.action} Executed successfully!`);
        setTimeout(() => setActivated(null), 2000);
      });

      socket.on("queue_command_error", (data: { action: string; error: string }) => {
        toast.error(`Failed to run command ${data.action}: ${data.error}`);
      });
    }

    return () => {
      if (socket) {
        socket.off("queue_command_success");
        socket.off("queue_command_error");
      }
    };
  }, [socket]);

  function handleAction(label: string) {
    if (socket) {
      socket.emit("trigger_queue_command", { action: label });
    } else {
      toast.error("Socket not connected. Command cannot be sent.");
    }
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-gray-900 text-lg font-bold">
          Queue Command Center
        </h2>
        <AnimatePresence>
          {activated && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
              style={{ background: "#EEF9F5", color: "#3AB58F", fontSize: "12px", fontWeight: 600 }}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {activated} triggered
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-4 gap-5">
        {actions.map((action, i) => {
          const Icon = action.icon;
          const isActive = activated === action.label;
          return (
            <motion.button
              key={action.label}
              onClick={() => handleAction(action.label)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.35 }}
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="flex flex-col items-center gap-2 p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-transparent"
              style={{
                background: isActive ? action.color : "white",
                borderColor: isActive ? action.color : "#F3F4F6",
                boxShadow: isActive ? `0 4px 20px ${action.color}40` : "0 1px 4px rgba(0,0,0,0.06)",
              }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-1"
                style={{
                  background: isActive ? "rgba(255,255,255,0.25)" : action.bg,
                }}
              >
                <Icon
                  className="w-5 h-5"
                  style={{ color: isActive ? "white" : action.color }}
                />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold leading-tight" style={{ color: isActive ? "white" : "#1F2937" }}>
                  {action.label}
                </p>
                <p className="text-xs mt-1" style={{ color: isActive ? "rgba(255,255,255,0.75)" : "#6B7280" }}>
                  {action.desc}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
