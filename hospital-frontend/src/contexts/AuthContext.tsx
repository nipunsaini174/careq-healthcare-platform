"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { setCookie, deleteCookie, getCookie } from "cookies-next";
import api from "@/services/api";

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginMock: (email: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_TOKEN_COOKIE = "healthflow-admin-token";
const ADMIN_USER_KEY = "hospitalAdminUser";

/**
 * Decodes the role claim from a JWT *without* verifying the signature.
 * We only need it for an early-exit decision (do we trust this token to
 * be an admin token?) — the backend still verifies the signature on
 * every protected request, so a forged claim here can't escalate
 * privileges, only force a re-bootstrap.
 */
function readRoleFromToken(token: string): string | null {
  try {
    const [, payloadB64] = token.split(".");
    if (!payloadB64) return null;
    // Base64URL → Base64 → JSON
    const b64 = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), "=");
    const payload = JSON.parse(atob(padded));
    if (typeof payload.exp === "number" && payload.exp * 1000 < Date.now()) {
      return null; // expired — treat as no token
    }
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

/**
 * Hits the dev-only backend endpoint that returns a real JWT for the
 * first admin in the DB. Stores it in the same cookie the existing
 * axios interceptor (services/api.ts) reads from, so every admin API
 * call is authenticated against a real backend identity.
 *
 * Replace the call site with a proper admin login flow when one exists.
 */
async function bootstrapAdminSession(): Promise<User | null> {
  try {
    const { data } = await api.post("/auth/admin-dev-token");
    const payload = data?.data;
    if (!payload?.token || !payload?.user) return null;

    setCookie(ADMIN_TOKEN_COOKIE, payload.token, {
      maxAge: 60 * 60 * 24,
      path: "/",
      sameSite: "lax",
    });

    const u: User = {
      uid: String(payload.user.user_id),
      email: payload.user.email ?? null,
      displayName: payload.user.full_name ?? null,
    };
    localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(u));
    return u;
  } catch (err) {
    console.error("[AuthContext] Failed to bootstrap admin session:", err);
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Reuse a previous session only when it's *actually* an admin
      // token. A stale cookie from an earlier non-admin login (or a
      // pre-refactor mock value) would otherwise sail past this check
      // and produce a confusing "Forbidden: requires role admin" toast
      // on every admin API call.
      const savedUser = localStorage.getItem(ADMIN_USER_KEY);
      const existingToken = getCookie(ADMIN_TOKEN_COOKIE);
      const tokenStr = typeof existingToken === "string" ? existingToken : null;
      const cachedRole = tokenStr ? readRoleFromToken(tokenStr) : null;

      if (savedUser && cachedRole === "admin") {
        if (!cancelled) {
          setUser(JSON.parse(savedUser));
          setLoading(false);
        }
        return;
      }

      // Cookie is missing, expired, or holds a non-admin role — wipe
      // and re-bootstrap so the next API call has the right identity.
      if (tokenStr && cachedRole !== "admin") {
        deleteCookie(ADMIN_TOKEN_COOKIE, { path: "/" });
        localStorage.removeItem(ADMIN_USER_KEY);
      }

      const fresh = await bootstrapAdminSession();
      if (!cancelled) {
        setUser(fresh);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const loginMock = (email: string) => {
    const mockUser: User = {
      uid: "mock-user-" + Math.random().toString(36).substring(7),
      email,
      displayName: email.split("@")[0].toUpperCase(),
    };
    setUser(mockUser);
    localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(mockUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(ADMIN_USER_KEY);
    deleteCookie(ADMIN_TOKEN_COOKIE, { path: "/" });
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginMock, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
