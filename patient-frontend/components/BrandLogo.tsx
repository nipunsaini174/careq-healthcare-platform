import { cn } from "@/lib/utils";

const LOGO_SRC = "/brand/suvidhaq-logo.png";

type BrandLogoProps = {
  className?: string;
  /** Width in pixels; height scales automatically */
  width?: number;
  priority?: boolean;
};

export function BrandLogo({ className, width = 220, priority = false }: BrandLogoProps) {
  return (
    <img
      src={LOGO_SRC}
      alt="SUVIDHAQ — Smart Hospital Management. Better Care, Together."
      width={width}
      height={Math.round(width * 0.84)}
      className={cn("h-auto object-contain", className)}
      draggable={false}
      fetchPriority={priority ? "high" : undefined}
    />
  );
}

export const BRAND_NAME = "SUVIDHAQ";
export const BRAND_TAGLINE = "Smart Hospital Management. Better Care, Together.";
