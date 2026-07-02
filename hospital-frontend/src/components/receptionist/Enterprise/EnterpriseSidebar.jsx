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
  Activity, 
  FileBarChart, 
  BellRing, 
  Settings 
} from 'lucide-react';

import { SidebarBrand } from '@/components/shared/SidebarBrand';

export default function EnterpriseSidebar() {
  const pathname = usePathname();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard/receptionist' },
    { id: 'doctors', label: 'Doctors', icon: Stethoscope, href: '/dashboard/receptionist/doctors' },
    { id: 'live-queue', label: 'Live Queue', icon: ListOrdered, href: '/dashboard/receptionist/live-queue' },
    { id: 'appointments', label: 'Appointments', icon: CalendarCheck, href: '/dashboard/receptionist/appointments' },
    { id: 'patients', label: 'Patients', icon: Users, href: '/dashboard/receptionist/patients' },
    { id: 'tracking', label: 'Tracking', icon: Activity, href: '/dashboard/receptionist/tracking' },
    { id: 'reports', label: 'Reports', icon: FileBarChart, href: '/dashboard/receptionist/reports' },
    { id: 'notifications', label: 'Notifications', icon: BellRing, href: '/dashboard/receptionist/notifications' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/dashboard/receptionist/settings' },
  ];

  return (
    <aside className="w-[260px] h-screen bg-white dark:bg-[#0F172A] border-r border-gray-100 dark:border-[#1E293B] flex flex-col flex-shrink-0 font-sans transition-colors duration-200">
      {/* Logo Area */}
      <SidebarBrand appName="MediCore" role="RECEPTION DESK" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        <p className="text-gray-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mb-4 px-2 transition-colors duration-200">Main Menu</p>
        
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (pathname === '/' && item.id === 'dashboard');
          
          return (
            <Link
              href={item.href}
              key={item.id}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
                isActive 
                  ? 'bg-green-50 dark:bg-teal-500/10 text-green-600 dark:text-teal-400 font-semibold' 
                  : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/50 hover:text-gray-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-green-600 dark:text-teal-400' : 'text-gray-500 dark:text-slate-500'} />
              {item.label}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-teal-400 shadow-[0_0_8px_rgba(34,197,94,0.6)] dark:shadow-[0_0_8px_rgba(45,212,191,0.8)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Mini Profile */}
      <div className="p-4 border-t border-gray-100 dark:border-[#1E293B] transition-colors duration-200">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/50 transition-colors duration-200">
          <div className="w-9 h-9 rounded-full bg-green-600 dark:bg-teal-600 flex items-center justify-center text-white font-bold text-sm transition-colors duration-200">
            JD
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-semibold text-gray-800 dark:text-white truncate transition-colors duration-200">Jane Doe</p>
            <p className="text-xs text-gray-500 dark:text-slate-400 truncate transition-colors duration-200">Head Receptionist</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
