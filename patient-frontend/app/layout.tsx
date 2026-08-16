import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LayoutProvider } from "@/contexts/LayoutContext";
import { AppDataProvider } from "@/contexts/AppDataProvider";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "CareQ — Smart Hospital Management",
  description:
    "Manage appointments, track queues, access lab reports, and navigate your healthcare journey with CareQ.",
  keywords: ["healthcare", "appointments", "queue management", "medical records", "CareQ", "hospital management"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <LayoutProvider>
          <ThemeProvider>
            {/* AppDataProvider initialises the QueryClient, connects the
                socket, and prefetches all user data immediately after login
                so every page renders from cache without a loading state. */}
            <AppDataProvider>
              {children}
            </AppDataProvider>
            <Toaster position="top-center" />
          </ThemeProvider>
        </LayoutProvider>
      </body>
    </html>
  );
}

