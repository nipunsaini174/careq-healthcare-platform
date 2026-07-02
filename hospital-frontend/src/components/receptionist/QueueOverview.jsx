import React from 'react';
import { motion } from 'motion/react';
import { MoreVertical, User, AlertTriangle } from 'lucide-react';

export default function QueueOverview({ onActionClick, onCardClick }) {
  const queue = [
    { token: 'T-01', name: 'Rahul', doctor: 'Dr. Smith', status: 'WAITING', priority: 'NORMAL' },
    { token: 'T-02', name: 'Priya', doctor: 'Dr. Jones', status: 'CHECKED_IN', priority: 'NORMAL' },
    { token: 'T-03', name: 'Amit', doctor: 'Dr. Smith', status: 'WAITING', priority: 'EMERGENCY' },
    { token: 'T-04', name: 'Neha', doctor: 'Dr. Jones', status: 'WAITING', priority: 'NORMAL' },
  ];

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
    <div className="pb-24">
      <div className="flex justify-between items-end mb-4 px-1">
        <h2 className="text-lg text-gray-900 font-semibold">Queue Overview</h2>
        <div className="flex gap-2">
          <span className="text-xs bg-[#58D0A7] text-white px-2 py-1 rounded-full">All</span>
          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">Waiting</span>
        </div>
      </div>
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-3"
      >
        {queue.map(patient => (
          <motion.div 
            key={patient.token}
            variants={itemVariants}
            className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between ${
              patient.priority === 'EMERGENCY' ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-[#58D0A7]'
            }`}
          >
            <div 
              className="flex items-center gap-4 cursor-pointer flex-1"
              onClick={() => onCardClick && onCardClick(patient)}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                patient.priority === 'EMERGENCY' ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-500'
              }`}>
                {patient.priority === 'EMERGENCY' ? <AlertTriangle size={18} /> : <User size={18} />}
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-gray-900">{patient.token}</span>
                  <span className="font-medium text-gray-700">{patient.name}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500">{patient.doctor}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                  <span className={patient.status === 'WAITING' ? 'text-orange-500' : 'text-[#58D0A7]'}>
                    {patient.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onActionClick(patient);
              }}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors ml-2"
            >
              <MoreVertical size={18} />
            </button>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
