import React from 'react';
import { motion } from 'motion/react';
import { User, Phone, Calendar, Search } from 'lucide-react';

export default function PatientsView() {
  const patients = [
    { id: 'P-1001', name: 'Rahul Sharma', phone: '+91 9876543210', lastVisit: 'Today', visits: 5 },
    { id: 'P-1002', name: 'Priya Patel', phone: '+91 8765432109', lastVisit: 'Today', visits: 2 },
    { id: 'P-1003', name: 'Amit Kumar', phone: '+91 7654321098', lastVisit: 'Today', visits: 1 },
    { id: 'P-1004', name: 'Neha Gupta', phone: '+91 6543210987', lastVisit: 'Yesterday', visits: 8 },
    { id: 'P-1005', name: 'Rohan Singh', phone: '+91 5432109876', lastVisit: '2 days ago', visits: 3 },
    { id: 'P-1006', name: 'Anjali Verma', phone: '+91 4321098765', lastVisit: '1 week ago', visits: 12 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className="pb-24 pt-4"
    >
      <div className="flex justify-between items-end mb-6 px-1">
        <h2 className="text-xl text-gray-900 font-bold">Patient Directory</h2>
      </div>

      <div className="mb-6 relative">
        <input 
          type="text" 
          placeholder="Search patients by name or phone..." 
          className="w-full bg-white border border-gray-200 rounded-2xl pl-12 pr-4 py-4 text-sm text-gray-900 focus:outline-none focus:border-[#58D0A7] focus:ring-1 focus:ring-[#58D0A7] shadow-sm"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
      </div>

      <div className="space-y-3">
        {patients.map((patient, index) => (
          <motion.div 
            key={patient.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center flex-shrink-0">
                <User size={20} />
              </div>
              
              <div>
                <h3 className="text-base font-bold text-gray-900">{patient.name}</h3>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                  <span className="flex items-center gap-1"><Phone size={10} /> {patient.phone}</span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-1">Last Visit</p>
              <p className="text-sm font-semibold text-gray-700">{patient.lastVisit}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
