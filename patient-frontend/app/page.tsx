"use client";

import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { PublicLayout } from "@/components/shells/PublicLayout";
import { BrandLogo } from "@/components/BrandLogo";

export default function SplashPage() {
  const router = useRouter();

  return (
    <PublicLayout>
      {/*
        The main container now handles the safe area padding
        to ensure content isn't hidden behind notches or the home indicator.
      */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50 flex flex-col items-center px-6 text-center overflow-hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-xs mx-auto">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="mb-16"
          >
            <BrandLogo width={180} priority className="mx-auto drop-shadow-sm" />
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="w-full"
          >
            <button
              onClick={() => router.push("/dev-bypass")}
              className="w-full bg-[#1e6fd9] text-white py-4 rounded-3xl font-bold shadow-lg shadow-blue-900/15 hover:shadow-xl transition-all active:scale-95 text-center flex justify-center items-center cursor-pointer"
            >
              Get Started
            </button>
          </motion.div>
        </div>

        {/* Footer Area */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="pb-8 pt-4 cursor-pointer relative z-50"
          onClick={() => router.push("/dev-bypass")}
        >
          <p className="text-slate-500 text-sm font-medium">
            Powered by SUVIDHAQ © 2026
          </p>
        </motion.div>
      </div>
    </PublicLayout>
  );
}
