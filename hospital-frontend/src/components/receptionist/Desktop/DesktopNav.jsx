import React from 'react';
import { LayoutGrid, ListOrdered, Stethoscope, UserPlus, Receipt } from 'lucide-react';

export default function DesktopNav({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'home', label: 'Home', icon: LayoutGrid },
    { id: 'queue', label: 'Queue', icon: ListOrdered },
    { id: 'doctors', label: 'Doctors', icon: Stethoscope },
    { id: 'register', label: 'Register', icon: UserPlus },
    { id: 'billing', label: 'Billing', icon: Receipt },
  ];

  return (
    <div className="bg-white border-b border-gray-200 px-8 flex gap-8">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center gap-1.5 pt-4 pb-3 px-2 relative transition-colors ${
              isActive ? 'text-[#58D0A7]' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            <span className={`text-[11px] font-bold tracking-wide ${isActive ? 'text-[#58D0A7]' : 'text-gray-500'}`}>
              {tab.label}
            </span>
            {isActive && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#58D0A7] rounded-b-full"></div>
            )}
          </button>
        );
      })}
    </div>
  );
}
