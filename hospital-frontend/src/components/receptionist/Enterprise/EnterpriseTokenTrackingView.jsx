"use client";
import React, { useState } from 'react';
import { Search, MapPin, User, Stethoscope, Clock, CheckCircle2, ChevronRight, FileText, Beaker, Receipt } from 'lucide-react';

export default function EnterpriseTokenTrackingView() {
  const [search, setSearch] = useState('A-045');

  const timelineSteps = [
    { id: 1, title: 'Registration & Token Issued', time: '08:15 AM', status: 'completed', icon: FileText, desc: 'Registered at Front Desk 2 by Jane Doe.' },
    { id: 2, title: 'Initial Vitals Checked', time: '08:30 AM', status: 'completed', icon: CheckCircle2, desc: 'BP: 120/80, Temp: 98.6°F, Wt: 72kg recorded.' },
    { id: 3, title: 'Waiting Area B', time: '08:35 AM', status: 'completed', icon: Clock, desc: 'Patient seated in Waiting Area B (Cardiology).' },
    { id: 4, title: 'Called by Doctor', time: '09:10 AM', status: 'active', icon: Stethoscope, desc: 'Token A-045 called to Room 104 by Dr. Sarah Smith.' },
    { id: 5, title: 'In Consultation', time: '-', status: 'pending', icon: User, desc: 'Ongoing consultation.' },
    { id: 6, title: 'Lab / Pharmacy Queue', time: '-', status: 'pending', icon: Beaker, desc: 'Awaiting doctor prescriptions.' },
    { id: 7, title: 'Billing & Checkout', time: '-', status: 'pending', icon: Receipt, desc: 'Final clearance.' },
  ];

  return (
    <div className="flex-1 min-w-0 overflow-x-auto overflow-y-auto bg-gray-50/50 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-[1200px] mx-auto min-w-0 space-y-6 pb-8 sm:space-y-8 sm:pb-12">
        
        {/* Page Header & Search */}
        <div className="text-center space-y-6 mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-100 text-teal-600 mb-2 shadow-sm">
            <MapPin size={32} />
          </div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight">Token Journey Tracker</h2>
          <p className="text-gray-500 max-w-lg mx-auto">Enter a patient's token number to instantly track their exact location and status across all hospital departments.</p>
          
          <div className="relative max-w-2xl mx-auto mt-8">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={24} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="e.g. A-045"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-14 pr-32 py-5 border-2 border-gray-200 rounded-2xl leading-5 bg-white placeholder-gray-300 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/20 text-2xl font-black tracking-widest uppercase transition-all shadow-lg"
            />
            <button className="absolute inset-y-2 right-2 bg-teal-600 hover:bg-teal-700 text-white font-bold px-8 rounded-xl transition-colors shadow-sm">
              Track
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="bg-white rounded-3xl shadow-md border border-gray-200 overflow-hidden">
          {/* Top Info Bar */}
          <div className="p-8 border-b border-gray-100 bg-gradient-to-br from-gray-50 to-white flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-2xl bg-teal-50 border-2 border-teal-100 flex items-center justify-center flex-col">
                <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">Token</span>
                <span className="text-3xl font-black text-teal-700">A-045</span>
              </div>
              <div>
                <h3 className="text-2xl font-black text-gray-900 mb-1">Alex Johnson</h3>
                <p className="text-gray-500 font-medium">Male, 42 yrs • PT-1045</p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-md border border-blue-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                    CALLED
                  </span>
                  <span className="text-sm font-bold text-gray-600">to Room 104</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
               <div className="bg-white border border-gray-200 rounded-xl p-4 min-w-[140px] text-center shadow-sm">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Wait Time</p>
                  <p className="text-xl font-black text-gray-900">55 <span className="text-sm font-bold text-gray-500">mins</span></p>
               </div>
               <div className="bg-white border border-gray-200 rounded-xl p-4 min-w-[140px] text-center shadow-sm">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Assigned Doctor</p>
                  <p className="text-xl font-black text-gray-900">Dr. Smith</p>
               </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="p-10 relative">
            <div className="absolute top-10 bottom-10 left-[62px] w-1 bg-gray-100 rounded-full"></div>
            
            <div className="space-y-8">
              {timelineSteps.map((step, idx) => {
                const Icon = step.icon;
                const isCompleted = step.status === 'completed';
                const isActive = step.status === 'active';
                const isPending = step.status === 'pending';

                return (
                  <div key={idx} className="flex gap-6 relative">
                    <div className="w-24 text-right pt-2 flex-shrink-0">
                      <p className={`text-sm font-bold ${isPending ? 'text-gray-300' : 'text-gray-500'}`}>{step.time}</p>
                    </div>
                    
                    <div className="relative z-10 flex flex-col items-center flex-shrink-0">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 ${
                        isCompleted ? 'bg-teal-500 border-white text-white shadow-md' :
                        isActive ? 'bg-white border-blue-500 text-blue-600 shadow-[0_0_0_4px_rgba(59,130,246,0.2)]' :
                        'bg-white border-gray-100 text-gray-300'
                      }`}>
                        <Icon size={20} />
                      </div>
                    </div>

                    <div className={`flex-1 bg-white rounded-2xl border ${isActive ? 'border-blue-200 shadow-md bg-blue-50/30' : 'border-gray-100 shadow-sm'} p-5`}>
                      <h4 className={`text-lg font-bold mb-1 ${isActive ? 'text-blue-900' : isPending ? 'text-gray-400' : 'text-gray-900'}`}>{step.title}</h4>
                      <p className={`text-sm ${isPending ? 'text-gray-300' : 'text-gray-600'}`}>{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
