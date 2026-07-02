"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { User, Phone, Mail, Calendar, CreditCard, Lock, CheckCircle, Eye, EyeOff } from "lucide-react";
import { authService } from "../../services/auth";
import { PublicLayout } from "@/components/shells/PublicLayout";
import { BrandLogo } from "@/components/BrandLogo";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    dob: "",
    gender: "",
    abhaId: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) errors.name = "Full name is required";
    else if (formData.name.trim().length < 2) errors.name = "Name must be at least 2 characters";

    if (!formData.phone.trim()) errors.phone = "Phone number is required";
    else if (!/^[+]?[\d\s\-()]{8,15}$/.test(formData.phone.trim()))
      errors.phone = "Enter a valid phone number";

    if (!formData.email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim()))
      errors.email = "Enter a valid email address";

    if (!formData.gender) errors.gender = "Please select a gender";

    if (!formData.password) errors.password = "Password is required";
    else if (formData.password.length < 6) errors.password = "Password must be at least 6 characters";

    if (!formData.confirmPassword) errors.confirmPassword = "Please confirm your password";
    else if (formData.password !== formData.confirmPassword)
      errors.confirmPassword = "Passwords do not match";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async () => {
    setError("");
    if (!validate()) return;

    setIsLoading(true);

    try {
      await authService.register({
        email: formData.email.trim(),
        password: formData.password,
        fullName: formData.name.trim(),
        role: "patient",
        hospitalId: 1,
        phone: formData.phone.trim(),
        dob: formData.dob ? new Date(formData.dob).toISOString() : undefined,
        gender: formData.gender,
        abhaId: formData.abhaId.trim() || undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push("/app/home");
      }, 1500);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || "Failed to create account";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  if (success) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-[#0B0F14] flex flex-col items-center justify-center px-6">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <CheckCircle className="w-9 h-9 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Account Created!</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Redirecting to your dashboard…</p>
          </motion.div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-[#0B0F14] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-[#064E3B] dark:via-[#047857] dark:to-[#065F46] pt-6 pb-12 px-5 rounded-b-[32px] border-b border-slate-100 dark:border-[#2A3A4E]">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex flex-col items-start mb-4"
          >
            <BrandLogo width={120} className="drop-shadow-sm" />
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-0.5">Create Account</h2>
            <p className="text-xs text-slate-600 dark:text-white/80">Join us for better healthcare</p>
          </motion.div>
        </div>

        {/* Form */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex-1 px-4 -mt-8 pb-6"
        >
          <div className="bg-white dark:bg-[#1A2332] rounded-2xl shadow-lg p-4 mb-4">

            {/* Full Name */}
            <div className="mb-3">
              <label className="text-xs text-gray-600 dark:text-[#94A3B8] mb-1 block font-medium">
                Full Name <span className="text-red-400">*</span>
              </label>
              <div className={`flex items-center bg-gray-50 dark:bg-[#223040] rounded-xl px-3 py-2 border ${fieldErrors.name ? "border-red-400" : "border-transparent"}`}>
                <User className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-white"
                />
              </div>
              {fieldErrors.name && <p className="text-red-400 text-[10px] mt-0.5 ml-1">{fieldErrors.name}</p>}
            </div>

            {/* Phone */}
            <div className="mb-3">
              <label className="text-xs text-gray-600 dark:text-[#94A3B8] mb-1 block font-medium">
                Phone Number <span className="text-red-400">*</span>
              </label>
              <div className={`flex items-center bg-gray-50 dark:bg-[#223040] rounded-xl px-3 py-2 border ${fieldErrors.phone ? "border-red-400" : "border-transparent"}`}>
                <Phone className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-white"
                />
              </div>
              {fieldErrors.phone && <p className="text-red-400 text-[10px] mt-0.5 ml-1">{fieldErrors.phone}</p>}
            </div>

            {/* Email */}
            <div className="mb-3">
              <label className="text-xs text-gray-600 dark:text-[#94A3B8] mb-1 block font-medium">
                Email <span className="text-red-400">*</span>
              </label>
              <div className={`flex items-center bg-gray-50 dark:bg-[#223040] rounded-xl px-3 py-2 border ${fieldErrors.email ? "border-red-400" : "border-transparent"}`}>
                <Mail className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                <input
                  type="email"
                  placeholder="john.doe@email.com"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-white"
                />
              </div>
              {fieldErrors.email && <p className="text-red-400 text-[10px] mt-0.5 ml-1">{fieldErrors.email}</p>}
            </div>

            {/* Date of Birth */}
            <div className="mb-3">
              <label className="text-xs text-gray-600 dark:text-[#94A3B8] mb-1 block font-medium">Date of Birth</label>
              <div className="flex items-center bg-gray-50 dark:bg-[#223040] rounded-xl px-3 py-2 border border-transparent">
                <Calendar className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => updateField("dob", e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Gender */}
            <div className="mb-3">
              <label className="text-xs text-gray-600 dark:text-[#94A3B8] mb-1 block font-medium">
                Gender <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["Male", "Female", "Other"].map((gender) => (
                  <button
                    key={gender}
                    onClick={() => updateField("gender", gender)}
                    className={`py-2 rounded-xl text-xs font-medium transition-all border ${
                      formData.gender === gender
                        ? "bg-teal-500 dark:bg-emerald-600 text-white border-teal-500"
                        : fieldErrors.gender
                        ? "bg-gray-50 dark:bg-[#223040] text-gray-700 dark:text-[#94A3B8] border-red-400"
                        : "bg-gray-50 dark:bg-[#223040] text-gray-700 dark:text-[#94A3B8] border-transparent"
                    }`}
                  >
                    {gender}
                  </button>
                ))}
              </div>
              {fieldErrors.gender && <p className="text-red-400 text-[10px] mt-0.5 ml-1">{fieldErrors.gender}</p>}
            </div>

            {/* ABHA ID */}
            <div className="mb-3">
              <label className="text-xs text-gray-600 dark:text-[#94A3B8] mb-1 block font-medium">ABHA ID (Optional)</label>
              <div className="flex items-center bg-gray-50 dark:bg-[#223040] rounded-xl px-3 py-2 border border-transparent">
                <CreditCard className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder="12-3456-7890-1234"
                  value={formData.abhaId}
                  onChange={(e) => updateField("abhaId", e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Password */}
            <div className="mb-3">
              <label className="text-xs text-gray-600 dark:text-[#94A3B8] mb-1 block font-medium">
                Password <span className="text-red-400">*</span>
              </label>
              <div className={`flex items-center bg-gray-50 dark:bg-[#223040] rounded-xl px-3 py-2 border ${fieldErrors.password ? "border-red-400" : "border-transparent"}`}>
                <Lock className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  value={formData.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-white"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="ml-1 text-gray-400">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && <p className="text-red-400 text-[10px] mt-0.5 ml-1">{fieldErrors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div className="mb-4">
              <label className="text-xs text-gray-600 dark:text-[#94A3B8] mb-1 block font-medium">
                Confirm Password <span className="text-red-400">*</span>
              </label>
              <div className={`flex items-center bg-gray-50 dark:bg-[#223040] rounded-xl px-3 py-2 border ${fieldErrors.confirmPassword ? "border-red-400" : "border-transparent"}`}>
                <Lock className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={(e) => updateField("confirmPassword", e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-white"
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="ml-1 text-gray-400">
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.confirmPassword && <p className="text-red-400 text-[10px] mt-0.5 ml-1">{fieldErrors.confirmPassword}</p>}
            </div>

            {/* Server Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-3 text-red-500 text-xs text-center font-medium bg-red-50 dark:bg-red-900/20 py-2 rounded-xl border border-red-200 dark:border-red-800"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Register Button */}
            <button
              onClick={handleRegister}
              disabled={isLoading}
              className="w-full bg-teal-500 dark:bg-emerald-600 text-white py-3 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-70 flex justify-center items-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Account…
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-xs text-gray-600 dark:text-[#94A3B8]">
              Already have an account?{" "}
              <button
                onClick={() => router.push("/login")}
                className="text-teal-500 dark:text-emerald-400 font-semibold"
              >
                Login
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </PublicLayout>
  );
}
