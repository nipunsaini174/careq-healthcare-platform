"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  ChevronDown,
  Clock,
  Stethoscope,
  FlaskConical,
  CheckCircle2,
  UserX,
  Filter,
} from "lucide-react";
import api from "@/services/api";
import { useSocket } from "@/contexts/SocketContext";

type Range = "today" | "7d" | "30d";

const RANGE_LABELS: Record<Range, string> = {
  today: "Today",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
};

const RANGE_OPTIONS: Range[] = ["today", "7d", "30d"];

interface KpiData {
  appointmentsTotal: number;
  admitted: number;
  waiting: number;
  consultation: number;
  labQueue: number;
  completed: number;
  noShow: number;
}

const INITIAL_KPIS: KpiData = {
  appointmentsTotal: 0,
  admitted: 0,
  waiting: 0,
  consultation: 0,
  labQueue: 0,
  completed: 0,
  noShow: 0,
};

const SOCKET_EVENTS = [
  "patient_created",
  "patient_updated",
  "patient_deleted",
  "appointment_created",
  "appointment_updated",
  "queue_updated",
  "lab_test_created",
  "lab_test_updated",
] as const;

export function KpiCards() {
  const [kpis, setKpis] = useState<KpiData>(INITIAL_KPIS);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>("today");
  const [menuOpen, setMenuOpen] = useState(false);
  const { socket } = useSocket();

  // Track latest range outside the socket effect so we don't rebind
  // every handler when the user toggles the filter.
  const rangeRef = useRef(range);
  useEffect(() => {
    rangeRef.current = range;
  }, [range]);

  const menuRef = useRef<HTMLDivElement>(null);

  const fetchKpis = async (currentRange: Range) => {
    try {
      const res = await api.get<KpiData>(`/reports/dashboard-kpis`, {
        params: { range: currentRange },
      });
      setKpis(res.data);
    } catch (err) {
      console.error("Failed to load dashboard KPIs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchKpis(range);
  }, [range]);

  useEffect(() => {
    if (!socket) return;
    const refresh = () => fetchKpis(rangeRef.current);
    SOCKET_EVENTS.forEach((evt) => socket.on(evt, refresh));
    return () => {
      SOCKET_EVENTS.forEach((evt) => socket.off(evt, refresh));
    };
  }, [socket]);

  useEffect(() => {
    if (!menuOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", onMouseDown);
    return () => window.removeEventListener("mousedown", onMouseDown);
  }, [menuOpen]);

  type Card = {
    icon: typeof Clock;
    value: number;
    label: string;
    trend: string;
    trendUp: boolean;
    iconBg: string;
    iconColor: string;
    accentColor: string;
    rangeFilter?: true;
    progressMax: number;
  };

  // Progress-bar denominators are tuned per card type so the fill
  // looks meaningful regardless of magnitude. Appointments scale with
  // the selected window.
  const appointmentsProgressMax =
    range === "today" ? 50 : range === "7d" ? 300 : 1500;

  const cards: Card[] = [
    {
      icon: CalendarDays,
      value: kpis.appointmentsTotal,
      label: "Total Appointments",
      trend: "+12",
      trendUp: true,
      iconBg: "#EEF9F5",
      iconColor: "#3AB58F",
      accentColor: "#3AB58F",
      rangeFilter: true,
      progressMax: appointmentsProgressMax,
    },
    {
      icon: Clock,
      value: kpis.waiting,
      label: "Currently Waiting in Hospital",
      trend: "+8",
      trendUp: false,
      iconBg: "#FFF4EC",
      iconColor: "#F97316",
      accentColor: "#F97316",
      progressMax: 300,
    },
    {
      icon: Stethoscope,
      value: kpis.consultation,
      label: "Under Consultation",
      trend: "-3",
      trendUp: true,
      iconBg: "#EEF3FF",
      iconColor: "#6366F1",
      accentColor: "#6366F1",
      progressMax: 100,
    },
    {
      icon: CheckCircle2,
      value: kpis.completed,
      label: "Completed Today",
      trend: "+47",
      trendUp: true,
      iconBg: "#EEF9F5",
      iconColor: "#22C55E",
      accentColor: "#22C55E",
      progressMax: 900,
    },
    {
      icon: FlaskConical,
      value: kpis.labQueue,
      label: "In Lab Queue",
      trend: "+5",
      trendUp: false,
      iconBg: "#FEF3F2",
      iconColor: "#EF4444",
      accentColor: "#EF4444",
      progressMax: 100,
    },
    {
      icon: UserX,
      value: kpis.noShow,
      label: "No Shows",
      trend: "-4",
      trendUp: true,
      iconBg: "#F5F5F5",
      iconColor: "#9CA3AF",
      accentColor: "#6B7280",
      progressMax: 100,
    },
  ];

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-gray-900 text-lg font-bold">
          Operations Overview
        </h2>
        <span
          className="px-3 py-1 rounded-full text-xs font-semibold"
          style={{ background: "#EEF9F5", color: "#3AB58F" }}
        >
          {loading ? "Syncing..." : "Live · Updated just now"}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5, type: "spring", stiffness: 100 }}
              className="bg-white rounded-3xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col gap-3 relative"
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: card.iconBg }}
                >
                  <Icon className="w-5 h-5" style={{ color: card.iconColor }} />
                </div>

                {card.rangeFilter ? (
                  <div ref={menuRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setMenuOpen((v) => !v)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 transition-colors"
                      aria-haspopup="menu"
                      aria-expanded={menuOpen}
                    >
                      <Filter className="w-3 h-3" />
                      <span>{RANGE_LABELS[range]}</span>
                      <ChevronDown
                        className={`w-3 h-3 transition-transform ${
                          menuOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    <AnimatePresence>
                      {menuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.15 }}
                          role="menu"
                          className="absolute right-0 top-full mt-1.5 z-20 w-40 rounded-xl bg-white shadow-lg border border-gray-100 overflow-hidden"
                        >
                          {RANGE_OPTIONS.map((r) => {
                            const active = r === range;
                            return (
                              <button
                                key={r}
                                type="button"
                                role="menuitemradio"
                                aria-checked={active}
                                onClick={() => {
                                  setRange(r);
                                  setMenuOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                                  active
                                    ? "bg-emerald-50 text-emerald-700 font-semibold"
                                    : "text-gray-700 hover:bg-gray-50"
                                }`}
                              >
                                {RANGE_LABELS[r]}
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <span
                    className="px-2.5 py-1 rounded-full text-xs font-bold shadow-sm"
                    style={{
                      background: card.trendUp ? "#EEF9F5" : "#FEF3F2",
                      color: card.trendUp ? "#22C55E" : "#EF4444",
                    }}
                  >
                    {card.trend}
                  </span>
                )}
              </div>
              <div>
                <p className="text-gray-900 text-3xl font-bold leading-tight">
                  {card.value}
                </p>
                <p className="text-gray-500 mt-1 text-sm font-medium">
                  {card.label}
                </p>
              </div>
              <div className="h-1 rounded-full bg-gray-100">
                <div
                  className="h-1 rounded-full transition-[width] duration-500"
                  style={{
                    width: `${Math.min((card.value / card.progressMax) * 100, 100)}%`,
                    background: card.accentColor,
                  }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
