import React from 'react';
import { motion } from 'motion/react';
import { Stethoscope, Clock, AlertCircle } from 'lucide-react';
import { mockDoctors as doctors } from '@/data/mockData';

export default function DoctorBoard({ onNotifyDelayed }) {

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="mb-8">
      <h2 className="text-lg text-gray-900 font-semibold mb-4 px-1">Available Doctors</h2>
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex overflow-x-auto gap-4 pb-4 hide-scrollbar px-1"
      >
        {doctors.map(doc => (
          <motion.div 
            key={doc.id}
            variants={itemVariants}
            className="bg-white rounded-3xl p-5 shadow-lg min-w-[200px] flex-shrink-0"
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${doc.accentBg} ${doc.accentText}`}>
              <Stethoscope size={24} />
            </div>
            
            <h3 className="text-xl text-gray-900 font-bold">{doc.name}</h3>
            <p className="text-sm text-gray-600 mb-4">{doc.specialty}</p>
            
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs text-gray-500 mb-1">Queue</p>
                <p className="font-semibold text-gray-900">{doc.queue} Patients</p>
              </div>
              
              {doc.status === 'ACTIVE' ? (
                <div className="bg-[#58D0A7]/10 text-[#58D0A7] px-3 py-1 rounded-lg text-xs font-medium">
                  Active
                </div>
              ) : (
                <div className="flex flex-col items-end gap-2">
                  <div className="bg-red-50 text-red-600 px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1">
                    <Clock size={12} /> {doc.delay}m
                  </div>
                  <button 
                    onClick={() => onNotifyDelayed(doc)}
                    className="text-xs text-blue-600 font-medium underline"
                  >
                    Notify Patients
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
