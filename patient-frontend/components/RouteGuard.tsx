"use client";

import { useEffect, useState } from "react";
import { setCookie } from "cookies-next";

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("healthflow-access-token");
      if (!token) {
        const dummyToken = "demo-patient-token-2026";
        const dummyUser = {
          id: "patient-demo-01",
          full_name: "Rahul Verma",
          email: "patient@careq.demo",
          role: "PATIENT"
        };
        localStorage.setItem("healthflow-access-token", dummyToken);
        localStorage.setItem("user", JSON.stringify(dummyUser));
        setCookie("healthflow-access-token", dummyToken, { maxAge: 60 * 60 * 24, path: "/" });
      }
    }
    setIsAuthorized(true);
  }, []);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
