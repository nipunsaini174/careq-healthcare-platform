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
    <div className="flex-1 min-w-0 overflow-x-auto overflow-y-auto bg-gray-50/50 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-[1600px] mx-auto min-w-0 space-y-6 pb-8 sm:space-y-8 sm:pb-12">
        
        {/* Page Title Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">Real-time Operations Dashboard</h2>
            <p className="mt-1 text-sm text-gray-500">Monitor live queues, doctor availability, and hospital efficiency.</p>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
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
