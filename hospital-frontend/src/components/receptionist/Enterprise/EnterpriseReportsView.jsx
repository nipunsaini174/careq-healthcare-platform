import React from 'react';
import { BarChart3, PieChart, Activity, TrendingUp, DollarSign, Users } from 'lucide-react';
import AnalyticsCharts from './Dashboard/AnalyticsCharts';

export default function EnterpriseReportsView() {
  return (
    <div className="flex-1 overflow-y-auto bg-gray-50/50 p-8">
      <div className="max-w-[1600px] mx-auto space-y-8 pb-12">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Reports & Analytics</h2>
            <p className="text-sm text-gray-500 mt-1">Hospital performance, revenue, and queue statistics.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <select className="bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500/20 shadow-sm">
              <option>Last 30 Days</option>
              <option>This Month</option>
              <option>This Quarter</option>
              <option>This Year</option>
            </select>
            <button className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 shadow-sm shadow-teal-600/20">
              Export PDF
            </button>
          </div>
        </div>

        {/* Top KPI Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { title: 'Total Revenue', value: '$124,500', trend: '+14%', icon: DollarSign, color: 'text-green-600' },
            { title: 'Total Patients', value: '3,428', trend: '+5%', icon: Users, color: 'text-blue-600' },
            { title: 'Avg Wait Time', value: '18 mins', trend: '-2 mins', icon: Activity, color: 'text-teal-600' },
            { title: 'Efficiency Score', value: '94%', trend: '+1.2%', icon: TrendingUp, color: 'text-purple-600' }
          ].map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-xl bg-gray-50 ${kpi.color}`}>
                    <Icon size={24} />
                  </div>
                  <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-1 rounded-md">{kpi.trend}</span>
                </div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">{kpi.title}</p>
                <h3 className="text-3xl font-black text-gray-900">{kpi.value}</h3>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Revenue Chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col h-96">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-1">
                  <BarChart3 size={18} className="text-teal-600" />
                  Monthly Revenue
                </h3>
                <p className="text-xs text-gray-500">Revenue across all departments</p>
              </div>
            </div>
            
            <div className="flex-1 flex items-end justify-between gap-4 mt-4">
              {[40, 65, 45, 80, 55, 95].map((val, i) => (
                <div key={i} className="flex flex-col items-center flex-1 group">
                  <div className="w-full relative flex justify-center mb-3">
                    <div 
                      className="w-full max-w-[50px] bg-teal-100 rounded-t-lg relative overflow-hidden group-hover:bg-teal-200 transition-colors"
                      style={{ height: `${val * 2}px` }}
                    >
                      <div className="absolute bottom-0 w-full bg-teal-500" style={{ height: '100%' }}></div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-gray-400">Month {i+1}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Department Load Balancing */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col h-96">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-1">
                  <PieChart size={18} className="text-teal-600" />
                  Department Patient Load
                </h3>
                <p className="text-xs text-gray-500">Distribution of patients by department</p>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-center space-y-6 px-4">
              {[
                { name: 'Cardiology', value: 45, color: 'bg-red-500' },
                { name: 'Pediatrics', value: 85, color: 'bg-blue-500' },
                { name: 'Orthopedics', value: 60, color: 'bg-teal-500' },
                { name: 'Dermatology', value: 30, color: 'bg-purple-500' },
              ].map((dept, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span className="text-gray-700">{dept.name}</span>
                    <span className="text-gray-900">{dept.value}%</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${dept.color} rounded-full`} style={{ width: `${dept.value}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <AnalyticsCharts />

      </div>
    </div>
  );
}
