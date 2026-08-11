"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const hasCookie = document.cookie.includes("healthflow-access-token=");
    const hasLocal = typeof window !== "undefined" && !!localStorage.getItem("healthflow-access-token");
    if (!hasCookie && !hasLocal) {
      window.location.href = "/login"; // More robust than router.push for static exports
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

  if (!isAuthorized) {
    return <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F14]" />; // Empty background while checking
  }

  return <>{children}</>;
}
