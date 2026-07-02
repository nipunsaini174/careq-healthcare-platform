"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Eye,
  Download,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  CreditCard,
} from "lucide-react";
import api from "@/services/api";
import { useSocket } from "@/contexts/SocketContext";
import { Invoice } from "@/types";
import { toast } from "sonner";

const statusConfig: Record<string, { bg: string; color: string; dot: string; icon: typeof CheckCircle2 }> = {
  Paid: { bg: "#EEF9F5", color: "#16A34A", dot: "#22C55E", icon: CheckCircle2 },
  Partial: { bg: "#FFF4EC", color: "#EA580C", dot: "#F97316", icon: AlertCircle },
  Pending: { bg: "#FEF3F2", color: "#DC2626", dot: "#EF4444", icon: Clock },
};

const methodColors: Record<string, string> = {
  Card: "#6366F1",
  Insurance: "#3AB58F",
  Cash: "#EAB308",
  UPI: "#8B5CF6",
  "—": "#9CA3AF",
};

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const { socket } = useSocket();

  // New Invoice Form States
  const [patient, setPatient] = useState("");
  const [dept, setDept] = useState("Cardiology");
  const [amount, setAmount] = useState("");
  const [paid, setPaid] = useState("");
  const [method, setMethod] = useState("—");
  const [services, setServices] = useState("Consultation, Medicines");

  const fetchInvoices = async () => {
    try {
      const res = await api.get<Invoice[]>("/invoices");
      setInvoices(res.data);
    } catch (err) {
      console.error("Failed to load invoices:", err);
      toast.error("Failed to load invoice records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();

    if (socket) {
      socket.on("invoice_created", (newInv: Invoice) => {
        setInvoices((prev) => [newInv, ...prev]);
        toast.info(`New Invoice raised: ${newInv.id} for ${newInv.patient}`);
      });
      socket.on("invoice_updated", (updatedInv: Invoice) => {
        setInvoices((prev) => prev.map((inv) => (inv.id === updatedInv.id ? updatedInv : inv)));
        if (selectedInvoice?.id === updatedInv.id) setSelectedInvoice(updatedInv);
      });
    }

    return () => {
      if (socket) {
        socket.off("invoice_created");
        socket.off("invoice_updated");
      }
    };
  }, [socket, selectedInvoice]);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient || !amount) {
      toast.error("Please fill in patient name and total amount.");
      return;
    }

    const amtNum = parseInt(amount);
    const paidNum = parseInt(paid) || 0;
    let status = "Pending";
    if (paidNum >= amtNum) status = "Paid";
    else if (paidNum > 0) status = "Partial";

    try {
      await api.post("/invoices", {
        patient,
        dept,
        amount: amtNum,
        paid: paidNum,
        services: services.split(",").map((s) => s.trim()),
        status,
        method: paidNum > 0 ? method : "—",
      });

      toast.success("Invoice created successfully!");
      setShowAddForm(false);
      setPatient("");
      setAmount("");
      setPaid("");
      setServices("Consultation, Medicines");
    } catch (err) {
      console.error("Failed to create invoice:", err);
      toast.error("Invoice creation failed.");
    }
  };

  const markInvoicePaid = async (id: string, payMethod: string) => {
    const inv = invoices.find(i => i.id === id);
    if (!inv) return;

    try {
      await api.put(`/invoices/${id}`, {
        paid: inv.amount,
        status: "Paid",
        method: payMethod,
      });
      toast.success("Invoice marked as FULLY PAID.");
    } catch (err) {
      console.error("Failed to pay invoice:", err);
    }
  };

  const filtered = invoices.filter((inv) => {
    const matchSearch =
      inv.patient.toLowerCase().includes(search.toLowerCase()) ||
      inv.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "All" || inv.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalRevenue = invoices.reduce((s, i) => s + i.paid, 0);
  const totalPending = invoices.reduce((s, i) => s + (i.amount - i.paid), 0);

  return (
    <div className="flex flex-col gap-5 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 font-bold text-lg">Billing & Finance</h1>
          <p className="text-gray-500 mt-0.5 text-xs">
            {invoices.filter(i => i.status !== "Paid").length} outstanding invoices · ₹{totalPending.toLocaleString()} outstanding
          </p>
        </div>
      </div>

      {/* Finance Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Revenue Collected", value: `₹${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: "#3AB58F", bg: "#EEF9F5" },
          { label: "Outstanding (Pending)", value: `₹${totalPending.toLocaleString()}`, icon: AlertCircle, color: "#EF4444", bg: "#FEF3F2" },
          { label: "Paid Bills", value: invoices.filter(i => i.status === "Paid").length.toString(), icon: CheckCircle2, color: "#22C55E", bg: "#F0FDF4" },
          { label: "Partial Payments", value: invoices.filter(i => i.status === "Partial").length.toString(), icon: CreditCard, color: "#F97316", bg: "#FFF4EC" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
                <Icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <div>
                <p style={{ fontSize: "24px", fontWeight: 700, color: s.color, lineHeight: 1.1 }}>{s.value}</p>
                <p className="text-gray-500 mt-0.5" style={{ fontSize: "11px", fontWeight: 500 }}>{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1 bg-gray-50 rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search patient, invoice ID..." className="flex-1 bg-transparent outline-none text-gray-700" style={{ fontSize: "13px" }} />
        </div>
        {["All", "Paid", "Partial", "Pending"].map((f) => (
          <button key={f} onClick={() => setFilterStatus(f)} className="px-3 py-1.5 rounded-lg transition-all whitespace-nowrap text-xs font-bold cursor-pointer" style={{ background: filterStatus === f ? "linear-gradient(135deg, #58D0A7, #3AB58F)" : "#F3F4F6", color: filterStatus === f ? "white" : "#6B7280" }}>
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400 text-sm">Syncing financial reports...</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: "#F9FAFB" }} className="border-b border-gray-100">
                {["Invoice ID", "Patient", "Department", "Services", "Total Amount", "Paid", "Balance", "Method", "Status", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-gray-400" style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv, i) => {
                const cfg = statusConfig[inv.status] || statusConfig.Pending;
                return (
                  <motion.tr
                    key={inv.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-4 py-3"><span style={{ fontSize: "12px", fontWeight: 700, color: "#3AB58F" }}>{inv.id}</span></td>
                    <td className="px-4 py-3 text-gray-900 font-bold text-xs">{inv.patient}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{inv.dept}</td>
                    <td className="px-4 py-3 text-gray-400 text-[11px] max-w-[200px] truncate">{inv.services.join(", ")}</td>
                    <td className="px-4 py-3 text-gray-900 font-bold text-xs">₹{inv.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-green-600 font-bold text-xs">₹{inv.paid.toLocaleString()}</td>
                    <td className="px-4 py-3 text-red-500 font-bold text-xs">₹{(inv.amount - inv.paid).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold text-white" style={{ backgroundColor: methodColors[inv.method] || "#9CA3AF" }}>{inv.method}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full w-fit" style={{ background: cfg.bg, color: cfg.color, fontSize: "11px", fontWeight: 600 }}>
                        <span className="w-1 h-1 rounded-full" style={{ background: cfg.dot }} />
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-1 justify-end">
                        {inv.status !== "Paid" && (
                          <button
                            onClick={() => {
                              const methodChosen = prompt("Enter payment method (Card, UPI, Cash, Insurance):", "Card");
                              if (methodChosen) markInvoicePaid(inv.id, methodChosen);
                            }}
                            className="text-[10px] bg-green-50 text-green-600 border border-green-200 px-2 py-1 rounded-lg font-bold hover:bg-green-100 cursor-pointer"
                          >
                            Pay Bill
                          </button>
                        )}
                        <button onClick={() => setSelectedInvoice(inv)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100">
                          <Eye className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Invoice Detail Modal */}
      <AnimatePresence>
        {selectedInvoice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
            onClick={() => setSelectedInvoice(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5 border-b border-gray-50 pb-3">
                <div>
                  <h3 className="text-gray-950 font-bold text-sm">Invoice Details</h3>
                  <p className="text-gray-400 text-xs mt-0.5">{selectedInvoice.id} · Issued {selectedInvoice.date}</p>
                </div>
                <button onClick={() => setSelectedInvoice(null)} className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-100 hover:bg-gray-200 cursor-pointer">
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              <div className="space-y-3 mb-5 text-xs text-gray-600">
                <div className="flex justify-between"><span className="text-gray-400">Patient:</span><span className="text-gray-900 font-bold">{selectedInvoice.patient}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Department:</span><span className="text-gray-900 font-bold">{selectedInvoice.dept}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Payment Status:</span><span className="font-bold" style={{ color: statusConfig[selectedInvoice.status]?.color }}>{selectedInvoice.status}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Payment Method:</span><span className="text-gray-900 font-bold">{selectedInvoice.method}</span></div>
              </div>

              {/* Services Breakdown */}
              <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50 mb-5 text-xs">
                <p className="text-gray-400 font-bold uppercase text-[10px] mb-2">Itemized Services</p>
                <div className="space-y-2">
                  {selectedInvoice.services.map((srv, index) => (
                    <div key={index} className="flex justify-between text-gray-700">
                      <span>{srv}</span>
                      <span>—</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-950 mt-2">
                    <span>Total Amount</span>
                    <span>₹{selectedInvoice.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Paid Amount</span>
                    <span>₹{selectedInvoice.paid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-red-500 font-bold">
                    <span>Outstanding Balance</span>
                    <span>₹{(selectedInvoice.amount - selectedInvoice.paid).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setSelectedInvoice(null)} className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-50 cursor-pointer">Close</button>
                <button
                  onClick={() => toast.success("PDF Invoice generated and downloaded!")}
                  className="flex-1 py-2 rounded-xl text-white font-bold text-xs hover:opacity-90 flex items-center justify-center gap-1.5 cursor-pointer"
                  style={{ background: "linear-gradient(135deg, #58D0A7, #3AB58F)" }}
                >
                  <Download className="w-4 h-4" /> Download PDF
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Invoice Form Modal */}
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
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-gray-900 font-bold text-base">Generate New Invoice</h2>
                <button onClick={() => setShowAddForm(false)} className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-100 hover:bg-gray-200 cursor-pointer">
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              <form onSubmit={handleCreateInvoice} className="space-y-4">
                <div>
                  <label className="text-gray-600 mb-1 block font-semibold text-xs">Patient Name</label>
                  <input value={patient} onChange={(e) => setPatient(e.target.value)} required placeholder="Patient Name" className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 outline-none" style={{ fontSize: "13px" }} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-600 mb-1 block font-semibold text-xs">Department</label>
                    <select value={dept} onChange={(e) => setDept(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 outline-none" style={{ fontSize: "13px" }}>
                      {["Cardiology", "Neurology", "Orthopedics", "Pediatrics", "Dermatology", "Oncology", "Gastroenterology"].map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-600 mb-1 block font-semibold text-xs">Payment Method</label>
                    <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 outline-none" style={{ fontSize: "13px" }}>
                      {Object.keys(methodColors).map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-600 mb-1 block font-semibold text-xs">Total Amount (₹)</label>
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="15000" className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 outline-none focus:border-green-400" style={{ fontSize: "13px" }} />
                  </div>
                  <div>
                    <label className="text-gray-600 mb-1 block font-semibold text-xs">Paid Amount (₹)</label>
                    <input type="number" value={paid} onChange={(e) => setPaid(e.target.value)} placeholder="0" className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 outline-none focus:border-green-400" style={{ fontSize: "13px" }} />
                  </div>
                </div>

                <div>
                  <label className="text-gray-600 mb-1 block font-semibold text-xs">Services Rendered (comma separated)</label>
                  <input value={services} onChange={(e) => setServices(e.target.value)} required placeholder="Consultation, ECG, Medicines" className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 outline-none focus:border-green-400" style={{ fontSize: "13px" }} />
                </div>

                <button type="submit" className="w-full py-2.5 rounded-xl text-white hover:opacity-90 transition-all font-bold text-xs cursor-pointer" style={{ background: "linear-gradient(135deg, #58D0A7, #3AB58F)" }}>
                  Create Invoice
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
