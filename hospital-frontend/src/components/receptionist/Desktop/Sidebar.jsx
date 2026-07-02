import React from 'react';
import { HeartPulse, Home, Users, FileText, UserPlus, Stethoscope, Settings } from 'lucide-react';

export default function Sidebar({ activeTab, onTabChange }) {
  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'queue', icon: Users, label: 'Queue' },
    { id: 'doctors', icon: Stethoscope, label: 'Doctors' },
    { id: 'register', icon: UserPlus, label: 'Register' },
    { id: 'billing', icon: FileText, label: 'Billing' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="w-64 h-full bg-[#0F1626] border-r border-[#1E293B] flex flex-col p-4">
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 mb-10 mt-2">
        <div className="w-8 h-8 bg-[#58D0A7] rounded-lg flex items-center justify-center text-[#0F1626]">
          <HeartPulse size={20} className="fill-current" />
        </div>
        <h1 className="text-xl font-bold text-white tracking-wide">HealthFlow</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive 
                  ? 'bg-[#58D0A7]/10 text-[#58D0A7] font-semibold' 
                  : 'text-gray-400 hover:text-white hover:bg-[#1E293B]/50'
              }`}
            >
              <Icon size={20} />
              <span className="text-sm">{item.label}</span>
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#58D0A7]" />}
            </button>
          );
        })}
      </nav>

      {/* Need Help Box */}
      <div className="mt-auto bg-[#131B2D] border border-[#1E293B] rounded-2xl p-4 mb-2">
        <h3 className="text-sm font-bold text-white mb-1">Need Help?</h3>
        <p className="text-xs text-gray-400 mb-4">Contact our support team</p>
        <button className="w-full bg-[#58D0A7] hover:bg-[#4AB892] text-[#0F1626] font-bold py-2.5 rounded-xl text-sm transition-colors shadow-[0_0_15px_rgba(88,208,167,0.3)]">
          Get Support
        </button>
      </div>
    </div>
  );
}
