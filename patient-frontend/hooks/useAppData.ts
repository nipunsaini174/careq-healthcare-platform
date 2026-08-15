"use client";

/**
 * useAppData — pre-wired React Query hooks for the patient app.
 *
 * Every hook reads from the cache warmed by AppDataProvider on login.
 * First render is INSTANT; background revalidation happens silently.
 *
 * Usage:
 *   const { data: profile, isLoading } = useProfile();
 *   const { data: appointments = [] }  = useAppointments();
 *   const { data: doctors = [] }       = useDoctors();
 *   const { data: hospitals = [] }     = useHospitals();
 *   const { data: specialties = [] }   = useSpecialties();
 */

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { patientApi, type ApiAppointment } from "@/services/api/patientApi";
import { doctorApi, type ApiBookingDoctor, type ApiSpecialty } from "@/services/api/doctorApi";
import { hospitalApi, type ApiHospital } from "@/services/api/hospitalApi";
import type { Patient } from "@/types";
import { QK } from "@/contexts/AppDataProvider";

// ── Read hooks ────────────────────────────────────────────────────────────────

export function useProfile() {
  return useQuery<Patient>({
    queryKey: QK.profile,
    queryFn: () => patientApi.getProfile(),
    // Gracefully return null so pages don't crash before token is present
    enabled: typeof window !== "undefined" && !!localStorage.getItem("healthflow-access-token"),
  });
}

export function useAppointments() {
  return useQuery<ApiAppointment[]>({
    queryKey: QK.appointments,
    queryFn: () => patientApi.getAppointments(),
    enabled: typeof window !== "undefined" && !!localStorage.getItem("healthflow-access-token"),
    refetchInterval: 5000, // 5s background sync fallback to guarantee live queue state freshness
    // Default to [] so callers don't need null checks
    initialData: undefined,
  });
}

export function useDoctors() {
  return useQuery<ApiBookingDoctor[]>({
    queryKey: QK.doctors,
    queryFn: () => doctorApi.getBookingDoctors(),
  });
}

export function useHospitals() {
  return useQuery<ApiHospital[]>({
    queryKey: QK.hospitals,
    queryFn: () => hospitalApi.getAll(),
  });
}

export function useSpecialties() {
  return useQuery<ApiSpecialty[]>({
    queryKey: QK.specialties,
    queryFn: () => doctorApi.getSpecialties(),
  });
}

// ── Mutation hooks ────────────────────────────────────────────────────────────
// Mutations optimistically update the cache then sync with the server.

export function useBookAppointment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: any) => patientApi.bookAppointment(payload),
    onSuccess: () => {
      // Appointments list changed — invalidate so home page refreshes
      qc.invalidateQueries({ queryKey: QK.appointments });
    },
  });
}

export function useCancelAppointment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (appointmentId: string) => patientApi.cancelAppointment(appointmentId),
    onMutate: async (appointmentId) => {
      // Optimistic update: mark cancelled instantly in UI
      await qc.cancelQueries({ queryKey: QK.appointments });
      const previous = qc.getQueryData<ApiAppointment[]>(QK.appointments);
      qc.setQueryData<ApiAppointment[]>(QK.appointments, (prev) =>
        (prev ?? []).map((a) =>
          a.appointment_id === appointmentId ? { ...a, status: "Cancelled" } : a
        )
      );
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      // Rollback on failure
      if (ctx?.previous) {
        qc.setQueryData(QK.appointments, ctx.previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: QK.appointments });
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: Partial<Patient>) => patientApi.updateProfile(payload),
    onSuccess: (updated) => {
      // Immediately update profile in cache
      qc.setQueryData(QK.profile, updated);
    },
  });
}
