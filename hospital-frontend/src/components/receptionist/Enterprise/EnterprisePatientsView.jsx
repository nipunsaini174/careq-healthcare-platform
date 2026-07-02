"use client";
import React, { useState } from 'react';
import { Search, Filter, Phone, Mail, FileText, Activity, MoreVertical } from 'lucide-react';

export default function EnterprisePatientsView() {
  const [search, setSearch] = useState('');

  const [patients, setPatients] = useState([
    { id: 'PT-1042', name: 'Alexander Hamilton', phone: '+1 234-567-8901', email: 'alex@example.com', lastVisit: 'Oct 12, 2026', totalVisits: 14, doctor: 'Dr. Sarah Smith', status: 'Active', billingStatus: 'Paid' },
    { id: 'PT-1043', name: 'Maria Garcia', phone: '+1 987-654-3210', email: 'maria.g@example.com', lastVisit: 'Sep 28, 2026', totalVisits: 3, doctor: 'Dr. Emily Chen', status: 'Active', billingStatus: 'Pending' },
    { id: 'PT-1044', name: 'James Wilson', phone: '+1 555-123-4567', email: 'j.wilson@example.com', lastVisit: 'Today', totalVisits: 1, doctor: 'Dr. Michael Jones', status: 'In Hospital', billingStatus: 'Pending' },
    { id: 'PT-1045', name: 'Linda Martinez', phone: '+1 444-987-6543', email: 'linda.m@example.com', lastVisit: 'Aug 05, 2026', totalVisits: 8, doctor: 'Dr. Sarah Smith', status: 'Inactive', billingStatus: 'Paid' },
    { id: 'PT-1046', name: 'David Lee', phone: '+1 333-222-1111', email: 'david.lee@example.com', lastVisit: 'Yesterday', totalVisits: 22, doctor: 'Dr. Lisa Taylor', status: 'Active', billingStatus: 'Paid' },
  ]);

  const filteredPatients = patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase()));

  const handleAddPatient = () => {
    const newId = 'PT-' + Math.floor(1000 + Math.random() * 9000);
    const newPatient = { id: newId, name: 'New Patient ' + newId.slice(-4), phone: '+1 555-000-0000', email: 'new@example.com', lastVisit: 'Today', totalVisits: 1, doctor: 'Unassigned', status: 'Active', billingStatus: 'Pending' };
    setPatients([newPatient, ...patients]);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50/50 p-8">
      <div className="max-w-[1600px] mx-auto space-y-8 pb-12">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Patient Directory</h2>
            <p className="text-sm text-gray-500 mt-1">Manage patient records, history, and contact information.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name or ID..."
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
              Filters
            </button>
            <button 
              onClick={handleAddPatient}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 shadow-sm shadow-teal-600/20"
            >
              Add Patient
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Patient Details</th>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Contact</th>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Primary Doctor</th>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">History</th>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Status</th>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Billing</th>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPatients.map((pt, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors group cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 font-bold">
                          {pt.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-base">{pt.name}</p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{pt.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1 text-xs">
                        <p className="flex items-center gap-2 text-gray-600"><Phone size={12} className="text-gray-400" /> {pt.phone}</p>
                        <p className="flex items-center gap-2 text-gray-600"><Mail size={12} className="text-gray-400" /> {pt.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-700">{pt.doctor}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-gray-900 mb-0.5">{pt.totalVisits} Visits</p>
                      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Last: {pt.lastVisit}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        pt.status === 'In Hospital' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        pt.status === 'Active' ? 'bg-green-50 text-green-700 border border-green-200' :
                        'bg-gray-100 text-gray-500 border border-gray-200'
                      }`}>
                        {pt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider gap-1.5 ${
                        pt.billingStatus === 'Paid' ? 'bg-green-50 text-green-700 border border-green-200' :
                        'bg-yellow-50 text-yellow-700 border border-yellow-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${pt.billingStatus === 'Paid' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                        {pt.billingStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" title="View Medical Records">
                          <FileText size={16} />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" title="View Vitals">
                          <Activity size={16} />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                          <MoreVertical size={16} />
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
