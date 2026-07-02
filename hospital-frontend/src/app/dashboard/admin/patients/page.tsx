"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Filter,
  Eye,
  Edit2,
  Trash2,
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Activity,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import api from "@/services/api";
import { useSocket } from "@/contexts/SocketContext";
import { Patient } from "@/types";
import { toast } from "sonner";

const statusColors: Record<string, { bg: string; color: string; dot: string }> = {
  Admitted: { bg: "#EEF9F5", color: "#16A34A", dot: "#22C55E" },
  OPD: { bg: "#EEF3FF", color: "#4F46E5", dot: "#6366F1" },
  Discharged: { bg: "#F5F5F5", color: "#6B7280", dot: "#9CA3AF" },
};

const conditionColors: Record<string, string> = {
  Critical: "#EF4444",
  Stable: "#F97316",
  Good: "#22C55E",
  Recovered: "#6366F1",
};

export default function PatientManagement() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 7;
  const { socket } = useSocket();

  // Form states
  const [formName, setFormName] = useState("");
  const [formAge, setFormAge] = useState("");
  const [formGender, setFormGender] = useState("Male");
  const [formBlood, setFormBlood] = useState("A+");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formDept, setFormDept] = useState("Cardiology");
  const [formDoctor, setFormDoctor] = useState("Dr. Sharma");
  const [formAddress, setFormAddress] = useState("");
  const [formCondition, setFormCondition] = useState("Stable");
  const [formStatus, setFormStatus] = useState("OPD");

  const fetchPatients = async () => {
    try {
      const res = await api.get<Patient[]>("/patients");
      setPatients(res.data);
    } catch (err) {
      console.error("Failed to load patients:", err);
      toast.error("Failed to retrieve patients records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();

    if (socket) {
      socket.on("patient_created", (newPat: Patient) => {
        setPatients((prev) => [newPat, ...prev]);
        toast.info(`New Patient Registered: ${newPat.name}`);
      });
      socket.on("patient_updated", (updatedPat: Patient) => {
        setPatients((prev) => prev.map((p) => (p.id === updatedPat.id ? updatedPat : p)));
      });
      socket.on("patient_deleted", ({ id }) => {
        setPatients((prev) => prev.filter((p) => p.id !== id));
      });
    }

    return () => {
      if (socket) {
        socket.off("patient_created");
        socket.off("patient_updated");
        socket.off("patient_deleted");
      }
    };
  }, [socket]);

  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formAge || !formPhone) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      await api.post("/patients", {
        name: formName,
        age: formAge,
        gender: formGender,
        blood: formBlood,
        phone: formPhone,
        email: formEmail || `${formName.toLowerCase().replace(/\s/g, "")}@email.com`,
        dept: formDept,
        doctor: formDoctor,
        address: formAddress,
        condition: formCondition,
        status: formStatus,
      });

      toast.success("Patient registered successfully!");
      setShowAddForm(false);
      
      // Reset form states
      setFormName("");
      setFormAge("");
      setFormPhone("");
      setFormEmail("");
      setFormAddress("");
    } catch (err) {
      console.error("Failed to register patient:", err);
      toast.error("Registration failed.");
    }
  };

  const handleDeletePatient = async (id: string) => {
    if (!confirm("Are you sure you want to delete this patient record?")) return;
    try {
      await api.delete(`/patients/${id}`);
      toast.success("Patient record deleted.");
    } catch (err) {
      console.error("Failed to delete patient:", err);
      toast.error("Deletion failed.");
    }
  };

  const filtered = patients.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.dept.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "All" || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="flex flex-col gap-5 pt-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900" style={{ fontSize: "20px", fontWeight: 700 }}>Patient Management</h1>
          <p className="text-gray-500 mt-0.5" style={{ fontSize: "13px" }}>
            {patients.length} total patients · {patients.filter(p => p.status === "Admitted").length} admitted
          </p>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Patients", value: patients.length.toString(), color: "#3AB58F", bg: "#EEF9F5" },
          { label: "Admitted", value: patients.filter(p => p.status === "Admitted").length.toString(), color: "#6366F1", bg: "#EEF3FF" },
          { label: "OPD Patients", value: patients.filter(p => p.status === "OPD").length.toString(), color: "#F97316", bg: "#FFF4EC" },
          { label: "Discharged Patients", value: patients.filter(p => p.status === "Discharged").length.toString(), color: "#EAB308", bg: "#FEFCE8" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-gray-500" style={{ fontSize: "12px", fontWeight: 500 }}>{s.label}</p>
            <p style={{ fontSize: "28px", fontWeight: 700, color: s.color, lineHeight: 1.1 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1 bg-gray-50 rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, ID, department..."
              className="flex-1 bg-transparent outline-none text-gray-700"
              style={{ fontSize: "13px" }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            {["All", "Admitted", "OPD", "Discharged"].map((f) => (
              <button
                key={f}
                onClick={() => { setFilterStatus(f); setPage(1); }}
                className="px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                style={{
                  background: filterStatus === f ? "linear-gradient(135deg, #58D0A7, #3AB58F)" : "#F3F4F6",
                  color: filterStatus === f ? "white" : "#6B7280",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400 text-sm">Syncing patient directory...</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: "#F9FAFB" }} className="border-b border-gray-100">
                {["Patient ID", "Name", "Age/Gender", "Blood", "Department", "Doctor", "Status", "Condition", ""].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-gray-400" style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((p, i) => {
                const sc = statusColors[p.status] || statusColors.OPD;
                return (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "#3AB58F" }}>{p.id}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #58D0A7, #3AB58F)" }}>
                          <span className="text-white" style={{ fontSize: "10px", fontWeight: 700 }}>{p.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</span>
                        </div>
                        <span className="text-gray-800" style={{ fontSize: "13px", fontWeight: 600 }}>{p.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-600" style={{ fontSize: "12px" }}>{p.age}y · {p.gender}</td>
                    <td className="px-5 py-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 font-bold" style={{ fontSize: "11px" }}>{p.blood}</span>
                    </td>
                    <td className="px-5 py-3 text-gray-600" style={{ fontSize: "12px" }}>{p.dept}</td>
                    <td className="px-5 py-3 text-gray-600" style={{ fontSize: "12px" }}>{p.doctor}</td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full w-fit" style={{ background: sc.bg, color: sc.color, fontSize: "11px", fontWeight: 600 }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc.dot }} />
                        {p.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span style={{ fontSize: "12px", fontWeight: 600, color: conditionColors[p.condition] || "#9CA3AF" }}>{p.condition}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setSelectedPatient(p)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-blue-50 transition-colors" title="View">
                          <Eye className="w-3.5 h-3.5 text-blue-500" />
                        </button>
                        <button className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-green-50 transition-colors" title="Edit">
                          <Edit2 className="w-3.5 h-3.5 text-green-500" />
                        </button>
                        <button onClick={() => handleDeletePatient(p.id)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors" title="Delete">
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
          <p className="text-gray-500" style={{ fontSize: "12px" }}>
            Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-7 h-7 rounded-lg flex items-center justify-center bg-white border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors cursor-pointer">
              <ChevronLeft className="w-3.5 h-3.5 text-gray-600" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button key={n} onClick={() => setPage(n)} className="w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer" style={{ background: page === n ? "linear-gradient(135deg, #58D0A7, #3AB58F)" : "white", color: page === n ? "white" : "#6B7280", border: page === n ? "none" : "1px solid #E5E7EB", fontSize: "12px", fontWeight: 600 }}>
                {n}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0} className="w-7 h-7 rounded-lg flex items-center justify-center bg-white border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors cursor-pointer">
              <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Patient Detail Modal */}
      <AnimatePresence>
        {selectedPatient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
            onClick={() => setSelectedPatient(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #58D0A7, #3AB58F)" }}>
                    <span className="text-white" style={{ fontSize: "16px", fontWeight: 700 }}>{selectedPatient.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</span>
                  </div>
                  <div>
                    <h2 className="text-gray-900" style={{ fontSize: "17px", fontWeight: 700 }}>{selectedPatient.name}</h2>
                    <p className="text-gray-500" style={{ fontSize: "12px" }}>{selectedPatient.id} · {selectedPatient.dept}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedPatient(null)} className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer">
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-5">
                {[
                  { icon: User, label: "Age / Gender", value: `${selectedPatient.age} yrs · ${selectedPatient.gender}` },
                  { icon: Activity, label: "Blood Group", value: selectedPatient.blood },
                  { icon: Phone, label: "Phone", value: selectedPatient.phone },
                  { icon: Mail, label: "Email", value: selectedPatient.email },
                  { icon: MapPin, label: "Address", value: selectedPatient.address },
                  { icon: Calendar, label: "Admitted", value: new Date(selectedPatient.admitted).toLocaleDateString() },
                ].map((row) => {
                  const Icon = row.icon;
                  return (
                    <div key={row.label} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#EEF9F5" }}>
                        <Icon className="w-3.5 h-3.5" style={{ color: "#3AB58F" }} />
                      </div>
                      <div>
                        <p className="text-gray-400" style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase" }}>{row.label}</p>
                        <p className="text-gray-800" style={{ fontSize: "12px", fontWeight: 500 }}>{row.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl mb-4" style={{ background: "#EEF9F5" }}>
                <FileText className="w-4 h-4" style={{ color: "#3AB58F" }} />
                <div>
                  <p className="text-gray-700" style={{ fontSize: "12px", fontWeight: 600 }}>Treating Doctor: {selectedPatient.doctor}</p>
                  <p className="text-gray-500" style={{ fontSize: "11px" }}>Condition: <span style={{ color: conditionColors[selectedPatient.condition], fontWeight: 700 }}>{selectedPatient.condition}</span></p>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 py-2 rounded-xl text-white transition-all hover:opacity-90 cursor-pointer" style={{ background: "linear-gradient(135deg, #58D0A7, #3AB58F)", fontSize: "13px", fontWeight: 600 }}>
                  View Full Record
                </button>
                <button className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all cursor-pointer" style={{ fontSize: "13px", fontWeight: 600 }}>
                  Edit Patient
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Patient Form Modal */}
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
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-gray-900" style={{ fontSize: "17px", fontWeight: 700 }}>Register New Patient</h2>
                <button onClick={() => setShowAddForm(false)} className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer">
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              <form onSubmit={handleRegisterPatient} className="grid grid-cols-2 gap-3 mb-4">
                <div className="col-span-2">
                  <label className="text-gray-600 mb-1 block font-semibold text-xs">Full Name</label>
                  <input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                    placeholder="Patient full name"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 outline-none focus:border-green-400 transition-colors"
                    style={{ fontSize: "13px" }}
                  />
                </div>

                <div>
                  <label className="text-gray-600 mb-1 block font-semibold text-xs">Age</label>
                  <input
                    type="number"
                    value={formAge}
                    onChange={(e) => setFormAge(e.target.value)}
                    required
                    placeholder="Age"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 outline-none focus:border-green-400 transition-colors"
                    style={{ fontSize: "13px" }}
                  />
                </div>

                <div>
                  <label className="text-gray-600 mb-1 block font-semibold text-xs">Gender</label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 outline-none focus:border-green-400 transition-colors"
                    style={{ fontSize: "13px" }}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-600 mb-1 block font-semibold text-xs">Blood Group</label>
                  <select
                    value={formBlood}
                    onChange={(e) => setFormBlood(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 outline-none focus:border-green-400 transition-colors"
                    style={{ fontSize: "13px" }}
                  >
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-gray-600 mb-1 block font-semibold text-xs">Phone</label>
                  <input
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    required
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 outline-none focus:border-green-400 transition-colors"
                    style={{ fontSize: "13px" }}
                  />
                </div>

                <div>
                  <label className="text-gray-600 mb-1 block font-semibold text-xs">Email</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="patient@email.com"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 outline-none focus:border-green-400 transition-colors"
                    style={{ fontSize: "13px" }}
                  />
                </div>

                <div>
                  <label className="text-gray-600 mb-1 block font-semibold text-xs">Department</label>
                  <select
                    value={formDept}
                    onChange={(e) => setFormDept(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 outline-none focus:border-green-400 transition-colors"
                    style={{ fontSize: "13px" }}
                  >
                    {["Cardiology", "Neurology", "Orthopedics", "Pediatrics", "Dermatology", "Oncology", "Gastroenterology"].map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-gray-600 mb-1 block font-semibold text-xs">Treating Doctor</label>
                  <input
                    value={formDoctor}
                    onChange={(e) => setFormDoctor(e.target.value)}
                    placeholder="Doctor Name"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 outline-none focus:border-green-400 transition-colors"
                    style={{ fontSize: "13px" }}
                  />
                </div>

                <div>
                  <label className="text-gray-600 mb-1 block font-semibold text-xs">Condition</label>
                  <select
                    value={formCondition}
                    onChange={(e) => setFormCondition(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 outline-none focus:border-green-400 transition-colors"
                    style={{ fontSize: "13px" }}
                  >
                    <option value="Good">Good</option>
                    <option value="Stable">Stable</option>
                    <option value="Critical">Critical</option>
                    <option value="Recovered">Recovered</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-600 mb-1 block font-semibold text-xs">Admission Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 outline-none focus:border-green-400 transition-colors"
                    style={{ fontSize: "13px" }}
                  >
                    <option value="OPD">OPD</option>
                    <option value="Admitted">Admitted</option>
                    <option value="Discharged">Discharged</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="text-gray-600 mb-1 block font-semibold text-xs">Address</label>
                  <input
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="Full address"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 outline-none focus:border-green-400 transition-colors"
                    style={{ fontSize: "13px" }}
                  />
                </div>

                <button type="submit" className="w-full py-2.5 rounded-xl text-white hover:opacity-90 transition-all col-span-2 cursor-pointer mt-2" style={{ background: "linear-gradient(135deg, #58D0A7, #3AB58F)", fontSize: "13px", fontWeight: 600 }}>
                  Register Patient
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
