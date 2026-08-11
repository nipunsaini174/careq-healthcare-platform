"use client";
import React, { useState } from 'react';
import { Search, Filter, MoreHorizontal, Mail, Phone, Calendar, Clock } from 'lucide-react';

export default function EnterpriseDoctorsView() {
  const [search, setSearch] = useState('');

  const [doctors, setDoctors] = useState([
    { name: 'Dr. Sarah Smith', spec: 'Cardiology', exp: '12 Years', status: 'Active', patientsToday: 42, avgTime: '12m', rating: 4.8, image: 'https://ui-avatars.com/api/?name=Sarah+Smith&background=14B8A6&color=fff' },
    { name: 'Dr. Michael Jones', spec: 'Ophthalmology', exp: '8 Years', status: 'Delayed', patientsToday: 28, avgTime: '15m', rating: 4.9, image: 'https://ui-avatars.com/api/?name=Michael+Jones&background=3B82F6&color=fff' },
    { name: 'Dr. Emily Chen', spec: 'Pediatrics', exp: '15 Years', status: 'Active', patientsToday: 55, avgTime: '8m', rating: 4.7, image: 'https://ui-avatars.com/api/?name=Emily+Chen&background=8B5CF6&color=fff' },
    { name: 'Dr. Robert Wilson', spec: 'Orthopedics', exp: '20 Years', status: 'On Break', patientsToday: 15, avgTime: '20m', rating: 4.6, image: 'https://ui-avatars.com/api/?name=Robert+Wilson&background=F59E0B&color=fff' },
    { name: 'Dr. Lisa Taylor', spec: 'Dermatology', exp: '6 Years', status: 'Active', patientsToday: 34, avgTime: '10m', rating: 4.9, image: 'https://ui-avatars.com/api/?name=Lisa+Taylor&background=EC4899&color=fff' },
    { name: 'Dr. James Miller', spec: 'Neurology', exp: '18 Years', status: 'Offline', patientsToday: 0, avgTime: '-', rating: 4.8, image: 'https://ui-avatars.com/api/?name=James+Miller&background=64748B&color=fff' },
    { name: 'Dr. Amanda Garcia', spec: 'General Medicine', exp: '10 Years', status: 'Active', patientsToday: 60, avgTime: '7m', rating: 4.5, image: 'https://ui-avatars.com/api/?name=Amanda+Garcia&background=10B981&color=fff' },
    { name: 'Dr. William Brown', spec: 'ENT', exp: '14 Years', status: 'Active', patientsToday: 31, avgTime: '12m', rating: 4.7, image: 'https://ui-avatars.com/api/?name=William+Brown&background=6366F1&color=fff' },
  ]);

  const filteredDoctors = doctors.filter(doc => doc.name.toLowerCase().includes(search.toLowerCase()) || doc.spec.toLowerCase().includes(search.toLowerCase()));

  const handleAddDoctor = () => {
    const newDoc = { 
      name: 'Dr. New Recruit', 
      spec: 'General Medicine', 
      exp: '1 Year', 
      status: 'Active', 
      patientsToday: 0, 
      avgTime: '0m', 
      rating: 5.0, 
      image: 'https://ui-avatars.com/api/?name=New+Recruit&background=14B8A6&color=fff' 
    };
    setDoctors([newDoc, ...doctors]);
  };

  return (
    <div className="flex-1 min-w-0 overflow-x-auto overflow-y-auto bg-gray-50/50 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-[1600px] mx-auto min-w-0 space-y-6 pb-8 sm:space-y-8 sm:pb-12">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Doctor Directory</h2>
            <p className="text-sm text-gray-500 mt-1">Manage hospital staff, view daily performance and schedules.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search doctors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-white shadow-sm w-64"
              />
            </div>
            <button 
              onClick={() => alert("Filters panel opened (Mock)")}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm"
            >
              <Filter size={16} />
              Filter
            </button>
            <button 
              onClick={handleAddDoctor}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 shadow-sm shadow-teal-600/20"
            >
              Add Doctor
            </button>
          </div>
        </div>

        {/* Doctors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDoctors.map((doc, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="relative">
                    <img src={doc.image} alt={doc.name} className="w-16 h-16 rounded-2xl shadow-sm border border-gray-100" />
                    <span className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${
                      doc.status === 'Active' ? 'bg-teal-500' :
                      doc.status === 'Delayed' ? 'bg-red-500' :
                      doc.status === 'On Break' ? 'bg-orange-500' :
                      'bg-gray-400'
                    }`}></span>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-50">
                    <MoreHorizontal size={18} />
                  </button>
                </div>
                
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{doc.name}</h3>
                  <p className="text-teal-600 font-semibold text-sm mb-1">{doc.spec}</p>
                  <p className="text-gray-500 text-xs">{doc.exp} Experience • ⭐ {doc.rating}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100">
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Today's Patients</p>
                    <p className="text-lg font-black text-gray-900">{doc.patientsToday}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Avg Wait Time</p>
                    <p className="text-lg font-black text-gray-900">{doc.avgTime}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50/80 px-6 py-4 flex gap-2 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 py-2 rounded-lg text-xs font-bold hover:bg-gray-50 shadow-sm">
                  <Calendar size={14} /> Schedule
                </button>
                <button className="w-10 flex items-center justify-center bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 shadow-sm">
                  <Mail size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
