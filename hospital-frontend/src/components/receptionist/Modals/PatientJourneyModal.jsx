import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, CheckCircle2, Beaker, Pill, CalendarPlus, Ban, History, MessageCircle, AlertCircle } from 'lucide-react';

export default function PatientJourneyModal({ isOpen, onClose, patient }) {
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 max-w-md mx-auto"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-gray-50 rounded-t-3xl z-50 flex flex-col h-[90vh] pb-safe"
          >
            <div className="flex-none p-6 pb-4 border-b border-gray-200 relative bg-white rounded-t-3xl">
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-200 rounded-full" />
              
              <div className="flex justify-between items-start mt-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  Visit Details
                </h2>
                <button 
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto hide-scrollbar p-5 space-y-6">
              {/* Alert Box */}
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex gap-3 text-orange-800">
                <AlertCircle className="flex-shrink-0 text-orange-500" size={20} />
                <p className="text-sm font-medium">Please arrive by 11:10 AM — 4 patients ahead</p>
              </div>

              {/* Big Token Box */}
              <div className="bg-gradient-to-br from-slate-800 to-[#1F3D33] rounded-3xl p-6 text-center shadow-lg relative overflow-hidden">
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#58D0A7] rounded-full blur-[60px] opacity-20"></div>
                <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-blue-500 rounded-full blur-[60px] opacity-20"></div>
                
                <p className="text-gray-300 text-sm font-medium mb-1 relative z-10">Your token</p>
                <h1 className="text-5xl font-bold text-white mb-2 relative z-10">{patient.token}</h1>
                <p className="text-gray-300 text-sm relative z-10">Cardiology • {patient.doctor}</p>
              </div>

              {/* Live Stats */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex justify-between divide-x divide-gray-100">
                <div className="text-center px-4">
                  <p className="text-2xl font-bold text-gray-900">4</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide font-bold mt-1">Ahead of you</p>
                </div>
                <div className="text-center px-4">
                  <p className="text-2xl font-bold text-gray-900">~28<span className="text-lg">m</span></p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide font-bold mt-1">Est. wait</p>
                </div>
                <div className="text-center px-4">
                  <p className="text-2xl font-bold text-[#58D0A7]">11:10</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide font-bold mt-1">Arrive by</p>
                </div>
              </div>

              {/* Visit Journey Timeline */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">Your Visit Journey</h3>
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative">
                  {/* Timeline Line */}
                  <div className="absolute left-10 top-10 bottom-10 w-[2px] bg-gray-100"></div>

                  <div className="space-y-6 relative z-10">
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm border-4 border-white">
                        <CheckCircle2 size={16} />
                      </div>
                      <div>
                        <h4 className="text-gray-900 font-bold">Registration</h4>
                        <p className="text-xs text-gray-500 mt-0.5">Token issued 9:55 AM</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 border-4 border-white">
                        <Clock size={16} />
                      </div>
                      <div>
                        <h4 className="text-gray-900 font-bold">Consultation</h4>
                        <p className="text-xs text-blue-600 font-medium mt-0.5">Est. 11:10 AM</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center flex-shrink-0 border-4 border-white">
                        <Beaker size={16} />
                      </div>
                      <div>
                        <h4 className="text-gray-900 font-bold">Lab test</h4>
                        <p className="text-xs text-gray-500 mt-0.5">Pending</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center flex-shrink-0 border-4 border-white">
                        <Pill size={16} />
                      </div>
                      <div>
                        <h4 className="text-gray-900 font-bold">Pharmacy</h4>
                        <p className="text-xs text-gray-500 mt-0.5">Pending</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 text-gray-700 transition-colors">
                    <CalendarPlus size={20} className="text-gray-500" />
                    <span className="text-sm font-bold">Book new</span>
                  </button>
                  <button className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 text-gray-700 transition-colors">
                    <Ban size={20} className="text-gray-500" />
                    <span className="text-sm font-bold">Cancel token</span>
                  </button>
                  <button className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 text-gray-700 transition-colors">
                    <History size={20} className="text-gray-500" />
                    <span className="text-sm font-bold">Past visits</span>
                  </button>
                  <button className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 text-gray-700 transition-colors">
                    <MessageCircle size={20} className="text-gray-500" />
                    <span className="text-sm font-bold">WhatsApp</span>
                  </button>
                </div>
              </div>
              
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
