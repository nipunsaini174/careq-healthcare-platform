import React from 'react';
import { Home, Users, Stethoscope, Settings, FileText } from 'lucide-react';
import { motion } from 'motion/react';

export default function BottomNav({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'queue', icon: Users, label: 'Queue' },
    { id: 'doctors', icon: Stethoscope, label: 'Doctors' },
    { id: 'billing', icon: FileText, label: 'Billing' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 max-w-md mx-auto z-50 h-20 px-6 flex justify-between items-center pb-safe">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex flex-col items-center justify-center relative w-16 h-16"
          >
            <motion.div
              animate={{ scale: isActive ? 1.1 : 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={`mb-1 ${isActive ? 'text-[#58D0A7]' : 'text-gray-400'}`}
            >
              <Icon size={24} />
            </motion.div>
            <span className={`text-[10px] ${isActive ? 'text-[#58D0A7] font-medium' : 'text-gray-400'}`}>
              {tab.label}
            </span>
            
            {isActive && (
              <motion.div
                layoutId="activeTab"
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="absolute -bottom-2 w-1.5 h-1.5 rounded-full bg-[#58D0A7]"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
