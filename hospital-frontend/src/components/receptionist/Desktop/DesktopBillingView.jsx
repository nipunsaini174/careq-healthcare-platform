"use client";
import React, { useState } from 'react';
import { Search, Filter, IndianRupee, FileText, CheckCircle2, Clock } from 'lucide-react';

export default function DesktopBillingView({ onOpenPayment }) {
  const [filter, setFilter] = useState('ALL');

  const billingData = [
    { token: 'T-01', name: 'Rahul Sharma', doctor: 'Dr. Smith', amount: 850, status: 'PAID', date: 'Today, 10:30 AM' },
    { token: 'T-02', name: 'Priya Patel', doctor: 'Dr. Jones', amount: 1200, status: 'UNPAID', date: 'Today, 11:15 AM' },
    { token: 'T-03', name: 'Amit Kumar', doctor: 'Dr. Smith', amount: 500, status: 'UNPAID', date: 'Today, 11:45 AM' },
    { token: 'T-04', name: 'Neha Singh', doctor: 'Dr. Jones', amount: 1500, status: 'PAID', date: 'Today, 12:10 PM' },
    { token: 'T-05', name: 'Rohan Verma', doctor: 'Dr. Smith', amount: 850, status: 'PAID', date: 'Today, 12:30 PM' },
  ];

  const filteredData = filter === 'ALL' ? billingData : billingData.filter(d => d.status === filter);

  return (
    <div className="flex-1 bg-[#0B1120] overflow-y-auto hide-scrollbar p-10">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            Billing & Payments
          </h2>
          <p className="text-gray-400 text-sm">Manage patient invoices and collections</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-[#131B2D] border border-[#1E293B] rounded-full px-4 py-2 flex items-center gap-2">
            <Search size={16} className="text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name or token..." 
              className="bg-transparent text-sm text-white focus:outline-none w-48"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-[#131B2D] border border-[#1E293B] rounded-3xl p-6">
          <div className="w-12 h-12 bg-[#58D0A7]/10 rounded-2xl flex items-center justify-center text-[#58D0A7] mb-4">
            <IndianRupee size={22} />
          </div>
          <p className="text-gray-400 text-xs font-semibold mb-1">Total Collected Today</p>
          <h3 className="text-2xl font-bold text-white">₹3,200</h3>
        </div>
        <div className="bg-[#131B2D] border border-[#1E293B] rounded-3xl p-6">
          <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-400 mb-4">
            <Clock size={22} />
          </div>
          <p className="text-gray-400 text-xs font-semibold mb-1">Pending Collections</p>
          <h3 className="text-2xl font-bold text-white">₹1,700</h3>
        </div>
        <div className="bg-[#131B2D] border border-[#1E293B] rounded-3xl p-6">
          <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 mb-4">
            <FileText size={22} />
          </div>
          <p className="text-gray-400 text-xs font-semibold mb-1">Invoices Generated</p>
          <h3 className="text-2xl font-bold text-white">5</h3>
        </div>
      </div>

      <div className="bg-[#131B2D] border border-[#1E293B] rounded-3xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-white font-bold">Recent Transactions</h3>
          <div className="flex gap-2">
            <button onClick={() => setFilter('ALL')} className={`text-xs px-4 py-2 rounded-full font-bold transition-colors ${filter === 'ALL' ? 'bg-[#58D0A7]/20 text-[#58D0A7]' : 'bg-[#1E293B] text-gray-400 hover:text-white'}`}>All</button>
            <button onClick={() => setFilter('PAID')} className={`text-xs px-4 py-2 rounded-full font-bold transition-colors ${filter === 'PAID' ? 'bg-[#58D0A7]/20 text-[#58D0A7]' : 'bg-[#1E293B] text-gray-400 hover:text-white'}`}>Paid</button>
            <button onClick={() => setFilter('UNPAID')} className={`text-xs px-4 py-2 rounded-full font-bold transition-colors ${filter === 'UNPAID' ? 'bg-orange-500/20 text-orange-400' : 'bg-[#1E293B] text-gray-400 hover:text-white'}`}>Unpaid</button>
          </div>
        </div>

        <div className="space-y-3">
          {filteredData.map((patient, idx) => (
            <div key={idx} className="bg-[#0B1120] border border-[#1E293B] rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-16">
                  <span className="text-lg font-bold text-white">{patient.token}</span>
                </div>
                <div className="w-40">
                  <span className="text-sm font-bold text-gray-200">{patient.name}</span>
                  <p className="text-[10px] text-gray-500">{patient.doctor}</p>
                </div>
                <div className="w-32">
                  <span className="text-sm font-bold text-white">₹{patient.amount}</span>
                  <p className="text-[10px] text-gray-500">{patient.date}</p>
                </div>
                <div className="w-24">
                  {patient.status === 'PAID' ? (
                    <span className="text-xs bg-[#58D0A7]/10 text-[#58D0A7] px-2.5 py-1 rounded-md font-bold flex items-center gap-1 w-max">
                      <CheckCircle2 size={12} /> Paid
                    </span>
                  ) : (
                    <span className="text-xs bg-orange-500/10 text-orange-400 px-2.5 py-1 rounded-md font-bold flex items-center gap-1 w-max">
                      <Clock size={12} /> Unpaid
                    </span>
                  )}
                </div>
              </div>
              
              <div>
                {patient.status === 'UNPAID' ? (
                  <button 
                    onClick={() => onOpenPayment && onOpenPayment(patient)}
                    className="bg-[#58D0A7] hover:bg-[#4AB892] text-[#0F1626] px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-lg"
                  >
                    Collect Payment
                  </button>
                ) : (
                  <button className="bg-[#1E293B] hover:bg-gray-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors">
                    View Receipt
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
