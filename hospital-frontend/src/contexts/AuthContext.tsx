"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { setCookie, deleteCookie, getCookie } from "cookies-next";

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  phone: string | null;
  role: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getRoleFromPath() {
  if (typeof window === 'undefined') return 'admin';
  const path = window.location.pathname;
  if (path.includes('/dashboard/doctor')) return 'doctor';
  if (path.includes('/dashboard/receptionist')) return 'receptionist';
  return 'admin';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const role = getRoleFromPath();
    const savedUserStr = getCookie(`${role}_user`);
    const existingToken = getCookie(`healthflow-${role}-token`);

    if (savedUserStr && existingToken) {
      try {
        let parsedUser;
        if (typeof savedUserStr === 'string') {
          parsedUser = JSON.parse(savedUserStr);
        }
        
        if (parsedUser) {
          setUser({
            uid: String(parsedUser.user_id || parsedUser.uid),
            email: parsedUser.email || null,
            displayName: parsedUser.full_name || parsedUser.displayName || null,
            phone: parsedUser.phone || null,
            role: parsedUser.role || null,
          });
        }
      } catch (e) {
        console.error("Error parsing user from cookie", e);
      }
    }
    
    setLoading(false);
  }, []);

  const logout = () => {
    const role = getRoleFromPath();
    setUser(null);
    deleteCookie(`${role}_user`, { path: "/" });
    deleteCookie(`healthflow-${role}-token`, { path: "/" });
    window.location.href = "/login";
  };

  const updateUser = (updates: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const updatedUser = { ...prev, ...updates };
      // Also update the cookie
      const role = getRoleFromPath();
      const existingCookieStr = getCookie(`${role}_user`);
      if (existingCookieStr && typeof existingCookieStr === 'string') {
        try {
          const parsed = JSON.parse(existingCookieStr);
          parsed.full_name = updatedUser.displayName;
          parsed.displayName = updatedUser.displayName;
          if (updatedUser.phone !== undefined) parsed.phone = updatedUser.phone;
          setCookie(`${role}_user`, JSON.stringify(parsed), { path: '/' });
        } catch(e) {}
      }
      return updatedUser;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, updateUser }}>
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
