import React from 'react';
import { motion } from 'motion/react';
import { Stethoscope, Star, Clock } from 'lucide-react';
import { mockDoctors as doctors } from '@/data/mockData';

export default function DoctorsView() {

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className="pb-24 pt-4"
    >
      <div className="flex justify-between items-end mb-6 px-1">
        <h2 className="text-xl text-gray-900 font-bold">All Doctors</h2>
        <span className="text-sm text-gray-500">{doctors.length} Total</span>
      </div>

      <div className="space-y-4">
        {doctors.map((doc, index) => (
          <motion.div 
            key={doc.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex items-center gap-4"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${doc.bg} ${doc.text} flex-shrink-0`}>
              <Stethoscope size={28} />
            </div>
            
            <div className="flex-1">
              <div className="flex justify-between items-start mb-1">
                <h3 className="text-lg text-gray-900 font-bold leading-tight">{doc.name}</h3>
                <div className="flex items-center gap-1 text-xs font-medium text-yellow-500 bg-yellow-50 px-2 py-0.5 rounded-full">
                  <Star size={10} fill="currentColor" /> {doc.rating}
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2">{doc.specialty}</p>
              
              <div className="flex items-center gap-3">
                {doc.status === 'ACTIVE' && <span className="text-[10px] bg-[#58D0A7]/10 text-[#58D0A7] px-2 py-1 rounded font-bold uppercase tracking-wider">Active</span>}
                {doc.status === 'DELAYED' && <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-1 rounded font-bold uppercase tracking-wider flex items-center gap-1"><Clock size={10} /> Delayed</span>}
                {doc.status === 'LEAVE' && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded font-bold uppercase tracking-wider">On Leave</span>}
                
                <span className="text-xs text-gray-500">{doc.patients} Patients today</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
