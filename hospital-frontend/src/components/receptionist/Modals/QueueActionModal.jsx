import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, Clock, Users, ArrowRightLeft, UserX, AlertTriangle, Accessibility, HeartPulse } from 'lucide-react';
import { mockDoctors } from '@/data/mockData';

export default function QueueActionModal({ isOpen, onClose, patient, onOpenPayment }) {
  if (!patient) return null;

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
            className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-3xl z-50 flex flex-col max-h-[90vh] pb-safe"
          >
            <div className="flex-none p-6 pb-2 border-b border-gray-50 relative">
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-200 rounded-full" />
              
              <div className="flex justify-between items-start mt-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-[#58D0A7]">{patient.token}</span>
                  {patient.name}
                </h2>
                <p className="text-sm text-gray-500 mt-1">Current Doctor: {patient.doctor}</p>
                <p className="text-sm text-gray-500">Status: <span className="font-semibold text-gray-700">{patient.status.replace('_', ' ')}</span></p>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
              >
                <X size={18} />
              </button>
            </div>
            </div>
            
            <div className="flex-1 overflow-y-auto hide-scrollbar p-6 space-y-8">
              {/* Triage Overrides */}
              <div>
                <div className="mb-4">
                  <h3 className="text-base font-bold text-gray-900">Triage overrides</h3>
                  <p className="text-xs text-gray-500 mt-1">Move a patient to front of queue</p>
                </div>
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-gray-200 bg-white hover:bg-gray-50 text-gray-800 font-bold transition-all">
                    <AlertTriangle size={18} /> Emergency push
                  </button>
                  <button className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-gray-200 bg-white hover:bg-gray-50 text-gray-800 font-bold transition-all">
                    <Accessibility size={18} /> Elderly priority
                  </button>
                  <button className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-gray-200 bg-white hover:bg-gray-50 text-gray-800 font-bold transition-all">
                    <HeartPulse size={18} /> Pregnant patient
                  </button>
                </div>
              </div>

              {/* Status Update */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Update Status</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button className="flex items-center gap-2 p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium">
                    <CheckCircle2 size={16} className="text-[#58D0A7]" /> Checked-In
                  </button>
                  <button className="flex items-center gap-2 p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium">
                    <Clock size={16} className="text-orange-500" /> Waiting
                  </button>
                  <button className="flex items-center gap-2 p-3 rounded-xl border border-[#58D0A7] bg-[#58D0A7]/5 text-[#58D0A7] text-sm font-medium">
                    <Users size={16} /> Consultation
                  </button>
                  <button className="flex items-center gap-2 p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium">
                    <UserX size={16} className="text-red-500" /> No-Show
                  </button>
                </div>
              </div>

              {/* Reassign */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Reassign Doctor</h3>
                <div className="flex gap-2">
                  <select className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-[#58D0A7] focus:ring-1 focus:ring-[#58D0A7] appearance-none">
                    <option>Select New Doctor...</option>
                    {mockDoctors.map(doc => (
                      <option key={doc.id} value={doc.id}>{doc.name} ({doc.specialty})</option>
                    ))}
                  </select>
                  <button className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-200">
                    <ArrowRightLeft size={18} />
                  </button>
                </div>
              </div>

              {/* Action Notes */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Action Notes</h3>
                <textarea 
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 text-gray-900 focus:outline-none focus:border-[#58D0A7] focus:ring-1 focus:ring-[#58D0A7] text-sm resize-none h-24"
                  placeholder="Optional reason for reassignment or priority change..."
                />
              </div>
            </div>

            <div className="flex-none p-6 bg-white border-t border-gray-50 space-y-3">
              {/* Payment Action */}
              <button 
                className="w-full bg-blue-50 text-blue-600 border border-blue-200 rounded-2xl py-4 font-bold text-sm hover:bg-blue-100 transition-colors"
                onClick={() => {
                  onClose();
                  if (onOpenPayment) onOpenPayment(patient);
                }}
              >
                Collect Payment
              </button>

              <button 
                className="w-full bg-gray-900 hover:bg-black text-white rounded-2xl py-4 font-bold text-lg shadow-md transition-colors"
                onClick={onClose}
              >
                Save Changes
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
