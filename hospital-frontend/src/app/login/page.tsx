"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { authService } from "../../services/auth";
export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<"ADMIN" | "RECEPTIONIST" | "DOCTOR" | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await authService.login({ email, password });

      // Verify that the user's role matches the selected role
      if (response.data.user.role.toLowerCase() !== selectedRole?.toLowerCase()) {
        throw new Error(`Unauthorized. You do not have ${selectedRole} privileges.`);
      }

      if (selectedRole === "ADMIN") {
        router.push("/dashboard/admin");
      } else if (selectedRole === "RECEPTIONIST") {
        router.push("/dashboard/receptionist");
      } else {
        router.push("/dashboard/doctor");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "An error occurred during login.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Dynamic Background Elements matching Admin Theme */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#58D0A7]/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#3AB58F]/20 rounded-full blur-[120px]" />
      
      <div className="w-full max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[24px] shadow-[0_20px_40px_rgba(0,0,0,0.08)] overflow-hidden border border-gray-100"
        >
          <div className="p-8 pb-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-[#58D0A7] to-[#3AB58F] rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-lg shadow-[#58D0A7]/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Hospital Portal</h1>
            <p className="text-gray-500 text-sm">Secure access to operations & management</p>
          </div>

          <div className="p-8 pt-2">
            <AnimatePresence mode="wait">
              {!selectedRole ? (
                <motion.div
                  key="role-selection"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <button
                    onClick={() => setSelectedRole("ADMIN")}
                    className="w-full bg-[#030213] text-white rounded-xl py-3.5 font-medium hover:bg-[#030213]/90 transition-all flex items-center justify-center gap-2 shadow-md shadow-[#030213]/10"
                  >
                    Login as Admin
                  </button>
                  <button
                    onClick={() => setSelectedRole("RECEPTIONIST")}
                    className="w-full bg-white text-[#030213] border-2 border-gray-100 rounded-xl py-3.5 font-medium hover:border-gray-200 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                  >
                    Login as Receptionist
                  </button>
                  <button
                    onClick={() => setSelectedRole("DOCTOR")}
                    className="w-full bg-white text-[#0f9f90] border-2 border-[#0f9f90]/20 rounded-xl py-3.5 font-medium hover:border-[#0f9f90]/50 hover:bg-[#0f9f90]/5 transition-all flex items-center justify-center gap-2"
                  >
                    Login as Doctor
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="login-form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full bg-[#f3f3f5] text-gray-900 border-transparent focus:bg-white focus:border-[#58D0A7] focus:ring-2 focus:ring-[#58D0A7]/20 rounded-xl px-4 py-3 outline-none transition-all"
                        placeholder="doctor@hospital.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="w-full bg-[#f3f3f5] text-gray-900 border-transparent focus:bg-white focus:border-[#58D0A7] focus:ring-2 focus:ring-[#58D0A7]/20 rounded-xl px-4 py-3 pr-12 outline-none transition-all"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    
                    {error && (
                      <p className="text-[#d4183d] text-sm text-center font-medium bg-[#d4183d]/10 py-2 rounded-lg">{error}</p>
                    )}

                    <div className="pt-2 space-y-3">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-[#58D0A7] to-[#3AB58F] text-white rounded-xl py-3.5 font-medium hover:opacity-90 transition-opacity shadow-lg shadow-[#58D0A7]/25 flex justify-center items-center"
                      >
                        {isLoading ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          `Sign in to ${selectedRole === "ADMIN" ? "Admin" : selectedRole === "RECEPTIONIST" ? "Reception" : "Doctor"}`
                        )}
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setSelectedRole(null)}
                        className="w-full text-gray-500 hover:text-gray-800 text-sm font-medium py-2 transition-colors"
                      >
                        Go Back
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
