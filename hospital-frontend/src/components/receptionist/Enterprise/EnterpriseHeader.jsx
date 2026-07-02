"use client";
"use client";

import React, { useState, useEffect } from 'react';
import { Search, Building2, Bell, ChevronDown, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function EnterpriseHeader() {
  const [time, setTime] = useState(new Date());
  const router = useRouter();

  useEffect(() => {
    // Only update once a minute to prevent unnecessary re-renders
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const formattedTime = time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  return (
    <header className="h-20 bg-white border-b border-gray-200 px-8 flex items-center justify-between flex-shrink-0 sticky top-0 z-40">
      
      {/* Left: Global Search & Hospital Selector */}
      <div className="flex items-center gap-6 flex-1">
        
        {/* Hospital Selector */}
        <button className="flex items-center gap-2 hover:bg-gray-50 p-2 rounded-lg transition-colors border border-transparent hover:border-gray-200">
          <div className="w-8 h-8 rounded-md bg-teal-50 text-teal-600 flex items-center justify-center">
            <Building2 size={16} />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-gray-900 leading-tight">City Center Branch</p>
            <p className="text-[10px] text-gray-500 font-medium">Main Hospital</p>
          </div>
          <ChevronDown size={14} className="text-gray-400 ml-1" />
        </button>

        {/* Vertical Divider */}
        <div className="h-8 w-px bg-gray-200"></div>

        {/* Global Search */}
        <div className="relative max-w-md w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 sm:text-sm transition-all shadow-sm inset-shadow-sm"
            placeholder="Search tokens, patients, doctors or departments... (Press '/')"
          />
        </div>
      </div>

      {/* Right: Time, Notifications, Profile */}
      <div className="flex items-center gap-6">
        
        {/* Live Date/Time */}
        <div className="hidden lg:flex items-center gap-2 text-gray-600 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
          <Clock size={16} className="text-teal-600" />
          <div className="flex flex-col text-right">
            <span className="text-sm font-bold leading-tight">{formattedTime}</span>
            <span className="text-[10px] font-medium uppercase tracking-wider">{formattedDate}</span>
          </div>
        </div>

        {/* Notification Bell */}
        <button onClick={() => router.push('/dashboard/receptionist/notifications')} className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100">
          <Bell size={22} />
          <span className="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        {/* Profile Dropdown */}
        <button className="flex items-center gap-2 pl-2">
          <img 
            src="https://ui-avatars.com/api/?name=Jane+Doe&background=0D8B96&color=fff&rounded=true" 
            alt="Profile" 
            className="w-9 h-9 rounded-full ring-2 ring-gray-100"
          />
          <ChevronDown size={16} className="text-gray-400" />
        </button>
      </div>

    </header>
  );
}
