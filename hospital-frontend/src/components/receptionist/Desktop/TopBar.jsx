import React from 'react';
import { Search, Bell } from 'lucide-react';

export default function TopBar() {
  return (
    <div className="h-20 border-b border-[#1E293B] flex items-center justify-between px-10 bg-[#0B1120]">
      {/* Search */}
      <div className="relative w-96">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
          <Search size={18} />
        </div>
        <input 
          type="text" 
          placeholder="Search doctors, departments, records..." 
          className="w-full bg-[#131B2D] border border-[#1E293B] text-gray-200 text-sm rounded-full pl-11 pr-4 py-2.5 focus:outline-none focus:border-[#58D0A7]/50 focus:ring-1 focus:ring-[#58D0A7]/50 transition-colors"
        />
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-6">
        {/* Notification */}
        <button className="w-10 h-10 rounded-full bg-[#131B2D] border border-[#1E293B] flex items-center justify-center text-gray-400 hover:text-white relative transition-colors">
          <Bell size={18} />
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-[#131B2D]"></span>
        </button>

        {/* Profile */}
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-[#58D0A7]/20 border border-[#58D0A7]/30 text-[#58D0A7] flex items-center justify-center font-bold">
            JD
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">John Doe</h3>
            <p className="text-xs text-gray-400">Patient</p>
          </div>
        </div>
      </div>
    </div>
  );
}
