"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, QrCode, User, Phone, Calendar, Stethoscope, AlertCircle, CreditCard, Loader2 } from 'lucide-react';

export default function PatientRegistrationModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({ name: '', phone: '', doctorId: 'doc1', priority: 'Normal', billing: 'Pending' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mockDoctors = [
    { id: 'doc1', name: 'Dr. Sarah Smith', specialty: 'Cardiology' },
    { id: 'doc2', name: 'Dr. Michael Jones', specialty: 'Ophthalmology' },
    { id: 'doc3', name: 'Dr. Emily Chen', specialty: 'Pediatrics' },
    { id: 'doc4', name: 'Dr. Lisa Taylor', specialty: 'Dermatology' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return alert("Please fill name and phone");

    setIsSubmitting(true);
    // Simulate network delay
    setTimeout(() => {
      onClose();
      setFormData({ name: '', phone: '', doctorId: 'doc1', priority: 'Normal', billing: 'Pending' });
      setIsSubmitting(false);
      alert("Registration Successful (Mock Mode)");
    }, 800);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 max-w-md mx-auto"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-3xl z-50 flex flex-col h-[85vh] pb-safe"
          >
            <div className="flex-none sticky top-0 bg-white/80 backdrop-blur-md pt-6 pb-4 px-6 border-b border-gray-100 z-10">
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-200 rounded-full" />
              <div className="flex justify-between items-center mt-2">
                <h2 className="text-xl font-bold text-gray-900">New Registration</h2>
                <button 
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Scan ABHA Section */}
                <div className="bg-[#58D0A7]/10 rounded-2xl p-4 flex items-center justify-between border border-[#58D0A7]/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#58D0A7] text-white flex items-center justify-center">
                      <QrCode size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Scan ABHA Card</h3>
                      <p className="text-xs text-gray-500">Auto-fill patient details</p>
                    </div>
                  </div>
                  <button type="button" className="px-4 py-2 bg-white text-[#58D0A7] rounded-xl text-sm font-bold shadow-sm">
                    Scan
                  </button>
                </div>

                {/* Patient Details */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User size={16} className="text-[#58D0A7]" />
                    Patient Details
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Full Name*</label>
                      <input 
                        type="text" 
                        required
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-[#58D0A7] focus:ring-1 focus:ring-[#58D0A7]" 
                        placeholder="e.g. John Doe" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Phone*</label>
                        <input 
                          type="tel" 
                          required
                          value={formData.phone}
                          onChange={e => setFormData({...formData, phone: e.target.value})}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-[#58D0A7] focus:ring-1 focus:ring-[#58D0A7]" 
                          placeholder="+91" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">DOB</label>
                        <input type="date" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-[#58D0A7] focus:ring-1 focus:ring-[#58D0A7]" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Appointment Details */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Stethoscope size={16} className="text-[#58D0A7]" />
                    Appointment Setup
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Assign Doctor*</label>
                      <select 
                        value={formData.doctorId}
                        onChange={e => setFormData({...formData, doctorId: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-[#58D0A7] focus:ring-1 focus:ring-[#58D0A7] appearance-none"
                      >
                        {mockDoctors.map(doc => (
                          <option key={doc.id} value={doc.id}>{doc.name} ({doc.specialty})</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                          <AlertCircle size={12} /> Priority
                        </label>
                        <select 
                          value={formData.priority}
                          onChange={e => setFormData({...formData, priority: e.target.value})}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-[#58D0A7] focus:ring-1 focus:ring-[#58D0A7] appearance-none"
                        >
                          <option value="Normal">Normal</option>
                          <option value="Emergency">Emergency</option>
                          <option value="Senior">Senior</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                          <CreditCard size={12} /> Billing
                        </label>
                        <select 
                          value={formData.billing}
                          onChange={e => setFormData({...formData, billing: e.target.value})}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-[#58D0A7] focus:ring-1 focus:ring-[#58D0A7] appearance-none"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Paid">Paid</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex-none bg-white border-t border-gray-100 p-4 pb-8">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center bg-[#58D0A7] hover:bg-[#3AB58F] disabled:opacity-70 text-white rounded-2xl py-4 font-bold text-lg shadow-md transition-colors"
                >
                  {isSubmitting ? <Loader2 className="animate-spin mr-2" size={24} /> : 'Register & Print Token'}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
