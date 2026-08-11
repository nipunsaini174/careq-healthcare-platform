"use client";
import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Search, Plus, MapPin } from 'lucide-react';

export default function EnterpriseAppointmentsView() {
  const [appointments, setAppointments] = useState([
    { id: '1', time: '09:00 AM', patient: 'Sarah Connor', type: 'New Consult', doctor: 'Dr. Emily Chen', status: 'Confirmed' },
    { id: '2', time: '09:30 AM', patient: 'John Smith', type: 'Follow-up', doctor: 'Dr. Michael Jones', status: 'Checked In' },
    { id: '3', time: '10:00 AM', patient: 'Emma Davis', type: 'Routine Check', doctor: 'Dr. Sarah Smith', status: 'Confirmed' },
    { id: '4', time: '10:15 AM', patient: 'William Brown', type: 'New Consult', doctor: 'Dr. Lisa Taylor', status: 'Delayed' },
    { id: '5', time: '11:00 AM', patient: 'Olivia Wilson', type: 'Follow-up', doctor: 'Dr. Emily Chen', status: 'Cancelled' },
  ]);

  const handleBookAppointment = () => {
    const newApt = {
      id: Math.random().toString(),
      time: '12:00 PM',
      patient: 'New Patient',
      type: 'Consultation',
      doctor: 'Dr. Sarah Smith',
      status: 'Confirmed'
    };
    setAppointments([...appointments, newApt]);
  };

  return (
    <div className="flex-1 min-w-0 overflow-x-auto overflow-y-auto bg-gray-50/50 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-[1600px] mx-auto min-w-0 space-y-6 pb-8 sm:space-y-8 sm:pb-12">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Appointments</h2>
            <p className="text-sm text-gray-500 mt-1">Manage scheduled consultations and hospital visits.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm">
              <CalendarIcon size={16} />
              Today: Oct 24, 2026
            </button>
            <button 
              onClick={handleBookAppointment}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 shadow-sm shadow-teal-600/20"
            >
              <Plus size={16} />
              Book Appointment
            </button>
          </div>
        </div>

        {/* Calendar and List Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* Left: Mini Calendar & Filters */}
          <div className="xl:col-span-3 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-900">October 2026</h3>
                <div className="flex gap-2">
                  <button className="p-1 rounded-md hover:bg-gray-100"><ChevronLeft size={16} /></button>
                  <button className="p-1 rounded-md hover:bg-gray-100"><ChevronRight size={16} /></button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-gray-400 mb-2">
                <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-gray-700">
                {/* Dummy calendar dates */}
                <div className="text-gray-300 p-2">27</div><div className="text-gray-300 p-2">28</div><div className="text-gray-300 p-2">29</div><div className="text-gray-300 p-2">30</div>
                <div className="p-2 hover:bg-gray-50 rounded-lg cursor-pointer">1</div>
                <div className="p-2 hover:bg-gray-50 rounded-lg cursor-pointer">2</div>
                <div className="p-2 hover:bg-gray-50 rounded-lg cursor-pointer">3</div>
                {/* ... skip to 24th */}
                <div className="p-2 hover:bg-gray-50 rounded-lg cursor-pointer col-start-3">20</div>
                <div className="p-2 hover:bg-gray-50 rounded-lg cursor-pointer">21</div>
                <div className="p-2 hover:bg-gray-50 rounded-lg cursor-pointer">22</div>
                <div className="p-2 hover:bg-gray-50 rounded-lg cursor-pointer">23</div>
                <div className="p-2 bg-teal-600 text-white font-bold rounded-lg cursor-pointer shadow-sm shadow-teal-600/30">24</div>
                <div className="p-2 hover:bg-gray-50 rounded-lg cursor-pointer relative">25<span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-teal-500 rounded-full"></span></div>
                <div className="p-2 hover:bg-gray-50 rounded-lg cursor-pointer">26</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-4">Filters</h3>
              <div className="space-y-3 text-sm">
                <label className="flex items-center gap-3">
                  <input type="checkbox" className="w-4 h-4 text-teal-600 rounded border-gray-300" defaultChecked />
                  <span className="text-gray-700">All Doctors</span>
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" className="w-4 h-4 text-teal-600 rounded border-gray-300" />
                  <span className="text-gray-700">Dr. Sarah Smith</span>
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" className="w-4 h-4 text-teal-600 rounded border-gray-300" />
                  <span className="text-gray-700">Dr. Michael Jones</span>
                </label>
              </div>
            </div>
          </div>

          {/* Right: Appointments List */}
          <div className="xl:col-span-9">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-bold text-gray-900">Schedule for Oct 24</h3>
                <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
                  <button className="px-4 py-1.5 text-xs font-bold bg-teal-50 text-teal-700 rounded-md">List View</button>
                  <button className="px-4 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 rounded-md">Timeline</button>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {appointments.map((apt, idx) => (
                  <div key={idx} className="p-6 hover:bg-gray-50/50 transition-colors flex items-center justify-between group">
                    <div className="flex items-center gap-6">
                      <div className="text-right w-20">
                        <p className="font-black text-gray-900">{apt.time.split(' ')[0]}</p>
                        <p className="text-xs font-bold text-gray-400">{apt.time.split(' ')[1]}</p>
                      </div>
                      <div className="h-10 w-px bg-gray-200"></div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg mb-1">{apt.patient}</h4>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider">{apt.type}</span>
                          <span className="text-gray-500 font-medium flex items-center gap-1">
                            <MapPin size={14} /> {apt.doctor}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold ${
                        apt.status === 'Confirmed' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        apt.status === 'Checked In' ? 'bg-green-50 text-green-700 border border-green-200' :
                        apt.status === 'Delayed' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                        'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {apt.status}
                      </span>
                      
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        {apt.status === 'Confirmed' && (
                          <button className="px-3 py-1.5 bg-teal-600 text-white text-xs font-bold rounded-lg shadow-sm">Check-in</button>
                        )}
                        <button className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg shadow-sm">Edit</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
