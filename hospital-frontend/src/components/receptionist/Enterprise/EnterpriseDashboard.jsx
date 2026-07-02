"use client";
import React, { useState } from 'react';
import KPIStats from './Dashboard/KPIStats';
import CommandCenter from './Dashboard/CommandCenter';
import TokenTrackingPanel from './Dashboard/TokenTrackingPanel';
import LiveActivityFeed from './Dashboard/LiveActivityFeed';
import DoctorOperationsTable from './Dashboard/DoctorOperationsTable';
import HospitalAlerts from './Dashboard/HospitalAlerts';
import PatientRegistrationModal from '../Modals/PatientRegistrationModal';

export default function EnterpriseDashboard() {
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50/50 p-8">
      <div className="max-w-[1600px] mx-auto space-y-8 pb-12">
        
        {/* Page Title Header */}
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Real-time Operations Dashboard</h2>
            <p className="text-sm text-gray-500 mt-1">Monitor live queues, doctor availability, and hospital efficiency.</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
              Export Report
            </button>
            <button 
              onClick={() => setIsRegistrationOpen(true)}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm shadow-teal-600/20"
            >
              New Registration
            </button>
          </div>
        </div>

        {/* Row 1: 60/40 Split */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <div className="xl:col-span-7 flex flex-col">
            <CommandCenter />
          </div>
          <div className="xl:col-span-5 flex flex-col">
            <TokenTrackingPanel />
          </div>
        </div>

        {/* Row 2: KPI Analytics Cards */}
        <KPIStats />

        {/* Row 3: Live Queue Activities (full-width) */}
        <LiveActivityFeed />

        {/* Row 4: 70/30 Split */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <div className="xl:col-span-8 flex flex-col">
            <DoctorOperationsTable />
          </div>
          <div className="xl:col-span-4 flex flex-col">
            <HospitalAlerts />
          </div>
        </div>

      </div>

      <PatientRegistrationModal 
        isOpen={isRegistrationOpen} 
        onClose={() => setIsRegistrationOpen(false)} 
      />
    </div>
  );
}
