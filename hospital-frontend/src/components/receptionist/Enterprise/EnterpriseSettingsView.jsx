"use client";
import React, { useEffect, useState } from 'react';
import { User, Shield, Bell, CreditCard, Building, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useReceptionistProfile } from '@/contexts/ReceptionistProfileContext';
import { splitFullName, joinFullName } from '@/services/receptionistApi';

export default function EnterpriseSettingsView() {
  const [activeTab, setActiveTab] = useState('profile');
  const { effectiveProfile, loading, saving, updateProfile, displayRole, avatar, loadError, refreshProfile } =
    useReceptionistProfile();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (!effectiveProfile) return;
    const { firstName: fn, lastName: ln } = splitFullName(effectiveProfile.name);
    setFirstName(fn);
    setLastName(ln);
    setEmail(effectiveProfile.email);
    setPhone(effectiveProfile.phone || '');
  }, [effectiveProfile]);

  const tabs = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'hospital', label: 'Hospital Config', icon: Building },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'billing', label: 'Billing Plans', icon: CreditCard },
  ];

  const handleSave = async () => {
    const name = joinFullName(firstName, lastName);
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    try {
      await updateProfile({ name, phone });
      toast.success('Profile updated successfully');
    } catch (err) {
      const axiosErr = err && typeof err === 'object' ? err : {};
      const message = axiosErr.response?.data?.error || 'Failed to update profile';
      toast.error(message);
    }
  };

  return (
    <div className="flex-1 min-w-0 overflow-x-auto overflow-y-auto bg-gray-50/50 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-[1200px] mx-auto min-w-0 space-y-6 pb-8 sm:space-y-8 sm:pb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">System Settings</h2>
            <p className="text-sm text-gray-500 mt-1">Manage your account, hospital preferences, and security.</p>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-bold hover:bg-teal-700 shadow-sm shadow-teal-600/20 disabled:opacity-60"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-64 flex-shrink-0">
            <nav className="space-y-1">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
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

          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {activeTab === 'profile' && (
              <div className="p-8">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4 mb-6">Profile Information</h3>

                {loading ? (
                  <div className="py-16 text-center text-sm text-gray-500">Loading your profile...</div>
                ) : (
                  <>
                    {loadError && (
                      <div className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        <span>Could not refresh profile from server. Showing saved account details.</span>
                        <button
                          type="button"
                          onClick={() => refreshProfile()}
                          className="shrink-0 font-bold text-amber-900 underline"
                        >
                          Retry
                        </button>
                      </div>
                    )}
                    <div className="flex items-center gap-6 mb-8">
                      <img src={avatar} alt="Profile" className="w-24 h-24 rounded-full shadow-sm" />
                      <div>
                        <button
                          type="button"
                          className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-bold text-sm rounded-lg hover:bg-gray-50 shadow-sm mb-2"
                          disabled
                        >
                          Change Photo
                        </button>
                        <p className="text-xs text-gray-500">Avatar is generated from your name</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">First Name</label>
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Last Name</label>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-medium"
                        />
                      </div>
                      <div className="col-span-full sm:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                        <input
                          type="email"
                          value={email}
                          readOnly
                          className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 font-medium cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-400 mt-1">Email is managed by your hospital admin</p>
                      </div>
                      <div className="col-span-full sm:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-medium"
                        />
                      </div>
                      <div className="col-span-full sm:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Role</label>
                        <input
                          type="text"
                          value={displayRole}
                          disabled
                          className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 font-medium cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

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
