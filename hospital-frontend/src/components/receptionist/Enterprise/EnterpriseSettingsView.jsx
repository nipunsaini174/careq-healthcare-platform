"use client";
import React, { useState } from 'react';
import { User, Shield, Bell, CreditCard, Building, Moon, Save } from 'lucide-react';

export default function EnterpriseSettingsView() {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'hospital', label: 'Hospital Config', icon: Building },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'billing', label: 'Billing Plans', icon: CreditCard },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50/50 p-8">
      <div className="max-w-[1200px] mx-auto space-y-8 pb-12">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">System Settings</h2>
            <p className="text-sm text-gray-500 mt-1">Manage your account, hospital preferences, and security.</p>
          </div>
          
          <button className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-bold hover:bg-teal-700 shadow-sm shadow-teal-600/20">
            <Save size={16} />
            Save Changes
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Settings Sidebar */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <nav className="space-y-1">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                      isActive ? 'bg-white text-teal-700 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon size={18} className={isActive ? 'text-teal-600' : 'text-gray-400'} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Settings Content */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="p-8">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4 mb-6">Profile Information</h3>
                
                <div className="flex items-center gap-6 mb-8">
                  <img src="https://ui-avatars.com/api/?name=Jane+Doe&background=0D8B96&color=fff&size=128" alt="Profile" className="w-24 h-24 rounded-full shadow-sm" />
                  <div>
                    <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-bold text-sm rounded-lg hover:bg-gray-50 shadow-sm mb-2">Change Photo</button>
                    <p className="text-xs text-gray-500">JPG, GIF or PNG. Max size of 800K</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">First Name</label>
                    <input type="text" defaultValue="Jane" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-medium" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Last Name</label>
                    <input type="text" defaultValue="Doe" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-medium" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                    <input type="email" defaultValue="jane.doe@medharvix.com" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-medium" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Role</label>
                    <input type="text" defaultValue="Head Receptionist" disabled className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 font-medium cursor-not-allowed" />
                  </div>
                </div>
              </div>
            )}

            {/* Placeholder for other tabs */}
            {activeTab !== 'profile' && (
              <div className="p-8 flex flex-col items-center justify-center h-96 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Shield size={32} className="text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Configuration Section</h3>
                <p className="text-gray-500 max-w-sm">This section is fully customizable and will connect to your backend settings database.</p>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
