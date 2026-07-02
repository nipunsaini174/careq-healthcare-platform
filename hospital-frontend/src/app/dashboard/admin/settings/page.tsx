"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Hospital, User, Bell, Shield, Database, Palette,
  Save, ChevronRight, Mail, Phone, MapPin, Clock, Users,
  X, Plus, Loader2
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { toast } from "sonner";
import {
  hospitalApi,
  type HospitalDepartment,
  type HospitalProfile,
} from "@/services/hospitalApi";

interface ProfileFormState {
  hospital_name: string;
  registration_no: string;
  phone: string;
  email: string;
  address: string;
  working_hours: string;
}

const EMPTY_PROFILE: ProfileFormState = {
  hospital_name: "",
  registration_no: "",
  phone: "",
  email: "",
  address: "",
  working_hours: "",
};

function toFormState(p: HospitalProfile): ProfileFormState {
  return {
    hospital_name: p.hospital_name,
    registration_no: p.registration_no,
    phone: p.phone,
    email: p.email,
    address: p.address,
    working_hours: p.working_hours,
  };
}

function extractError(err: unknown, fallback: string): string {
  if (typeof err === "object" && err !== null) {
    const anyErr = err as any;
    return anyErr.response?.data?.error || anyErr.message || fallback;
  }
  return fallback;
}

const settingsSections = [
  { key: "hospital", icon: Hospital, label: "Hospital Profile" },
  { key: "queue", icon: Users, label: "Queue Capacity" },
  { key: "account", icon: User, label: "Admin Account" },
  { key: "notifications", icon: Bell, label: "Notifications" },
  { key: "security", icon: Shield, label: "Security" },
  { key: "backup", icon: Database, label: "Data & Backup" },
  { key: "appearance", icon: Palette, label: "Appearance" },
];

const notifSettings = [
  { label: "New Patient Registered", desc: "Alert when a new patient is registered", enabled: true },
  { label: "Emergency Alerts", desc: "Immediate notification for emergency cases", enabled: true },
  { label: "Low Inventory Alert", desc: "Notify when stock falls below minimum", enabled: true },
  { label: "Appointment Reminders", desc: "Reminder 30 min before appointments", enabled: false },
  { label: "Daily Summary Report", desc: "End-of-day operations summary", enabled: true },
  { label: "Doctor No-Show Alert", desc: "Alert if doctor is absent without notice", enabled: false },
  { label: "Queue Overflow Warning", desc: "Notify when queue exceeds capacity", enabled: true },
];

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="relative w-11 h-6 rounded-full transition-all duration-200 flex-shrink-0 cursor-pointer outline-none"
      style={{ background: enabled ? "linear-gradient(135deg, #58D0A7, #3AB58F)" : "#E5E7EB" }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-5 h-5 bg-white dark:bg-gray-900 rounded-full shadow transition-all duration-200"
        style={{ transform: enabled ? "translateX(20px)" : "translateX(0)" }}
      />
    </button>
  );
}

function StatefulToggleRow({ label, desc, initialEnabled }: { label: string, desc?: string, initialEnabled: boolean }) {
  const [en, setEn] = useState(initialEnabled);
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-800">
      <div>
        <p className="text-gray-800 dark:text-gray-200 font-bold" style={{ fontSize: "13px" }}>{label}</p>
        {desc && <p className="text-gray-400 mt-0.5" style={{ fontSize: "11px" }}>{desc}</p>}
      </div>
      <Toggle enabled={en} onToggle={() => setEn(!en)} />
    </div>
  );
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("hospital");
  const [capacity, setCapacity] = useState({ new: 40, followup: 30, walkin: 30 });

  // Hospital profile + departments are loaded from the backend; these
  // are the canonical source of truth, not hardcoded values.
  const [profileForm, setProfileForm] = useState<ProfileFormState>(EMPTY_PROFILE);
  const [departments, setDepartments] = useState<HospitalDepartment[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [isEditDeptOpen, setIsEditDeptOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [isAddingDept, setIsAddingDept] = useState(false);

  const [notifications, setNotifications] = useState(notifSettings);
  const [saved, setSaved] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, loading: authLoading } = useAuth();
  const { socket } = useSocket();

  // Load the hospital profile + departments as soon as the admin
  // session is ready. We wait on authLoading so the dev bootstrap
  // call (AuthContext) has time to land a real JWT in the cookie
  // before our request fires.
  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;

    (async () => {
      setIsLoadingProfile(true);
      try {
        const hospital = await hospitalApi.getMyHospital();
        if (cancelled) return;
        setProfileForm(toFormState(hospital));
        setDepartments(hospital.departments);
      } catch (err) {
        if (!cancelled) {
          toast.error(extractError(err, "Failed to load hospital profile"));
        }
      } finally {
        if (!cancelled) setIsLoadingProfile(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading]);

  function updateField<K extends keyof ProfileFormState>(key: K, value: ProfileFormState[K]) {
    setProfileForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    // Only the Hospital Profile section persists to the backend right
    // now. The other tabs (queue/notifications/etc.) stay client-side
    // until their own endpoints exist.
    if (activeSection !== "hospital") {
      setSaved(true);
      toast.success("Settings saved (local only for this section)");
      setTimeout(() => setSaved(false), 1800);
      return;
    }

    try {
      setIsSaving(true);
      await hospitalApi.updateMyHospital({
        hospital_name: profileForm.hospital_name,
        registration_no: profileForm.registration_no,
        phone: profileForm.phone,
        email: profileForm.email,
        address: profileForm.address,
        working_hours: profileForm.working_hours,
      });
      setSaved(true);
      toast.success("Hospital profile saved!");
      setTimeout(() => setSaved(false), 1800);
    } catch (err) {
      toast.error(extractError(err, "Could not save hospital profile"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAddDepartment() {
    const name = newDeptName.trim();
    if (!name) return;
    try {
      setIsAddingDept(true);
      const created = await hospitalApi.addDepartment({ name });
      setDepartments((prev) => [...prev, created]);
      setNewDeptName("");
      toast.success(`Added "${created.department_name}"`);
    } catch (err) {
      toast.error(extractError(err, "Could not add department"));
    } finally {
      setIsAddingDept(false);
    }
  }

  async function handleDeleteDepartment(departmentId: string) {
    const target = departments.find((d) => d.department_id === departmentId);
    try {
      await hospitalApi.deleteDepartment(departmentId);
      setDepartments((prev) => prev.filter((d) => d.department_id !== departmentId));
      if (target) toast.success(`Removed "${target.department_name}"`);
    } catch (err) {
      toast.error(extractError(err, "Could not delete department"));
    }
  }

  function toggleNotif(idx: number) {
    setNotifications((prev) => prev.map((n, i) => i === idx ? { ...n, enabled: !n.enabled } : n));
  }

  function handleCapacityChange(key: keyof typeof capacity, newValue: number) {
    setCapacity((prev) => {
      const otherKeys = (Object.keys(prev) as Array<keyof typeof capacity>).filter((k) => k !== key);
      const oldValue = prev[key];
      let diff = newValue - oldValue;

      if (diff === 0) return prev;

      const newValues = { ...prev };
      newValues[key] = newValue;

      if (diff > 0) {
        let remainingToTake = diff;
        for (const k of otherKeys) {
          const take = Math.min(newValues[k], remainingToTake);
          newValues[k] -= take;
          remainingToTake -= take;
        }
        if (remainingToTake > 0) {
          newValues[key] -= remainingToTake;
        }
      } else {
        newValues[otherKeys[0]] += Math.abs(diff);
      }

      return newValues;
    });
  }

  return (
    <div className="flex flex-col gap-5 pt-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 dark:text-gray-100" style={{ fontSize: "20px", fontWeight: 700 }}>Settings</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5" style={{ fontSize: "13px" }}>Manage hospital system configuration</p>
        </div>
        <motion.button
          onClick={handleSave}
          disabled={isSaving || isLoadingProfile}
          animate={{ background: saved ? ["linear-gradient(135deg, #22C55E, #16A34A)"] : ["linear-gradient(135deg, #58D0A7, #3AB58F)"] }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white hover:opacity-90 transition-all cursor-pointer text-xs font-bold disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
        </motion.button>
      </div>

      <div className="flex gap-5">
        {/* Left nav */}
        <div className="w-52 flex-shrink-0">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-2">
            {settingsSections.map((s) => {
              const Icon = s.icon;
              const isActive = activeSection === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => setActiveSection(s.key)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all mb-0.5 text-left cursor-pointer"
                  style={{ background: isActive ? "linear-gradient(135deg, #58D0A7, #3AB58F)" : "transparent", color: isActive ? "white" : "#6B7280" }}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" style={{ color: isActive ? "white" : "#9CA3AF" }} />
                  <span style={{ fontSize: "12px", fontWeight: isActive ? 600 : 500 }}>{s.label}</span>
                  {isActive && <ChevronRight className="w-3 h-3 ml-auto text-white/70" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeSection === "hospital" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
              <h2 className="text-gray-800 dark:text-gray-200 mb-5" style={{ fontSize: "16px", fontWeight: 700 }}>Hospital Profile</h2>

              {isLoadingProfile ? (
                <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 py-10 justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span style={{ fontSize: "13px" }}>Loading hospital profile…</span>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {(
                      [
                        { key: "hospital_name", label: "Hospital Name", icon: Hospital },
                        { key: "registration_no", label: "Registration Number", icon: Shield },
                        { key: "phone", label: "Phone Number", icon: Phone },
                        { key: "email", label: "Email Address", icon: Mail },
                        { key: "address", label: "Address", icon: MapPin, span: 2 },
                        { key: "working_hours", label: "Working Hours", icon: Clock, span: 2 },
                      ] as Array<{
                        key: keyof ProfileFormState;
                        label: string;
                        icon: typeof Hospital;
                        span?: number;
                      }>
                    ).map((f) => {
                      const Icon = f.icon;
                      return (
                        <div key={f.key} className={f.span === 2 ? "col-span-2" : ""}>
                          <label className="text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-1.5 block" style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase" }}>
                            <Icon className="w-3 h-3" /> {f.label}
                          </label>
                          <input
                            value={profileForm[f.key]}
                            onChange={(e) => updateField(f.key, e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 outline-none focus:border-green-400 transition-colors"
                            style={{ fontSize: "13px" }}
                          />
                        </div>
                      );
                    })}
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-gray-500 dark:text-gray-400 block" style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase" }}>Departments</label>
                      <button onClick={() => setIsEditDeptOpen(true)} className="text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400 transition-colors text-xs font-semibold cursor-pointer">
                        Edit Departments
                      </button>
                    </div>
                    {departments.length === 0 ? (
                      <p className="text-gray-400 italic" style={{ fontSize: "12px" }}>
                        No departments yet. Click &ldquo;Edit Departments&rdquo; to add one.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {departments.map((dept) => (
                          <span key={dept.department_id} className="px-3 py-1 rounded-full" style={{ background: "#EEF9F5", color: "#3AB58F", fontSize: "12px", fontWeight: 600 }}>{dept.department_name}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {activeSection === "queue" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
              <h2 className="text-gray-800 dark:text-gray-200 mb-5" style={{ fontSize: "16px", fontWeight: 700 }}>Queue & Capacity Split</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6" style={{ fontSize: "13px" }}>Adjust daily allocations for different patient types.</p>
              
              <div className="space-y-6 mb-8">
                {[
                  { key: "new", label: "New Appointment", color: "#6366F1" },
                  { key: "followup", label: "Follow-up Appointment", color: "#3AB58F" },
                  { key: "walkin", label: "Walk-in Patients", color: "#F97316" }
                ].map(param => (
                  <div key={param.key}>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-gray-700 dark:text-gray-300 font-semibold" style={{ fontSize: "13px" }}>{param.label}</label>
                      <span className="font-bold" style={{ color: param.color, fontSize: "14px" }}>{capacity[param.key as keyof typeof capacity]}%</span>
                    </div>
                    <input 
                      type="range" 
                      value={capacity[param.key as keyof typeof capacity]} 
                      onChange={(e) => handleCapacityChange(param.key as keyof typeof capacity, parseInt(e.target.value))}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer" 
                      style={{ background: "#E5E7EB", accentColor: param.color }} 
                    />
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => {
                    if (socket) {
                      socket.emit("trigger_queue_command", { action: "Walk-in Capacity" });
                      toast.success("Capacity split updated successfully!");
                    } else {
                      toast.error("Socket not connected.");
                    }
                  }}
                  className="w-full py-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                  style={{ fontSize: "13px" }}
                >
                  Save Capacity Configuration
                </button>
              </div>
            </motion.div>
          )}

          {activeSection === "account" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
              <h2 className="text-gray-800 dark:text-gray-200 mb-5" style={{ fontSize: "16px", fontWeight: 700 }}>Admin Account</h2>
              <div className="flex items-center gap-4 mb-6 p-4 rounded-xl" style={{ background: "#EEF9F5" }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #58D0A7, #3AB58F)" }}>
                  <span className="text-white" style={{ fontSize: "20px", fontWeight: 700 }}>{user?.displayName ? user.displayName.slice(0, 2) : "AM"}</span>
                </div>
                <div>
                  <p className="text-gray-800 dark:text-gray-200" style={{ fontSize: "16px", fontWeight: 700 }}>{user?.displayName || "Dr. Admin"}</p>
                  <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: "12px" }}>{user?.email || "admin@stmarys.in"}</p>
                  <button onClick={() => toast.info("Upload Admin Avatar coming soon.")} className="mt-1 text-green-600 hover:underline cursor-pointer" style={{ fontSize: "11px", fontWeight: 600 }}>Change Photo</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Full Name", value: user?.displayName || "Dr. Admin Manager" },
                  { label: "Role", value: "Super Administrator" },
                  { label: "Email", value: user?.email || "admin@stmarys.in" },
                  { label: "Phone", value: "+91 98765 43210" },
                  { label: "Current Password", value: "", placeholder: "Enter current password", type: "password" },
                  { label: "New Password", value: "", placeholder: "Enter new password", type: "password" },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="text-gray-500 dark:text-gray-400 mb-1.5 block" style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase" }}>{f.label}</label>
                    <input
                      type={f.type || "text"}
                      defaultValue={f.value}
                      placeholder={f.placeholder || ""}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 outline-none focus:border-green-400 transition-colors"
                      style={{ fontSize: "13px" }}
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeSection === "notifications" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
              <h2 className="text-gray-800 dark:text-gray-200 mb-5" style={{ fontSize: "16px", fontWeight: 700 }}>Notification Preferences</h2>
              <div className="space-y-1">
                {notifications.map((n, i) => (
                  <div key={n.label} className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 dark:bg-gray-800 transition-colors">
                    <div>
                      <p className="text-gray-800 dark:text-gray-200 font-bold" style={{ fontSize: "13px" }}>{n.label}</p>
                      <p className="text-gray-400 mt-0.5" style={{ fontSize: "11px" }}>{n.desc}</p>
                    </div>
                    <Toggle enabled={n.enabled} onToggle={() => toggleNotif(i)} />
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeSection === "security" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
              <h2 className="text-gray-800 dark:text-gray-200 mb-5" style={{ fontSize: "16px", fontWeight: 700 }}>Security Settings</h2>
              <div className="space-y-3">
                {[
                  { label: "Two-Factor Authentication", desc: "Require OTP on every login", enabled: true },
                  { label: "Session Timeout (30 min)", desc: "Auto logout after inactivity", enabled: true },
                  { label: "Login Activity Log", desc: "Record all login attempts", enabled: true },
                  { label: "IP Whitelist", desc: "Restrict access to known IPs", enabled: false },
                  { label: "Audit Trail", desc: "Log all admin actions", enabled: true },
                ].map((s) => (
                  <StatefulToggleRow key={s.label} label={s.label} desc={s.desc} initialEnabled={s.enabled} />
                ))}
              </div>
            </motion.div>
          )}

          {activeSection === "backup" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
              <h2 className="text-gray-800 dark:text-gray-200 mb-5" style={{ fontSize: "16px", fontWeight: 700 }}>Data & Backup</h2>
              <div className="space-y-4">
                <div className="p-4 rounded-xl" style={{ background: "#EEF9F5" }}>
                  <p className="text-gray-700 dark:text-gray-300 font-bold" style={{ fontSize: "13px" }}>Last Backup</p>
                  <p className="text-gray-500 dark:text-gray-400 mt-1" style={{ fontSize: "12px" }}>Today at 03:00 AM — Automatic daily backup completed successfully (47 GB archived to Cloud)</p>
                </div>
                {["Auto Backup (Daily 3:00 AM)", "Cloud Sync (AWS S3)", "Encrypt Backups", "Retain 30-Day History"].map((item) => (
                  <StatefulToggleRow key={item} label={item} initialEnabled={true} />
                ))}
                <button type="button" onClick={() => toast.success("Manual database backup initiated successfully!")} className="w-full py-2.5 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-green-400 hover:text-green-600 transition-all text-xs font-bold cursor-pointer">
                  Run Manual Backup Now
                </button>
              </div>
            </motion.div>
          )}

          {activeSection === "appearance" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
              <h2 className="text-gray-800 dark:text-gray-200 mb-5" style={{ fontSize: "16px", fontWeight: 700 }}>Appearance Settings</h2>
              <div className="space-y-5">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 mb-3" style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>Theme Mode</p>
                  <div className="flex gap-3">
                    {["Light", "Dark"].map((t) => {
                      const isCurrent = (t === "Light" && theme === "light") || (t === "Dark" && theme === "dark");
                      return (
                        <button
                          key={t}
                          onClick={() => { if (!isCurrent) toggleTheme(); }}
                          className="flex-1 py-3 rounded-xl border-2 transition-all cursor-pointer font-bold text-xs"
                          style={{
                            borderColor: isCurrent ? "#3AB58F" : "#E5E7EB",
                            background: isCurrent ? "#EEF9F5" : (theme === "dark" ? "#1f2937" : "white"),
                            color: isCurrent ? "#3AB58F" : "#6B7280"
                          }}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 mb-3" style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>Primary Branding Color</p>
                  <div className="flex gap-3">
                    {["#58D0A7", "#6366F1", "#F97316", "#EF4444", "#8B5CF6", "#0EA5E9"].map((c) => (
                      <button key={c} onClick={() => toast.info(`Color theme changed to ${c}`)} className="w-10 h-10 rounded-xl border-4 transition-all cursor-pointer" style={{ background: c, borderColor: c === "#58D0A7" ? "white" : "transparent", outline: c === "#58D0A7" ? `3px solid ${c}` : "none" }} />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 mb-3" style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>Primary System Language</p>
                  <select className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 outline-none cursor-pointer" style={{ fontSize: "13px" }}>
                    <option>English (Global)</option>
                    <option>Hindi (India)</option>
                    <option>Spanish</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
      {/* Edit Departments Modal */}
      {isEditDeptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-gray-800 dark:text-gray-200" style={{ fontSize: "16px", fontWeight: 700 }}>Edit Departments</h3>
              <button onClick={() => setIsEditDeptOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex gap-2 mb-4">
              <input
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                placeholder="New department name..."
                disabled={isAddingDept}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 outline-none focus:border-green-400 transition-colors disabled:opacity-60"
                style={{ fontSize: "13px" }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newDeptName.trim() && !isAddingDept) {
                    handleAddDepartment();
                  }
                }}
              />
              <button
                onClick={handleAddDepartment}
                disabled={isAddingDept || !newDeptName.trim()}
                className="flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl text-white hover:opacity-90 transition-all cursor-pointer text-xs font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, #58D0A7, #3AB58F)" }}
              >
                {isAddingDept ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto pr-1 space-y-2">
              {departments.length === 0 && (
                <p className="text-center text-gray-500 py-4 text-xs">No departments added yet.</p>
              )}
              {departments.map((dept) => (
                <div key={dept.department_id} className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                  <span className="text-gray-700 dark:text-gray-300 font-medium" style={{ fontSize: "13px" }}>{dept.department_name}</span>
                  <button
                    onClick={() => handleDeleteDepartment(dept.department_id)}
                    className="text-red-400 hover:text-red-600 transition-colors cursor-pointer p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
              <button 
                onClick={() => setIsEditDeptOpen(false)}
                className="px-5 py-2.5 rounded-xl text-gray-600 dark:text-gray-300 font-bold text-xs hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
