import React from 'react';
import { Stethoscope, Clock, Users, Bell } from 'lucide-react';
import { mockDoctors } from '@/data/mockData';

export default function DesktopDoctorsView() {
  return (
    <div className="flex-1 bg-[#0B1120] overflow-y-auto hide-scrollbar p-10">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            Doctors Directory
          </h2>
          <p className="text-gray-400 text-sm">Manage doctor schedules and availability</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {mockDoctors.map(doctor => (
          <div key={doctor.id} className="bg-[#131B2D] border border-[#1E293B] rounded-3xl p-6 shadow-sm hover:border-[#58D0A7]/50 transition-colors relative overflow-hidden group">
            {/* Status Badge */}
            <div className="absolute top-6 right-6">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                doctor.status === 'ACTIVE' ? 'bg-[#58D0A7]/20 text-[#58D0A7]' : 
                doctor.status === 'DELAYED' ? 'bg-orange-500/20 text-orange-400' :
                'bg-gray-800 text-gray-400'
              }`}>
                {doctor.status}
              </span>
            </div>

            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400">
                <Stethoscope size={24} />
              </div>
              <div className="mt-1">
                <h3 className="text-lg font-bold text-white">{doctor.name}</h3>
                <p className="text-xs text-gray-400">{doctor.specialty}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-[#0B1120] rounded-2xl p-4 border border-[#1E293B]">
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <Users size={14} />
                  <span className="text-xs font-semibold">In Queue</span>
                </div>
                <p className="text-xl font-bold text-white">{doctor.queueCount}</p>
              </div>
              <div className="bg-[#0B1120] rounded-2xl p-4 border border-[#1E293B]">
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <Clock size={14} />
                  <span className="text-xs font-semibold">Avg Time</span>
                </div>
                <p className="text-xl font-bold text-white">12m</p>
              </div>
            </div>

            <div className="flex gap-3">
              {doctor.status === 'DELAYED' ? (
                <button className="flex-1 bg-orange-500/10 text-orange-400 px-4 py-3 rounded-xl text-xs font-bold hover:bg-orange-500/20 transition-colors flex items-center justify-center gap-2">
                  <Bell size={16} /> Notify Patients
                </button>
              ) : (
                <button className="flex-1 bg-[#1E293B] text-white px-4 py-3 rounded-xl text-xs font-bold hover:bg-gray-700 transition-colors">
                  View Schedule
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
