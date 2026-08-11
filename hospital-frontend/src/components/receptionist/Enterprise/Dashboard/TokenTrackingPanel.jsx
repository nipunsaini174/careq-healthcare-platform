"use client";
import React, { useState } from 'react';
import { Search, MapPin, User, Stethoscope, Clock, CheckCircle2, ChevronRight, Activity, Trash2 } from 'lucide-react';
import { useQueue } from '@/hooks/useQueue';

export default function TokenTrackingPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const { queue, updateTokenStatus, removeToken } = useQueue();
  const [expandedTokenId, setExpandedTokenId] = useState(null);

  const filteredQueue = queue.filter(q => 
    q.tokenNumber?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    q.patientName?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const getStatuses = (status) => {
    const sequence = ['WAITING', 'IN_CONSULTATION', 'COMPLETED'];
    let currentIndex = sequence.indexOf(status);
    if (currentIndex === -1) currentIndex = 0;

    return [
      { label: 'Registration', completed: true },
      { label: 'Waiting', completed: currentIndex > 0, active: currentIndex === 0 },
      { label: 'In Consultation', completed: currentIndex > 1, active: currentIndex === 1 },
      { label: 'Completed', completed: currentIndex === 2, active: currentIndex === 2 },
    ];
  };

  const StatusButton = ({ active, children, colorClass }) => (
    <div
      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 border ${
        active 
          ? `${colorClass} shadow-sm ring-2 ring-offset-1 ring-current border-transparent` 
          : 'bg-white text-gray-400 border-gray-200'
      }`}
    >
      {children}
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <MapPin size={18} className="text-teal-600" />
          Live Queue Manager
        </h3>
        <span className="bg-teal-100 text-teal-700 text-xs font-bold px-2 py-1 rounded-md">
          {queue.length} Total Patients
        </span>
      </div>

      <div className="p-6 flex-1 flex flex-col overflow-hidden">
        {/* Patient Search */}
        <div className="relative mb-6 shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50/50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 sm:text-sm font-semibold transition-all shadow-sm"
            placeholder="Search by token number or patient name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Display Panel */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-3 pb-4">
          {filteredQueue.length > 0 ? filteredQueue.map(patient => (
            <div key={patient.id} className={`bg-white border rounded-xl p-4 transition-all ${expandedTokenId === patient.id ? 'border-teal-300 shadow-md' : 'border-gray-200 shadow-sm hover:border-gray-300'}`}>
              
              <div className="flex justify-between items-center cursor-pointer" onClick={() => setExpandedTokenId(expandedTokenId === patient.id ? null : patient.id)}>
                <div className="flex items-center gap-6">
                  <div className={`w-auto px-4 min-w-[3rem] h-12 whitespace-nowrap rounded-xl flex items-center justify-center font-black text-lg ${
                    patient.status === 'IN_CONSULTATION' ? 'bg-blue-100 text-blue-700' :
                    patient.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                    patient.status === 'CANCELLED_BY_PATIENT' ? 'bg-red-100 text-red-700 line-through opacity-70' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {patient.tokenNumber}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{patient.patientName}</h4>
                    <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5 font-medium">
                      <Stethoscope size={12} className="text-gray-400" /> {patient.doctorName}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    {patient.status === 'WAITING' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); updateTokenStatus(patient.id, 'PRESENT'); }}
                        className="flex items-center gap-1.5 px-3 py-1 bg-white border border-teal-200 text-teal-600 hover:bg-teal-50 rounded-md text-[10px] font-bold tracking-wider uppercase transition-colors shadow-sm shrink-0"
                      >
                        <CheckCircle2 size={12} />
                        Mark Present
                      </button>
                    )}
                    {patient.status === 'CANCELLED_BY_PATIENT' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeToken(patient.id); }}
                        className="flex items-center gap-1.5 px-3 py-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-md text-[10px] font-bold tracking-wider uppercase transition-colors shadow-sm shrink-0"
                      >
                        <Trash2 size={12} />
                        Remove from Queue
                      </button>
                    )}
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase border ${
                      patient.status === 'WAITING' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                      patient.status === 'IN_CONSULTATION' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      patient.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200' :
                      patient.status === 'DELAYED' ? 'bg-red-50 text-red-700 border-red-200' :
                      patient.status === 'CANCELLED_BY_PATIENT' ? 'bg-red-100 text-red-800 border-red-300 shadow-sm' :
                      'bg-gray-50 text-gray-700 border-gray-200'
                    }`}>
                      {patient.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-xs text-teal-600 font-bold flex items-center gap-0.5">
                    {expandedTokenId === patient.id ? 'Close' : 'Details'} 
                    <ChevronRight size={14} className={`transition-transform ${expandedTokenId === patient.id ? 'rotate-90' : ''}`} />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100 pb-1">
                 <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mr-1 shrink-0">Status:</span>
                 <StatusButton active={patient.status === 'PRESENT'} colorClass="bg-teal-500 text-white border-teal-600">Present</StatusButton>
                 <StatusButton active={patient.status === 'WAITING'} colorClass="bg-orange-500 text-white border-orange-600">Waiting</StatusButton>
                 <StatusButton active={patient.status === 'IN_CONSULTATION'} colorClass="bg-blue-500 text-white border-blue-600">Consulting</StatusButton>
                 <StatusButton active={patient.status === 'DELAYED'} colorClass="bg-red-500 text-white border-red-600">Delayed</StatusButton>
                 <StatusButton active={patient.status === 'COMPLETED'} colorClass="bg-green-500 text-white border-green-600">Completed</StatusButton>
                 <StatusButton active={patient.status === 'CANCELLED_BY_PATIENT'} colorClass="bg-red-600 text-white border-red-700">Cancelled</StatusButton>
              </div>
              
              {/* Detailed View Expansion */}
              {expandedTokenId === patient.id && (
                <div className="mt-5 pt-5 border-t border-gray-100 bg-gray-50/50 -mx-4 -mb-4 p-4 rounded-b-xl">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-200/50 flex items-center justify-center text-gray-600">
                        <User size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase">Patient ID</p>
                        <p className="text-sm font-bold text-gray-900">{patient.patientId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                        <Activity size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase">Score</p>
                        <p className="text-sm font-bold text-gray-900">{patient.currentScore} pts</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <Clock size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase">Wait Time</p>
                        <p className="text-sm font-bold text-gray-900">{Math.floor((new Date() - new Date(patient.arrivalTime))/60000)}m</p>
                      </div>
                    </div>
                  </div>

                  {/* Visual Timeline */}
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">Patient Journey</p>
                    <div className="relative pl-2">
                      <div className="absolute top-0 bottom-0 left-5 w-0.5 bg-gray-200"></div>
                      <div className="space-y-4">
                        {getStatuses(patient.status).map((status, index) => (
                          <div key={index} className="flex items-center gap-4 relative">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center relative z-10 ${
                              status.completed ? 'bg-teal-500 text-white' : 
                              status.active ? 'bg-white border-2 border-blue-500 text-blue-500 ring-4 ring-blue-50' : 
                              'bg-white border-2 border-gray-200 text-gray-300'
                            }`}>
                              {status.completed && <CheckCircle2 size={12} />}
                              {status.active && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                            </div>
                            <div className={`text-xs font-bold ${status.active ? 'text-blue-600' : status.completed ? 'text-gray-900' : 'text-gray-400'}`}>
                              {status.label}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )) : (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full">
              <Search size={32} className="text-gray-300 mb-3" />
              <p className="text-gray-500 font-bold">No patients found in queue.</p>
              <p className="text-xs text-gray-400 mt-1">Try adjusting your search terms.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
