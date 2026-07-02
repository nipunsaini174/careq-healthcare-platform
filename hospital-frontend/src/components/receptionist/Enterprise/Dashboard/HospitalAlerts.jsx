import React from 'react';
import { AlertCircle, ShieldAlert, Activity, Bell } from 'lucide-react';

export default function HospitalAlerts() {
  const alerts = [
    { type: 'CRITICAL', title: 'Queue Congestion', desc: 'Cardiology wait times exceeding 45 mins.', time: 'Just now', icon: Activity, color: 'text-red-600', bg: 'bg-red-50' },
    { type: 'WARNING', title: 'Doctor Running Late', desc: 'Dr. Jones (Eye) delayed by 15 mins.', time: '5m ago', icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50' },
    { type: 'INFO', title: 'Lab Delays', desc: 'Blood test results delayed by 20 mins.', time: '12m ago', icon: ShieldAlert, color: 'text-blue-600', bg: 'bg-blue-50' },
    { type: 'SYSTEM', title: 'System Update', desc: 'Maintenance scheduled for 2:00 AM.', time: '1h ago', icon: Bell, color: 'text-slate-600', bg: 'bg-slate-50' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <Bell size={18} className="text-teal-600" />
          Hospital Alerts
        </h3>
        <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">2 NEW</span>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        <div className="space-y-3">
          {alerts.map((alert, idx) => {
            const Icon = alert.icon;
            return (
              <div key={idx} className="p-4 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 transition-colors shadow-sm cursor-pointer group">
                <div className="flex gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${alert.bg} ${alert.color}`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-bold text-gray-900">{alert.title}</h4>
                      <span className="text-[10px] text-gray-400 font-semibold">{alert.time}</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-snug">{alert.desc}</p>
                    {alert.type === 'CRITICAL' && (
                      <button className="mt-2 text-[10px] font-bold text-red-600 uppercase tracking-wider hover:underline">Take Action &rarr;</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
