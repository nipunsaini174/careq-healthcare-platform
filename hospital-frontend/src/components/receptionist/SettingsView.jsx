import React from 'react';
import { motion } from 'motion/react';
import { User, Shield, Bell, Moon, ChevronRight } from 'lucide-react';

export default function SettingsView({ isDarkMode, toggleDarkMode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="pb-20 pt-4"
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-6 px-2">Settings</h2>

      <div className="space-y-6">
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-4">Account</h3>
          <div className="bg-white rounded-3xl p-2 shadow-sm border border-gray-100 divide-y divide-gray-50">
            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                  <User size={20} />
                </div>
                <span className="font-bold text-gray-900">Profile Information</span>
              </div>
              <ChevronRight size={20} className="text-gray-300" />
            </button>
            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-500">
                  <Shield size={20} />
                </div>
                <span className="font-bold text-gray-900">Security & Password</span>
              </div>
              <ChevronRight size={20} className="text-gray-300" />
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-4">Preferences</h3>
          <div className="bg-white rounded-3xl p-2 shadow-sm border border-gray-100 divide-y divide-gray-50">
            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
                  <Bell size={20} />
                </div>
                <span className="font-bold text-gray-900">Notifications</span>
              </div>
              <ChevronRight size={20} className="text-gray-300" />
            </button>
            <div className="w-full flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500">
                  <Moon size={20} />
                </div>
                <span className="font-bold text-gray-900">Dark Mode</span>
              </div>
              <button 
                onClick={toggleDarkMode}
                className={`w-12 h-7 rounded-full relative transition-colors ${isDarkMode ? 'bg-[#58D0A7]' : 'bg-gray-200'}`}
              >
                <motion.div 
                  layout
                  className="w-5 h-5 bg-white rounded-full absolute top-1 shadow-sm"
                  initial={false}
                  animate={{ left: isDarkMode ? '24px' : '4px' }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-4">Support</h3>
          <div className="bg-white rounded-3xl p-2 shadow-sm border border-gray-100">
            <button className="w-full p-4 font-bold text-[#58D0A7] hover:bg-gray-50 rounded-2xl transition-colors text-center">
              Logout
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
