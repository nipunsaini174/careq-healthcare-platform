"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { setCookie, deleteCookie, getCookie } from "cookies-next";

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_TOKEN_COOKIE = "healthflow-admin-token";
const ADMIN_USER_KEY = "admin_user";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Read the user immediately from the cookie/localStorage set by authService.login
    const savedUserStr = getCookie(ADMIN_USER_KEY);
    const existingToken = getCookie(ADMIN_TOKEN_COOKIE);

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
          });
        }
      } catch (e) {
        console.error("Error parsing user from cookie", e);
      }
    }
    
    setLoading(false);
  }, []);

  const logout = () => {
    setUser(null);
    deleteCookie(ADMIN_USER_KEY, { path: "/" });
    deleteCookie(ADMIN_TOKEN_COOKIE, { path: "/" });
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
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
