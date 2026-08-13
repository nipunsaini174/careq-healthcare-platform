"use client";

import { useLayout } from "@/contexts/LayoutContext";
import { MobileAppShell } from "./shells/MobileAppShell";
import { DesktopAppShell } from "./shells/DesktopAppShell";
import { DeviceFrame } from "./shells/DeviceFrame";

export function Layout({ children }: { children: React.ReactNode }) {
  const { isMobileView, isCapacitor } = useLayout();

  // ─────────────────────────────────────────────
  // MOBILE VIEW
  // ─────────────────────────────────────────────
  if (isMobileView) {
    // In Capacitor (native app) — render mobile shell directly, no frame
    if (isCapacitor) {
      return <MobileAppShell>{children}</MobileAppShell>;
    }

    // In desktop browser — wrap in decorative phone frame
    return (
      <DeviceFrame>
        <MobileAppShell>{children}</MobileAppShell>
      </DeviceFrame>
    );
  }

  // ─────────────────────────────────────────────
  // DESKTOP VIEW (original layout)
  // ─────────────────────────────────────────────
  return <DesktopAppShell>{children}</DesktopAppShell>;
}
