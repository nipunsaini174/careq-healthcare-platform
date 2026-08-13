"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Sparkles } from "lucide-react";
import { PublicLayout } from "@/components/shells/PublicLayout";
import { setCookie } from "cookies-next";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("patient@careq.demo");
  const [password, setPassword] = useState("12345678");
  const [isLoading, setIsLoading] = useState(false);

  const performBypassLogin = () => {
    setIsLoading(true);
    const dummyToken = "demo-patient-token-2026";
    const dummyUser = {
      id: "patient-demo-01",
      full_name: "Rahul Verma",
      email: email || "patient@careq.demo",
      role: "PATIENT"
    };

    setCookie('healthflow-access-token', dummyToken, { maxAge: 60 * 60 * 24, path: '/' });
    setCookie('user', JSON.stringify(dummyUser), { maxAge: 60 * 60 * 24, path: '/' });

    if (typeof window !== "undefined") {
      localStorage.setItem("healthflow-access-token", dummyToken);
      localStorage.setItem("user", JSON.stringify(dummyUser));
    }

    setTimeout(() => {
      router.push("/app/home");
    }, 400);
  };

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    performBypassLogin();
  };

  return (
    <PublicLayout>
      <div className="min-h-[100dvh] bg-slate-50 flex flex-col justify-center items-center p-3 md:p-4 relative overflow-y-auto overflow-x-hidden scrollbar-hide">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#6EC5A1]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#6EC5A1]/10 rounded-full blur-[120px]" />
        
        <div className="w-full max-w-[480px] relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden"
          >
            <div className="px-4 md:px-6 pt-6 pb-2 text-center">
              <h1 className="text-xl font-bold text-[#111827] mb-1">Patient Portal</h1>
              <p className="text-[#6B7280] text-xs">CareQ Smart Patient Experience & Queue Status</p>
            </div>

            <div className="p-4 md:p-6 space-y-4">
              {/* Quick Demo Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={performBypassLogin}
                type="button"
                className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>Instant Demo Patient Login</span>
              </motion.button>

              <div className="flex items-center gap-3 my-2">
                <div className="h-[1px] bg-slate-200 flex-1" />
                <span className="text-xs text-slate-400 font-medium">or login with email</span>
                <div className="h-[1px] bg-slate-200 flex-1" />
              </div>

              <form onSubmit={handleLogin} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-1.5 ml-1">Email Address</label>
                  <div className="flex items-center bg-[#F6F7F8] border border-[#E5E7EB] rounded-[12px] px-4 h-[48px]">
                    <Mail className="w-5 h-5 text-[#6B7280] mr-3" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1 bg-transparent outline-none text-[#111827] h-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-1.5 ml-1">Password</label>
                  <div className="flex items-center bg-[#F6F7F8] border border-[#E5E7EB] rounded-[12px] px-4 h-[48px]">
                    <Lock className="w-5 h-5 text-[#6B7280] mr-3" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="flex-1 bg-transparent outline-none text-[#111827] h-full"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="w-5 h-5 text-[#6B7280]" /> : <Eye className="w-5 h-5 text-[#6B7280]" />}
                    </button>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-[48px] bg-[#030322] text-white rounded-[12px] font-medium shadow-md flex justify-center items-center cursor-pointer mt-4"
                >
                  {isLoading ? "Signing in..." : "Login"}
                </motion.button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </PublicLayout>
  );
}
