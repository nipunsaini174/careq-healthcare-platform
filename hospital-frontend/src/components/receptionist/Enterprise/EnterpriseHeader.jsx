"use client";

import React, { useState, useEffect } from 'react';
import { Search, Building2, Bell, ChevronDown, Clock, Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useReceptionistProfile } from '@/contexts/ReceptionistProfileContext';

export default function EnterpriseHeader({ onMenuClick = () => {} }) {
  const [time, setTime] = useState(new Date());
  const router = useRouter();
  const { profile, avatar, loading } = useReceptionistProfile();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const formattedTime = time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  return (
    <header className="sticky top-0 z-40 flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 sm:px-6 lg:px-8">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 sm:gap-4 lg:gap-6">
        <button
          type="button"
          aria-label="Open menu"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
        >
          <Menu size={22} />
        </button>

        <button
          type="button"
          className="flex min-w-0 max-w-full items-center gap-2 rounded-lg border border-transparent p-2 transition-colors hover:border-gray-200 hover:bg-gray-50"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-teal-50 text-teal-600">
            <Building2 size={16} />
          </div>
          <div className="min-w-0 text-left">
            <p className="truncate text-sm font-bold leading-tight text-gray-900">
              {loading ? 'Loading...' : profile?.branchName || profile?.hospitalName || 'Hospital'}
            </p>
            <p className="truncate text-[10px] font-medium text-gray-500">
              {profile?.hospitalName || 'Main Hospital'}
            </p>
          </div>
          <ChevronDown size={14} className="ml-1 shrink-0 text-gray-400" />
        </button>

        <div className="hidden h-8 w-px bg-gray-200 md:block" />

        <div className="relative w-full min-w-0 basis-full md:basis-auto md:max-w-md md:flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-10 pr-3 text-sm leading-5 shadow-sm transition-all placeholder:text-gray-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            placeholder="Search tokens, patients, doctors..."
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3 sm:gap-4 lg:gap-6">
        <div className="hidden items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-gray-600 lg:flex">
          <Clock size={16} className="text-teal-600" />
          <div className="flex flex-col text-right">
            <span className="text-sm font-bold leading-tight">{formattedTime}</span>
            <span className="text-[10px] font-medium uppercase tracking-wider">{formattedDate}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => router.push('/dashboard/receptionist/notifications')}
          className="relative rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          <Bell size={22} />
          <span className="absolute right-1.5 top-1.5 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        <button
          type="button"
          className="flex items-center gap-2 pl-1"
          onClick={() => router.push('/dashboard/receptionist/settings')}
        >
          <img src={avatar} alt="Profile" className="h-9 w-9 rounded-full ring-2 ring-gray-100" />
          <ChevronDown size={16} className="hidden text-gray-400 sm:block" />
        </button>
      </div>
    </header>
  );
}
