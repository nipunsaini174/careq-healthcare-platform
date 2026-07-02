"use client";
"use client";

import React, { useState } from 'react';
import EnterpriseSidebar from './EnterpriseSidebar';
import EnterpriseHeader from './EnterpriseHeader';
import EnterpriseDashboard from './EnterpriseDashboard';
import EnterpriseDoctorsView from './EnterpriseDoctorsView';
import EnterpriseLiveQueueView from './EnterpriseLiveQueueView';
import EnterpriseAppointmentsView from './EnterpriseAppointmentsView';
import EnterprisePatientsView from './EnterprisePatientsView';
import EnterpriseTokenTrackingView from './EnterpriseTokenTrackingView';
import EnterpriseReportsView from './EnterpriseReportsView';
import EnterpriseNotificationsView from './EnterpriseNotificationsView';
import EnterpriseSettingsView from './EnterpriseSettingsView';

export default function EnterpriseApp() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-900">
      <EnterpriseSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
        <EnterpriseHeader onTabChange={setActiveTab} />
        
        {/* Main Content Area */}
        {activeTab === 'dashboard' && <EnterpriseDashboard />}
        {activeTab === 'doctors' && <EnterpriseDoctorsView />}
        {activeTab === 'live-queue' && <EnterpriseLiveQueueView />}
        {activeTab === 'appointments' && <EnterpriseAppointmentsView />}
        {activeTab === 'patients' && <EnterprisePatientsView />}
        {activeTab === 'tracking' && <EnterpriseTokenTrackingView />}
        {activeTab === 'reports' && <EnterpriseReportsView />}
        {activeTab === 'notifications' && <EnterpriseNotificationsView />}
        {activeTab === 'settings' && <EnterpriseSettingsView />}
      </div>
    </div>
  );
}
