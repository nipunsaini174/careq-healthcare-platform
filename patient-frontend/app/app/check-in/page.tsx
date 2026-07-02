"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { QrCode, Hash, CheckCircle } from "lucide-react";

export default function DigitalCheckIn() {
  const router = useRouter();
  const [method, setMethod] = useState<"qr" | "token" | null>(null);
  const [tokenNumber, setTokenNumber] = useState("");
  const [checkedIn, setCheckedIn] = useState(false);

  const handleCheckIn = () => {
    setCheckedIn(true);
    setTimeout(() => {
      router.push("/app/queue");
    }, 2000);
  };

  const cardCls =
    "bg-white dark:bg-[#1A2332] border border-gray-100 dark:border-[#2A3A4E] rounded-3xl shadow-sm dark:shadow-black/20 p-6 mb-6";
  const ghostBtn =
    "w-full bg-gray-100 dark:bg-[#1A2332] border dark:border-[#2A3A4E] text-gray-700 dark:text-[#CBD5E1] py-4 rounded-2xl font-medium hover:bg-gray-200 dark:hover:bg-[#223040] transition-colors";

  if (checkedIn) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0B0F14] flex items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="text-center"
        >
          <div className="w-24 h-24 bg-green-500 dark:bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-16 h-16 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Checked In!</h2>
          <p className="text-gray-600 dark:text-[#94A3B8]">You're marked as present</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B0F14] pb-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-400 to-teal-500 dark:from-[#064E3B] dark:via-[#047857] dark:to-[#065F46] pt-12 pb-8 px-6 rounded-b-[40px]">
        <motion.h1
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-2xl font-bold text-white mb-2"
        >
          Digital Check-In
        </motion.h1>
        <p className="text-white/80">Confirm your arrival</p>
      </div>

      <div className="px-6 py-6">
        {!method ? (
          <>
            <motion.h3
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-lg font-semibold text-gray-900 dark:text-white mb-4"
            >
              Choose Check-In Method
            </motion.h3>

            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              onClick={() => setMethod("qr")}
              className={`w-full text-left ${cardCls} hover:shadow-md dark:hover:bg-[#1F2A38] transition-all`}
            >
              <div className="flex items-center">
                <div className="w-16 h-16 bg-teal-50 dark:bg-emerald-600/10 rounded-2xl flex items-center justify-center mr-4">
                  <QrCode className="w-8 h-8 text-teal-600 dark:text-emerald-400" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Scan QR Code</h3>
                  <p className="text-sm text-gray-600 dark:text-[#94A3B8]">Scan the QR code at the hospital</p>
                </div>
                <div className="text-2xl text-gray-400 dark:text-[#64748B]">&rarr;</div>
              </div>
            </motion.button>

            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              onClick={() => setMethod("token")}
              className={`w-full text-left ${cardCls} hover:shadow-md dark:hover:bg-[#1F2A38] transition-all`}
            >
              <div className="flex items-center">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-500/15 rounded-2xl flex items-center justify-center mr-4">
                  <Hash className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Enter Token</h3>
                  <p className="text-sm text-gray-600 dark:text-[#94A3B8]">Manually enter your token number</p>
                </div>
                <div className="text-2xl text-gray-400 dark:text-[#64748B]">&rarr;</div>
              </div>
            </motion.button>
          </>
        ) : method === "qr" ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <div className={cardCls}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
                Position QR Code in Frame
              </h3>

              <div className="relative aspect-square bg-gray-900 dark:bg-black rounded-2xl overflow-hidden mb-6">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-64 border-4 border-teal-500 dark:border-emerald-500 rounded-2xl relative">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white"></div>
                    <motion.div
                      className="absolute inset-x-0 h-1 bg-teal-500 dark:bg-emerald-400"
                      animate={{ top: ["0%", "100%"] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-[#94A3B8] text-center mb-4">
                Align the QR code within the frame to scan
              </p>

              <button
                onClick={handleCheckIn}
                className="w-full bg-teal-500 dark:bg-emerald-600 text-white py-4 rounded-2xl font-medium shadow-sm shadow-teal-500/20 dark:shadow-emerald-600/30 hover:bg-teal-600 dark:hover:bg-emerald-500 transition-colors"
              >
                Simulate Check-In
              </button>
            </div>

            <button onClick={() => setMethod(null)} className={ghostBtn}>
              Change Method
            </button>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <div className={cardCls}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Enter Token Number</h3>

              <div className="mb-6">
                <label className="text-sm text-gray-600 dark:text-[#94A3B8] mb-2 block">Token Number</label>
                <input
                  type="text"
                  placeholder="T-142"
                  value={tokenNumber}
                  onChange={(e) => setTokenNumber(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#0F1722] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#64748B] rounded-2xl px-4 py-4 text-center text-2xl font-mono outline-none border-2 border-transparent focus:border-teal-500 dark:focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-2xl p-4 mb-6">
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Where to find it?</p>
                <p className="text-xs text-gray-600 dark:text-[#94A3B8]">
                  Your token number can be found on your appointment confirmation or virtual walk-in ticket.
                </p>
              </div>

              <button
                onClick={handleCheckIn}
                disabled={!tokenNumber}
                className="w-full bg-teal-500 dark:bg-emerald-600 text-white py-4 rounded-2xl font-medium shadow-sm shadow-teal-500/20 dark:shadow-emerald-600/30 hover:bg-teal-600 dark:hover:bg-emerald-500 transition-colors disabled:bg-gray-300 dark:disabled:bg-[#223040] disabled:cursor-not-allowed disabled:shadow-none"
              >
                Check In
              </button>
            </div>

            <button onClick={() => setMethod(null)} className={ghostBtn}>
              Change Method
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

