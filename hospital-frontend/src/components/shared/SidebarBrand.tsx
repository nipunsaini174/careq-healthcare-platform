import React from 'react';
import { Activity } from 'lucide-react';

interface SidebarBrandProps {
  appName: string;
  role: string;
  collapsed?: boolean;
}

export function SidebarBrand({ appName, role, collapsed = false }: SidebarBrandProps) {
  return (
    <div className="h-20 flex items-center px-6 border-b border-gray-100 dark:border-[#1E293B] transition-colors duration-200 overflow-hidden">
      <div className="w-8 h-8 rounded-lg bg-green-500 dark:bg-teal-500 flex flex-shrink-0 items-center justify-center mr-3 shadow-md dark:shadow-[0_0_15px_rgba(20,184,166,0.4)] transition-all duration-200">
        <Activity size={20} className="text-white" />
      </div>
      {!collapsed && (
        <div className="whitespace-nowrap overflow-hidden">
          <h1 className="text-gray-800 dark:text-white font-bold text-lg leading-tight tracking-wide transition-colors duration-200">
            {appName}
          </h1>
          <p className="text-gray-500 dark:text-teal-400 text-[10px] uppercase font-bold tracking-widest transition-colors duration-200">
            {role}
          </p>
        </div>
      )}
    </div>
  );
}
