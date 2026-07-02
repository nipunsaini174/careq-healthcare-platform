import React from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';

export default function AnalyticsCharts() {
  const barData = [
    { label: '8AM', value: 20 },
    { label: '9AM', value: 45 },
    { label: '10AM', value: 80 },
    { label: '11AM', value: 65 },
    { label: '12PM', value: 30 },
    { label: '1PM', value: 25 },
    { label: '2PM', value: 55 },
    { label: '3PM', value: 75 },
    { label: '4PM', value: 40 },
  ];

  const maxVal = Math.max(...barData.map(d => d.value));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      {/* Chart 1: Hourly Traffic */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col h-80">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-1">
              <BarChart3 size={18} className="text-teal-600" />
              Hourly Patient Traffic
            </h3>
            <p className="text-xs text-gray-500">Total patients registered per hour</p>
          </div>
          <select className="bg-gray-50 border border-gray-200 text-xs font-semibold rounded-lg px-3 py-1.5 focus:outline-none">
            <option>Today</option>
            <option>Yesterday</option>
            <option>This Week</option>
          </select>
        </div>

        <div className="flex-1 flex items-end justify-between gap-2">
          {barData.map((d, i) => (
            <div key={i} className="flex flex-col items-center flex-1 group">
              <div className="w-full relative flex justify-center mb-2">
                {/* Tooltip on hover */}
                <span className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-gray-900 text-white text-[10px] py-1 px-2 rounded font-bold transition-opacity whitespace-nowrap z-10">
                  {d.value} pts
                </span>
                {/* Bar */}
                <div 
                  className="w-full max-w-[40px] bg-teal-100 rounded-t-md relative overflow-hidden group-hover:bg-teal-200 transition-colors"
                  style={{ height: `${(d.value / maxVal) * 160}px` }}
                >
                  <div className="absolute bottom-0 w-full bg-teal-500" style={{ height: '100%' }}></div>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-gray-400">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart 2: Wait Time Trends */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col h-80">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-1">
              <TrendingUp size={18} className="text-teal-600" />
              Average Wait Time Trends
            </h3>
            <p className="text-xs text-gray-500">Wait times across departments (mins)</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center space-y-5">
          {/* Fake horizontal bars for departments */}
          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-gray-700">Cardiology</span>
              <span className="text-teal-600">18m</span>
            </div>
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-teal-500 rounded-full w-[45%]"></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-gray-700">Orthopedics</span>
              <span className="text-teal-600">24m</span>
            </div>
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-teal-400 rounded-full w-[60%]"></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-gray-700">Pediatrics</span>
              <span className="text-orange-600">42m</span>
            </div>
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-orange-500 rounded-full w-[85%]"></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-gray-700">Dermatology</span>
              <span className="text-teal-600">12m</span>
            </div>
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-teal-300 rounded-full w-[30%]"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
