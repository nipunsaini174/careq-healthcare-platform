"use client";

import { useLayout } from "@/contexts/LayoutContext";
import { DeviceFrame } from "./DeviceFrame";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const { isMobileView, isCapacitor } = useLayout();

  if (isMobileView && !isCapacitor) {
    return (
      <DeviceFrame>
        <div className="w-full h-full overflow-y-auto scrollbar-hide relative [&>div]:!min-h-full">
          {children}
        </div>
      </DeviceFrame>
    );
  }

  return <>{children}</>;
}
