"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, AlertTriangle, CheckCircle2, Info, User,
  Pill, Activity, DollarSign, X, Clock, ShieldAlert
} from "lucide-react";
import api from "@/services/api";
import { useSocket } from "@/contexts/SocketContext";
import { Notification } from "@/types";
import { toast } from "sonner";

const iconMap: Record<string, any> = {
  emergency: AlertTriangle,
  inventory: Pill,
  queue: Activity,
  patient: User,
  billing: DollarSign,
  doctor: User,
  lab: FlaskConicalIcon,
  system: Info,
};

function FlaskConicalIcon(props: any) {
  return <Bell {...props} />; // fallback
}

const colorConfig: Record<string, { bg: string; color: string }> = {
  emergency: { bg: "#FEF3F2", color: "#EF4444" },
  inventory: { bg: "#FFF4EC", color: "#F97316" },
  queue: { bg: "#FEFCE8", color: "#EAB308" },
  patient: { bg: "#EEF9F5", color: "#3AB58F" },
  billing: { bg: "#EEF3FF", color: "#6366F1" },
  doctor: { bg: "#EEF9F5", color: "#3AB58F" },
  lab: { bg: "#FEF3F2", color: "#EF4444" },
  system: { bg: "#F5F5F5", color: "#9CA3AF" },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const { socket } = useSocket();

  const fetchNotifications = async () => {
    try {
      const res = await api.get<Notification[]>("/notifications");
      setNotifications(res.data);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    if (socket) {
      socket.on("notification_created", (newNotif: Notification) => {
        setNotifications((prev) => [newNotif, ...prev]);
      });
      socket.on("notification_updated", (updatedNotif: Notification) => {
        setNotifications((prev) => prev.map((n) => (n.id === updatedNotif.id ? updatedNotif : n)));
      });
      socket.on("notifications_all_read", () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      });
      socket.on("notification_deleted", ({ id }) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      });
    }

    return () => {
      if (socket) {
        socket.off("notification_created");
        socket.off("notification_updated");
        socket.off("notifications_all_read");
        socket.off("notification_deleted");
      }
    };
  }, [socket]);

  const markAllRead = async () => {
    try {
      await api.put("/notifications/read-all");
      toast.success("All notifications marked as read.");
    } catch (err) {
      console.error("Failed to clear notifications:", err);
    }
  };

  const markRead = async (id: number) => {
    try {
      await api.put(`/notifications/${id}/read`);
    } catch (err) {
      console.error("Failed to read notification:", err);
    }
  };

  const dismiss = async (id: number) => {
    try {
      await api.delete(`/notifications/${id}`);
      toast.success("Notification dismissed.");
    } catch (err) {
      console.error("Failed to dismiss notification:", err);
    }
  };

  const filtered = notifications.filter((n) => {
    return filter === "All" || n.type.toLowerCase() === filter.toLowerCase();
  });

  const unread = notifications.filter(n => !n.read).length;
  const typeFilters = ["All", "Emergency", "Inventory", "Queue", "Patient", "Billing", "Doctor", "System", "Lab"];

  return (
    <div className="flex flex-col gap-5 pt-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 font-bold text-lg">Notifications</h1>
          <p className="text-gray-500 mt-0.5 text-xs">
            {unread} unread notifications · {notifications.length} total warnings logged
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={markAllRead} className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all text-xs font-bold bg-white cursor-pointer">
            Mark All Read
          </button>
          <button onClick={() => toast.info("Configure alerts settings coming soon.")} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white hover:opacity-90 transition-all text-xs font-bold cursor-pointer" style={{ background: "linear-gradient(135deg, #58D0A7, #3AB58F)" }}>
            <Bell className="w-4 h-4" /> Configure Alerts
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Unread Warnings", value: unread.toString(), color: "#EF4444", bg: "#FEF3F2" },
          { label: "Emergency Critical", value: notifications.filter(n => n.type === "emergency").length.toString(), color: "#EF4444", bg: "#FEF3F2" },
          { label: "Inventory Stock Alerts", value: notifications.filter(n => n.type === "inventory").length.toString(), color: "#F97316", bg: "#FFF4EC" },
          { label: "Total Logged Today", value: notifications.length.toString(), color: "#3AB58F", bg: "#EEF9F5" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p style={{ fontSize: "28px", fontWeight: 700, color: s.color, lineHeight: 1.1 }}>{s.value}</p>
              <p className="text-gray-500 mt-0.5 text-xs font-bold">{s.label}</p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
              <Bell className="w-4 h-4" style={{ color: s.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        {typeFilters.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className="px-3 py-1.5 rounded-lg transition-all whitespace-nowrap text-xs font-bold cursor-pointer" style={{ background: filter === f ? "linear-gradient(135deg, #58D0A7, #3AB58F)" : "#F3F4F6", color: filter === f ? "white" : "#6B7280" }}>
            {f}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="flex flex-col gap-2">
        {loading ? (
          <div className="bg-white p-10 rounded-2xl text-center text-gray-400 text-sm">Loading logs...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl text-center text-gray-400 text-sm">No notifications found in this category.</div>
        ) : (
          <AnimatePresence>
            {filtered.map((n, i) => {
              const IconComponent = iconMap[n.type] || Info;
              const clr = colorConfig[n.type] || colorConfig.system;
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => !n.read && markRead(n.id)}
                  className={`bg-white rounded-2xl p-4 shadow-sm border ${n.read ? "border-gray-100" : "border-green-200 bg-green-50/10"} flex gap-4 items-start cursor-pointer hover:border-gray-300 transition-colors`}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: clr.bg }}>
                    <IconComponent className="w-5 h-5" style={{ color: clr.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-gray-900 font-bold text-xs">{n.title} {!n.read && <span className="ml-2 px-1.5 py-0.5 bg-green-500 text-white rounded text-[8px] font-bold uppercase">New</span>}</h3>
                      <span className="text-[10px] text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {n.time}</span>
                    </div>
                    <p className="text-gray-500 text-xs leading-relaxed">{n.message}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); dismiss(n.id); }} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center flex-shrink-0 cursor-pointer">
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
