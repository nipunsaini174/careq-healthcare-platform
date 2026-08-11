"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  receptionistApi,
  type ReceptionistProfile,
  profileInitials,
  avatarUrl,
  formatRoleLabel,
  profileFromAuthUser,
} from "@/services/receptionistApi";
import { useAuth } from "@/contexts/AuthContext";

interface ReceptionistProfileContextValue {
  profile: ReceptionistProfile | null;
  /** Profile from API, or auth cookie fallback for the settings form. */
  effectiveProfile: ReceptionistProfile | null;
  loading: boolean;
  saving: boolean;
  loadError: string | null;
  refreshProfile: () => Promise<void>;
  updateProfile: (payload: { name: string; phone?: string }) => Promise<ReceptionistProfile>;
  displayName: string;
  displayRole: string;
  initials: string;
  avatar: string;
}

const ReceptionistProfileContext = createContext<ReceptionistProfileContextValue | undefined>(
  undefined
);

export function ReceptionistProfileProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, updateUser } = useAuth();
  const [profile, setProfile] = useState<ReceptionistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const authFallback = useMemo(() => profileFromAuthUser(user), [user]);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoadError(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setLoadError(null);
      const data = await receptionistApi.getMyProfile();
      setProfile(data);
      updateUser({ displayName: data.name, email: data.email });
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { status?: number; data?: { error?: string } };
        message?: string;
      };
      const status = axiosErr.response?.status;
      let message =
        axiosErr.response?.data?.error ||
        axiosErr.message ||
        "Failed to load profile";

      if (status === 403) {
        message = "Your account is not a receptionist. Please log out and sign in with Receptionist selected.";
      } else if (status === 500 || status === 502 || status === 503) {
        message = "Could not reach the server. Make sure the backend is running on port 5000.";
      }

      if (process.env.NODE_ENV === "development") {
        console.warn("Receptionist profile fetch failed:", message);
      }
      setLoadError(message);
      if (authFallback) {
        setProfile(authFallback);
      }
    } finally {
      setLoading(false);
    }
  }, [user, updateUser, authFallback]);

  useEffect(() => {
    if (authLoading) return;
    refreshProfile();
  }, [authLoading, refreshProfile]);

  const updateProfile = useCallback(
    async (payload: { name: string; phone?: string }) => {
      setSaving(true);
      try {
        const updated = await receptionistApi.updateMyProfile(payload);
        setProfile(updated);
        setLoadError(null);
        updateUser({ displayName: updated.name, email: updated.email });
        return updated;
      } finally {
        setSaving(false);
      }
    },
    [updateUser]
  );

  const effectiveProfile = profile ?? authFallback;
  const displayName = effectiveProfile?.name || user?.displayName || "Receptionist";
  const displayRole = formatRoleLabel(effectiveProfile?.role || "receptionist");
  const initials = profileInitials(displayName);
  const avatar = avatarUrl(displayName);

  return (
    <ReceptionistProfileContext.Provider
      value={{
        profile,
        effectiveProfile,
        loading: authLoading || loading,
        saving,
        loadError,
        refreshProfile,
        updateProfile,
        displayName,
        displayRole,
        initials,
        avatar,
      }}
    >
      {children}
    </ReceptionistProfileContext.Provider>
  );
}

export function useReceptionistProfile() {
  const ctx = useContext(ReceptionistProfileContext);
  if (!ctx) {
    throw new Error("useReceptionistProfile must be used within ReceptionistProfileProvider");
  }
  return ctx;
}
