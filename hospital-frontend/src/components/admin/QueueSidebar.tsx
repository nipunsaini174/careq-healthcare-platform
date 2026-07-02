"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Activity, Users, Clock, BarChart3 } from "lucide-react";
import api from "@/services/api";
import { useSocket } from "@/contexts/SocketContext";
import { Queue } from "@/types";

const REFRESH_EVENTS = [
  "queue_updated",
  "appointment_created",
  "appointment_updated",
] as const;

export function QueueSidebar() {
  const [queues, setQueues] = useState<Queue[]>([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  const fetchQueues = useCallback(async () => {
    try {
      const res = await api.get<Queue[]>("/queues");
      setQueues(res.data);
    } catch (err) {
      console.error("Failed to fetch queues load:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced refetch — a burst of bookings triggers one call, not many.
  const debouncedFetch = useCallback(
    (() => {
      let timer: ReturnType<typeof setTimeout> | null = null;
      return () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          timer = null;
          fetchQueues();
        }, 400);
      };
    })(),
    [fetchQueues]
  );

  useEffect(() => {
    fetchQueues();
  }, [fetchQueues]);

  useEffect(() => {
    if (!socket) return;
    REFRESH_EVENTS.forEach((evt) => socket.on(evt, debouncedFetch));
    return () => {
      REFRESH_EVENTS.forEach((evt) => socket.off(evt, debouncedFetch));
    };
  }, [socket, debouncedFetch]);

  // Live stats derived from the actual queue data — no hardcoded values.
  const stats = useMemo(() => {
    const totalWaiting = queues.reduce((s, q) => s + (q.waiting ?? 0), 0);
    const totalActive = queues.reduce((s, q) => s + (q.max ?? 0), 0);

    return [
      {
        label: "Total Waiting",
        value: String(totalWaiting),
        icon: Clock,
        color: "#F97316",
      },
      {
        label: "Active Queues",
        value: String(queues.filter((q) => q.status === "Active").length),
        icon: Activity,
        color: "#6366F1",
      },
      {
        label: "Total Active",
        value: String(totalActive),
        icon: Users,
        color: "#3AB58F",
      },
      {
        label: "Queue Types",
        value: String(queues.length),
        icon: BarChart3,
        color: "#3B82F6",
      },
    ];
  }, [queues]);

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="bg-white rounded-3xl shadow-lg p-6 flex-1">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-900 text-lg font-bold">Live Queue Load</h3>
          <Link
            href="/patients"
            className="text-green-600 hover:underline"
            style={{ fontSize: "11px", fontWeight: 600 }}
          >
            Manage →
          </Link>
        </div>
        <div className="flex flex-col gap-3">
          {loading ? (
            <p className="text-gray-400 text-xs">Syncing queue levels...</p>
          ) : queues.length === 0 ? (
            <p className="text-gray-400 text-xs">No active queues</p>
          ) : (
            queues.map((q) => {
              const pct = q.max > 0 ? Math.round((q.waiting / q.max) * 100) : 0;
              return (
                <div key={q.id}>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600" style={{ fontSize: "12px", fontWeight: 500 }}>
                      {q.label} {q.status !== "Active" ? `(${q.status})` : ""}
                    </span>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: q.color }}>
                      {q.waiting} waiting
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(pct, 100)}%`,
                        background: q.status === "Closed" ? "#D1D5DB" : q.color,
                      }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-3xl shadow-lg p-6 flex flex-col gap-2">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-1" style={{ background: `${s.color}20` }}>
                <Icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <p className="text-gray-900 text-2xl font-bold leading-tight">{s.value}</p>
              <p className="text-gray-500 text-sm font-medium">{s.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

