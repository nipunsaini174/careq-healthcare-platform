"use client";
import React, { useMemo } from 'react';
import { MoreHorizontal, Stethoscope } from 'lucide-react';
import { useQueue } from '@/hooks/useQueue';

export default function DoctorOperationsTable() {
  const { queue } = useQueue();

  const doctors = useMemo(() => {
    if (!queue || queue.length === 0) return [];

    const docMap = new Map();
    queue.forEach(q => {
      if (q.doctorName && !docMap.has(q.doctorName)) {
        docMap.set(q.doctorName, {
          name: q.doctorName,
          spec: q.department || 'General',
          avgTime: '15m',
          status: 'Active'
        });
      }
    });

    const docList = Array.from(docMap.values());

    return docList.map(doc => {
      // Patients assigned to this doc
      const docQueue = queue.filter(q => q.doctorName === doc.name);
      const active = docQueue.find(q => q.status === 'IN_CONSULTATION');
      const waiting = docQueue.filter(q => q.status === 'WAITING').length;
      
      return {
        ...doc,
        queue: active ? active.tokenNumber : (docQueue.filter(q => q.status === 'WAITING')[0]?.tokenNumber || '-'),
        waiting
      };
    });
  }, [queue]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <Stethoscope size={18} className="text-teal-600" />
          Doctor Operations Board
        </h3>
        <button className="text-sm font-bold text-teal-600 hover:text-teal-700">View All Doctors</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-white border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Doctor</th>
              <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Current Token</th>
              <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Waiting</th>
              <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Avg Time</th>
              <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Status</th>
              <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {doctors.map((doc, idx) => (
              <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 font-bold text-xs">
                      {doc.name.split(' ')[1].charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{doc.name}</p>
                      <p className="text-[10px] text-gray-500 uppercase font-semibold">{doc.spec}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`font-bold ${doc.queue !== '-' ? 'text-gray-900' : 'text-gray-400'}`}>
                    {doc.queue}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`font-semibold ${doc.waiting > 10 ? 'text-orange-600' : 'text-gray-700'}`}>
                    {doc.waiting} {doc.waiting > 0 && <span className="text-gray-400 text-xs font-normal ml-1">pts</span>}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-700 font-medium">
                  {doc.avgTime}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${
                    doc.status === 'Active' ? 'bg-teal-50 text-teal-700 border border-teal-200' :
                    doc.status === 'Delayed' ? 'bg-red-50 text-red-700 border border-red-200' :
                    'bg-orange-50 text-orange-700 border border-orange-200'
                  }`}>
                    {doc.status === 'Active' && <div className="w-1.5 h-1.5 rounded-full bg-teal-500"></div>}
                    {doc.status === 'Delayed' && <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>}
                    {doc.status === 'On Break' && <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>}
                    {doc.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {doc.status === 'Delayed' && (
                      <button className="text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">
                        Notify
                      </button>
                    )}
                    <button className="text-xs font-bold text-gray-600 hover:text-gray-900 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                      View
                    </button>
                    <button className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100">
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
