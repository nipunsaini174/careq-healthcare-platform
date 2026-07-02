"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  X,
  Phone,
  Save,
  Clock,
  MoreHorizontal,
} from "lucide-react";
import api from "@/services/api";
import { useSocket } from "@/contexts/SocketContext";
import { Receptionist } from "@/types";
import { toast } from "sonner";

const statusConfig: Record<string, { bg: string; color: string; dot: string }> = {
  Active: { bg: "#EEF9F5", color: "#16A34A", dot: "#22C55E" },
  Offline: { bg: "#F5F5F5", color: "#6B7280", dot: "#9CA3AF" },
};

export default function ReceptionistsPage() {
  const [receptionists, setReceptionists] = useState<Receptionist[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedReceptionist, setSelectedReceptionist] = useState<Receptionist | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { socket } = useSocket();

  // Add Form States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [shiftStart, setShiftStart] = useState("09:00");
  const [shiftEnd, setShiftEnd] = useState("17:00");
  const [password, setPassword] = useState("");

  const fetchReceptionists = async () => {
    try {
      const res = await api.get<Receptionist[]>("/admin/receptionists");
      setReceptionists(res.data);
    } catch (err: any) {
      console.error("Failed to load receptionists:", err);
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || "Failed to load receptionists directory.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceptionists();

    if (socket) {
      socket.on("receptionist_created", (newRec: Receptionist) => {
        setReceptionists((prev) => [...prev, newRec]);
        toast.info(`New Receptionist Added: ${newRec.name}`);
      });
      socket.on("receptionist_updated", (updatedRec: Receptionist) => {
        setReceptionists((prev) => prev.map((d) => (d.id === updatedRec.id ? updatedRec : d)));
        if (selectedReceptionist?.id === updatedRec.id) {
          setSelectedReceptionist(updatedRec);
        }
      });
      socket.on("receptionist_deleted", ({ id }) => {
        setReceptionists((prev) => prev.filter((d) => d.id !== id));
        if (selectedReceptionist?.id === id) setSelectedReceptionist(null);
      });
    }

    return () => {
      if (socket) {
        socket.off("receptionist_created");
        socket.off("receptionist_updated");
        socket.off("receptionist_deleted");
      }
    };
  }, [socket, selectedReceptionist]);

  const openEditModal = (rec: Receptionist) => {
    setEditingId(rec.id);
    setName(rec.name);
    setEmail(rec.email);
    setPhone(rec.phone || "");
    const sStart = new Date(rec.shift_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const sEnd = new Date(rec.shift_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    setShiftStart(sStart);
    setShiftEnd(sEnd);
    setPassword(""); // Reset password field for editing
    setShowAddForm(true);
  };

  const handleAddReceptionist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !shiftStart || !shiftEnd) {
      toast.error("Please fill in all fields.");
      return;
    }

    try {
      if (editingId) {
        await api.put(`/admin/receptionists/${editingId}`, {
          name,
          email,
          phone,
          shift_start: shiftStart,
          shift_end: shiftEnd,
          ...(password ? { password } : {}) // Only send password if provided
        });
        toast.success("Receptionist updated successfully!");
      } else {
        if (!password) {
          toast.error("Please provide a password for the new receptionist.");
          return;
        }
        await api.post("/admin/receptionists", {
          name,
          email,
          phone,
          password,
          shift_start: shiftStart,
          shift_end: shiftEnd,
          status: "Offline",
        });
        toast.success("Receptionist registered successfully!");
      }

      await fetchReceptionists();
      setShowAddForm(false);
      setEditingId(null);
      setName("");
      setEmail("");
      setPhone("");
      setShiftStart("09:00");
      setShiftEnd("17:00");
      setPassword("");
    } catch (err: any) {
      console.error("Failed to add receptionist:", err);
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || "Failed to add receptionist.";
      toast.error(msg);
    }
  };

  const toggleReceptionistStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "Active" ? "Offline" : "Active";
    try {
      await api.put(`/admin/receptionists/${id}/status`, { status: nextStatus });
      toast.success(`Receptionist status updated to ${nextStatus}.`);
      await fetchReceptionists();
    } catch (err: any) {
      console.error("Failed to update status:", err);
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || "Failed to update status.";
      toast.error(msg);
    }
  };

  const filtered = receptionists.filter((rec) => {
    return rec.name.toLowerCase().includes(search.toLowerCase()) || rec.email.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="flex flex-col gap-5 pt-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900" style={{ fontSize: "20px", fontWeight: 700 }}>Receptionists Directory</h1>
          <p className="text-gray-500 mt-0.5" style={{ fontSize: "13px" }}>
            {receptionists.length} receptionists registered · {receptionists.filter(r => r.status === "Active").length} active duty
          </p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setName("");
            setEmail("");
            setPhone("");
            setShiftStart("09:00");
            setShiftEnd("17:00");
            setPassword("");
            setShowAddForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white hover:opacity-90 transition-all cursor-pointer"
          style={{ background: "linear-gradient(135deg, #4F46E5, #6366F1)", fontSize: "13px", fontWeight: 600 }}
        >
          <Plus className="w-4 h-4" /> Add Receptionist
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex gap-3 items-center justify-between">
        <div className="flex items-center gap-2 flex-1 bg-gray-50 rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search receptionist name or email..."
            className="flex-1 bg-transparent outline-none text-gray-700"
            style={{ fontSize: "13px" }}
          />
        </div>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="p-10 text-center text-gray-400 text-sm">Syncing medical staff directory...</div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {filtered.map((rec, i) => {
            const sc = statusConfig[rec.status] || statusConfig.Offline;
            return (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => toggleReceptionistStatus(rec.id, rec.status)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-left cursor-pointer"
                      style={{ background: sc.bg, color: sc.color, fontSize: "11px", fontWeight: 700 }}
                      title="Click to toggle status"
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc.dot }} />
                      {rec.status}
                    </button>
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #4F46E5, #6366F1)" }}>
                      <span className="text-white text-base font-bold">{rec.name.split(" ").slice(0, 2).map((n) => n[0]).join("")}</span>
                    </div>
                    <div>
                      <h3 className="text-gray-900 font-bold text-sm leading-tight">{rec.name}</h3>
                      <p className="text-gray-400 text-xs mt-0.5">{rec.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-gray-50 rounded-2xl p-3 text-xs mb-4">
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      <span>{new Date(rec.shift_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(rec.shift_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <Phone className="w-3.5 h-3.5 text-orange-400" />
                      <span>{rec.phone || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(rec)}
                    className="flex-1 py-2 rounded-xl border border-gray-200 flex items-center justify-center text-gray-700 font-bold hover:bg-gray-50 transition-colors text-xs cursor-pointer"
                  >
                    Edit
                  </button>
                  <a
                    href={`tel:${rec.phone}`}
                    className="flex-1 py-2 rounded-xl border border-gray-200 flex items-center justify-center text-gray-700 font-bold hover:bg-gray-50 transition-colors text-xs cursor-pointer gap-2"
                  >
                    <Phone className="w-4 h-4 text-gray-500" />
                    Call
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add Receptionist Form Modal */}
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
                <h2 className="text-gray-900 font-bold text-base">{editingId ? "Edit Receptionist" : "Add New Receptionist"}</h2>
                <button onClick={() => setShowAddForm(false)} className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer">
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              <form onSubmit={handleAddReceptionist} className="grid grid-cols-2 gap-3 mb-4">
                <div className="col-span-2">
                  <label className="text-gray-600 mb-1 block font-semibold text-xs">Full Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g. Rahul Verma"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 outline-none focus:border-indigo-400 transition-colors"
                    style={{ fontSize: "13px" }}
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-gray-600 mb-1 block font-semibold text-xs">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="reception@hospital.in"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 outline-none focus:border-indigo-400 transition-colors"
                    style={{ fontSize: "13px" }}
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-gray-600 mb-1 block font-semibold text-xs">Phone</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 outline-none focus:border-indigo-400 transition-colors"
                    style={{ fontSize: "13px" }}
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-gray-600 mb-1 block font-semibold text-xs">Password {editingId && <span className="text-gray-400 font-normal">(Leave blank to keep unchanged)</span>}</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={!editingId}
                    placeholder={editingId ? "Enter new password if changing..." : "SecurePassword123!"}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 outline-none focus:border-indigo-400 transition-colors"
                    style={{ fontSize: "13px" }}
                  />
                </div>

                <div>
                  <label className="text-gray-600 mb-1 block font-semibold text-xs">Shift Start</label>
                  <input
                    type="time"
                    value={shiftStart}
                    onChange={(e) => setShiftStart(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 outline-none focus:border-indigo-400 transition-colors"
                    style={{ fontSize: "13px" }}
                  />
                </div>

                <div>
                  <label className="text-gray-600 mb-1 block font-semibold text-xs">Shift End</label>
                  <input
                    type="time"
                    value={shiftEnd}
                    onChange={(e) => setShiftEnd(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 outline-none focus:border-indigo-400 transition-colors"
                    style={{ fontSize: "13px" }}
                  />
                </div>

                <button type="submit" className="w-full py-2.5 rounded-xl text-white hover:opacity-90 transition-all col-span-2 cursor-pointer mt-2" style={{ background: "linear-gradient(135deg, #4F46E5, #6366F1)", fontSize: "13px", fontWeight: 600 }}>
                  {editingId ? "Save Changes" : "Add Receptionist"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
