"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { authService } from "../../services/auth";
import { PublicLayout } from "@/components/shells/PublicLayout";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      await authService.login({ email, password });
      router.push("/app/home");
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="min-h-[100dvh] bg-slate-50 flex flex-col justify-center items-center p-3 md:p-4 relative overflow-y-auto overflow-x-hidden scrollbar-hide">
      {/* Dynamic Background Elements matching Admin Theme */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#6EC5A1]/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#6EC5A1]/10 rounded-full blur-[120px]" />
      
      <div className="w-full max-w-[480px] relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden"
        >
          <div className="px-4 md:px-6 pt-6 pb-4 text-center">
            <h1 className="text-xl font-bold text-[#111827] mb-1">Patient Portal</h1>
            <p className="text-[#6B7280] text-xs">Secure access to appointments & healthcare services</p>
          </div>

          <div className="px-4 md:px-6 pb-6">
            <form onSubmit={handleLogin} className="space-y-3">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-1.5 ml-1">Email Address</label>
                <div className="flex items-center bg-[#F6F7F8] border border-[#E5E7EB] focus-within:bg-white focus-within:border-[#6EC5A1] focus-within:ring-2 focus-within:ring-[#6EC5A1]/20 rounded-[12px] px-4 h-[48px] transition-all duration-300">
                  <Mail className="w-5 h-5 text-[#6B7280] mr-3" />
                  <input
                    type="email"
                    placeholder="patient@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1 bg-transparent outline-none text-[#111827] h-full placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex justify-between items-center mb-1.5 mx-1">
                  <label className="block text-sm font-medium text-[#111827]">Password</label>
                  <button type="button" className="text-[#6B7280] text-sm font-medium hover:text-[#6EC5A1] transition-colors">
                    Forgot?
                  </button>
                </div>
                <div className="flex items-center bg-[#F6F7F8] border border-[#E5E7EB] focus-within:bg-white focus-within:border-[#6EC5A1] focus-within:ring-2 focus-within:ring-[#6EC5A1]/20 rounded-[12px] px-4 h-[48px] transition-all duration-300">
                  <Lock className="w-5 h-5 text-[#6B7280] mr-3" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="flex-1 bg-transparent outline-none text-[#111827] h-full placeholder:text-gray-400"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="ml-2">
                    {showPassword ? (
                      <EyeOff className="w-5 h-5 text-[#6B7280] hover:text-[#111827] transition-colors" />
                    ) : (
                      <Eye className="w-5 h-5 text-[#6B7280] hover:text-[#111827] transition-colors" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-red-500 text-sm text-center font-medium bg-red-50 py-2 rounded-xl">
                  {error}
                </div>
              )}

              {/* Buttons */}
              <div className="pt-1 space-y-2.5">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-[48px] bg-[#030322] text-white rounded-[12px] font-medium shadow-md flex justify-center items-center disabled:opacity-70 transition-all duration-200"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Login"
                  )}
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  className="w-full h-[48px] bg-white border border-[#6EC5A1] text-[#6EC5A1] rounded-[12px] font-medium hover:bg-[#6EC5A1]/5 transition-all duration-200"
                >
                  Continue with OTP
                </motion.button>
              </div>

              {/* Create Account */}
              <div className="text-center pt-4">
                <p className="text-[#6B7280] text-sm">
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => router.push("/register")}
                    className="text-[#6EC5A1] font-medium hover:text-[#5ab391] transition-colors"
                  >
                    Create Account
                  </button>
                </p>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
    </PublicLayout>
  );
}
