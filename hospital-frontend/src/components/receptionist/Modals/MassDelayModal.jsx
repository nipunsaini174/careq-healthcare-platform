import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, AlertTriangle } from 'lucide-react';

export default function MassDelayModal({ isOpen, onClose, doctor }) {
  if (!doctor) return null;

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
            className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-3xl z-50 p-6 pb-safe"
          >
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-200 rounded-full" />
            
            <div className="flex justify-between items-start mt-2 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Notify Patients</h2>
                  <p className="text-sm text-gray-500">{doctor.name} is Delayed</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Delay Duration */}
              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-2xl border border-orange-100">
                <span className="font-semibold text-orange-800">Delay Duration</span>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    defaultValue={doctor.delay} 
                    className="w-16 bg-white border border-orange-200 rounded-lg px-2 py-1 text-center font-bold text-orange-600 focus:outline-none"
                  />
                  <span className="text-orange-600 text-sm font-medium">Minutes</span>
                </div>
              </div>

              {/* Impacted Patients */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Impacted Patients ({doctor.queue} in Queue)
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                  {[
                    { id: 'T-02', name: 'Priya', type: 'SMS' },
                    { id: 'T-05', name: 'Rohan', type: 'WhatsApp' },
                    { id: 'T-09', name: 'Neha', type: 'App Push' }
                  ].map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" defaultChecked className="w-4 h-4 text-[#58D0A7] rounded border-gray-300 focus:ring-[#58D0A7]" />
                        <span className="font-medium text-gray-900">{p.id} - {p.name}</span>
                      </div>
                      <span className="text-xs bg-white border border-gray-200 px-2 py-1 rounded text-gray-500 font-medium">
                        {p.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Message Preview */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Message Preview</h3>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-600 italic">
                  "Dear Patient, {doctor.name} is delayed by {doctor.delay} minutes. Your estimated consultation time has been updated accordingly. Sorry for the inconvenience."
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl py-4 font-bold text-lg transition-colors"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button 
                  className="flex-[2] bg-orange-500 hover:bg-orange-600 text-white rounded-2xl py-4 font-bold text-lg shadow-md transition-colors flex items-center justify-center gap-2"
                  onClick={onClose}
                >
                  <Send size={20} /> Send Broadcast
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
