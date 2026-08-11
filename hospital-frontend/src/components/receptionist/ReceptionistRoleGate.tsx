"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

function dashboardForRole(role: string | null | undefined) {
  const r = (role || "").toLowerCase();
  if (r === "admin") return "/dashboard/admin";
  if (r === "receptionist") return "/dashboard/receptionist";
  if (r === "doctor") return "/dashboard/doctor";
  return "/login";
}

/** Redirect users who opened receptionist pages with the wrong role token. */
export function ReceptionistRoleGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || !user?.role) return;
    if (user.role.toLowerCase() !== "receptionist") {
      router.replace(dashboardForRole(user.role));
    }
  }, [user, loading, router]);

  if (loading) return null;
  if (user?.role && user.role.toLowerCase() !== "receptionist") return null;

  return children;
}
