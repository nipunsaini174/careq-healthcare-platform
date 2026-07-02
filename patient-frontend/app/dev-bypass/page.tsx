"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { setCookie } from "cookies-next";

/**
 * DEVELOPMENT BYPASS PAGE
 * Visit /dev-bypass on your phone to automatically log in with a dummy session
 */
export default function DevBypassPage() {
  const router = useRouter();

  useEffect(() => {
    // 1. Create a dummy token and user
    const dummyToken = "dev-bypass-token-123";
    const dummyUser = {
      id: "dev-user-id",
      full_name: "Dhruv Raj (Dev)",
      email: "dev@example.com",
      role: "PATIENT"
    };

    // 2. Set cookies and localStorage to simulate a real login
    setCookie('healthflow-access-token', dummyToken, { maxAge: 60 * 60 * 24, path: '/' });
    setCookie('user', JSON.stringify(dummyUser), { maxAge: 60 * 60 * 24, path: '/' });

    if (typeof window !== "undefined") {
      localStorage.setItem("healthflow-access-token", dummyToken);
      localStorage.setItem("user", JSON.stringify(dummyUser));
    }

    // 3. Redirect to the home page
    setTimeout(() => {
      router.push("/app/home");
    }, 500);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-teal-500 text-white p-8 text-center">
      <div>
        <h1 className="text-3xl font-bold mb-4">Development Bypass</h1>
        <p className="text-lg opacity-90 mb-8">Setting up your session and taking you to the app...</p>
        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
}
