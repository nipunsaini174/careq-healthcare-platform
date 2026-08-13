"use client";

import { useState } from "react";
import { setCookie, deleteCookie } from "cookies-next";

const DEMO_TOKEN = "demo-bypass-token-careq-2026";

function enterAsRole(role: "admin" | "receptionist" | "doctor") {
  const user = {
    user_id: "1",
    email: `${role}@careq.demo`,
    full_name: role === "admin" ? "Dr. Admin" : role === "receptionist" ? "Reception Staff" : "Dr. Sharma",
    role: role,
    phone: null,
  };

  deleteCookie("healthflow-admin-token", { path: "/" });
  deleteCookie("healthflow-receptionist-token", { path: "/" });
  deleteCookie("healthflow-doctor-token", { path: "/" });
  deleteCookie("admin_user", { path: "/" });
  deleteCookie("receptionist_user", { path: "/" });
  deleteCookie("doctor_user", { path: "/" });

  setCookie(`healthflow-${role}-token`, DEMO_TOKEN, { maxAge: 86400, path: "/" });
  setCookie(`${role}_user`, JSON.stringify(user), { maxAge: 86400, path: "/" });
  setCookie("healthflow-admin-token", DEMO_TOKEN, { maxAge: 86400, path: "/" });

  const routes: Record<string, string> = {
    admin: "/dashboard/admin",
    receptionist: "/dashboard/receptionist",
    doctor: "/dashboard/doctor",
  };

  window.location.href = routes[role];
}

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<"admin" | "receptionist" | "doctor" | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // BYPASS: Any email & password immediately logs in!
    const role = selectedRole || "admin";
    enterAsRole(role);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafb", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ background: "white", borderRadius: 24, padding: 36, maxWidth: 420, width: "100%", boxShadow: "0 10px 40px rgba(0,0,0,0.08)" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ width: 56, height: 56, background: "linear-gradient(135deg, #58D0A7, #3AB58F)", borderRadius: 16, margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg style={{ width: 28, height: 28, color: "white" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 6px", color: "#111" }}>CareQ Hospital Portal</h1>
          <p style={{ color: "#666", fontSize: 14, margin: 0 }}>Select your role to enter directly</p>
        </div>

        {!selectedRole ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button
              onClick={() => enterAsRole("admin")}
              style={{ width: "100%", padding: "14px", background: "#030213", color: "white", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: "pointer" }}
            >
              Enter as Admin
            </button>
            <button
              onClick={() => enterAsRole("receptionist")}
              style={{ width: "100%", padding: "14px", background: "white", color: "#030213", border: "2px solid #e5e7eb", borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: "pointer" }}
            >
              Enter as Receptionist
            </button>
            <button
              onClick={() => enterAsRole("doctor")}
              style={{ width: "100%", padding: "14px", background: "white", color: "#0f9f90", border: "2px solid #0f9f9040", borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: "pointer" }}
            >
              Enter as Doctor
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#444" }}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="any@email.com"
                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #ddd", background: "#f9f9f9", fontSize: 14, outline: "none" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#444" }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #ddd", background: "#f9f9f9", fontSize: 14, outline: "none" }}
              />
            </div>

            <button
              type="submit"
              style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg, #58D0A7, #3AB58F)", color: "white", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: "pointer", marginTop: 8 }}
            >
              Sign In (Demo Bypass)
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole(null)}
              style={{ background: "none", border: "none", color: "#888", fontSize: 13, cursor: "pointer", marginTop: 4 }}
            >
              ← Choose another role
            </button>
          </form>
        )}

        <p style={{ color: "#aaa", fontSize: 12, textAlign: "center", marginTop: 24, margin: "24px 0 0" }}>
          Demo Mode • All Logins Automatically Authorized
        </p>
      </div>
    </div>
  );
}
