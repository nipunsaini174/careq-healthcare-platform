"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Bell,
  Calendar,
  Clock,
  FileText,
  FolderOpen,
  Upload,
  MapPin,
  Activity,
  Users,
  TestTubes,
  Plus,
  Clock3,
  XCircle,
  MessageSquare,
  Sparkles,
  ChevronRight,
  HeartPulse,
  Search,
  Building2,
  Stethoscope,
  AlertCircle,
  ShieldCheck,
  Heart,
} from "lucide-react";
import { useLayout } from "@/contexts/LayoutContext";
import { LiveQueueTracker } from "@/components/ui/LiveQueueTracker";
import { SmartSearchBar } from "@/components/ui/SmartSearchBar";
import { patientApi, isUpcomingStatus } from "../../../services/api/patientApi";
import { useProfile, useAppointments } from "../../../hooks/useAppData";

export default function Home() {
  const router = useRouter();
  const { isMobileView } = useLayout();

  const allocatedTimeMinutes = 2; // Reduced to 2 minutes for a much faster, real-time feel
  const [startTime] = useState(() => new Date(Date.now() - 1 * 60000).getTime()); // Starts halfway
  const [progressPct, setProgressPct] = useState(() => {
    // Synchronously calculate initial progress so it loads instantly without jumping from 0
    const totalSeconds = allocatedTimeMinutes * 60;
    const elapsedSeconds = (Date.now() - (Date.now() - 1 * 60000)) / 1000;
    return Math.min(100, Math.max(0, (elapsedSeconds / totalSeconds) * 100));
  });
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [profileName, setProfileName] = useState("Patient");
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [nextAppointment, setNextAppointment] = useState<any>(null);
  const [allAppointments, setAllAppointments] = useState<any[]>([]);
  // Four states: brand-new user (no history), returning user with no active
  // appointment, actively-tracking user — and `loading` which is the
  // initial state before the backend fetch resolves. Without `loading`
  // we'd flash the "first-time" welcome hero for one frame on every
  // reload, even for users who actually have an active appointment.
  const [userState, setUserState] = useState<"loading" | "first-time" | "returning-empty" | "active">("loading");
  const [daysSinceLastVisit, setDaysSinceLastVisit] = useState<number | null>(null);

  const { data: profile } = useProfile();
  const { data: appointmentsList, isLoading: isAppointmentsLoading } = useAppointments();

  // Source of truth: the backend (via React Query cache).
  // The home page derives one of three states from the cached appointments:
  //   - first-time      → no appointment rows at all
  //   - returning-empty → has past appointments but nothing Upcoming
  //   - active          → has at least one Upcoming appointment
  useEffect(() => {
    if (isAppointmentsLoading) {
      setUserState("loading");
      return;
    }

    const list = appointmentsList || [];
    setAllAppointments(list);

    if (list.length === 0) {
      setUserState("first-time");
      setUpcomingAppointments([]);
      setNextAppointment(null);
      return;
    }

    const upcoming = list.filter((apt) => isUpcomingStatus(apt.status));
    setUpcomingAppointments(upcoming);

    if (upcoming.length > 0) {
      // Soonest upcoming first.
      const sorted = [...upcoming].sort(
        (a, b) => new Date(a.isoDate).getTime() - new Date(b.isoDate).getTime()
      );
      setNextAppointment(sorted[0]);
      setUserState("active");
    } else {
      setNextAppointment(null);
      setUserState("returning-empty");
      const past = list
        .filter((a) => a.status === "Completed" || a.status === "Cancelled")
        .map((a) => new Date(a.isoDate).getTime())
        .filter((t) => !isNaN(t));
      if (past.length > 0) {
        const mostRecent = Math.max(...past);
        const days = Math.max(0, Math.floor((Date.now() - mostRecent) / 86400000));
        setDaysSinceLastVisit(days);
      } else {
        setDaysSinceLastVisit(0);
      }
    }
  }, [appointmentsList, isAppointmentsLoading]);

  useEffect(() => {
    if (profile && profile.full_name) {
      setProfileName(profile.full_name);
    }
  }, [profile]);

  // Build smart, context-aware suggestions. Returns up to 2 cards in priority order.
  // First-time users get NO suggestions (everything would be fake) — they see the
  // dedicated welcome experience below instead.
  const buildSmartSuggestions = () => {
    if (userState === "first-time" || userState === "loading") return [];

    const suggestions: Array<{
      id: string;
      icon: any;
      title: string;
      subtitle: string;
      cta: string;
      tone: "teal" | "purple" | "amber" | "blue";
      onClick: () => void;
    }> = [];

    if (nextAppointment) {
      suggestions.push({
        id: "next-appt",
        icon: Activity,
        title: `Token ${nextAppointment.tokenCode || nextAppointment.token?.tokenCode || nextAppointment.id.replace("APT-", "T-")} • ${nextAppointment.doctorName}`,
        subtitle: `${nextAppointment.department} • ${nextAppointment.date} at ${nextAppointment.time}`,
        cta: "Track Queue",
        tone: "teal",
        onClick: () => router.push(`/app/queue?appointmentId=${nextAppointment.id}`),
      });
    }

    const hasCompleted = allAppointments.some((a) => a.status === "Completed");
    if (hasCompleted) {
      suggestions.push({
        id: "report-ready",
        icon: FileText,
        title: "Recent lab results are ready",
        subtitle: "View your latest reports",
        cta: "View",
        tone: "blue",
        onClick: () => router.push("/app/reports"),
      });
    }

    if (!nextAppointment) {
      suggestions.push({
        id: "annual-checkup",
        icon: HeartPulse,
        title: "Time for your annual checkup",
        subtitle: "Stay ahead with preventive care",
        cta: "Book",
        tone: "purple",
        onClick: () => router.push("/app/book"),
      });
    }

    return suggestions.slice(0, 2);
  };
  const smartSuggestions = buildSmartSuggestions();

  useEffect(() => {
    const totalSeconds = allocatedTimeMinutes * 60;

    const interval = setInterval(() => {
      const elapsedSeconds = (Date.now() - startTime) / 1000;
      let pct = (elapsedSeconds / totalSeconds) * 100;
      if (pct < 0) pct = 0;
      if (pct > 100) pct = 100;
      setProgressPct(pct);
    }, 100); // 100ms interval for silky-smooth realtime loading

    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className="min-h-full bg-gray-50 dark:bg-[#0B0F14] pb-[120px]">
      {/* ====================== MOBILE HEADER (hidden on desktop) ====================== */}
      <div className={`${isMobileView ? '' : 'hidden lg:hidden'} bg-gradient-to-br from-teal-400 to-teal-500 dark:from-[#064E3B] dark:via-[#047857] dark:to-[#065F46] pb-8 px-6 rounded-b-[40px]`} style={{ paddingTop: "max(2.5rem, calc(env(safe-area-inset-top) + 1rem))" }}>
        <div className="flex items-center justify-between mb-6">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          >
            <p className="text-slate-900/80 dark:text-emerald-100/80 text-sm mb-1 font-medium">Good Morning</p>
            <h1 className="text-xl text-slate-900 dark:text-white font-bold">{profileName}</h1>
          </motion.div>
          <div className="flex items-center gap-3">
            <motion.button
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              onClick={() => router.push("/app/emergency")}
              className="h-9 px-3 bg-red-500 rounded-[12px] flex items-center justify-center gap-1.5 shadow-md shadow-red-500/20 active:scale-95 transition-transform hover:bg-red-600"
            >
              <Activity className="w-4 h-4 text-white" />
              <span className="text-white text-xs font-bold">SOS</span>
            </motion.button>
            <motion.button
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              onClick={() => router.push("/app/notifications")}
              className="w-12 h-12 bg-slate-900/5 dark:bg-white/10 rounded-2xl flex items-center justify-center relative shadow-xl shadow-teal-900/10 dark:shadow-emerald-900/20 border border-slate-900/10 dark:border-white/10"
            >
              <Bell className="w-6 h-6 text-slate-900 dark:text-white" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-400 rounded-full"></span>
            </motion.button>
          </div>
        </div>

        {/* --- SMART SEARCH BAR (MOBILE) --- */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.05 }}
          className="mb-6"
        >
          <SmartSearchBar />
        </motion.div>

        {/* Mobile Live Queue Widget */}
        {nextAppointment ? (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            onClick={() => router.push(`/app/queue?appointmentId=${nextAppointment.id}`)}
            className="bg-white/30 dark:bg-[#1A2332]/70 backdrop-blur-xl rounded-3xl p-4 border border-white/40 dark:border-[#2A3A4E] relative overflow-hidden shadow-xl shadow-teal-900/10 dark:shadow-black/20 cursor-pointer"
          >
            {/* Top Row (Header) */}
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="flex flex-col items-start">
                <span className="text-[10px] text-slate-900/80 dark:text-emerald-200/80 font-bold uppercase tracking-wider mb-1">Your Token</span>
                <span className="text-[32px] font-bold text-slate-900 dark:text-white leading-none tracking-tight">
                  {nextAppointment.tokenCode || nextAppointment.token?.tokenCode || nextAppointment.id.replace("APT-", "T-")}
                </span>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-slate-900/10 dark:border-emerald-400/20 bg-slate-900/5 dark:bg-emerald-500/10">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-600"></span>
                  </span>
                  <span className="text-[9px] text-slate-900 dark:text-emerald-200 font-bold tracking-wider uppercase">Live</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  <span className="text-[10px] text-slate-900 dark:text-emerald-100 font-bold">
                    {nextAppointment.doctorName.replace("Dr. ", "Dr.")}
                  </span>
                </div>
              </div>
            </div>

            {/* Middle Row (The Minimalist Queue Tracker) */}
            <div className="relative z-10 -mx-2 mt-4">
              <LiveQueueTracker 
                tokens={(nextAppointment as any)?.liveQueueTokens || []} 
                userToken={nextAppointment.tokenCode || nextAppointment.token?.tokenCode || nextAppointment.id.replace("APT-", "T-")}
                arriveByTime={nextAppointment.time} 
              />
            </div>

            {/* Bottom Row (Footer) */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-900/10 dark:border-[#2A3A4E] relative z-10">
              <div className="flex items-center gap-4">
                <p className="text-slate-900/90 dark:text-white/90 text-sm font-bold">Wait Time: {(nextAppointment as any)?.estimatedWaitTime || 0} mins</p>
                <p className="text-slate-900/90 dark:text-white/90 text-sm font-bold text-teal-600 dark:text-emerald-400">Ahead: {Math.max(0, ((nextAppointment as any)?.queuePosition || 1) - 1)}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/app/queue?appointmentId=${nextAppointment.id}`);
                }}
                className="flex items-center gap-1 text-slate-900/90 dark:text-white/90 text-xs font-bold cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                View Timeline <span>&rarr;</span>
              </button>
            </div>
          </motion.div>
        ) : userState === "loading" ? (
          /* === LOADING PLACEHOLDER === Shown until the appointments fetch
              resolves so we never flash the welcome hero at users who
              actually have an active appointment. */
          <div className="bg-white/20 dark:bg-[#1A2332]/60 rounded-3xl p-6 border border-white/30 dark:border-[#2A3A4E] shadow-xl shadow-teal-900/10 dark:shadow-black/20 h-[200px] animate-pulse" />
        ) : userState === "first-time" ? (
          /* === FIRST-TIME WELCOME HERO === No history yet. Build confidence and drive the first booking. */
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white/30 dark:bg-[#1A2332]/70 backdrop-blur-xl rounded-3xl p-6 border border-white/40 dark:border-[#2A3A4E] relative overflow-hidden shadow-xl shadow-teal-900/10 dark:shadow-black/20 flex flex-col items-center text-center"
          >
            <div className="text-4xl mb-2" aria-hidden>👋</div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1 drop-shadow-sm">
              Welcome to CareQ
            </h2>
            <p className="text-slate-900/80 dark:text-emerald-100/80 text-sm font-medium mb-5 max-w-xs">
              Skip the wait. See your doctor on time.
            </p>
            <Link href="/app/book" className="w-full">
              <button className="w-full bg-white dark:bg-emerald-600 text-teal-700 dark:text-white text-sm font-bold py-3.5 px-6 rounded-full shadow-lg shadow-teal-900/15 dark:shadow-emerald-900/40 hover:shadow-xl hover:bg-teal-50 dark:hover:bg-emerald-500 active:scale-95 transition-all flex items-center justify-center gap-2">
                <Calendar className="w-4 h-4" /> Book Your First Appointment
              </button>
            </Link>
            <button
              onClick={() => router.push("/app/book")}
              className="mt-3 text-slate-900/70 dark:text-emerald-100/70 text-xs font-medium hover:text-slate-900 dark:hover:text-emerald-100 transition-colors underline-offset-2 hover:underline"
            >
              or browse hospitals
            </button>
          </motion.div>
        ) : (
          /* === RETURNING-EMPTY RE-ENGAGEMENT === Has history but no active appointment. */
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white/30 dark:bg-[#1A2332]/70 backdrop-blur-xl rounded-3xl p-6 border border-white/40 dark:border-[#2A3A4E] relative overflow-hidden shadow-xl shadow-teal-900/10 dark:shadow-black/20"
          >
            <div className="flex items-start gap-4 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-white/40 dark:bg-emerald-500/15 border border-white/40 dark:border-emerald-400/20 flex items-center justify-center shrink-0">
                <Heart className="w-6 h-6 text-teal-700 dark:text-emerald-300" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1 drop-shadow-sm">
                  Welcome back, {profileName.split(" ")[0]}
                </h2>
                <p className="text-slate-900/80 dark:text-emerald-100/80 text-sm font-medium">
                  {daysSinceLastVisit !== null && daysSinceLastVisit > 0
                    ? `It's been ${daysSinceLastVisit} day${daysSinceLastVisit === 1 ? "" : "s"} since your last visit.`
                    : "Ready to book your next appointment?"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <Link href="/app/book" className="w-full">
                <button className="w-full bg-white dark:bg-emerald-600 text-teal-700 dark:text-white text-xs font-bold py-3 px-3 rounded-full shadow-md shadow-teal-900/10 dark:shadow-emerald-900/40 hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Book Again
                </button>
              </Link>
              <button
                onClick={() => router.push("/app/reports")}
                className="w-full bg-white/40 dark:bg-white/5 text-slate-900 dark:text-white text-xs font-bold py-3 px-3 rounded-full border border-white/40 dark:border-white/10 hover:bg-white/60 dark:hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" /> Past Reports
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* ====================== MAIN CONTENT ====================== */}
      {/* Mobile: standard flow | Desktop: normal flow */}
      <div className={`px-6 pb-6 ${isMobileView ? 'mt-6' : 'mt-0 px-0 pb-0'}`}>

        {/* ====================== DESKTOP GREETING ====================== */}
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`${isMobileView ? 'hidden' : 'flex'} items-center justify-between mb-6`}
        >
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-slate-50">
              Good Morning, {profileName.split(" ")[0]} 👋
            </h1>
            <p className="text-sm text-gray-500 dark:text-[#94A3B8] mt-1">
              Here's your health dashboard overview
            </p>
          </div>
          
          {/* --- SMART SEARCH BAR (DESKTOP) --- */}
          <div className="flex-1 max-w-md mx-8 hidden lg:block">
            <SmartSearchBar />
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 dark:border-[#2A3A4E] bg-white dark:bg-[#1A2332]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs text-gray-600 dark:text-[#94A3B8] font-medium">Live Updates</span>
          </div>
        </motion.div>

        {/* ====================== DASHBOARD GRID ====================== */}
        <div className={`grid gap-3 ${isMobileView ? 'grid-cols-2 mb-4' : 'grid-cols-12 gap-4 mb-0'}`}>

          {/* ---- ROW 1: Token Hero + Queue Position (Desktop) ---- */}
          {/* Current Token Hero — full width on mobile (hidden, shown in header), big card on desktop */}
          {userState === "loading" ? (
            /* Skeleton placeholder so we don't flash the welcome hero
                before the appointment fetch resolves on desktop. */
            <div
              className={`${isMobileView ? 'hidden' : 'block col-span-8'} bg-gradient-to-br from-teal-400/60 to-teal-500/60 dark:from-[#064E3B]/60 dark:via-[#047857]/60 dark:to-[#065F46]/60 rounded-3xl p-6 h-[280px] animate-pulse`}
            />
          ) : nextAppointment ? (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              onClick={() => router.push(`/app/queue?appointmentId=${nextAppointment.id}`)}
              className={`${isMobileView ? 'hidden' : 'block col-span-8'} bg-gradient-to-br from-teal-400 to-teal-500 dark:from-[#064E3B] dark:via-[#047857] dark:to-[#065F46] rounded-3xl p-6 cursor-pointer hover:shadow-xl transition-shadow relative overflow-hidden`}
            >
              {/* Background embellishments */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-slate-900/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>

              {/* Top Row (Header) */}
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex flex-col items-start">
                  <span className="text-[12px] text-slate-900/80 dark:text-emerald-200/80 font-bold uppercase tracking-wider mb-1">Your Token</span>
                  <span className="text-[32px] font-bold text-slate-900 dark:text-white leading-none tracking-tight">
                    {nextAppointment.tokenCode || nextAppointment.token?.tokenCode || nextAppointment.id.replace("APT-", "T-")}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-900/10 dark:border-emerald-400/20 bg-white/30 dark:bg-emerald-500/10 backdrop-blur-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600"></span>
                    </span>
                    <span className="text-xs text-slate-900 dark:text-emerald-200 font-bold tracking-wider uppercase">Live</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/30 dark:bg-white/5 backdrop-blur-sm">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-xs text-slate-900 dark:text-emerald-100 font-bold">
                      {nextAppointment.doctorName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Middle Row (The Minimalist Queue Tracker) */}
              <div className="relative z-10 mt-6">
                <LiveQueueTracker 
                  tokens={(nextAppointment as any)?.liveQueueTokens || []} 
                  userToken={nextAppointment.tokenCode || nextAppointment.token?.tokenCode || nextAppointment.id.replace("APT-", "T-")}
                  arriveByTime={nextAppointment.time} 
                />
              </div>

              {/* Bottom Row (Footer) */}
              <div className="flex items-center justify-between mt-2 pt-5 border-t border-slate-900/10 dark:border-emerald-400/15 relative z-10">
                <div className="flex items-center gap-4">
                  <p className="text-slate-900/90 dark:text-white/90 text-base font-bold">Wait Time: {(nextAppointment as any)?.estimatedWaitTime || 0} mins</p>
                  <p className="text-slate-900/90 dark:text-white/90 text-base font-bold text-teal-600 dark:text-emerald-400">Ahead: {Math.max(0, ((nextAppointment as any)?.queuePosition || 1) - 1)}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/app/queue?appointmentId=${nextAppointment.id}`);
                  }}
                  className="flex items-center gap-1 text-slate-900/90 dark:text-white/90 text-base font-bold cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  View Full Timeline <span className="text-xl leading-none">&rarr;</span>
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className={`${isMobileView ? 'hidden' : 'flex col-span-8'} bg-gradient-to-br from-teal-400 to-teal-500 dark:from-[#064E3B] dark:via-[#047857] dark:to-[#065F46] rounded-[2.5rem] pt-14 pb-10 px-6 shadow-md text-white flex-col items-center justify-center text-center relative overflow-hidden`}
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-slate-900/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
              {userState === "first-time" ? (
                <>
                  <div className="text-5xl mb-3 relative z-10" aria-hidden>👋</div>
                  <h2 className="text-3xl font-extrabold tracking-tight mb-2 drop-shadow-sm relative z-10">
                    Welcome to CareQ
                  </h2>
                  <p className="text-teal-50 dark:text-emerald-100 text-sm font-medium opacity-90 mb-8 max-w-md relative z-10">
                    Skip the wait. See your doctor on time.
                  </p>
                  <Link href="/app/book" className="w-full max-w-xs flex justify-center relative z-10">
                    <button className="bg-white dark:bg-emerald-600 text-teal-600 dark:text-white text-lg font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl hover:bg-teal-50 dark:hover:bg-emerald-500 active:scale-95 transition-all w-full flex items-center justify-center gap-2">
                      <Calendar className="w-5 h-5" /> Book Your First Appointment
                    </button>
                  </Link>
                </>
              ) : (
                <>
                  <Heart className="w-12 h-12 text-white/90 dark:text-emerald-100 mb-3 relative z-10" />
                  <h2 className="text-3xl font-extrabold tracking-tight mb-2 drop-shadow-sm relative z-10">
                    Welcome back, {profileName.split(" ")[0]}
                  </h2>
                  <p className="text-teal-50 dark:text-emerald-100 text-sm font-medium opacity-90 mb-8 max-w-md relative z-10">
                    {daysSinceLastVisit !== null && daysSinceLastVisit > 0
                      ? `It's been ${daysSinceLastVisit} day${daysSinceLastVisit === 1 ? "" : "s"} since your last visit. Ready to book again?`
                      : "Ready to book your next appointment?"}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-md relative z-10">
                    <Link href="/app/book" className="flex-1 min-w-[140px]">
                      <button className="w-full bg-white dark:bg-emerald-600 text-teal-600 dark:text-white text-base font-bold py-3 px-5 rounded-full shadow-lg hover:shadow-xl hover:bg-teal-50 dark:hover:bg-emerald-500 active:scale-95 transition-all flex items-center justify-center gap-2">
                        <Calendar className="w-5 h-5" /> Book Again
                      </button>
                    </Link>
                    <button
                      onClick={() => router.push("/app/reports")}
                      className="flex-1 min-w-[140px] bg-white/20 dark:bg-white/10 text-white text-base font-bold py-3 px-5 rounded-full border border-white/30 dark:border-white/15 hover:bg-white/30 dark:hover:bg-white/15 active:scale-95 transition-all flex items-center justify-center gap-2 backdrop-blur-sm"
                    >
                      <FileText className="w-5 h-5" /> Past Reports
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* Queue Position Card (Desktop right column) — hidden for first-time users (no real queue) */}
          {userState !== "first-time" && userState !== "loading" && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              onClick={() => router.push(nextAppointment ? `/app/queue?appointmentId=${nextAppointment.id}` : "/app/queue")}
              className={`hidden @4xl:flex @4xl:col-span-4 bg-white dark:bg-[#1A2332] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-[#2A3A4E] flex-col cursor-pointer hover:shadow-lg transition-shadow`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/30 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-gray-900 dark:text-slate-50 font-medium">Queue Status</h3>
              </div>
              <div className="flex-1 w-full flex flex-col justify-center">
                <LiveQueueTracker 
                  tokens={(nextAppointment as any)?.liveQueueTokens || []} 
                  userToken={nextAppointment?.tokenCode || nextAppointment?.token?.tokenCode || nextAppointment?.id?.replace("APT-", "T-")}
                />
              </div>
            </motion.div>
          )}

          {/* ---- ROW 2: Stat Cards (mobile 2-col grid, desktop 4 across or 3 in main) ---- */}
          {/* Hidden for first-time users — they have nothing to count yet. */}

          {/* Upcoming Appointment */}
          {userState !== "first-time" && userState !== "loading" && (
            <Link href="/app/appointments" className={`block ${isMobileView ? 'col-span-1' : 'col-span-3'}`}>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className={`bg-white dark:bg-[#1A2332] dark:border dark:border-[#2A3A4E] rounded-[24px] p-3 text-gray-900 dark:text-white cursor-pointer transition-all duration-300 h-full shadow-[0_20px_40px_rgba(88,208,167,0.08),0_10px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_40px_rgba(16,185,129,0.04),0_10px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_24px_48px_rgba(88,208,167,0.10),0_12px_24px_rgba(0,0,0,0.08)] hover:-translate-y-[2px]`}
              >
                <div className={`w-8 h-8 bg-teal-50 dark:bg-emerald-500/10 rounded-[12px] flex items-center justify-center mb-2`}>
                  <Calendar className="w-4 h-4 text-teal-600 dark:text-emerald-400" />
                </div>
                <p className="text-gray-500 dark:text-[#94A3B8] text-xs mb-1 font-medium">Upcoming</p>
                <h3 className="text-base font-bold text-gray-900 dark:text-slate-50 leading-tight">
                  {upcomingAppointments.length > 0 ? `${upcomingAppointments.length} Appt${upcomingAppointments.length > 1 ? 's' : ''}` : 'None'}
                </h3>
                <p className="text-[10px] text-gray-500 dark:text-[#94A3B8] mt-1.5 truncate">
                  {nextAppointment ? nextAppointment.date : 'Book now'}
                </p>
              </motion.div>
            </Link>
          )}

          {/* Lab Reports */}
          {userState !== "first-time" && userState !== "loading" && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              onClick={() => router.push("/app/lab-reports")}
              className={`bg-white dark:bg-[#1A2332] dark:border dark:border-[#2A3A4E] rounded-[24px] p-3 text-gray-900 dark:text-white cursor-pointer transition-all duration-300 ${isMobileView ? 'col-span-1' : 'col-span-3'} shadow-[0_20px_40px_rgba(88,208,167,0.08),0_10px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_40px_rgba(16,185,129,0.04),0_10px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_24px_48px_rgba(88,208,167,0.10),0_12px_24px_rgba(0,0,0,0.08)] hover:-translate-y-[2px]`}
            >
              <div className={`w-8 h-8 bg-orange-50 dark:bg-orange-950/30 rounded-[12px] flex items-center justify-center mb-2`}>
                <TestTubes className="w-4 h-4 text-orange-500 dark:text-orange-400" />
              </div>
              <p className="text-gray-500 dark:text-[#94A3B8] text-xs mb-1 font-medium">Lab Reports</p>
              <h3 className="text-base font-bold text-gray-900 dark:text-slate-50 leading-tight">Upload</h3>
              <p className="text-[10px] text-gray-500 dark:text-[#94A3B8] mt-1.5 truncate">Upload & manage</p>
            </motion.div>
          )}

          {/* ====================== FIRST-TIME USER EXPERIENCE ====================== */}
          {/* Replaces stat cards / suggestions / quick actions for brand-new users.
              Goal: set the mental model, drive the first booking, build trust. */}
          {userState === "first-time" && (
            <motion.section
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className={`${isMobileView ? 'col-span-2' : 'col-span-12'}`}
            >
              {/* --- How CareQ works (3-step visual) --- */}
              <div className="flex items-center gap-2 mb-3 px-0.5">
                <Sparkles className="w-4 h-4 text-teal-600 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">How CareQ works</h3>
              </div>

              <div className="grid grid-cols-3 gap-2.5 mb-6">
                {[
                  { num: 1, icon: Search, title: "Find", desc: "Pick a doctor or department", tone: "teal" },
                  { num: 2, icon: Calendar, title: "Book", desc: "Choose a slot that fits you", tone: "blue" },
                  { num: 3, icon: Clock, title: "Skip the queue", desc: "Track your turn live", tone: "purple" },
                ].map((step, i) => {
                  const toneStyles: Record<string, { wrap: string; icon: string; num: string }> = {
                    teal: { wrap: "bg-teal-50 dark:bg-emerald-500/10", icon: "text-teal-600 dark:text-emerald-400", num: "bg-teal-100 dark:bg-emerald-500/20 text-teal-700 dark:text-emerald-300" },
                    blue: { wrap: "bg-blue-50 dark:bg-blue-500/10", icon: "text-blue-600 dark:text-blue-400", num: "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300" },
                    purple: { wrap: "bg-purple-50 dark:bg-purple-500/10", icon: "text-purple-600 dark:text-purple-400", num: "bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300" },
                  };
                  const tone = toneStyles[step.tone];
                  const Icon = step.icon;
                  return (
                    <motion.div
                      key={step.num}
                      initial={{ y: 12, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 + i * 0.06 }}
                      className="relative bg-white dark:bg-[#1A2332] border border-gray-100 dark:border-[#2A3A4E] rounded-2xl p-3 flex flex-col items-center text-center shadow-[0_6px_20px_rgba(15,23,42,0.04)] dark:shadow-[0_6px_20px_rgba(0,0,0,0.25)]"
                    >
                      <span className={`absolute top-2 right-2 w-4 h-4 ${tone.num} rounded-full text-[9px] font-bold flex items-center justify-center`}>
                        {step.num}
                      </span>
                      <div className={`w-10 h-10 ${tone.wrap} rounded-xl flex items-center justify-center mb-2`}>
                        <Icon className={`w-5 h-5 ${tone.icon}`} />
                      </div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight mb-1">{step.title}</p>
                      <p className="text-[10px] text-gray-500 dark:text-[#94A3B8] leading-tight">{step.desc}</p>
                    </motion.div>
                  );
                })}
              </div>

              {/* --- Explore CareQ (discovery strip) --- */}
              <div className="flex items-center gap-2 mb-3 px-0.5">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">Explore CareQ</h3>
              </div>

              <div className="flex flex-col gap-2.5 mb-6">
                {[
                  { label: "Find Hospitals", desc: "50+ verified centres", icon: Building2, tone: "teal", path: "/app/book" },
                  { label: "Browse Doctors", desc: "Across all specialties", icon: Stethoscope, tone: "blue", path: "/app/book?view=doctors" },
                  { label: "Lab Reports", desc: "Upload & track", icon: TestTubes, tone: "amber", path: "/app/lab-reports" },
                  { label: "Emergency", desc: "Quick access SOS", icon: AlertCircle, tone: "red", path: "/app/emergency" },
                ].map((item, i) => {
                  const toneStyles: Record<string, { wrap: string; icon: string }> = {
                    teal: { wrap: "bg-teal-50 dark:bg-emerald-500/10", icon: "text-teal-600 dark:text-emerald-400" },
                    blue: { wrap: "bg-blue-50 dark:bg-blue-500/10", icon: "text-blue-600 dark:text-blue-400" },
                    amber: { wrap: "bg-amber-50 dark:bg-amber-500/10", icon: "text-amber-600 dark:text-amber-400" },
                    red: { wrap: "bg-red-50 dark:bg-red-500/10", icon: "text-red-600 dark:text-red-400" },
                  };
                  const tone = toneStyles[item.tone];
                  const Icon = item.icon;
                  return (
                    <motion.button
                      key={item.label}
                      initial={{ y: 12, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.35 + i * 0.05 }}
                      onClick={() => router.push(item.path)}
                      className="w-full text-left bg-white dark:bg-[#1A2332] border border-gray-100 dark:border-[#2A3A4E] rounded-2xl p-3.5 flex items-center gap-3 active:scale-[0.98] transition-transform shadow-[0_6px_20px_rgba(15,23,42,0.04)] dark:shadow-[0_6px_20px_rgba(0,0,0,0.25)]"
                    >
                      <div className={`shrink-0 w-11 h-11 ${tone.wrap} rounded-xl flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${tone.icon}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.label}</p>
                        <p className="text-[11px] text-gray-500 dark:text-[#94A3B8] mt-0.5">{item.desc}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 dark:text-[#64748B] shrink-0" />
                    </motion.button>
                  );
                })}
              </div>

              {/* --- Trust footer (final reassurance before the big "Book" CTA tap) --- */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center justify-center gap-3 text-[10px] text-gray-500 dark:text-[#64748B] font-medium px-2"
              >
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600 dark:text-emerald-400" />
                  Encrypted
                </span>
                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-[#2A3A4E]" />
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  50+ Hospitals
                </span>
                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-[#2A3A4E]" />
                <span className="flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                  Free to use
                </span>
              </motion.div>
            </motion.section>
          )}

          {/* ====================== UPCOMING VISITS WITH LIVE QUEUE ====================== */}
          {userState !== "first-time" && userState !== "loading" && upcomingAppointments.length > 0 && (
            <motion.section
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={`${isMobileView ? 'col-span-2 mt-2' : 'col-span-12 mt-4'}`}
            >
              <div className="flex items-center justify-between mb-3 px-0.5">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-teal-600 dark:text-emerald-400" />
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">Upcoming Visits & Live Tokens</h3>
                </div>
                <Link href="/app/appointments" className="text-[11px] text-teal-600 dark:text-emerald-400 font-bold flex items-center gap-0.5 hover:underline">
                  <span>View all ({upcomingAppointments.length})</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-2.5">
                {upcomingAppointments.map((apt, i) => {
                  const token = apt.tokenCode || apt.token?.tokenCode || apt.id.replace("APT-", "T-");
                  return (
                    <motion.div
                      key={apt.id}
                      initial={{ x: -8, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.25 + i * 0.05 }}
                      onClick={() => router.push(`/app/queue?appointmentId=${apt.id}`)}
                      className="w-full bg-white dark:bg-[#1A2332] border border-gray-100 dark:border-[#2A3A4E] rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 active:scale-[0.98] transition-all cursor-pointer shadow-[0_6px_20px_rgba(15,23,42,0.04)] dark:shadow-[0_6px_20px_rgba(0,0,0,0.25)] hover:border-teal-300 dark:hover:border-emerald-500/40"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-teal-50 dark:bg-emerald-500/10 rounded-xl flex flex-col items-center justify-center shrink-0 border border-teal-100 dark:border-emerald-500/20">
                          <span className="text-[9px] font-bold text-teal-600 dark:text-emerald-400 uppercase leading-none mb-0.5">Token</span>
                          <span className="text-sm font-extrabold text-teal-700 dark:text-emerald-300 leading-none">{token}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">{apt.doctorName}</h4>
                            <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 dark:bg-[#223040] text-slate-600 dark:text-[#94A3B8] rounded-md">
                              {apt.department}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 dark:text-[#94A3B8] mt-1 flex items-center gap-2">
                            <span>{apt.date} at {apt.time}</span>
                            {apt.patientName && apt.relationship !== "Self" && (
                              <span className="text-blue-600 dark:text-blue-400 font-medium">
                                • {apt.patientName.split(" ")[0]} ({apt.relationship})
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-[#2A3A4E]">
                        <div className="text-left sm:text-right">
                          <p className="text-[9px] text-gray-400 dark:text-[#64748B] uppercase font-bold tracking-wider">Ahead</p>
                          <p className="text-xs font-bold text-teal-600 dark:text-emerald-400">
                            {Math.max(0, (apt.queuePosition || 1) - 1)} in queue
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/app/queue?appointmentId=${apt.id}`);
                          }}
                          className="px-3 py-1.5 bg-teal-500 dark:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-teal-600 dark:hover:bg-emerald-500 active:scale-95 transition-all"
                        >
                          <Activity className="w-3.5 h-3.5" />
                          <span>Track Live Queue</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>
          )}

          {/* ====================== SUGGESTED FOR YOU (Mobile-first personalized cards) ====================== */}
          {userState !== "first-time" && userState !== "loading" && smartSuggestions.length > 0 && (
            <motion.section
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25 }}
              className={`${isMobileView ? 'col-span-2 mt-2' : 'hidden'}`}
            >
              <div className="flex items-center justify-between mb-3 px-0.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-600 dark:text-emerald-400" />
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">Suggested for You</h3>
                </div>
                <span className="text-[10px] text-gray-400 dark:text-[#64748B] uppercase tracking-wider font-semibold">Personalized</span>
              </div>

              <div className="space-y-2.5">
                {smartSuggestions.map((s, i) => {
                  const toneStyles: Record<string, { wrap: string; icon: string; cta: string }> = {
                    teal: { wrap: "bg-teal-50 dark:bg-emerald-500/10", icon: "text-teal-600 dark:text-emerald-400", cta: "text-teal-600 dark:text-emerald-400" },
                    blue: { wrap: "bg-blue-50 dark:bg-blue-500/10", icon: "text-blue-600 dark:text-blue-400", cta: "text-blue-600 dark:text-blue-400" },
                    purple: { wrap: "bg-purple-50 dark:bg-purple-500/10", icon: "text-purple-600 dark:text-purple-400", cta: "text-purple-600 dark:text-purple-400" },
                    amber: { wrap: "bg-amber-50 dark:bg-amber-500/10", icon: "text-amber-600 dark:text-amber-400", cta: "text-amber-600 dark:text-amber-400" },
                  };
                  const tone = toneStyles[s.tone];
                  const Icon = s.icon;
                  return (
                    <motion.button
                      key={s.id}
                      initial={{ x: -8, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3 + i * 0.05 }}
                      onClick={s.onClick}
                      className="w-full text-left bg-white dark:bg-[#1A2332] border border-gray-100 dark:border-[#2A3A4E] rounded-2xl p-3.5 flex items-center gap-3 active:scale-[0.98] transition-transform shadow-[0_6px_20px_rgba(15,23,42,0.04)] dark:shadow-[0_6px_20px_rgba(0,0,0,0.25)]"
                    >
                      <div className={`shrink-0 w-11 h-11 ${tone.wrap} rounded-xl flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${tone.icon}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{s.title}</p>
                        <p className="text-[11px] text-gray-500 dark:text-[#94A3B8] mt-0.5 truncate">{s.subtitle}</p>
                      </div>
                      <div className={`flex items-center gap-0.5 text-xs font-bold ${tone.cta} shrink-0`}>
                        {s.cta}
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.section>
          )}

          {/* Live queue section has been merged into the top hero card */}

          {/* Floating Action Button */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="fixed bottom-28 right-6 z-[110]"
          >
            <div className="relative">
              <button
                onClick={() => setIsFabOpen(!isFabOpen)}
                className="w-14 h-14 bg-teal-500 dark:bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-teal-500/30 dark:shadow-emerald-600/30 backdrop-blur-sm border border-teal-400/20 dark:border-emerald-500/20 hover:scale-105 active:scale-95 hover:bg-teal-400 dark:hover:bg-emerald-500 transition-all duration-200 ease-out"
              >
                <motion.div
                  animate={{ rotate: isFabOpen ? 45 : 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >
                  <Plus className="w-6 h-6 text-white" />
                </motion.div>
              </button>

              {/* Expanded Menu (Absolute to this container) */}
              {isFabOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute bottom-full right-0 mb-4 flex flex-col gap-3 items-end z-50"
                >
                  {[
                    { label: "Contact Receptionist", icon: MessageSquare, path: "/app/contact-receptionist" },
                    { label: "Track Queue", icon: MapPin, path: "/app/journey-tracker" },
                    { label: "Cancel Appointment", icon: XCircle, path: "/app/appointments", isDestructive: true }
                  ].map((action, i) => (
                    <motion.button
                      key={action.label}
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 0.05 * (3 - i) }}
                      onClick={() => {
                        router.push(action.path);
                        setIsFabOpen(false);
                      }}
                      className="flex items-center gap-3 bg-white dark:bg-[#1A2332] text-slate-800 dark:text-[#F1F5F9] rounded-2xl py-2 px-4 shadow-md border border-slate-100 dark:border-[#2A3A4E] hover:bg-slate-50 dark:hover:bg-[#223040] transition-colors whitespace-nowrap"
                    >
                      <span className={`text-sm font-medium ${action.isDestructive ? 'text-red-600' : ''}`}>{action.label}</span>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        action.isDestructive 
                          ? 'bg-red-50 dark:bg-red-950/30 text-red-500' 
                          : 'bg-teal-50 dark:bg-emerald-500/10 text-teal-600 dark:text-emerald-400'
                      }`}>
                        <action.icon className="w-5 h-5" />
                      </div>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* ---- ROW 4: Recent Lab Reports Table (Desktop, hidden for first-time users) ---- */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className={`${isMobileView || userState === "first-time" || userState === "loading" ? 'hidden' : 'block col-span-12'} bg-white dark:bg-[#1A2332] rounded-2xl shadow-sm border border-gray-100 dark:border-[#2A3A4E] overflow-hidden`}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#2A3A4E]">
              <h3 className="text-gray-900 dark:text-slate-50 font-medium">Recent Lab Reports</h3>
              <button
                onClick={() => router.push("/app/lab-reports")}
                className="text-sm text-teal-500 dark:text-emerald-400 font-medium hover:underline"
              >
                Upload New
              </button>
            </div>
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-500 dark:text-[#94A3B8] uppercase tracking-wider border-b border-gray-100 dark:border-[#2A3A4E]">
                  <th className="text-left px-6 py-3 font-medium">Document</th>
                  <th className="text-left px-6 py-3 font-medium">Type</th>
                  <th className="text-left px-6 py-3 font-medium">Date</th>
                  <th className="text-left px-6 py-3 font-medium">Status</th>
                  <th className="text-right px-6 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {[
                  { name: "Blood Test - Complete Hemogram", type: "Lab Report", date: "Jun 15, 2026", status: "Available" },
                  { name: "X-Ray Chest PA View", type: "Radiology", date: "Jun 10, 2026", status: "Available" },
                  { name: "ECG Report", type: "Cardiology", date: "Jun 5, 2026", status: "Available" },
                  { name: "General Consultation Rx", type: "Prescription", date: "Jun 15, 2026", status: "Active" },
                ].map((record, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-50 dark:border-[#2A3A4E]/50 hover:bg-gray-50 dark:hover:bg-[#223040]/50 transition-colors cursor-pointer"
                    onClick={() => router.push("/app/report-viewer")}
                  >
                    <td className="px-6 py-4">
                      <p className="text-gray-900 dark:text-slate-50 font-medium">{record.name}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-[#94A3B8]">{record.type}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-[#94A3B8]">{record.date}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        record.status === "Available"
                          ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                          : "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-teal-500 dark:text-emerald-400 text-sm font-medium hover:underline">
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </div>

      {/* Overlay to close FAB when clicking outside */}
      {isFabOpen && (
        <div 
          className="fixed inset-0 z-40 bg-transparent" 
          onClick={() => setIsFabOpen(false)}
        />
      )}

    </div>
  );
}

