"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  MapPin,
  Clock,
  Star,
  Users,
  Building2,
  Stethoscope,
  Filter,
  ChevronLeft,
  ChevronDown,
  X,
  Check
} from "lucide-react";
import { useLayout } from "@/contexts/LayoutContext";
import { SpecialtyFilterBar, ALL_SPECIALTIES, type SpecialtyChip } from "@/components/book/SpecialtyFilterBar";
import { doctorApi, type ApiBookingDoctor, type ApiSpecialty } from "@/services/api/doctorApi";
import { hospitalApi, type ApiHospital } from "@/services/api/hospitalApi";
import { useDirectorySocket } from "@/services/socket/socket";
import { useDoctors, useHospitals, useSpecialties } from "@/hooks/useAppData";

// --- Types ---
interface Hospital {
  id: string;
  name: string;
  location: string;
  type: "government" | "private";
  rating: number;
  departments: string[];
}

interface Doctor {
  id: string;
  name: string;
  photo: string;
  department: string;
  specialty: string;
  hospitalId: string;
  rating: number;
  experience: string;
  availableSlots: string[];
  queueLength: number;
}

// --- Backend → UI mapping ---
// The backend's `hospitals` table doesn't (yet) carry the `type` and
// `rating` fields the UI uses for filtering, so we derive sensible
// defaults while still using the real data for everything else. These
// defaults can be replaced once the schema picks up those columns or
// the admin Settings UI exposes them.
function mapApiHospital(h: ApiHospital): Hospital {
  return {
    id: h.id,
    name: h.name,
    location: [h.branchName, h.address].filter(Boolean).join(" • ") || h.address,
    type: "private",
    rating: 4.6,
    departments: h.departments,
  };
}

function getLiveDynamicSlots(): string[] {
  const now = new Date();
  const slots: string[] = [];
  const STANDARD_SLOT_MINS = 15;
  for (let i = 0; i < 8; i++) {
    const d = new Date(now.getTime() + (i * STANDARD_SLOT_MINS * 60000));
    slots.push(d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }));
  }
  return slots;
}

/**
 * Backend → UI mapper. The booking screen's `Doctor` interface has a
 * couple of fields that don't exist in the DB yet (photo, experience
 * as a human string, available time slots, live queue length). We
 * derive or default them here so the rest of the UI is untouched.
 */
function mapApiDoctor(api: ApiBookingDoctor): Doctor {
  const photo = /^(female|f|ms|mrs|miss)/i.test((api.name || "").replace(/^dr\.?\s*/i, ""))
    ? "👩‍⚕️"
    : "👨‍⚕️";
  return {
    id: api.id,
    name: api.name || "Doctor",
    photo,
    department: api.dept || api.specialization || "General",
    specialty: api.focus || api.specialization || api.dept || "General",
    hospitalId: api.hospitalId,
    rating: api.rating || 0,
    experience: api.experience ? `${api.experience} years` : "—",
    availableSlots: (api as any).availableSlots && (api as any).availableSlots.length > 0 ? (api as any).availableSlots : getLiveDynamicSlots(),
    queueLength: typeof (api as any).queueLength === "number" ? (api as any).queueLength : 0,
  };
}

function BookAppointmentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isMobileView } = useLayout();

  // --- Navigation state lives in the URL ---
  //
  // Hospitals → Departments → Doctors is a real navigation hierarchy,
  // so every drill-down updates the URL via `router.push`. Reading
  // these values back out via `searchParams` makes the page fully
  // shareable, refreshable, and — most importantly — gives the
  // browser-back button + the booking-details back arrow something to
  // return to. Local state for these was the original mistake.
  //
  // URL contract:
  //   /app/book                                    → hospitals grid
  //   /app/book?hospitalId=X                       → that hospital's departments
  //   /app/book?hospitalId=X&specialty=Y           → that hospital's Y doctors
  //   /app/book?view=doctors                       → flat all-doctors list
  //   /app/book?view=doctors&specialty=Y           → flat list filtered by Y
  const urlHospitalId = searchParams.get("hospitalId");
  const urlSpecialty = searchParams.get("specialty");
  const urlView = searchParams.get("view");

  const viewMode: "hierarchy" | "flat" =
    urlView === "doctors" || urlView === "flat" ? "flat" : "hierarchy";

  const hierarchyStep: "hospitals" | "departments" | "doctors" =
    viewMode === "flat"
      ? "hospitals" // unused in flat mode; placeholder keeps the model uniform
      : !urlHospitalId
        ? "hospitals"
        : urlSpecialty
          ? "doctors"
          : "departments";

  // --- Ephemeral UI state ---
  const [filterSector, setFilterSector] = useState<"all" | "government" | "private">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [expandedDoctorId, setExpandedDoctorId] = useState<string | null>(null);

  // Drawer stages view-mode locally so the user can preview their
  // choice and commit it via "Apply Filters", matching the existing UX.
  const [drawerViewMode, setDrawerViewMode] = useState<"hierarchy" | "flat">(viewMode);
  const [drawerFilterSector, setDrawerFilterSector] = useState<"all" | "government" | "private">(filterSector);

  const { data: apiDoctors = [], isLoading: isLoadingDoctors, refetch: refetchDoctors } = useDoctors();
  const { data: apiHospitals = [], isLoading: isLoadingHospitals, refetch: refetchHospitals } = useHospitals();
  const { data: apiSpecialties = [], refetch: refetchSpecialties } = useSpecialties();

  // The mapped data
  const doctors = useMemo(() => apiDoctors.map(mapApiDoctor), [apiDoctors]);
  const hospitals = useMemo(() => apiHospitals.map(mapApiHospital), [apiHospitals]);

  // Reset transient UI when the user navigates between hierarchy
  // steps or modes. Without this, the search box text and an open
  // doctor card would leak across pages of the funnel.
  useEffect(() => {
    setSearchQuery("");
    setExpandedDoctorId(null);
  }, [urlHospitalId, urlSpecialty, urlView]);

  // Mirror the current viewMode / filterSector into the drawer when
  // it opens so the radios reflect what's currently in effect.
  useEffect(() => {
    if (isDrawerOpen) {
      setDrawerViewMode(viewMode);
      setDrawerFilterSector(filterSector);
    }
  }, [isDrawerOpen, viewMode, filterSector]);

  // Realtime channel — single subscription that keeps the doctor
  // directory and the hospital→department map in sync as the hospital
  // app mutates them. By calling refetch(), we automatically update
  // the React Query cache which flows down into our useMemo mappings.
  useDirectorySocket({
    onDoctorCreated: () => { refetchDoctors(); },
    onDoctorUpdated: () => { refetchDoctors(); },
    onDoctorDeleted: () => { refetchDoctors(); },
    onDepartmentCreated: () => {
      refetchHospitals();
      refetchSpecialties();
    },
    onDepartmentDeleted: () => {
      refetchHospitals();
      refetchSpecialties();
    },
  });

  // --- URL → state (single source of truth) ---
  // Resolve the hospital model from the URL id once hospitals have
  // loaded. While the list is still empty (initial render), this is
  // null and the doctors step shows the skeleton path.
  const selectedHospital = useMemo<Hospital | null>(
    () =>
      viewMode === "hierarchy" && urlHospitalId
        ? hospitals.find((h) => h.id === urlHospitalId) || null
        : null,
    [viewMode, urlHospitalId, hospitals]
  );

  // In hierarchy mode, ?specialty=… is the chosen department.
  // In flat mode, it's the chip-row filter. They map to different
  // downstream filters (hierarchyDoctors vs filteredFlatDoctors).
  const selectedDepartment = viewMode === "hierarchy" ? urlSpecialty : null;
  const selectedSpecialty = viewMode === "flat" && urlSpecialty ? urlSpecialty : ALL_SPECIALTIES;

  // --- Computed Data ---
  const filteredHospitals = useMemo(() => {
    return hospitals.filter((h) => {
      const matchSector = filterSector === "all" || h.type === filterSector;
      const matchSearch = h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          h.location.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSector && matchSearch;
    });
  }, [hospitals, filterSector, searchQuery]);

  const filteredFlatDoctors = useMemo(() => {
    return doctors.filter((d) => {
      const hospital = hospitals.find(h => h.id === d.hospitalId);
      // If we couldn't find a matching hospital row in the live list,
      // fall back to "all matches" instead of silently filtering the
      // doctor out — the mock doctor list still uses placeholder
      // hospital ids that don't exist server-side yet.
      const matchSector = filterSector === "all" || !hospital || hospital.type === filterSector;
      const matchSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.specialty.toLowerCase().includes(searchQuery.toLowerCase());
      const matchSpecialty = selectedSpecialty === ALL_SPECIALTIES || d.department === selectedSpecialty;
      return matchSector && matchSearch && matchSpecialty;
    });
  }, [hospitals, filterSector, searchQuery, selectedSpecialty]);

  const hierarchyDoctors = useMemo(() => {
    if (!selectedHospital || !selectedDepartment) return [];
    return doctors.filter(d => d.hospitalId === selectedHospital.id && d.department === selectedDepartment);
  }, [doctors, selectedHospital, selectedDepartment]);

  // Chip-row source list. Priority:
  //   1. backend `/api/doctors/specialties` response (real, authoritative)
  //   2. specialties derived from the currently-loaded doctor list
  // Either way the row is data-driven — adding a new department on the
  // hospital side automatically surfaces here.
  const displaySpecialties: SpecialtyChip[] = useMemo(() => {
    if (apiSpecialties.length > 0) {
      return apiSpecialties.map((s) => ({ name: s.name, count: s.count }));
    }
    const counts = new Map<string, number>();
    for (const d of doctors) counts.set(d.department, (counts.get(d.department) || 0) + 1);
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [apiSpecialties, doctors]);

  const totalDoctorCount = useMemo(
    () => (apiSpecialties.length > 0 ? apiSpecialties.reduce((sum, s) => sum + s.count, 0) : doctors.length),
    [apiSpecialties, doctors]
  );

  // --- Handlers ---
  // All navigation transitions go through router.push so the URL stays
  // in lockstep with what the user sees. The useEffect at the top
  // resets transient UI (search box, expanded card) automatically.
  const pushBookUrl = useCallback(
    (params: Record<string, string | undefined>) => {
      const qs = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== "") qs.set(k, v);
      }
      const suffix = qs.toString();
      router.push(suffix ? `/app/book?${suffix}` : "/app/book");
    },
    [router]
  );

  const handleHospitalSelect = (hospital: Hospital) => {
    pushBookUrl({ hospitalId: hospital.id });
  };

  const handleDepartmentSelect = (dept: string) => {
    if (!urlHospitalId) return;
    pushBookUrl({ hospitalId: urlHospitalId, specialty: dept });
  };

  // Intra-page back: doctors → departments → hospitals → (leave page).
  const handleBack = () => {
    if (hierarchyStep === "doctors" && urlHospitalId) {
      pushBookUrl({ hospitalId: urlHospitalId });
    } else if (hierarchyStep === "departments") {
      pushBookUrl({});
    }
  };

  const handleSelectSpecialty = (specialty: string) => {
    // Specialty chip-row only renders in flat mode. ALL_SPECIALTIES is
    // a sentinel for "no filter" — drop the param in that case so the
    // URL stays clean and reflects the actual filter state.
    pushBookUrl({
      view: "doctors",
      specialty: specialty === ALL_SPECIALTIES ? undefined : specialty,
    });
  };

  const applyFilters = () => {
    setFilterSector(drawerFilterSector);
    if (drawerViewMode === "flat") {
      pushBookUrl({ view: "doctors" });
    } else {
      pushBookUrl({});
    }
    setIsDrawerOpen(false);
  };

  // --- Search Placeholder ---
  let searchPlaceholder = "Search...";
  if (viewMode === "flat") {
    searchPlaceholder = "Search doctors, specialties...";
  } else if (hierarchyStep === "hospitals") {
    searchPlaceholder = "Search hospitals, locations...";
  } else if (hierarchyStep === "departments") {
    searchPlaceholder = "Search departments...";
  } else if (hierarchyStep === "doctors") {
    searchPlaceholder = "Search doctors...";
  }

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: -20 },
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B0F14] relative flex flex-col">
      {/* Mobile Header */}
      <div className={`${isMobileView ? '' : 'lg:hidden'} sticky top-0 z-40 bg-gradient-to-br from-teal-400 to-teal-500 dark:from-[#064E3B] dark:via-[#047857] dark:to-[#065F46] pt-[calc(env(safe-area-inset-top)+3.5rem)] pb-8 px-6 rounded-b-[40px] shadow-lg shadow-teal-900/20 dark:shadow-emerald-900/30 shrink-0`}>
        <div className="flex items-center justify-between mb-6">
          <motion.h1
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-xl text-white font-semibold line-clamp-1 mr-4"
          >
            {hierarchyStep === "hospitals" || viewMode === "flat" ? "Book Appointment" : selectedHospital?.name}
          </motion.h1>
          <motion.button 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setIsDrawerOpen(true)}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white shrink-0"
          >
            <Filter className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Search Bar */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-[#1A2332] rounded-2xl px-4 py-3 flex items-center shadow-lg shadow-teal-500/20 dark:shadow-black/20"
        >
          <Search className="w-5 h-5 text-gray-400 mr-3 shrink-0" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 outline-none text-gray-900 dark:text-[#F1F5F9] bg-transparent min-w-0"
          />
        </motion.div>
      </div>

      {/* Desktop Header */}
      <div className={`${isMobileView ? 'hidden' : 'hidden lg:block'} pt-8 px-8 mb-6 shrink-0`}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {hierarchyStep === "hospitals" || viewMode === "flat" ? "Book Appointment" : selectedHospital?.name}
            </h1>
            <p className="text-gray-500 mt-2">
              {hierarchyStep === "hospitals" && viewMode === "hierarchy" && "Select a hospital to view departments"}
              {hierarchyStep === "departments" && "Select a specialized department"}
              {hierarchyStep === "doctors" && "Choose a doctor to schedule your visit"}
              {viewMode === "flat" && "Find doctors and schedule your visit"}
            </p>
          </div>
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-[#1A2332] border border-gray-200 dark:border-[#2A3A4E] rounded-xl text-gray-700 dark:text-[#94A3B8] hover:bg-gray-50 dark:hover:bg-[#223040] transition-colors shadow-sm"
          >
            <Filter className="w-4 h-4" />
            <span className="font-medium text-sm">Filter & Sort</span>
          </button>
        </div>

        {/* Search Bar Desktop */}
         <div className="flex-1 flex items-center bg-white dark:bg-[#1A2332] border border-gray-200 dark:border-[#2A3A4E] rounded-xl px-4 py-3 max-w-2xl shadow-sm">
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 outline-none text-gray-900 dark:text-white bg-transparent"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 px-6 pt-6 pb-24 ${isMobileView ? '' : 'lg:px-8'}`}>
        
        {/* Back Button for Hierarchy */}
        {viewMode === "hierarchy" && hierarchyStep !== "hospitals" && (
          <button 
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-500 dark:text-[#94A3B8] hover:text-teal-500 dark:hover:text-emerald-400 transition-colors mb-6 font-medium text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to {hierarchyStep === "departments" ? "Hospitals" : "Departments"}
          </button>
        )}

        <AnimatePresence mode="wait">
          {viewMode === "hierarchy" && hierarchyStep === "hospitals" && (
            <motion.div
              key="hospitals"
              initial="initial" animate="in" exit="out" variants={pageVariants} transition={{ duration: 0.2 }}
              className={`space-y-3 ${isMobileView ? '' : 'lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-4 lg:space-y-0'}`}
            >
              {filteredHospitals.map((h, i) => (
                <div 
                  key={h.id} 
                  onClick={() => handleHospitalSelect(h)}
                  className="bg-white dark:bg-[#1A2332] rounded-2xl p-3 shadow-sm border border-gray-100 dark:border-[#2A3A4E] cursor-pointer hover:shadow-md hover:border-teal-500/30 dark:hover:border-emerald-500/30 transition-all group"
                >
                  <div className="flex justify-between items-start mb-2.5">
                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/20 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Building2 className="w-5 h-5 text-blue-500" />
                    </div>
                    <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${h.type === 'government' ? 'bg-teal-100 dark:bg-emerald-500/10 text-teal-700 dark:text-emerald-400' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'}`}>
                      {h.type}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-0.5 group-hover:text-teal-500 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">{h.name}</h3>
                  <div className="flex items-center text-gray-500 dark:text-[#94A3B8] text-xs mb-3">
                    <MapPin className="w-3.5 h-3.5 mr-1 shrink-0" />
                    <span className="line-clamp-1">{h.location}</span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-[#2A3A4E]">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs font-medium text-gray-700 dark:text-[#94A3B8]">{h.rating}</span>
                    </div>
                    <span className="text-[11px] text-gray-500 dark:text-[#94A3B8]">{h.departments.length} Departments</span>
                  </div>
                </div>
              ))}
              {isLoadingHospitals && filteredHospitals.length === 0 && (
                <>
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div
                      key={`hospital-skeleton-${idx}`}
                      className="bg-white dark:bg-[#1A2332] rounded-2xl p-3 shadow-sm border border-gray-100 dark:border-[#2A3A4E] animate-pulse"
                    >
                      <div className="flex justify-between items-start mb-2.5">
                        <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-[#22324A]" />
                      </div>
                      <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-[#22324A] mb-2" />
                      <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-[#22324A] mb-4" />
                      <div className="h-3 w-1/3 rounded bg-gray-200 dark:bg-[#22324A]" />
                    </div>
                  ))}
                </>
              )}
              {!isLoadingHospitals && filteredHospitals.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-500">
                  {hospitals.length === 0
                    ? "No hospitals available yet. Once an admin sets one up it will appear here."
                    : "No hospitals found matching your criteria."}
                </div>
              )}
            </motion.div>
          )}

          {viewMode === "hierarchy" && hierarchyStep === "departments" && (
            <motion.div
              key="departments"
              initial="initial" animate="in" exit="out" variants={pageVariants} transition={{ duration: 0.2 }}
              className={`space-y-3 ${isMobileView ? '' : 'lg:grid lg:grid-cols-3 xl:grid-cols-4 lg:gap-4 lg:space-y-0'}`}
            >
              {selectedHospital?.departments.filter(d => d.toLowerCase().includes(searchQuery.toLowerCase())).map((dept, i) => (
                <div
                  key={dept}
                  onClick={() => handleDepartmentSelect(dept)}
                  className="bg-white dark:bg-[#1A2332] rounded-2xl p-3 shadow-sm border border-gray-100 dark:border-[#2A3A4E] flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-[#223040] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center">
                      <Stethoscope className="w-5 h-5 text-teal-600 dark:text-emerald-400" />
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">{dept}</span>
                  </div>
                  <ChevronLeft className="w-5 h-5 text-gray-300 rotate-180" />
                </div>
              ))}
            </motion.div>
          )}

          {(viewMode === "flat" || (viewMode === "hierarchy" && hierarchyStep === "doctors")) && (
            <motion.div
              key="doctors"
              initial="initial" animate="in" exit="out" variants={pageVariants} transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Specialty chip-row — visible only in the flat directory view.
                  Inside the hierarchy flow the user has already chosen a
                  department, so re-filtering by specialty would be redundant.
                  `pt-1` keeps the active chip's ring clear of the green
                  hero card sitting just above it. */}
              {viewMode === "flat" && (
                <div className="-mx-1 pt-1">
                  <SpecialtyFilterBar
                    specialties={displaySpecialties}
                    selectedSpecialty={selectedSpecialty}
                    onSelect={handleSelectSpecialty}
                    totalCount={totalDoctorCount}
                  />
                </div>
              )}

              <div className={isMobileView ? "space-y-4" : "lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6 space-y-4 lg:space-y-0"}>
              {(viewMode === "flat" ? filteredFlatDoctors : hierarchyDoctors).map((doctor, index) => {
                const docHospital = hospitals.find(h => h.id === doctor.hospitalId);
                return (
                  <div
                    key={doctor.id}
                    className="bg-white dark:bg-[#1A2332] rounded-3xl p-3 shadow-sm border border-gray-100 dark:border-[#2A3A4E] cursor-pointer hover:border-teal-500/30 dark:hover:border-emerald-500/30 transition-colors"
                    onClick={() => setExpandedDoctorId(expandedDoctorId === doctor.id ? null : doctor.id)}
                  >
                    {/* Compact View (Always Visible) */}
                    <div className="flex items-center">
                      <div className="text-3xl mr-4">{doctor.photo}</div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-0.5">{doctor.name}</h3>
                            <div className="flex items-center">
                              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-1" />
                              <span className="text-sm font-medium dark:text-[#94A3B8]">{doctor.rating}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${docHospital?.type === 'government' ? 'bg-teal-100 dark:bg-emerald-500/10 text-teal-700 dark:text-emerald-400' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'}`}>
                              {docHospital?.type.substring(0, 3)}
                            </span>
                            <motion.div animate={{ rotate: expandedDoctorId === doctor.id ? 180 : 0 }}>
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            </motion.div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded View */}
                    <AnimatePresence>
                      {expandedDoctorId === doctor.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-4 mt-4 border-t border-gray-100 dark:border-[#2A3A4E]">
                            <p className="text-sm text-teal-500 dark:text-emerald-400 font-medium mb-2">{doctor.specialty}</p>
                            <div className="flex items-center mb-4">
                              <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                              <p className="text-sm text-gray-600 dark:text-[#94A3B8] line-clamp-1">{docHospital?.name}</p>
                            </div>
                            
                            <div className="flex items-center gap-5 mb-5">
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 text-gray-400 mr-2" />
                                <span className="text-sm text-gray-600 dark:text-[#94A3B8]">Wait: ~{doctor.queueLength * 10} mins</span>
                              </div>
                              <div className="flex items-center">
                                <Users className="w-4 h-4 text-gray-400 mr-2" />
                                <span className="text-sm text-gray-600 dark:text-[#94A3B8]">Current: #{40 + doctor.queueLength}</span>
                              </div>
                            </div>

                            <div className="mb-5">
                              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide font-medium">Available Slots</p>
                              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                                {doctor.availableSlots.map((slot, i) => (
                                  <div key={i} className="px-3 py-1.5 bg-gray-50 dark:bg-[#223040] text-gray-700 dark:text-[#94A3B8] rounded-lg text-xs font-medium whitespace-nowrap border border-gray-100 dark:border-[#2A3A4E]">
                                    {slot}
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="flex gap-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Carry hospitalId alongside doctorId/department so the
                                  // booking-details back-button can restore the exact
                                  // hospital + department doctor list the user came from
                                  // (not just "all hospitals with this specialty").
                                  const params = new URLSearchParams({
                                    doctorId: String(doctor.id),
                                    doctorName: doctor.name,
                                    department: doctor.department,
                                    hospitalId: String(doctor.hospitalId),
                                    hospitalName: docHospital?.name || "",
                                  });
                                  router.push(`/app/booking-details?${params.toString()}`);
                                }}
                                className="flex-1 bg-teal-500 dark:bg-emerald-600 text-white py-3 rounded-2xl font-medium shadow-sm shadow-teal-500/20 dark:shadow-emerald-600/20 hover:bg-[#4bc29a] dark:hover:bg-emerald-500 transition-colors"
                              >
                                Book Visit
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
              {(() => {
                // Hierarchy doctors step depends on `selectedHospital`
                // being resolved against the loaded hospitals list, so
                // we treat "hospitals still loading + URL says we need
                // one" as a loading state rather than letting the empty
                // filter result trigger a false "no doctors" message.
                const visibleList = viewMode === "flat" ? filteredFlatDoctors : hierarchyDoctors;
                const stillResolvingHospital =
                  viewMode === "hierarchy" && urlHospitalId && !selectedHospital && isLoadingHospitals;
                const isLoading = isLoadingDoctors || stillResolvingHospital;

                if (isLoading && visibleList.length === 0) {
                  return (
                    <>
                      {Array.from({ length: 4 }).map((_, idx) => (
                        <div
                          key={`doctor-skeleton-${idx}`}
                          className="bg-white dark:bg-[#1A2332] rounded-3xl p-3 shadow-sm border border-gray-100 dark:border-[#2A3A4E] animate-pulse"
                        >
                          <div className="flex items-center">
                            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-[#22324A] mr-4" />
                            <div className="flex-1">
                              <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-[#22324A] mb-2" />
                              <div className="h-3 w-1/3 rounded bg-gray-200 dark:bg-[#22324A]" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  );
                }

                if (!isLoading && visibleList.length === 0) {
                  return (
                    <div className="col-span-full py-12 text-center text-gray-500">
                      {doctors.length === 0
                        ? "No doctors registered yet. They'll show up here the moment a hospital adds them."
                        : viewMode === "flat" && selectedSpecialty !== ALL_SPECIALTIES
                        ? `No ${selectedSpecialty} doctors found matching your criteria.`
                        : "No doctors found matching your criteria."}
                    </div>
                  );
                }

                return null;
              })()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Filter Drawer Overlay */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/40 z-[200] backdrop-blur-sm"
            />
            
            <motion.div
              initial={isMobileView ? { y: "100%" } : { opacity: 0, scale: 0.95, y: "-50%", x: "-50%" }}
              animate={isMobileView ? { y: 0 } : { opacity: 1, scale: 1, y: "-50%", x: "-50%" }}
              exit={isMobileView ? { y: "100%" } : { opacity: 0, scale: 0.95, y: "-50%", x: "-50%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={`fixed z-[210] bg-white dark:bg-[#111820] shadow-2xl flex flex-col
                ${isMobileView 
                  ? "bottom-0 left-0 right-0 rounded-t-[32px] max-h-[85vh]" 
                  : "top-1/2 left-1/2 w-full max-w-md rounded-3xl"
                }`}
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-[#2A3A4E] shrink-0">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Filter & Sort</h2>
                <button onClick={() => setIsDrawerOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-[#1A2332] text-gray-500 dark:text-[#94A3B8] hover:bg-gray-200 dark:hover:bg-[#223040] transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="p-6 overflow-y-auto space-y-8 flex-1">
                <DrawerSection 
                  title="View Layout" 
                  options={[
                    { id: "hierarchy", label: "Group by Hospital", desc: "Select hospital -> department -> doctor" },
                    { id: "flat", label: "List all Doctors", desc: "Direct directory of all doctors" }
                  ]}
                  value={drawerViewMode}
                  onChange={(val) => setDrawerViewMode(val as "hierarchy" | "flat")}
                />
                
                <DrawerSection 
                  title="Hospital Sector" 
                  options={[
                    { id: "all", label: "All Sectors" },
                    { id: "government", label: "Government Only" },
                    { id: "private", label: "Private Only" }
                  ]}
                  value={drawerFilterSector}
                  onChange={(val) => setDrawerFilterSector(val as "all" | "government" | "private")}
                />
              </div>

              {/* Drawer Footer */}
              <div className="p-6 border-t border-gray-100 dark:border-[#2A3A4E] shrink-0 bg-white dark:bg-[#111820] rounded-b-3xl">
                <button 
                  onClick={applyFilters}
                  className="w-full bg-teal-500 dark:bg-emerald-600 text-white py-4 rounded-2xl font-semibold shadow-lg shadow-teal-500/25 dark:shadow-emerald-600/25 hover:bg-[#4bc29a] dark:hover:bg-emerald-500 transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function BookAppointment() {
  return (
    <Suspense fallback={<div className="min-h-full flex items-center justify-center">Loading...</div>}>
      <BookAppointmentContent />
    </Suspense>
  );
}

// --- Helper Component for Drawer ---
function DrawerSection({ title, options, value, onChange }: { 
  title: string, 
  options: {id: string, label: string, desc?: string}[], 
  value: string, 
  onChange: (val: string) => void 
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 uppercase tracking-wider">{title}</h3>
      <div className="space-y-3">
        {options.map((opt) => (
          <div 
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`flex items-center p-4 rounded-2xl border-2 cursor-pointer transition-all ${value === opt.id ? 'border-teal-500 dark:border-emerald-500 bg-teal-500 dark:bg-emerald-600/5 dark:bg-emerald-500/5' : 'border-gray-100 dark:border-[#2A3A4E] hover:border-gray-200 dark:hover:border-[#3A4A5E]'}`}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 shrink-0 transition-colors ${value === opt.id ? 'border-teal-500 dark:border-emerald-500 bg-teal-500 dark:bg-emerald-500' : 'border-gray-300 dark:border-[#64748B]'}`}>
              {value === opt.id && <Check className="w-3 h-3 text-white" />}
            </div>
            <div>
              <p className={`font-medium ${value === opt.id ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-[#94A3B8]'}`}>{opt.label}</p>
              {opt.desc && <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
