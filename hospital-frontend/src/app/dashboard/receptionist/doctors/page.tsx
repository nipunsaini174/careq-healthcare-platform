"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  X,
  Phone,
  Mail,
  Star,
  Clock,
  Users,
  MoreHorizontal,
  Save,
  Calendar,
  ShieldCheck,
  Heart,
  Award,
  BookOpen,
  GraduationCap,
} from "lucide-react";
import api from "@/services/api";
import { hospitalApi, type HospitalDepartment } from "@/services/hospitalApi";
import { useSocket } from "@/contexts/SocketContext";
import { Doctor } from "@/types";
import { toast } from "sonner";

const statusConfig: Record<string, { bg: string; color: string; dot: string }> = {
  Active: { bg: "#EEF9F5", color: "#16A34A", dot: "#22C55E" },
  Busy: { bg: "#FFF4EC", color: "#EA580C", dot: "#F97316" },
  Offline: { bg: "#F5F5F5", color: "#6B7280", dot: "#9CA3AF" },
};

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("All");
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const { socket } = useSocket();

  // Departments come from the admin's hospital settings — never hardcoded.
  // The receptionist can only assign new doctors to departments the admin
  // has actually created. Empty until the staff endpoint resolves.
  const [hospitalDepartments, setHospitalDepartments] = useState<HospitalDepartment[]>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(true);

  // Add Form States
  const [name, setName] = useState("");
  const [dept, setDept] = useState("");
  const [qualification, setQualification] = useState("");
  const [experience, setExperience] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [opd, setOpd] = useState("OPD-1");
  const [schedule, setSchedule] = useState("Mon–Fri 09:00–17:00");
  const [bio, setBio] = useState("");
  const [focus, setFocus] = useState("");
  const [awards, setAwards] = useState("");
  const [password, setPassword] = useState("");

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let p = "";
    for (let i = 0; i < 12; i++) {
      p += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(p);
  };

  const fetchDoctors = async () => {
    try {
      const res = await api.get<Doctor[]>("/receptionist/doctors");
      setDoctors(res.data);
    } catch (err: any) {
      console.error("Failed to load doctors:", err);
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || "Failed to load doctors directory.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Pulls the latest departments for the receptionist's hospital. Used
  // by both the initial mount and the `department_*` socket handlers
  // below so the dropdown reflects admin changes in real time without
  // a page refresh.
  const refreshDepartments = async () => {
    try {
      const list = await hospitalApi.listDepartmentsForStaff();
      setHospitalDepartments(list);
      // Pre-select the first department so the form is valid by
      // default; otherwise the receptionist would have to manually
      // pick before submitting.
      setDept((current) => {
        if (current && list.some((d) => d.department_name === current)) return current;
        return list[0]?.department_name ?? "";
      });
    } catch (err: any) {
      console.error("Failed to load departments:", err);
      const msg =
        err.response?.data?.error || err.response?.data?.message || err.message || "Failed to load departments";
      toast.error(msg);
    } finally {
      setIsLoadingDepartments(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
    refreshDepartments();

    if (socket) {
      socket.on("doctor_created", (newDoc: Doctor) => {
        setDoctors((prev) => [...prev, newDoc]);
        toast.info(`New Doctor Added: ${newDoc.name}`);
      });
      socket.on("doctor_updated", (updatedDoc: Doctor) => {
        setDoctors((prev) => prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d)));
        if (selectedDoctor?.id === updatedDoc.id) {
          setSelectedDoctor(updatedDoc);
        }
      });
      socket.on("doctor_deleted", ({ id }) => {
        setDoctors((prev) => prev.filter((d) => d.id !== id));
        if (selectedDoctor?.id === id) setSelectedDoctor(null);
      });

      // Refresh the dropdown when the admin adds/removes departments
      // from the Settings page. The events are emitted by the backend
      // after a successful POST/DELETE on /admin/hospital/departments.
      const onDeptChange = () => refreshDepartments();
      socket.on("department_created", onDeptChange);
      socket.on("department_deleted", onDeptChange);
    }

    return () => {
      if (socket) {
        socket.off("doctor_created");
        socket.off("doctor_updated");
        socket.off("doctor_deleted");
        socket.off("department_created");
        socket.off("department_deleted");
      }
    };
  }, [socket, selectedDoctor]);

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !qualification || !experience || !phone || !email || !password) {
      toast.error("Please fill in all required fields (including password).");
      return;
    }

    try {
      await api.post("/receptionist/doctors", {
        name,
        dept,
        qualification,
        experience,
        phone,
        email,
        opd,
        schedule,
        bio,
        focus,
        awards,
        password,
        status: "Offline",
      });

      toast.success("Doctor registered successfully!");
      setShowAddForm(false);
      setName("");
      setQualification("");
      setExperience("");
      setPhone("");
      setEmail("");
      setBio("");
      setFocus("");
      setAwards("");
      setPassword("");
    } catch (err: any) {
      console.error("Failed to add doctor:", err);
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || "Failed to add doctor.";
      toast.error(msg);
    }
  };

  const toggleDoctorStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "Active" ? "Busy" : currentStatus === "Busy" ? "Offline" : "Active";
    try {
      await api.put(`/receptionist/doctors/${id}`, { status: nextStatus });
      toast.success(`Doctor status updated to ${nextStatus}.`);
    } catch (err: any) {
      console.error("Failed to update status:", err);
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || "Failed to update status.";
      toast.error(msg);
    }
  };

  const filtered = doctors.filter((doc) => {
    const matchSearch = doc.name.toLowerCase().includes(search.toLowerCase()) || doc.qualification.toLowerCase().includes(search.toLowerCase());
    const matchDept = filterDept === "All" || doc.dept === filterDept;
    return matchSearch && matchDept;
  });

  const departments = ["All", ...Array.from(new Set(doctors.map((d) => d.dept)))];

  return (
    <div className="flex flex-col gap-5 pt-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900" style={{ fontSize: "20px", fontWeight: 700 }}>Doctors Directory</h1>
          <p className="text-gray-500 mt-0.5" style={{ fontSize: "13px" }}>
            {doctors.length} doctors registered · {doctors.filter(d => d.status === "Active").length} active duty
          </p>
        </div>
        <button
          onClick={() => {
            // Refresh the department list every time the form opens so
            // newly-added departments show up even if the socket event
            // was missed (e.g. lost connection, page open before the
            // admin saved). Safe net on top of the real-time listeners.
            refreshDepartments();
            setShowAddForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white hover:opacity-90 transition-all cursor-pointer"
          style={{ background: "linear-gradient(135deg, #58D0A7, #3AB58F)", fontSize: "13px", fontWeight: 600 }}
        >
          <Plus className="w-4 h-4" /> Add Doctor
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex gap-3 items-center justify-between">
        <div className="flex items-center gap-2 flex-1 bg-gray-50 rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search doctor name or specialty..."
            className="flex-1 bg-transparent outline-none text-gray-700"
            style={{ fontSize: "13px" }}
          />
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-gray-400 text-xs font-semibold uppercase">Specialty:</span>
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setFilterDept(dept)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
              style={{
                background: filterDept === dept ? "linear-gradient(135deg, #58D0A7, #3AB58F)" : "#F3F4F6",
                color: filterDept === dept ? "white" : "#6B7280",
              }}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="p-10 text-center text-gray-400 text-sm">Syncing medical staff directory...</div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {filtered.map((doc, i) => {
            const sc = statusConfig[doc.status] || statusConfig.Offline;
            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => toggleDoctorStatus(doc.id, doc.status)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-left cursor-pointer"
                      style={{ background: sc.bg, color: sc.color, fontSize: "11px", fontWeight: 700 }}
                      title="Click to toggle status"
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc.dot }} />
                      {doc.status}
                    </button>
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-yellow-400 stroke-yellow-400" />
                      <span className="text-gray-700 font-bold text-xs">{doc.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #58D0A7, #3AB58F)" }}>
                      <span className="text-white text-base font-bold">{doc.name.split(" ").slice(1).map((n) => n[0]).join("").slice(0, 2)}</span>
                    </div>
                    <div>
                      <h3 className="text-gray-900 font-bold text-sm leading-tight">{doc.name}</h3>
                      <p className="text-gray-400 text-xs mt-0.5">{doc.dept} · {doc.qualification}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-gray-50 rounded-2xl p-3 text-xs mb-4">
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <Award className="w-3.5 h-3.5 text-green-500" />
                      <span>{doc.experience} Years Exp</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <Clock className="w-3.5 h-3.5 text-orange-400" />
                      <span>{doc.opd}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-500 col-span-2 mt-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      <span className="truncate">{doc.schedule}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedDoctor(doc)}
                    className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-all text-xs cursor-pointer"
                  >
                    View Profile
                  </button>
                  <a
                    href={`tel:${doc.phone}`}
                    className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                    <Phone className="w-4 h-4 text-gray-500" />
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Doctor Profile Modal */}
      <AnimatePresence>
        {selectedDoctor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
            onClick={() => setSelectedDoctor(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-gray-900 font-bold text-lg">Doctor Profile</h2>
                <button onClick={() => setSelectedDoctor(null)} className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer">
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              <div className="flex gap-4 items-start mb-6">
                <div className="w-16 h-16 rounded-3xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #58D0A7, #3AB58F)" }}>
                  <span className="text-white text-2xl font-bold">{selectedDoctor.name.split(" ").slice(1).map((n) => n[0]).join("").slice(0, 2)}</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900">{selectedDoctor.name}</h2>
                  <p className="text-gray-500 text-sm mt-0.5">{selectedDoctor.dept} · {selectedDoctor.qualification}</p>
                  <p className="text-gray-400 text-xs mt-1">OPD Room: {selectedDoctor.opd} · Delay: +{selectedDoctor.delay} mins</p>
                </div>
              </div>

              {selectedDoctor.bio && (
                <div className="mb-6">
                  <h4 className="text-gray-900 font-bold text-xs uppercase mb-2">Biography</h4>
                  <p className="text-gray-600 text-xs leading-relaxed bg-gray-50 rounded-2xl p-3">{selectedDoctor.bio}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <h4 className="text-gray-900 font-bold text-xs uppercase mb-2">Education & Training</h4>
                  <ul className="text-gray-600 text-xs space-y-1.5">
                    {selectedDoctor.education && selectedDoctor.education.length > 0 ? (
                      selectedDoctor.education.map((e, index) => (
                        <li key={index} className="flex items-start gap-1.5">
                          <GraduationCap className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span>{e}</span>
                        </li>
                      ))
                    ) : (
                      <li>No education history available.</li>
                    )}
                  </ul>
                </div>

                <div>
                  <h4 className="text-gray-900 font-bold text-xs uppercase mb-2">Key Publications</h4>
                  <ul className="text-gray-600 text-xs space-y-1.5">
                    {selectedDoctor.publications && selectedDoctor.publications.length > 0 ? (
                      selectedDoctor.publications.map((p, index) => (
                        <li key={index} className="flex items-start gap-1.5">
                          <BookOpen className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          <span>{p}</span>
                        </li>
                      ))
                    ) : (
                      <li>No publication records available.</li>
                    )}
                  </ul>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setSelectedDoctor(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-all text-xs cursor-pointer"
                >
                  Close Profile
                </button>
                <a
                  href={`mailto:${selectedDoctor.email}`}
                  className="flex-1 py-2.5 rounded-xl text-white font-bold hover:opacity-90 transition-all text-xs text-center cursor-pointer"
                  style={{ background: "linear-gradient(135deg, #58D0A7, #3AB58F)" }}
                >
                  Send Email
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Doctor Form Modal */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
            onClick={() => setShowAddForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100 flex-shrink-0">
                <h2 className="text-gray-900 font-bold text-base">Add New Doctor</h2>
                <button onClick={() => setShowAddForm(false)} className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer">
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              <form onSubmit={handleAddDoctor} className="flex flex-col flex-1 min-h-0">
                <div className="p-6 overflow-y-auto flex-1">
                  <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-gray-600 mb-1 block font-semibold text-xs">Full Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g. Dr. Priya Sharma"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 outline-none focus:border-green-400 transition-colors"
                    style={{ fontSize: "13px" }}
                  />
                </div>

                <div>
                  <label className="text-gray-600 mb-1 block font-semibold text-xs">Department</label>
                  <select
                    value={dept}
                    onChange={(e) => setDept(e.target.value)}
                    required
                    disabled={isLoadingDepartments || hospitalDepartments.length === 0}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 outline-none focus:border-green-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ fontSize: "13px" }}
                  >
                    {isLoadingDepartments && <option value="">Loading…</option>}
                    {!isLoadingDepartments && hospitalDepartments.length === 0 && (
                      <option value="">No departments yet — ask your admin</option>
                    )}
                    {!isLoadingDepartments &&
                      hospitalDepartments.map((d) => (
                        <option key={d.department_id} value={d.department_name}>
                          {d.department_name}
                        </option>
                      ))}
                  </select>
                  {!isLoadingDepartments && hospitalDepartments.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      Your hospital admin hasn&apos;t added any departments yet. Doctors can&apos;t be created until at least one exists.
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-gray-600 mb-1 block font-semibold text-xs">Experience (Years)</label>
                  <input
                    type="number"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    required
                    placeholder="Years of experience"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 outline-none focus:border-green-400 transition-colors"
                    style={{ fontSize: "13px" }}
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-gray-600 mb-1 block font-semibold text-xs">Qualification</label>
                  <input
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    required
                    placeholder="e.g. MD, DM Cardiology"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 outline-none focus:border-green-400 transition-colors"
                    style={{ fontSize: "13px" }}
                  />
                </div>

                <div>
                  <label className="text-gray-600 mb-1 block font-semibold text-xs">Phone</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 outline-none focus:border-green-400 transition-colors"
                    style={{ fontSize: "13px" }}
                  />
                </div>



                <div>
                  <label className="text-gray-600 mb-1 block font-semibold text-xs">OPD Cabin</label>
                  <input
                    value={opd}
                    onChange={(e) => setOpd(e.target.value)}
                    placeholder="e.g. OPD-3"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 outline-none focus:border-green-400 transition-colors"
                    style={{ fontSize: "13px" }}
                  />
                </div>

                <div>
                  <label className="text-gray-600 mb-1 block font-semibold text-xs">Schedule</label>
                  <input
                    value={schedule}
                    onChange={(e) => setSchedule(e.target.value)}
                    placeholder="e.g. Mon–Fri 09:00–17:00"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 outline-none focus:border-green-400 transition-colors"
                    style={{ fontSize: "13px" }}
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-gray-600 mb-1 block font-semibold text-xs">Short Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Write a brief professional summary..."
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 outline-none focus:border-green-400 transition-colors h-20 resize-none"
                    style={{ fontSize: "13px" }}
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-gray-600 mb-1 block font-semibold text-xs">Specialization & Clinical Focus</label>
                  <input
                    value={focus}
                    onChange={(e) => setFocus(e.target.value)}
                    placeholder="e.g. Interventional Cardiology, Electrophysiology"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 outline-none focus:border-green-400 transition-colors"
                    style={{ fontSize: "13px" }}
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-gray-600 mb-1 block font-semibold text-xs">Awards & Honors</label>
                  <textarea
                    value={awards}
                    onChange={(e) => setAwards(e.target.value)}
                    placeholder="List any notable awards..."
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 outline-none focus:border-green-400 transition-colors h-16 resize-none"
                    style={{ fontSize: "13px" }}
                  />
                </div>

                <div className="col-span-2 mt-2 pt-4 border-t border-gray-100">
                  <h3 className="text-gray-900 font-bold text-sm mb-3">Account Credentials</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-gray-600 mb-1 block font-semibold text-xs">Login Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="doctor@hospital.in"
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 outline-none focus:border-green-400 transition-colors"
                        style={{ fontSize: "13px" }}
                      />
                    </div>
                    <div>
                      <label className="text-gray-600 mb-1 block font-semibold text-xs flex justify-between items-center">
                        <span>Password</span>
                        <button type="button" onClick={generatePassword} className="text-blue-500 hover:text-blue-700 text-[10px] uppercase font-bold cursor-pointer">Generate Random</button>
                      </label>
                      <input
                        type="text"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Secure password"
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 outline-none focus:border-green-400 transition-colors"
                        style={{ fontSize: "13px" }}
                      />
                    </div>
                  </div>
                </div>

                  </div>
                </div>

                <div className="p-6 pt-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
                  <button type="submit" className="w-full py-2.5 rounded-xl text-white hover:opacity-90 transition-all cursor-pointer shadow-md" style={{ background: "linear-gradient(135deg, #58D0A7, #3AB58F)", fontSize: "13px", fontWeight: 600 }}>
                    Add Doctor
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
