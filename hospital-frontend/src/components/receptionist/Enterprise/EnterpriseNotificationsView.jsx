"use client";
import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Info, CheckCircle, Clock, MoreHorizontal, Shield } from 'lucide-react';
import { useSocket } from '@/contexts/SocketContext';

export default function EnterpriseNotificationsView() {
  const [filter, setFilter] = useState('All');
  const { socket } = useSocket();

  const [notifications, setNotifications] = useState([
    { id: 1, type: 'critical', title: 'Doctor Running Late', desc: 'Dr. Smith is running 15 minutes late. Your estimated wait time has been updated.', time: 'Just now', read: false, action: 'Notify Waiting Patients' },
    { id: 2, type: 'warning', title: 'High Queue Volume', desc: 'Cardiology department is experiencing wait times > 45 minutes.', time: '1 hour ago', read: false },
    { id: 3, type: 'success', title: 'Daily Backup Complete', desc: 'All patient records and billing data have been successfully backed up to cloud storage.', time: '3 hours ago', read: true },
    { id: 4, type: 'info', title: 'New Doctor Onboarded', desc: 'Dr. Rebecca Lee has joined the Dermatology department. Please update schedules.', time: 'Yesterday', read: true },
    { id: 5, type: 'warning', title: 'Low Inventory: Syringes', desc: 'Supply of 5ml syringes in Emergency Ward is below 15%. Reorder immediately.', time: 'Yesterday', read: true },
    { id: 6, type: 'info', title: 'Software Update Available', desc: 'MedHarvix SmartQueue v2.4.1 is available for deployment.', time: '2 days ago', read: true },
  ]);

  useEffect(() => {
    if (!socket) return;

    const handleBroadcast = (data) => {
      // Create a new notification object from the broadcast
      const newNotification = {
        id: Date.now(), // Generate unique ID
        type: data.type ? data.type.toLowerCase() : 'info',
        title: data.title,
        desc: data.message,
        time: 'Just now',
        read: false,
        source: 'admin' // Mark source so we can display it
      };

      // Add the new notification to the top of the list
      setNotifications((prev) => [newNotification, ...prev]);
    };

    socket.on('broadcast_notification', handleBroadcast);

    return () => {
      socket.off('broadcast_notification', handleBroadcast);
    };
  }, [socket]);

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  return (
    <div className="flex-1 min-w-0 overflow-x-auto overflow-y-auto bg-gray-50/50 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-[1200px] mx-auto min-w-0 space-y-6 pb-8 sm:space-y-8 sm:pb-12">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Bell className="text-teal-600" /> Notifications Center
            </h2>
            <p className="text-sm text-gray-500 mt-1">Manage system alerts, updates, and hospital notices.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handleMarkAllRead}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm"
            >
              Mark all as read
            </button>
            <button 
              onClick={handleClearAll}
              className="px-4 py-2 bg-white border border-gray-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 shadow-sm"
            >
              Clear all
            </button>
          </div>
        </div>

        {/* Inbox Layout */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row">
          
          {/* Sidebar Filters */}
          <div className="w-full md:w-64 border-r border-gray-100 bg-gray-50/30 p-6 flex flex-col gap-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-3">Filters</h3>
            
            {['All', 'Unread', 'Critical', 'Warnings', 'System Updates'].map((item) => (
              <button 
                key={item}
                onClick={() => setFilter(item)}
                className={`text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                  filter === item ? 'bg-teal-50 text-teal-700 shadow-sm' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <div className="flex-1 divide-y divide-gray-100">
            {notifications.map((notif) => {
              const isCritical = notif.type === 'critical';
              const isWarning = notif.type === 'warning';
              const isSuccess = notif.type === 'success';
              const isInfo = notif.type === 'info';

              return (
                <div key={notif.id} className={`p-6 flex gap-4 transition-colors hover:bg-gray-50/50 group ${!notif.read ? 'bg-blue-50/10' : ''}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                    isCritical ? 'bg-red-100 text-red-600' :
                    isWarning ? 'bg-orange-100 text-orange-600' :
                    isSuccess ? 'bg-green-100 text-green-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {isCritical && <AlertTriangle size={18} />}
                    {isWarning && <AlertTriangle size={18} />}
                    {isSuccess && <CheckCircle size={18} />}
                    {isInfo && <Info size={18} />}
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        <h4 className={`text-base font-bold ${!notif.read ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notif.title}
                        </h4>
                        {notif.source === 'admin' && (
                          <span className="flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
                            <Shield size={10} />
                            From Admin
                          </span>
                        )}
                      </div>
                      <span className="flex items-center gap-1 text-xs font-semibold text-gray-400">
                        <Clock size={12} /> {notif.time}
                      </span>
                    </div>
                    <p className={`text-sm ${!notif.read ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                      {notif.desc}
                    </p>
                    
                    {!notif.read && (
                      <div className="mt-3 flex gap-3">
                        <button className="text-xs font-bold text-teal-600 hover:text-teal-800">Mark as Read</button>
                        {isCritical && <button className="text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 px-2 py-1 rounded border border-red-100">{notif.action || 'Take Action'}</button>}
                      </div>
                    )}
                  </div>

                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                      <MoreHorizontal size={20} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

        </div>

      </div>
    </div>
  );
}
