"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function RouteGuard() {
  const router = useRouter();

  useEffect(() => {
    const hasToken = document.cookie.includes("healthflow-access-token=");
    if (!hasToken) {
      router.push("/login");
    }
  }, [router]);

  return null;
}
