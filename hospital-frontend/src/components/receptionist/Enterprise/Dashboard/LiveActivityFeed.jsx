"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Activity, CalendarCheck, UserPlus, Ban, Stethoscope, Clock } from 'lucide-react';
import api from '@/services/api';
import { useSocket } from '@/contexts/SocketContext';

const FEED_LIMIT = 15;

const STATUS_BADGE = {
  Upcoming: { label: 'Upcoming', cls: 'bg-blue-50 text-blue-700 border-blue-100' },
  Scheduled: { label: 'Scheduled', cls: 'bg-blue-50 text-blue-700 border-blue-100' },
  Waiting: { label: 'Waiting', cls: 'bg-amber-50 text-amber-700 border-amber-100' },
  'In Progress': { label: 'In Consult', cls: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
  Completed: { label: 'Completed', cls: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  Cancelled: { label: 'Cancelled', cls: 'bg-rose-50 text-rose-700 border-rose-100' },
  'No Show': { label: 'No Show', cls: 'bg-gray-100 text-gray-600 border-gray-200' },
};

function formatRelativeTime(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.round(diffMs / 1000);
  if (diffSec < 0) {
    // Future appointment — show the scheduled time of day instead.
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
  if (diffSec < 60) return 'just now';
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Live feed of the most recent appointment / queue events at the
 * authenticated receptionist's hospital.
 *
 * Data lifecycle:
 *   - On mount: GET /api/receptionist/queue-activity?limit=N
 *   - On `appointment_created`: prepend the payload (deduped by id)
 *   - On `appointment_updated`: patch the matching row's status; if
 *     no matching row in the current window, fall back to a refetch
 *     so the user sees the change even on a long-running tab.
 *   - On `queue_updated`: opportunistic refetch (covers manual
 *     status changes from other tabs/users).
 */
export default function LiveActivityFeed() {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const { socket } = useSocket();
  // A ref to the items lets socket handlers diff without re-binding
  // every render.
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const fetchFeed = useCallback(async () => {
    try {
      const res = await api.get('/receptionist/queue-activity', {
        params: { limit: FEED_LIMIT },
      });
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      setItems(list);
    } catch (err) {
      console.error('Failed to load queue activity:', err);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  useEffect(() => {
    if (!socket) return;

    const onCreated = (payload) => {
      if (!payload?.appointmentId) return;
      setItems((prev) => {
        if (prev.some((row) => row.appointmentId === payload.appointmentId)) return prev;
        const next = [
          {
            appointmentId: payload.appointmentId,
            patientId: payload.patientId,
            patientName: payload.patientName,
            doctorId: payload.doctorId,
            doctorName: payload.doctorName,
            department: payload.department,
            appointmentDate: payload.appointmentDate,
            appointmentStatus: payload.appointmentStatus,
            appointmentType: payload.appointmentType,
            token: payload.tokenId
              ? {
                  tokenId: payload.tokenId,
                  tokenCode: payload.tokenCode,
                  queuePosition: payload.queuePosition,
                  tokenStatus: payload.tokenStatus,
                }
              : null,
            _justAdded: true,
          },
          ...prev,
        ];
        return next.slice(0, FEED_LIMIT);
      });
      // Drop the flash animation marker after the highlight settles.
      setTimeout(() => {
        setItems((prev) =>
          prev.map((row) =>
            row.appointmentId === payload.appointmentId ? { ...row, _justAdded: false } : row
          )
        );
      }, 1500);
    };

    const onUpdated = (payload) => {
      if (!payload?.appointmentId) return;
      const existing = itemsRef.current.some((row) => row.appointmentId === payload.appointmentId);
      if (!existing) {
        fetchFeed();
        return;
      }
      setItems((prev) =>
        prev.map((row) =>
          row.appointmentId === payload.appointmentId
            ? {
                ...row,
                appointmentStatus: payload.appointmentStatus ?? row.appointmentStatus,
                token: payload.tokenStatus
                  ? { ...(row.token || {}), tokenStatus: payload.tokenStatus }
                  : row.token,
              }
            : row
        )
      );
    };

    socket.on('appointment_created', onCreated);
    socket.on('appointment_updated', onUpdated);
    socket.on('queue_updated', fetchFeed);
    return () => {
      socket.off('appointment_created', onCreated);
      socket.off('appointment_updated', onUpdated);
      socket.off('queue_updated', fetchFeed);
    };
  }, [socket, fetchFeed]);

  const isEmpty = loaded && items.length === 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
      <header className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Activity size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Live Queue Activities</h3>
            <p className="text-xs text-gray-500">Streams every booking and token change in real time</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          LIVE
        </span>
      </header>

      <div className="divide-y divide-gray-50 max-h-[480px] overflow-y-auto">
        {!loaded &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={`skel-${i}`} className="px-5 py-3 flex items-center gap-4 animate-pulse">
              <div className="w-9 h-9 rounded-lg bg-gray-100" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/2 bg-gray-100 rounded" />
                <div className="h-3 w-1/3 bg-gray-50 rounded" />
              </div>
            </div>
          ))}

        {isEmpty && (
          <div className="px-5 py-10 text-center text-sm text-gray-500">
            No queue activity yet. When a patient books an appointment it will appear here instantly.
          </div>
        )}

        {items.map((row) => {
          const cancelled = row.appointmentStatus === 'Cancelled' || row.token?.tokenStatus === 'Cancelled';
          const statusInfo = STATUS_BADGE[row.appointmentStatus] ?? STATUS_BADGE.Upcoming;
          const Icon = cancelled ? Ban : row.appointmentStatus === 'Completed' ? CalendarCheck : UserPlus;
          const iconWrap = cancelled
            ? 'bg-rose-50 text-rose-600'
            : row.appointmentStatus === 'Completed'
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-blue-50 text-blue-600';

          return (
            <div
              key={row.appointmentId}
              className={`px-5 py-3 flex items-start gap-4 transition-colors ${row._justAdded ? 'bg-emerald-50/60' : 'hover:bg-gray-50/60'}`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${iconWrap}`}>
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {row.patientName}
                  </p>
                  <span className="text-[11px] text-gray-500 flex-shrink-0 inline-flex items-center gap-1">
                    <Clock size={10} />
                    {formatRelativeTime(row.appointmentDate)}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-0.5 truncate">
                  <Stethoscope className="inline mr-1 align-text-bottom" size={12} />
                  {row.doctorName} <span className="text-gray-400">·</span> {row.department}
                </p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${statusInfo.cls}`}>
                    {statusInfo.label}
                  </span>
                  {row.token?.tokenCode && (
                    <span className="text-[10px] font-mono font-bold text-gray-600 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md">
                      {row.token.tokenCode}
                      {typeof row.token.queuePosition === 'number' && (
                        <span className="text-gray-400 ml-1">· #{row.token.queuePosition}</span>
                      )}
                    </span>
                  )}
                  {row.appointmentType?.startsWith('other:') && (
                    <span className="text-[10px] text-gray-500">For someone else</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
