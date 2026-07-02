"use client";

import React from "react";

interface DeviceFrameProps {
  children: React.ReactNode;
}

/**
 * Wraps MobileAppShell in a decorative iPhone-style frame when viewed
 * on a desktop browser. Purely cosmetic — does not affect internal layout.
 * Automatically stripped in Capacitor builds (not rendered when isCapacitor=true).
 */
export function DeviceFrame({ children }: DeviceFrameProps) {
  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-100 via-gray-50 to-slate-200 dark:from-[#060A0F] dark:via-[#0B0F14] dark:to-[#060A0F] flex items-center justify-center p-6">
      {/* Phone bezel - [transform:translateZ(0)] creates a containing block for fixed elements */}
      <div className="relative w-full max-w-[430px] h-[93vh] max-h-[932px] rounded-[3rem] shadow-2xl shadow-black/20 dark:shadow-black/50 border-[3px] border-gray-300 dark:border-[#2A3A4E] overflow-hidden bg-black [transform:translateZ(0)]">
        {/* Dynamic Island */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[200] w-[126px] h-[37px] bg-black rounded-full" />

        {/* Screen content */}
        <div className="w-full h-full rounded-[2.75rem] overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
