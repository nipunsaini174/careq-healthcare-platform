"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Calendar, Clock, FileText, Bell, AlertCircle, Info, AlertTriangle } from "lucide-react";
import api from "@/services/api/axios";

type NotificationType = "All" | "Appointments" | "Queue" | "Reports" | "Broadcast";

export default function Notifications() {
  const [activeTab, setActiveTab] = useState<NotificationType>("All");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get("/notifications");
        const formatted = res.data.map((n: any) => {
          let type = "Broadcast";
          let icon = Bell;
          
          if (n.category?.toLowerCase() === "appointment") { type = "Appointments"; icon = Calendar; }
          else if (n.category?.toLowerCase() === "queue") { type = "Queue"; icon = Clock; }
          else if (n.category?.toLowerCase() === "report") { type = "Reports"; icon = FileText; }
          
          let color = "blue";
          if (n.severity === "warning") { color = "orange"; icon = AlertTriangle; }
          else if (n.severity === "emergency") { color = "red"; icon = AlertCircle; }
          else if (n.severity === "info") { color = "blue"; icon = Info; }

          return {
            id: n.notification_id,
            type,
            icon,
            title: n.title,
            message: n.message,
            time: new Date(n.created_at).toLocaleString(),
            read: n.is_read,
            color,
          };
        });
        setNotifications(formatted);
      } catch (error) {
        console.error("Failed to load notifications:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const tabs: NotificationType[] = ["All", "Appointments", "Queue", "Reports", "Broadcast"];

  const filteredNotifications =
    activeTab === "All"
      ? notifications
      : notifications.filter((n) => n.type === activeTab);

  const getIconColor = (color: string) => {
    switch (color) {
      case "blue":
        return "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400";
      case "purple":
        return "bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400";
      case "orange":
        return "bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400";
      case "green":
        return "bg-green-50 text-green-600 dark:bg-emerald-500/15 dark:text-emerald-400";
      case "red":
        return "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400";
      default:
        return "bg-gray-50 text-gray-600 dark:bg-[#223040] dark:text-[#94A3B8]";
    }
  };

  return (
    <div className="min-h-full bg-gray-50 dark:bg-[#0B0F14] pb-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-400 to-teal-500 dark:from-[#064E3B] dark:via-[#047857] dark:to-[#065F46] pt-12 pb-8 px-6 rounded-b-[40px]">
        <motion.h1
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-2xl font-bold text-white mb-2"
        >
          Notifications
        </motion.h1>
        <p className="text-white/80">Stay updated with your health</p>
      </div>

      {/* Tabs */}
      <div className="px-6 py-4 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-all ${
                activeTab === tab
                  ? "bg-teal-500 dark:bg-emerald-600 text-white shadow-sm"
                  : "bg-white dark:bg-[#1A2332] text-gray-700 dark:text-[#CBD5E1] border border-gray-100 dark:border-[#2A3A4E]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="px-6 pb-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
             <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
          </div>
        ) : filteredNotifications.length > 0 ? (
          <div className="space-y-3">
            {filteredNotifications.map((notification, index) => {
              const Icon = notification.icon;
              return (
                <motion.div
                  key={notification.id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-white dark:bg-[#1A2332] border border-gray-100 dark:border-[#2A3A4E] rounded-2xl p-4 shadow-sm dark:shadow-black/20 ${
                    !notification.read ? "border-l-4 border-l-teal-500 dark:border-l-emerald-500" : ""
                  }`}
                >
                  <div className="flex items-start">
                    <div
                      className={`w-10 h-10 ${getIconColor(
                        notification.color
                      )} rounded-xl flex items-center justify-center mr-3 flex-shrink-0`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h3
                          className={`text-sm ${
                            !notification.read
                              ? "text-gray-900 dark:text-white font-semibold"
                              : "text-gray-700 dark:text-[#CBD5E1] font-medium"
                          }`}
                        >
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-teal-500 dark:bg-emerald-400 rounded-full ml-2 flex-shrink-0 mt-1.5"></span>
                        )}
                      </div>

                      <p
                        className={`text-sm mb-2 ${
                          !notification.read
                            ? "text-gray-600 dark:text-[#94A3B8]"
                            : "text-gray-500 dark:text-[#64748B]"
                        }`}
                      >
                        {notification.message}
                      </p>

                      <p className="text-xs text-gray-400 dark:text-[#64748B]">{notification.time}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 bg-gray-100 dark:bg-[#223040] rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-gray-400 dark:text-[#64748B]" />
            </div>
            <p className="text-gray-500 dark:text-[#94A3B8]">No notifications in this category</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

