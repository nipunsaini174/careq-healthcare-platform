"use client";

/**
 * AppDataProvider
 *
 * Wraps the app in a QueryClient that:
 *   1. Pre-fetches profile, appointments, doctors, hospitals and
 *      specialties THE MOMENT a user is authenticated.
 *   2. Keeps that data fresh for 60 s (staleTime) — navigating between
 *      pages is INSTANT because the cache is already warm.
 *   3. Wires socket events to surgical cache mutations so the UI
 *      updates in real-time without a full refetch.
 *
 * Import order: this provider must be inside the LayoutProvider
 * (reads isMobileView) but outside individual pages.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
} from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { patientApi } from "@/services/api/patientApi";
import { doctorApi, type ApiBookingDoctor } from "@/services/api/doctorApi";
import { hospitalApi } from "@/services/api/hospitalApi";
import {
  connectSocket,
  disconnectSocket,
  getSocket,
  type DirectoryDoctorPayload,
  type DirectoryDoctorDeleted,
} from "@/services/socket/socket";
import { setCurrentUserId } from "@/lib/people";

// ── Query keys ────────────────────────────────────────────────────────────────
// Centralised so every hook + socket handler shares the same key strings.
export const QK = {
  profile: ["patient", "profile"],
  appointments: ["patient", "appointments"],
  doctors: ["doctors"],
  hospitals: ["hospitals"],
  specialties: ["doctors", "specialties"],
} as const;

// ── Singleton QueryClient ─────────────────────────────────────────────────────
let _queryClient: QueryClient | null = null;

function getQueryClient(): QueryClient {
  if (!_queryClient) {
    _queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          // 60 s: navigating between pages does NOT refetch — data served from cache
          staleTime: 60 * 1000,
          // 5 min: cache survives unmounts (e.g. leaving home page and returning)
          gcTime: 5 * 60 * 1000,
          // Don't retry on 401/404 — those are permanent errors
          retry: (failureCount, error: any) => {
            if (error?.response?.status === 401) return false;
            if (error?.response?.status === 404) return false;
            return failureCount < 1;
          },
          refetchOnWindowFocus: false, // avoid double-fetch when switching tabs
        },
      },
    });
  }
  return _queryClient;
}

// ── Prefetch helper — run this right after login ──────────────────────────────
export async function prefetchAllUserData(qc: QueryClient) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("healthflow-access-token")
      : null;
  if (!token) return;

  // Fire ALL fetches in parallel — total time = slowest single request, not sum
  await Promise.allSettled([
    qc.prefetchQuery({ queryKey: QK.profile, queryFn: () => patientApi.getProfile() }),
    qc.prefetchQuery({ queryKey: QK.appointments, queryFn: () => patientApi.getAppointments() }),
    qc.prefetchQuery({ queryKey: QK.doctors, queryFn: () => doctorApi.getBookingDoctors() }),
    qc.prefetchQuery({ queryKey: QK.hospitals, queryFn: () => hospitalApi.getAll() }),
    qc.prefetchQuery({ queryKey: QK.specialties, queryFn: () => doctorApi.getSpecialties() }),
  ]);
}

// ── Socket ↔ Cache bridge ─────────────────────────────────────────────────────
// Keeps the cache live without full refetches.

function mapApiDoctorToCache(api: ApiBookingDoctor | DirectoryDoctorPayload) {
  return api;
}

function SocketCacheBridge() {
  const qc = useQueryClient();
  const bridgeInstalled = useRef(false);

  useEffect(() => {
    if (bridgeInstalled.current) return;
    bridgeInstalled.current = true;

    const socket = getSocket();

    // Doctor directory events — surgically update the doctors cache
    const onDoctorCreated = (doc: DirectoryDoctorPayload) => {
      qc.setQueryData<ApiBookingDoctor[]>(QK.doctors, (prev) => {
        if (!prev) return [doc as unknown as ApiBookingDoctor];
        if (prev.some((d) => d.id === doc.id)) return prev;
        return [...prev, doc as unknown as ApiBookingDoctor];
      });
      // Specialties counts changed — invalidate so chip bar refreshes
      qc.invalidateQueries({ queryKey: QK.specialties });
    };

    const onDoctorUpdated = (doc: DirectoryDoctorPayload) => {
      qc.setQueryData<ApiBookingDoctor[]>(QK.doctors, (prev) => {
        if (!prev) return;
        return prev.map((d) => (d.id === doc.id ? (doc as unknown as ApiBookingDoctor) : d));
      });
    };

    const onDoctorDeleted = ({ id }: DirectoryDoctorDeleted) => {
      qc.setQueryData<ApiBookingDoctor[]>(QK.doctors, (prev) =>
        prev ? prev.filter((d) => d.id !== id) : []
      );
      qc.invalidateQueries({ queryKey: QK.specialties });
    };

    const onDeptChanged = () => {
      // Department changes affect hospital.departments array — refetch hospitals
      qc.invalidateQueries({ queryKey: QK.hospitals });
      qc.invalidateQueries({ queryKey: QK.specialties });
    };

    // Queue / appointment updates — refresh appointments list
    const onQueueUpdate = () => {
      qc.invalidateQueries({ queryKey: QK.appointments });
    };

    socket.on("doctor_created", onDoctorCreated);
    socket.on("doctor_updated", onDoctorUpdated);
    socket.on("doctor_deleted", onDoctorDeleted);
    socket.on("department_created", onDeptChanged);
    socket.on("department_deleted", onDeptChanged);
    socket.on("queue:update", onQueueUpdate);
    socket.on("notification:new", onQueueUpdate);

    return () => {
      socket.off("doctor_created", onDoctorCreated);
      socket.off("doctor_updated", onDoctorUpdated);
      socket.off("doctor_deleted", onDoctorDeleted);
      socket.off("department_created", onDeptChanged);
      socket.off("department_deleted", onDeptChanged);
      socket.off("queue:update", onQueueUpdate);
      socket.off("notification:new", onQueueUpdate);
      bridgeInstalled.current = false;
    };
  }, [qc]);

  return null;
}

// ── Context for prefetch function ─────────────────────────────────────────────
interface AppDataContextType {
  prefetchAll: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextType>({
  prefetchAll: async () => {},
});

export const useAppDataActions = () => useContext(AppDataContext);

function parseJwt(token: string) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch (e) {
    return null;
  }
}

// ── Root Provider ─────────────────────────────────────────────────────────────
export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const qc = getQueryClient();

  // Connect socket and kick off prefetch on mount
  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("healthflow-access-token")
        : null;

    if (token) {
      const payload = parseJwt(token);
      if (payload && payload.userId) {
        setCurrentUserId(payload.userId);
      }
      
      // Connect socket with latest auth so real-time events start immediately
      connectSocket();
      // Prefetch all data so the first navigation is instant
      prefetchAllUserData(qc);
    }

    return () => {
      disconnectSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const prefetchAll = () => prefetchAllUserData(qc);

  return (
    <AppDataContext.Provider value={{ prefetchAll }}>
      <QueryClientProvider client={qc}>
        <SocketCacheBridge />
        {children}
      </QueryClientProvider>
    </AppDataContext.Provider>
  );
}

