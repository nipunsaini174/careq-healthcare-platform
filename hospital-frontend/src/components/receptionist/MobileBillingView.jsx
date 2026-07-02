"use client";
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { IndianRupee, Clock, CheckCircle2, Search } from 'lucide-react';

export default function MobileBillingView({ onOpenPayment }) {
  const [filter, setFilter] = useState('ALL');

  const billingData = [
    { token: 'T-01', name: 'Rahul Sharma', amount: 850, status: 'PAID', date: '10:30 AM' },
    { token: 'T-02', name: 'Priya Patel', amount: 1200, status: 'UNPAID', date: '11:15 AM' },
    { token: 'T-03', name: 'Amit Kumar', amount: 500, status: 'UNPAID', date: '11:45 AM' },
    { token: 'T-04', name: 'Neha Singh', amount: 1500, status: 'PAID', date: '12:10 PM' },
  ];

  const filteredData = filter === 'ALL' ? billingData : billingData.filter(d => d.status === filter);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="pb-20 pt-4 space-y-6"
    >
      <div className="flex justify-between items-center bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Today's Revenue</p>
          <h2 className="text-3xl font-extrabold text-gray-900">₹3,200</h2>
        </div>
        <div className="w-12 h-12 bg-[#58D0A7]/10 rounded-xl flex items-center justify-center text-[#58D0A7]">
          <IndianRupee size={24} />
        </div>
      </div>

      <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-100">
        <button 
          onClick={() => setFilter('ALL')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${filter === 'ALL' ? 'bg-[#58D0A7] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          All
        </button>
        <button 
          onClick={() => setFilter('PAID')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${filter === 'PAID' ? 'bg-[#58D0A7] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          Paid
        </button>
        <button 
          onClick={() => setFilter('UNPAID')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${filter === 'UNPAID' ? 'bg-orange-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          Unpaid
        </button>
      </div>

      <div className="space-y-3">
        {filteredData.map((patient, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-700">
                  {patient.token}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{patient.name}</h3>
                  <p className="text-xs text-gray-500">{patient.date}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="font-bold text-gray-900 block">₹{patient.amount}</span>
                {patient.status === 'PAID' ? (
                  <span className="text-[10px] font-bold text-[#58D0A7] flex items-center gap-1 justify-end mt-1">
                    <CheckCircle2 size={12} /> PAID
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-orange-500 flex items-center gap-1 justify-end mt-1">
                    <Clock size={12} /> UNPAID
                  </span>
                )}
              </div>
            </div>
            
            {patient.status === 'UNPAID' && (
              <button 
                onClick={() => onOpenPayment && onOpenPayment(patient)}
                className="w-full bg-[#58D0A7] text-white font-bold py-3 rounded-xl text-sm shadow-[0_4px_12px_rgba(88,208,167,0.3)] hover:bg-[#4AB892] transition-colors"
              >
                Collect Payment
              </button>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
