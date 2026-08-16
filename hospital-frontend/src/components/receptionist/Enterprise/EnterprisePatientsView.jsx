"use client";
import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Phone, Mail, FileText, Activity, MoreVertical, 
  Loader2, Plus, X, User, HeartPulse, CheckCircle2, 
  AlertCircle, Calendar, RefreshCw
} from 'lucide-react';
import { usePatients } from '@/hooks/usePatients';
import api from '@/services/api';

export default function EnterprisePatientsView() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [billingFilter, setBillingFilter] = useState('ALL');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [doctors, setDoctors] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    age: '',
    gender: 'Male',
    blood: 'O+',
    doctor: '',
    dept: 'General OPD',
    status: 'Active',
    condition: 'Stable',
    address: ''
  });

  const { patients, loading, refreshPatients } = usePatients();

  // Load doctors for assignment dropdown
  useEffect(() => {
    async function loadDoctors() {
      try {
        const res = await api.get('/receptionist/doctors');
        const docs = res.data?.data || (Array.isArray(res.data) ? res.data : []);
        setDoctors(docs);
        if (docs.length > 0) {
          const firstDocName = docs[0].name || docs[0].fullName || (docs[0].users?.full_name ? `Dr. ${docs[0].users.full_name}` : '');
          if (firstDocName) {
            setFormData(prev => ({ ...prev, doctor: firstDocName }));
          }
        }
      } catch {
        // Fallback demo doctors
        setDoctors([
          { id: '1', name: 'Dr. Rahul Sharma', specialization: 'Cardiology' },
          { id: '2', name: 'Dr. Priya Patel', specialization: 'Neurology' },
          { id: '3', name: 'Dr. Amit Verma', specialization: 'General Physician' }
        ]);
      }
    }
    loadDoctors();
  }, []);

  // Filtered patient records
  const filteredPatients = patients.filter(p => {
    const q = search.toLowerCase();
    const matchesSearch = 
      (p.name || '').toLowerCase().includes(q) || 
      (p.id || '').toLowerCase().includes(q) ||
      (p.phone || '').toLowerCase().includes(q) ||
      (p.email || '').toLowerCase().includes(q) ||
      (p.doctor || '').toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'ALL' || 
      (p.status || '').toLowerCase() === statusFilter.toLowerCase();

    const matchesBilling = billingFilter === 'ALL' || 
      (p.billingStatus || '').toLowerCase() === billingFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesBilling;
  });

  // KPI Calculations
  const totalCount = patients.length;
  const activeCount = patients.filter(p => (p.status || '').toLowerCase() === 'active').length;
  const inHospitalCount = patients.filter(p => (p.status || '').toLowerCase() === 'in hospital').length;
  const paidCount = patients.filter(p => (p.billingStatus || '').toLowerCase() === 'paid').length;

  const handleRegisterPatient = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Please enter patient name.");
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/patients', {
        name: formData.name.trim(),
        age: formData.age ? parseInt(formData.age) : 0,
        gender: formData.gender,
        blood: formData.blood,
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        dept: formData.dept,
        doctor: formData.doctor || 'Dr. General',
        address: formData.address || 'Not Provided',
        condition: formData.condition,
        status: formData.status
      });

      setShowAddModal(false);
      setFormData({
        name: '',
        phone: '',
        email: '',
        age: '',
        gender: 'Male',
        blood: 'O+',
        doctor: doctors[0]?.name || '',
        dept: 'General OPD',
        status: 'Active',
        condition: 'Stable',
        address: ''
      });

      await refreshPatients();
    } catch (err) {
      console.error('Failed to register patient:', err);
      alert('Failed to register patient. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 min-w-0 overflow-x-auto overflow-y-auto bg-gray-50/50 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-[1600px] mx-auto min-w-0 space-y-6 pb-8 sm:space-y-8 sm:pb-12">
        
        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
              <User size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Registered</p>
              <p className="text-xl font-bold text-gray-900">{totalCount}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Activity size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Active Patients</p>
              <p className="text-xl font-bold text-gray-900">{activeCount}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <HeartPulse size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">In Hospital</p>
              <p className="text-xl font-bold text-gray-900">{inHospitalCount}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Paid / Settled</p>
              <p className="text-xl font-bold text-gray-900">{paidCount}</p>
            </div>
          </div>
        </div>

        {/* Page Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Patient Directory</h2>
            <p className="text-sm text-gray-500 mt-1">Manage registered patient records, appointment history, and contact information.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name, UHID, doctor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-white shadow-xs w-64 md:w-72"
              />
              {search && (
                <button 
                  onClick={() => setSearch('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Toggle */}
            <div className="relative">
              <button 
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className={`flex items-center gap-2 px-3.5 py-2 border rounded-lg text-sm font-medium transition-colors shadow-xs ${
                  statusFilter !== 'ALL' || billingFilter !== 'ALL'
                    ? 'bg-teal-50 border-teal-300 text-teal-700'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter size={15} />
                Filters
                {(statusFilter !== 'ALL' || billingFilter !== 'ALL') && (
                  <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                )}
              </button>

              {/* Filter Popup */}
              {showFilterDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-30 space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Filter Directory</span>
                    <button 
                      onClick={() => { setStatusFilter('ALL'); setBillingFilter('ALL'); }}
                      className="text-xs text-teal-600 hover:underline font-medium"
                    >
                      Reset All
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Status</label>
                    <select 
                      value={statusFilter} 
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-gray-50 focus:bg-white focus:outline-none focus:border-teal-500"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="Active">Active</option>
                      <option value="In Hospital">In Hospital</option>
                      <option value="OPD">OPD</option>
                      <option value="Discharged">Discharged</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Billing Status</label>
                    <select 
                      value={billingFilter} 
                      onChange={(e) => setBillingFilter(e.target.value)}
                      className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-gray-50 focus:bg-white focus:outline-none focus:border-teal-500"
                    >
                      <option value="ALL">All Billing</option>
                      <option value="Paid">Paid</option>
                      <option value="Pending">Pending</option>
                      <option value="Unpaid">Unpaid</option>
                    </select>
                  </div>

                  <button 
                    onClick={() => setShowFilterDropdown(false)}
                    className="w-full py-1.5 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-800"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>

            {/* Refresh Button */}
            <button 
              onClick={() => refreshPatients()}
              title="Refresh Directory"
              className="p-2 bg-white border border-gray-200 text-gray-600 hover:text-teal-600 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-xs transition-colors"
            >
              <RefreshCw size={16} />
            </button>

            {/* Add Patient Button */}
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 shadow-xs shadow-teal-600/20 transition-colors"
            >
              <Plus size={16} />
              Add Patient
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-500">
              <Loader2 size={32} className="animate-spin text-teal-500 mb-4" />
              <p className="font-medium">Loading patient directory...</p>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50/70 border-b border-gray-200">
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
                {filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-gray-500">
                      <div className="max-w-md mx-auto space-y-2">
                        <User size={36} className="mx-auto text-gray-300 mb-2" />
                        <p className="font-semibold text-gray-700 text-base">No patients found</p>
                        <p className="text-xs text-gray-400">
                          {search || statusFilter !== 'ALL' || billingFilter !== 'ALL'
                            ? "Try adjusting your search terms or filters."
                            : "Registered patients and patients who book appointments will appear here automatically."}
                        </p>
                        {(search || statusFilter !== 'ALL' || billingFilter !== 'ALL') && (
                          <button 
                            onClick={() => { setSearch(''); setStatusFilter('ALL'); setBillingFilter('ALL'); }}
                            className="mt-2 text-xs text-teal-600 hover:underline font-semibold"
                          >
                            Clear filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map((pt, idx) => (
                    <tr 
                      key={idx} 
                      onClick={() => setSelectedPatient(pt)}
                      className="hover:bg-teal-50/30 transition-colors group cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm border border-teal-100 flex-shrink-0">
                            {(pt.name || 'P').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-base group-hover:text-teal-700 transition-colors">{pt.name}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">{pt.id}</p>
                              {pt.gender && pt.gender !== 'Not Specified' && (
                                <span className="text-[10px] text-gray-400">({pt.gender}{pt.age ? `, ${pt.age}y` : ''})</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1 text-xs">
                          <p className="flex items-center gap-2 text-gray-600 font-medium"><Phone size={12} className="text-gray-400" /> {pt.phone}</p>
                          <p className="flex items-center gap-2 text-gray-500"><Mail size={12} className="text-gray-400" /> {pt.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-800">{pt.doctor}</p>
                        <p className="text-[11px] text-teal-600 font-medium">Assigned Physician</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-gray-900 mb-0.5">{pt.totalVisits} {pt.totalVisits === 1 ? 'Visit' : 'Visits'}</p>
                        <p className="text-[11px] text-gray-500 font-medium">Last: {pt.lastVisit}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          (pt.status || '').toLowerCase() === 'in hospital' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          (pt.status || '').toLowerCase() === 'active' ? 'bg-green-50 text-green-700 border border-green-200' :
                          (pt.status || '').toLowerCase() === 'opd' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                          'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}>
                          {pt.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider gap-1.5 ${
                          (pt.billingStatus || '').toLowerCase() === 'paid' || (pt.billingStatus || '').toLowerCase() === 'clear' ? 'bg-green-50 text-green-700 border border-green-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            (pt.billingStatus || '').toLowerCase() === 'paid' || (pt.billingStatus || '').toLowerCase() === 'clear' ? 'bg-green-500' : 'bg-amber-500'
                          }`}></span>
                          {pt.billingStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => setSelectedPatient(pt)}
                            className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" 
                            title="View Medical Records"
                          >
                            <FileText size={16} />
                          </button>
                          <button 
                            onClick={() => setSelectedPatient(pt)}
                            className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" 
                            title="View Vitals"
                          >
                            <Activity size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          )}
        </div>

        {/* Modal: Patient Record Details */}
        {selectedPatient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 relative">
              <button 
                onClick={() => setSelectedPatient(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 text-xl font-bold">
                  {(selectedPatient.name || 'P').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedPatient.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                    <span className="font-bold uppercase text-teal-600">{selectedPatient.id}</span>
                    <span>•</span>
                    <span>{selectedPatient.gender || 'Not Specified'}</span>
                    {selectedPatient.age && <span>• {selectedPatient.age} yrs</span>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-gray-400 font-medium mb-1 flex items-center gap-1.5"><Phone size={12} /> Phone</p>
                  <p className="text-gray-900 font-bold">{selectedPatient.phone}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-gray-400 font-medium mb-1 flex items-center gap-1.5"><Mail size={12} /> Email</p>
                  <p className="text-gray-900 font-bold truncate">{selectedPatient.email}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-gray-400 font-medium mb-1">Primary Doctor</p>
                  <p className="text-gray-900 font-bold">{selectedPatient.doctor}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-gray-400 font-medium mb-1 flex items-center gap-1.5"><Calendar size={12} /> Last Visit</p>
                  <p className="text-gray-900 font-bold">{selectedPatient.lastVisit}</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-teal-50/60 rounded-xl border border-teal-100 text-xs mb-6">
                <div>
                  <p className="text-teal-700 font-semibold">Total Consultations</p>
                  <p className="text-gray-600">{selectedPatient.totalVisits} Recorded Appointments</p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    (selectedPatient.billingStatus || '').toLowerCase() === 'paid' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {selectedPatient.billingStatus}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => setSelectedPatient(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Add Patient */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-200 relative max-h-[90vh] overflow-y-auto">
              <button 
                onClick={() => setShowAddModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100"
              >
                <X size={18} />
              </button>

              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900">Register New Patient</h3>
                <p className="text-xs text-gray-500 mt-1">Create a patient directory profile and assign a primary physician.</p>
              </div>

              <form onSubmit={handleRegisterPatient} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Full Name *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg p-2.5 bg-gray-50 focus:bg-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Phone Number</label>
                    <input 
                      type="text" 
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg p-2.5 bg-gray-50 focus:bg-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Email</label>
                    <input 
                      type="email" 
                      placeholder="patient@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg p-2.5 bg-gray-50 focus:bg-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Age</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 32"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg p-2.5 bg-gray-50 focus:bg-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Gender</label>
                    <select 
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg p-2.5 bg-gray-50 focus:bg-white focus:outline-none focus:border-teal-500"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Blood Group</label>
                    <select 
                      value={formData.blood}
                      onChange={(e) => setFormData({ ...formData, blood: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg p-2.5 bg-gray-50 focus:bg-white focus:outline-none focus:border-teal-500"
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Assigned Doctor</label>
                    <select 
                      value={formData.doctor}
                      onChange={(e) => setFormData({ ...formData, doctor: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg p-2.5 bg-gray-50 focus:bg-white focus:outline-none focus:border-teal-500"
                    >
                      {doctors.map((doc, i) => (
                        <option key={i} value={doc.name || doc.fullName || (doc.users?.full_name ? `Dr. ${doc.users.full_name}` : `Doctor ${i+1}`)}>
                          {doc.name || doc.fullName || (doc.users?.full_name ? `Dr. ${doc.users.full_name}` : `Doctor ${i+1}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Initial Status</label>
                    <select 
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg p-2.5 bg-gray-50 focus:bg-white focus:outline-none focus:border-teal-500"
                    >
                      <option value="Active">Active</option>
                      <option value="In Hospital">In Hospital</option>
                      <option value="OPD">OPD</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-2 border-t border-gray-100">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium shadow-xs disabled:opacity-50"
                  >
                    {submitting && <Loader2 size={14} className="animate-spin" />}
                    {submitting ? 'Registering...' : 'Register Patient'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
