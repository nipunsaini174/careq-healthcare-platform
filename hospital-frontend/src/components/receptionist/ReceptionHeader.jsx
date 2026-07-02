import React from 'react';
import { Search, Bell, Menu } from 'lucide-react';
import { motion } from 'motion/react';

export default function Header({ onOpenSearch }) {
  return (
    <motion.div 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-gradient-to-br from-[#58D0A7] to-[#3AB58F] rounded-b-[40px] pt-12 pb-24 px-6 relative z-10"
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">ClinicCare</h1>
          <p className="text-white/80 text-sm">Reception Dashboard</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={onOpenSearch}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-lg border border-white/30 flex items-center justify-center text-white"
          >
            <Search size={20} />
          </button>
          <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-lg border border-white/30 flex items-center justify-center text-white relative">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </div>
      
      {/* Glassmorphism widget overlay */}
      <div className="bg-white/20 backdrop-blur-lg border border-white/30 rounded-2xl p-4 flex justify-between items-center text-white">
        <div>
          <p className="text-xs text-white/80">Today's Queue</p>
          <p className="text-xl font-bold">42 Patients</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-white/80">Avg Wait Time</p>
          <p className="text-xl font-bold">18 mins</p>
        </div>
      </div>
    </motion.div>
  );
}
