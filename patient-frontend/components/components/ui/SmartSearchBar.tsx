"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, X, Stethoscope, Building2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

// Mock catalog used by both the booking page and this search bar. Kept small &
// inline for now; when the backend exposes doctor/hospital search, replace this
// with a typed fetch (e.g. `doctorApi.search(query)` + `hospitalApi.search`).
interface SearchableDoctor {
  id: string;
  name: string;
  specialty: string;
  department: string;
  hospitalName: string;
}
interface SearchableHospital {
  id: string;
  name: string;
  location: string;
}

const DOCTORS: SearchableDoctor[] = [];

const HOSPITALS: SearchableHospital[] = [];

import { patientApi } from "@/services/api/patientApi";

export function SmartSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [fetchedDoctors, setFetchedDoctors] = useState<SearchableDoctor[]>([]);
  const [fetchedHospitals, setFetchedHospitals] = useState<SearchableHospital[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [docs, hosps] = await Promise.all([
          patientApi.getDoctors(),
          patientApi.getHospitals()
        ]);
        
        // Map backend responses to the Searchable interfaces
        setFetchedDoctors(docs.map((d: any) => ({
          id: d.id || d.doctor_id,
          name: d.name || d.users?.full_name || 'Doctor',
          specialty: d.specialization || d.specialty || d.departments?.department_name || 'General',
          department: d.dept || d.department || d.departments?.department_name || 'General',
          hospitalName: d.hospitalName || d.hospitals?.hospital_name || 'Hospital'
        })));

        setFetchedHospitals(hosps.map((h: any) => ({
          id: h.id || h.hospital_id,
          name: h.name || h.hospital_name || 'Hospital',
          location: h.address || h.location || 'Unknown'
        })));
      } catch (err) {
        console.error("Failed to fetch catalog:", err);
      }
    })();
  }, []);

  const { doctors, hospitals } = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { doctors: [] as SearchableDoctor[], hospitals: [] as SearchableHospital[] };
    return {
      doctors: fetchedDoctors.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.specialty.toLowerCase().includes(q) ||
          d.department.toLowerCase().includes(q)
      ),
      hospitals: fetchedHospitals.filter(
        (h) => h.name.toLowerCase().includes(q) || h.location.toLowerCase().includes(q)
      ),
    };
  }, [query, fetchedDoctors, fetchedHospitals]);

  const totalResults = doctors.length + hospitals.length;

  // ESC closes the search overlay
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen]);

  const close = () => {
    setIsOpen(false);
    setQuery("");
    inputRef.current?.blur();
  };

  const goToDoctor = (d: SearchableDoctor) => {
    close();
    router.push(
      `/app/booking-details?doctorId=${d.id}&doctorName=${encodeURIComponent(d.name)}&department=${encodeURIComponent(d.department)}`
    );
  };

  const goToHospital = (h: SearchableHospital) => {
    close();
    // Deep-link into the Book page at this hospital's departments step.
    router.push(`/app/book?hospitalId=${h.id}`);
  };

  return (
    <>
      {/* Backdrop that blurs the rest of the screen while the search is open. */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={close}
            className="fixed inset-0 z-[80] bg-black/30 backdrop-blur-xl"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Bar + dropdown container. Elevated above the backdrop when open. */}
      <div className={`relative w-full ${isOpen ? "z-[90]" : ""}`}>
        <div className="w-full bg-white dark:bg-[#1A2332] rounded-full flex items-center justify-between px-4 py-3 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.3)] cursor-text">
          {/* Left input */}
          <div className="flex items-center gap-3 flex-1 overflow-hidden">
            <Search className="w-5 h-5 text-[#042F2E] dark:text-[#94A3B8] shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (!isOpen) setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder="Search doctors, hospitals..."
              className="bg-transparent border-none outline-none text-[#475569] dark:text-[#F1F5F9] text-sm font-medium w-full placeholder:text-[#475569]/70 dark:placeholder:text-[#94A3B8]/70 focus:ring-0"
            />
            {(query || isOpen) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (query) setQuery("");
                  else close();
                }}
                className="text-[#94A3B8] hover:text-[#475569] dark:hover:text-white shrink-0"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Right location */}
          <div className="flex items-center shrink-0">
            <div className="w-[1px] h-6 bg-[#E2E8F0] dark:bg-[#2A3A4E] mx-4" />
            <button className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">
              <MapPin className="w-4 h-4 text-[#FB923C]" />
              <span className="text-[#042F2E] dark:text-[#F1F5F9] text-sm font-bold">Patna</span>
            </button>
          </div>
        </div>

        {/* Results panel */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-[#1A2332] rounded-2xl shadow-2xl border border-gray-100 dark:border-[#2A3A4E] max-h-[60vh] overflow-y-auto p-2"
            >
              {!query.trim() ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm text-gray-500 dark:text-[#94A3B8]">
                    Start typing to search doctors, departments or hospitals.
                  </p>
                </div>
              ) : totalResults === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm text-gray-500 dark:text-[#94A3B8]">
                    No results for &ldquo;{query}&rdquo;.
                  </p>
                </div>
              ) : (
                <div>
                  {doctors.length > 0 && (
                    <div className="mb-1">
                      <p className="px-3 py-2 text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-[#64748B]">
                        Doctors
                      </p>
                      <div className="space-y-1">
                        {doctors.map((d) => (
                          <button
                            key={d.id}
                            onClick={() => goToDoctor(d)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-gray-50 dark:hover:bg-[#223040] transition-colors"
                          >
                            <div className="w-9 h-9 rounded-full bg-teal-50 dark:bg-emerald-600/15 flex items-center justify-center shrink-0">
                              <Stethoscope className="w-4 h-4 text-teal-500 dark:text-emerald-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {d.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-[#94A3B8] truncate">
                                {d.specialty} · {d.hospitalName}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {hospitals.length > 0 && (
                    <div>
                      <p className="px-3 py-2 text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-[#64748B]">
                        Hospitals
                      </p>
                      <div className="space-y-1">
                        {hospitals.map((h) => (
                          <button
                            key={h.id}
                            onClick={() => goToHospital(h)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-gray-50 dark:hover:bg-[#223040] transition-colors"
                          >
                            <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                              <Building2 className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {h.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-[#94A3B8] truncate">
                                {h.location}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
