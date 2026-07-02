"use client";
import React, { useState } from 'react';
import { Search, Filter, MoreHorizontal, Clock, User, CheckCircle2 } from 'lucide-react';
import { useQueue } from '@/hooks/useQueue';

export default function EnterpriseLiveQueueView() {
  const [search, setSearch] = useState('');
  const { queue, loading, addToken } = useQueue();

  const filteredQueue = queue.filter(q => 
    (q.tokenNumber && q.tokenNumber.toLowerCase().includes(search.toLowerCase())) || 
    (q.patientName && q.patientName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50/50 p-8">
      <div className="max-w-[1600px] mx-auto space-y-8 pb-12">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Live Queue Management</h2>
            <p className="text-sm text-gray-500 mt-1">Real-time overview of all patients currently in the facility.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search token or patient..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-white shadow-sm w-64"
              />
            </div>
            <button 
              onClick={() => alert("Filter status panel opened (Mock)")}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm"
            >
              <Filter size={16} />
              Filter Status
            </button>
            <button 
              onClick={addToken}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 shadow-sm shadow-teal-600/20"
            >
              New Token
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Token</th>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Patient</th>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Assigned Doctor</th>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Check-in</th>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Wait Time</th>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Status</th>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredQueue.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-black text-gray-900 text-base">{item.tokenNumber}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                          <User size={14} />
                        </div>
                        <span className="font-bold text-gray-900">{item.patientName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">{item.doctorName}</p>
                      <p className="text-[10px] text-gray-500 uppercase font-semibold">{item.department}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-medium">
                      {new Date(item.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-bold flex items-center gap-1 ${Math.floor((new Date() - new Date(item.arrivalTime))/60000) > 30 ? 'text-red-600' : 'text-gray-700'}`}>
                        <Clock size={14} /> {Math.floor((new Date() - new Date(item.arrivalTime))/60000)}m
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${
                        item.status === 'IN_CONSULTATION' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        item.status === 'WAITING' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                        item.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border border-green-200' :
                        'bg-gray-100 text-gray-700 border border-gray-200'
                      }`}>
                        {item.status === 'COMPLETED' && <CheckCircle2 size={12} />}
                        {item.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="text-xs font-bold text-teal-600 hover:text-teal-800 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200">
                          Call Next
                        </button>
                        <button className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100">
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
