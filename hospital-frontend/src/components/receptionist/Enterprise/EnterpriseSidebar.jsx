"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Stethoscope, 
  ListOrdered, 
  CalendarCheck, 
  Users, 
  HeartPulse,
  Activity, 
  FileBarChart, 
  BellRing, 
  Settings,
  X,
} from 'lucide-react';

import { SidebarBrand } from '@/components/shared/SidebarBrand';
import { useReceptionistProfile } from '@/contexts/ReceptionistProfileContext';

export default function EnterpriseSidebar({ open = false, onClose = () => {} }) {
  const pathname = usePathname();
  const { displayName, displayRole, initials, loading } = useReceptionistProfile();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard/receptionist' },
    { id: 'doctors', label: 'Doctors', icon: Stethoscope, href: '/dashboard/receptionist/doctors' },
    { id: 'live-queue', label: 'Live Queue', icon: ListOrdered, href: '/dashboard/receptionist/live-queue' },
    { id: 'appointments', label: 'Appointments', icon: CalendarCheck, href: '/dashboard/receptionist/appointments' },
    { id: 'patients', label: 'Patients', icon: Users, href: '/dashboard/receptionist/patients' },
    { id: 'care-continuity', label: 'AI Follow-Ups', icon: HeartPulse, href: '/dashboard/receptionist/care-continuity' },
    { id: 'tracking', label: 'Tracking', icon: Activity, href: '/dashboard/receptionist/tracking' },
    { id: 'reports', label: 'Reports', icon: FileBarChart, href: '/dashboard/receptionist/reports' },
    { id: 'notifications', label: 'Notifications', icon: BellRing, href: '/dashboard/receptionist/notifications' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/dashboard/receptionist/settings' },
  ];

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 flex w-[min(280px,88vw)] shrink-0 flex-col border-r border-gray-100 bg-white font-sans transition-transform duration-200 dark:border-[#1E293B] dark:bg-[#0F172A]
        lg:static lg:z-auto lg:translate-x-0 lg:w-64 xl:w-[260px]
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      <div className="flex items-center justify-between lg:block">
        <SidebarBrand appName="MediCore" role="RECEPTION DESK" />
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="mr-3 rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 sm:px-4 sm:py-6">
        <p className="mb-4 px-2 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">Main Menu</p>
        
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (pathname === '/' && item.id === 'dashboard');
          
          return (
            <Link
              href={item.href}
              key={item.id}
              onClick={onClose}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                isActive 
                  ? 'bg-green-50 font-semibold text-green-600 dark:bg-teal-500/10 dark:text-teal-400' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-green-600 dark:text-teal-400' : 'text-gray-500 dark:text-slate-500'} />
              <span className="truncate">{item.label}</span>
              {isActive && (
                <div className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] dark:bg-teal-400" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-100 p-3 dark:border-[#1E293B] sm:p-4">
        <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-slate-700/50 dark:bg-slate-800/50">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-600 text-sm font-bold text-white dark:bg-teal-600">
            {initials || 'R'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-800 dark:text-white">
              {displayName || 'Receptionist'}
            </p>
            <p className="truncate text-xs text-gray-500 dark:text-slate-400">
              {displayRole || 'Reception Staff'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
