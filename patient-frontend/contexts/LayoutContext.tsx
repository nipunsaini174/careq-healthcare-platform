"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface LayoutContextType {
  isMobileView: boolean;
  isCapacitor: boolean;
  toggleMobileView: () => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [isMobileView, setIsMobileView] = useState(false);
  const [isCapacitor, setIsCapacitor] = useState(false);

  useEffect(() => {
    // Detect Capacitor native environment or small screen
    const capacitorDetected = !!(window as any).Capacitor?.isNativePlatform?.();
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    setIsCapacitor(capacitorDetected || isMobileDevice);

    if (capacitorDetected || isMobileDevice || window.innerWidth < 768) {
      // Lock to mobile view in native app or on mobile device
      setIsMobileView(true);
    } else {
      const saved = localStorage.getItem("forceMobileView");
      if (saved) {
        setIsMobileView(saved === "true");
      }
    }
  }, []);

  const toggleMobileView = () => {
    if (isCapacitor) return; // Cannot toggle in native app
    setIsMobileView((prev) => {
      const newValue = !prev;
      localStorage.setItem("forceMobileView", String(newValue));
      return newValue;
    });
  };

  return (
    <LayoutContext.Provider value={{ isMobileView, isCapacitor, toggleMobileView }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error("useLayout must be used within a LayoutProvider");
  }
  return context;
}
