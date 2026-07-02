"use client";
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Users,
  LayoutList,
  Clock,
  Stethoscope,
  Ticket,
  CalendarCheck,
} from 'lucide-react';
import api from '@/services/api';
import { useSocket } from '@/contexts/SocketContext';

const INITIAL_STATS = {
  todaysAppointments: 0,
  todaysPatients: 0,
  activeTokens: 0,
  waitingTokens: 0,
  completedToday: 0,
};

/**
 * Events that should re-fetch the receptionist KPI strip. Booking an
 * appointment (`appointment_created`) and cancelling one
 * (`appointment_updated`) both move several of these counters at
 * once, and `queue_updated` covers manual token state changes from
 * other receptionist UIs.
 */
const REFRESH_EVENTS = [
  'appointment_created',
  'appointment_updated',
  'queue_updated',
  'patient_created',
];

export default function KPIStats() {
  const [stats, setStats] = useState(INITIAL_STATS);
  const [loaded, setLoaded] = useState(false);
  const { socket } = useSocket();

  // Keep a stable handler reference across socket reconnects.
  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/receptionist/dashboard-stats');
      if (res.data?.data) setStats({ ...INITIAL_STATS, ...res.data.data });
    } catch (err) {
      console.error('Failed to load receptionist dashboard stats:', err);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (!socket) return;
    REFRESH_EVENTS.forEach((evt) => socket.on(evt, fetchStats));
    return () => {
      REFRESH_EVENTS.forEach((evt) => socket.off(evt, fetchStats));
    };
  }, [socket, fetchStats]);

  // Display values come straight off `stats`; placeholders that we
  // don't yet have backend support for are clearly marked (`—`).
  const kpis = [
    {
      label: "Today's Patients",
      value: stats.todaysPatients.toString(),
      trend: stats.todaysPatients > 0 ? 'Live' : 'No patients yet',
      isPositive: true,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Active Tokens',
      value: stats.activeTokens.toString(),
      trend: stats.waitingTokens > 0 ? `${stats.waitingTokens} waiting` : 'No queue',
      isPositive: stats.activeTokens > 0,
      icon: LayoutList,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      label: "Today's Appointments",
      value: stats.todaysAppointments.toString(),
      trend: 'Live',
      isPositive: true,
      icon: CalendarCheck,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
    },
    {
      label: 'Doctors Available',
      value: '—',
      trend: 'Pending wiring',
      isPositive: false,
      icon: Stethoscope,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Tokens Served',
      value: stats.completedToday.toString(),
      trend: 'Today',
      isPositive: true,
      icon: Ticket,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: 'Avg Wait Time',
      value: '—',
      trend: 'Pending wiring',
      isPositive: false,
      icon: Clock,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {kpis.map((kpi, idx) => {
        const Icon = kpi.icon;
        return (
          <div
            key={idx}
            className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${kpi.bg} ${kpi.color}`}>
              <Icon size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 truncate">{kpi.label}</p>
              <h3 className="text-2xl font-black text-gray-900 leading-none mb-2">
                {loaded ? kpi.value : '…'}
              </h3>
              <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md inline-block ${kpi.isPositive ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                {kpi.trend}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
