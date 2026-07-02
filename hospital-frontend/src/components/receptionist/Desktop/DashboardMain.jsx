import React from 'react';
import { Users, UserPlus, AlertTriangle, FileText, MoreVertical, Clock, Activity, CheckCircle2 } from 'lucide-react';
import { mockDoctors } from '@/data/mockData';

export default function DashboardMain({ onOpenBook, onCardClick, onActionClick }) {
  const queue = [
    { token: 'T-01', name: 'Rahul', doctor: 'Dr. Smith', status: 'WAITING', priority: 'NORMAL' },
    { token: 'T-02', name: 'Priya', doctor: 'Dr. Jones', status: 'CHECKED_IN', priority: 'NORMAL' },
    { token: 'T-03', name: 'Amit', doctor: 'Dr. Smith', status: 'WAITING', priority: 'EMERGENCY' },
    { token: 'T-04', name: 'Neha', doctor: 'Dr. Jones', status: 'WAITING', priority: 'NORMAL' },
    { token: 'T-05', name: 'Rohan', doctor: 'Dr. Smith', status: 'CONSULTATION', priority: 'NORMAL' },
  ];

  return (
    <div className="flex-1 bg-[#0B1120] overflow-y-auto hide-scrollbar p-10">
      {/* Header Area */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            Good Morning, Receptionist
          </h2>
          <p className="text-gray-400 text-sm">Here's the live clinic overview</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={onOpenBook}
            className="bg-[#58D0A7] hover:bg-[#4AB892] text-[#0F1626] px-6 py-2.5 rounded-full font-bold text-sm transition-colors shadow-[0_0_15px_rgba(88,208,167,0.3)] flex items-center gap-2"
          >
            <UserPlus size={18} /> New Patient
          </button>
        </div>
      </div>

      {/* 4 Stats Cards Grid */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-[#131B2D] border border-[#1E293B] rounded-3xl p-6 hover:bg-[#1A233A] transition-colors shadow-sm">
          <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 mb-4">
            <Clock size={22} />
          </div>
          <p className="text-gray-400 text-xs font-semibold mb-1">Waiting Patients</p>
          <h3 className="text-2xl font-bold text-white mb-1">14</h3>
          <p className="text-blue-400 text-[10px] font-bold">+2 since last hour</p>
        </div>
        
        <div className="bg-[#131B2D] border border-[#1E293B] rounded-3xl p-6 hover:bg-[#1A233A] transition-colors shadow-sm">
          <div className="w-12 h-12 bg-[#58D0A7]/10 rounded-2xl flex items-center justify-center text-[#58D0A7] mb-4">
            <Activity size={22} />
          </div>
          <p className="text-gray-400 text-xs font-semibold mb-1">Active Doctors</p>
          <h3 className="text-2xl font-bold text-white mb-1">4 Online</h3>
          <p className="text-gray-500 text-[10px]">Out of 5 total</p>
        </div>

        <div className="bg-[#131B2D] border border-[#1E293B] rounded-3xl p-6 hover:bg-[#1A233A] transition-colors shadow-sm relative overflow-hidden">
          <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-400 mb-4">
            <AlertTriangle size={22} />
          </div>
          <p className="text-gray-400 text-xs font-semibold mb-1">Emergencies</p>
          <h3 className="text-2xl font-bold text-white mb-1">2</h3>
          <p className="text-red-400 text-[10px] font-bold">Needs immediate attention</p>
          <div className="absolute top-6 right-6 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_10px_#EF4444] animate-pulse"></div>
        </div>

        <div className="bg-gradient-to-br from-[#58D0A7] to-[#3AB58F] border border-[#58D0A7]/50 rounded-3xl p-6 shadow-[0_0_20px_rgba(88,208,167,0.15)] relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white rounded-full blur-[40px] opacity-20"></div>
          <div>
            <p className="text-[#0F1626]/70 text-xs font-bold mb-1 uppercase tracking-wide">Live Token</p>
            <h3 className="text-4xl font-extrabold text-[#0F1626] tracking-tight">T-142</h3>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <p className="text-[#0F1626] text-[10px] font-bold">Currently serving</p>
          </div>
        </div>
      </div>

      {/* Main Split View */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Left Column: Queue Overview */}
        <div className="col-span-8 bg-[#131B2D] border border-[#1E293B] rounded-3xl p-6 shadow-sm flex flex-col h-[500px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-white font-bold flex items-center gap-2">
              Comprehensive Queue Overview
              <div className="w-1.5 h-1.5 bg-[#58D0A7] rounded-full"></div>
            </h3>
            <div className="flex gap-2">
              <span className="text-xs bg-[#58D0A7]/20 text-[#58D0A7] px-3 py-1.5 rounded-full font-bold cursor-pointer">All</span>
              <span className="text-xs bg-gray-800 text-gray-400 px-3 py-1.5 rounded-full font-bold hover:text-white cursor-pointer">Waiting</span>
              <span className="text-xs bg-red-500/10 text-red-400 px-3 py-1.5 rounded-full font-bold hover:bg-red-500/20 cursor-pointer">Emergency</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
            {queue.map((patient, idx) => (
              <div 
                key={idx}
                onClick={() => onCardClick && onCardClick(patient)}
                className={`bg-[#0B1120] rounded-2xl p-4 border flex items-center justify-between cursor-pointer transition-all hover:bg-[#1A233A] ${
                  patient.priority === 'EMERGENCY' ? 'border-red-500/50 shadow-[inset_4px_0_0_#EF4444]' : 'border-[#1E293B] shadow-[inset_4px_0_0_#58D0A7]'
                }`}
              >
                <div className="flex items-center gap-6">
                  <div className="w-16">
                    <span className="text-lg font-bold text-white">{patient.token}</span>
                  </div>
                  <div className="w-32">
                    <span className="text-sm font-bold text-gray-200">{patient.name}</span>
                    {patient.priority === 'EMERGENCY' && <span className="ml-2 text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">EM</span>}
                  </div>
                  <div className="w-32 text-sm text-gray-400 flex items-center gap-1.5">
                    <Users size={14} /> {patient.doctor}
                  </div>
                  <div className="w-32">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                      patient.status === 'WAITING' ? 'bg-orange-500/10 text-orange-400' :
                      patient.status === 'CHECKED_IN' ? 'bg-[#58D0A7]/10 text-[#58D0A7]' :
                      'bg-blue-500/10 text-blue-400'
                    }`}>
                      {patient.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onActionClick && onActionClick(patient);
                  }}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#1E293B] transition-colors"
                >
                  <MoreVertical size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Doctor Availability */}
        <div className="col-span-4 bg-[#131B2D] border border-[#1E293B] rounded-3xl p-6 shadow-sm h-[500px] flex flex-col">
          <h3 className="text-white font-bold mb-6">Doctor Availability</h3>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
            {mockDoctors.map(doctor => (
              <div key={doctor.id} className="bg-[#0B1120] border border-[#1E293B] rounded-2xl p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-white">{doctor.name}</h4>
                    <p className="text-xs text-gray-500">{doctor.specialty}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${
                      doctor.status === 'ACTIVE' ? 'bg-[#58D0A7]/20 text-[#58D0A7]' : 
                      doctor.status === 'DELAYED' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-gray-800 text-gray-400'
                    }`}>
                      {doctor.status}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-4 text-xs">
                  <div className="text-gray-400">
                    Queue: <span className="text-white font-bold">{doctor.queueCount}</span>
                  </div>
                  {doctor.status === 'DELAYED' ? (
                    <button className="bg-orange-500/10 text-orange-400 px-3 py-1.5 rounded-lg font-bold hover:bg-orange-500/20 transition-colors">
                      Notify Patients
                    </button>
                  ) : (
                    <button className="bg-[#1E293B] text-gray-300 px-3 py-1.5 rounded-lg font-bold hover:text-white transition-colors">
                      Manage
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
