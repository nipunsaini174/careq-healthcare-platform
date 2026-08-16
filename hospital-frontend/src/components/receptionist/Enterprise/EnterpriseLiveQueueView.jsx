"use client";
import React, { useState } from 'react';
import { Search, Filter, MoreHorizontal, Clock, User, CheckCircle2, PlayCircle, Sparkles, RefreshCw, Timer } from 'lucide-react';
import { useQueue } from '@/hooks/useQueue';

export default function EnterpriseLiveQueueView() {
  const [search, setSearch] = useState('');
  const { queue, loading, addToken, refreshQueue } = useQueue();

  const filteredQueue = queue.filter(q => 
    (q.tokenNumber && q.tokenNumber.toLowerCase().includes(search.toLowerCase())) || 
    (q.patientName && q.patientName.toLowerCase().includes(search.toLowerCase())) ||
    (q.doctorName && q.doctorName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex-1 min-w-0 overflow-x-auto overflow-y-auto bg-gray-50/50 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-[1600px] mx-auto min-w-0 space-y-6 pb-8 sm:space-y-8 sm:pb-12">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Live Cascading Queue Management</h2>
              <span className="bg-teal-100 text-teal-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                <Timer size={11} /> 15-Min Dynamic Cascading
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Live consultation scheduling from real-time clock. Early checkouts reduce subsequent patient wait times automatically!
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={15} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search token, patient, doctor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-teal-500 bg-gray-50 shadow-2xs w-64"
              />
            </div>
            <button 
              onClick={refreshQueue}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all shadow-2xs"
            >
              <RefreshCw size={13} />
              Sync
            </button>
            <button 
              onClick={addToken}
              className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-black hover:bg-teal-700 shadow-xs flex items-center gap-1.5"
            >
              + Issue Token
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl shadow-2xs border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Pos & Token</th>
                  <th className="px-5 py-3.5">Patient Info</th>
                  <th className="px-5 py-3.5">Assigned Physician</th>
                  <th className="px-5 py-3.5">Cascading Slot Window</th>
                  <th className="px-5 py-3.5">Est. Wait Time</th>
                  <th className="px-5 py-3.5">Live Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                {filteredQueue.map((item, idx) => {
                  const isServing = item.status === 'IN_CONSULTATION';
                  return (
                    <tr key={idx} className={`hover:bg-gray-50/70 transition-colors group ${isServing ? 'bg-teal-50/30' : ''}`}>
                      
                      {/* Token & Pos */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-gray-400">#{item.queuePosition || idx + 1}</span>
                          <span className={`font-black px-2 py-0.5 rounded-md text-xs ${
                            isServing ? 'bg-teal-600 text-white shadow-2xs' : 'bg-gray-100 text-gray-900'
                          }`}>
                            {item.tokenNumber}
                          </span>
                        </div>
                      </td>

                      {/* Patient */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">
                            <User size={13} />
                          </div>
                          <div>
                            <span className="font-bold text-gray-900 block">{item.patientName}</span>
                            <span className="text-[10px] text-gray-400 font-medium">{item.patientId || 'PT-1001'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Doctor */}
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-gray-900">{item.doctorName}</p>
                        <p className="text-[10px] text-teal-600 font-bold uppercase">{item.department}</p>
                      </td>

                      {/* Cascading Slot Window */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 font-bold text-gray-900">
                          <Timer size={13} className="text-teal-600" />
                          <span>{item.slotWindow || `${item.scheduledStartTime} - ${item.scheduledEndTime}`}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium block">
                          {isServing ? 'Started consultation' : `Starts ~${item.scheduledStartTime}`}
                        </span>
                      </td>

                      {/* Wait Time */}
                      <td className="px-5 py-3.5">
                        {isServing ? (
                          <span className="inline-flex items-center gap-1 text-teal-700 font-black bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping" />
                            Serving Now
                          </span>
                        ) : (
                          <span className={`font-bold flex items-center gap-1 ${item.estimatedWaitMins > 30 ? 'text-amber-600' : 'text-gray-700'}`}>
                            <Clock size={13} /> ~{item.estimatedWaitMins || 15} mins
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-black border ${
                          isServing ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          item.status === 'WAITING' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                          item.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          'bg-gray-100 text-gray-700 border-gray-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            isServing ? 'bg-purple-500' : 'bg-orange-400'
                          }`} />
                          {item.status.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button className="text-xs font-bold text-teal-700 hover:bg-teal-100 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 transition-colors shadow-2xs">
                            Manage
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
