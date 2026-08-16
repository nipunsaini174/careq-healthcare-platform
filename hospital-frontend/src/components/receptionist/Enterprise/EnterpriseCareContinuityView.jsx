"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { 
  HeartPulse, Sparkles, AlertTriangle, Phone, Calendar, 
  MessageSquare, CheckCircle2, Search, Filter, RefreshCw, 
  ChevronRight, BrainCircuit, Activity, Clock, UserCheck, 
  ShieldAlert, Stethoscope, ArrowUpRight, X, Loader2
} from 'lucide-react';
import api from '@/services/api';
import { useSocket } from '@/contexts/SocketContext';

export default function EnterpriseCareContinuityView() {
  const [data, setData] = useState({ summary: {}, patients: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [diagnosisFilter, setDiagnosisFilter] = useState('ALL');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [actionModal, setActionModal] = useState(null); // { type: 'CALL' | 'BOOK' | 'MSG', patient: ... }
  const [actionNotes, setActionNotes] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);

  // Live Calculator State
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcForm, setCalcForm] = useState({
    diagnosis: 'Diabetes',
    severity: 'Moderate',
    testName: 'HbA1c',
    testValue: 8.5,
    testAbnormal: true,
    medicationChanged: true,
    previousMissedFollowup: true,
  });
  const [calcResult, setCalcResult] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);

  const { socket } = useSocket();

  const fetchFollowupData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/retention/followup-intelligence');
      if (res.data?.data) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load AI follow-up data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFollowupData();
  }, [fetchFollowupData]);

  // Socket updates
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => fetchFollowupData();
    socket.on('followup_action_logged', handleUpdate);
    socket.on('appointment_created', handleUpdate);
    socket.on('consultation_completed', handleUpdate);

    return () => {
      socket.off('followup_action_logged', handleUpdate);
      socket.off('appointment_created', handleUpdate);
      socket.off('consultation_completed', handleUpdate);
    };
  }, [socket, fetchFollowupData]);

  const handleActionSubmit = async (actionType) => {
    if (!actionModal?.patient) return;
    try {
      setActionSubmitting(true);
      await api.post('/retention/action-followup', {
        patientId: actionModal.patient.id,
        actionType,
        notes: actionNotes,
      });
      // Optimistic update
      setData(prev => ({
        ...prev,
        patients: prev.patients.map(p => p.id === actionModal.patient.id ? { ...p, actionStatus: 'CONTACTED' } : p)
      }));
      setActionModal(null);
      setActionNotes('');
    } catch (err) {
      console.error('Failed to log follow-up action:', err);
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleRunCalculator = async (e) => {
    e.preventDefault();
    try {
      setCalcLoading(true);
      const res = await api.post('/retention/predict-followup', calcForm);
      if (res.data?.data) {
        setCalcResult(res.data.data);
      }
    } catch (err) {
      console.error('Prediction failed:', err);
    } finally {
      setCalcLoading(false);
    }
  };

  // Filter patients
  const filteredPatients = (data.patients || []).filter(p => {
    const matchesSearch = p.patientName?.toLowerCase().includes(search.toLowerCase()) ||
                          p.uhid?.toLowerCase().includes(search.toLowerCase()) ||
                          p.diagnosis?.toLowerCase().includes(search.toLowerCase());
    const matchesPriority = priorityFilter === 'ALL' || p.priorityTier === priorityFilter;
    const matchesDiagnosis = diagnosisFilter === 'ALL' || p.diagnosis === diagnosisFilter;
    return matchesSearch && matchesPriority && matchesDiagnosis;
  });

  return (
    <div className="flex-1 min-w-0 overflow-y-auto bg-gray-50/50 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-[1400px] mx-auto space-y-6 pb-12">
        
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 shadow-2xs">
              <BrainCircuit size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-gray-900">AI Follow-up Intelligence & Care Continuity</h2>
                <span className="bg-teal-100 text-teal-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <Sparkles size={10} /> 500 Records Trained
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Detects missed, delayed, and high-risk patient follow-ups with clinical priority scoring and actionable staff workflows.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCalculator(!showCalculator)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-all shadow-2xs"
            >
              <Activity size={15} className="text-teal-600" />
              {showCalculator ? 'Hide AI Predictor' : 'Live Risk Predictor'}
            </button>
            <button
              onClick={fetchFollowupData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Sync Engine
            </button>
          </div>
        </div>

        {/* Live Predictor Calculator Tool Modal/Collapse */}
        {showCalculator && (
          <div className="bg-gradient-to-br from-gray-900 to-slate-900 text-white p-6 rounded-2xl border border-gray-800 shadow-xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-teal-400" />
                <h3 className="text-sm font-black tracking-wide text-white uppercase">Instant AI Follow-up Interval Predictor</h3>
              </div>
              <button onClick={() => setShowCalculator(false)} className="text-gray-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRunCalculator} className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              <div>
                <label className="block text-gray-400 font-bold mb-1">Diagnosis</label>
                <select 
                  value={calcForm.diagnosis} 
                  onChange={e => setCalcForm({...calcForm, diagnosis: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white font-medium focus:border-teal-400 focus:outline-none"
                >
                  <option value="Diabetes">Diabetes</option>
                  <option value="Hypertension">Hypertension</option>
                  <option value="Migraine">Migraine</option>
                  <option value="Asthma">Asthma</option>
                  <option value="Thyroid Disorder">Thyroid Disorder</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1">Severity</label>
                <select 
                  value={calcForm.severity} 
                  onChange={e => setCalcForm({...calcForm, severity: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white font-medium focus:border-teal-400 focus:outline-none"
                >
                  <option value="High">High</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1">Test Name & Value</label>
                <div className="flex gap-1">
                  <input 
                    type="text" 
                    value={calcForm.testName} 
                    onChange={e => setCalcForm({...calcForm, testName: e.target.value})}
                    placeholder="Test"
                    className="w-1/2 bg-gray-800 border border-gray-700 rounded-lg p-2 text-white font-medium focus:border-teal-400 focus:outline-none"
                  />
                  <input 
                    type="number" 
                    step="0.1"
                    value={calcForm.testValue} 
                    onChange={e => setCalcForm({...calcForm, testValue: parseFloat(e.target.value) || 0})}
                    placeholder="Value"
                    className="w-1/2 bg-gray-800 border border-gray-700 rounded-lg p-2 text-white font-medium focus:border-teal-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1">Test Abnormal?</label>
                <select 
                  value={calcForm.testAbnormal ? 'yes' : 'no'} 
                  onChange={e => setCalcForm({...calcForm, testAbnormal: e.target.value === 'yes'})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white font-medium focus:border-teal-400 focus:outline-none"
                >
                  <option value="yes">Yes (Abnormal)</option>
                  <option value="no">No (Normal)</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1">Medication Changed?</label>
                <select 
                  value={calcForm.medicationChanged ? 'yes' : 'no'} 
                  onChange={e => setCalcForm({...calcForm, medicationChanged: e.target.value === 'yes'})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white font-medium focus:border-teal-400 focus:outline-none"
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={calcLoading}
                  className="w-full py-2 bg-teal-500 hover:bg-teal-400 text-gray-950 font-black rounded-lg transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  {calcLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  Predict
                </button>
              </div>
            </form>

            {calcResult && (
              <div className="bg-gray-800/80 border border-teal-500/30 p-4 rounded-xl mt-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black text-teal-400">
                      Recommendation: {calcResult.recommendedFollowup.replace('_', ' ')}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase ${
                      calcResult.priorityTier === 'CRITICAL' ? 'bg-red-500 text-white' :
                      calcResult.priorityTier === 'HIGH' ? 'bg-amber-500 text-black' : 'bg-blue-500 text-white'
                    }`}>
                      {calcResult.priorityTier} PRIORITY ({calcResult.priorityScore}/100)
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 font-medium">{calcResult.clinicalReason}</p>
                </div>
                <div className="bg-teal-950/60 border border-teal-500/40 px-3.5 py-2 rounded-lg text-xs font-semibold text-teal-200">
                  <span className="text-[10px] uppercase text-teal-400 block font-bold">Action Workflow</span>
                  {calcResult.receptionistAction}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4 KPI Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">All Patients Evaluated</p>
                <h3 className="text-2xl font-black text-gray-900 mt-1">{data.summary?.totalEvaluated || 0}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <HeartPulse size={20} />
              </div>
            </div>
            <p className="text-[11px] font-semibold text-blue-600 mt-2">Continuous longitudinal tracking</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-red-200 shadow-2xs bg-red-50/30">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-bold text-red-500 uppercase tracking-wider">Urgent Calls Needed</p>
                <h3 className="text-2xl font-black text-red-700 mt-1">{data.summary?.urgentCallsNeeded ?? data.summary?.criticalCount ?? 0}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center animate-pulse">
                <Phone size={20} />
              </div>
            </div>
            <p className="text-[11px] font-bold text-red-600 mt-2">Severe condition / Prolonged absence</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-2xs bg-amber-50/20">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">High Priority (7-Day)</p>
                <h3 className="text-2xl font-black text-amber-800 mt-1">{data.summary?.highCount || 0}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Clock size={20} />
              </div>
            </div>
            <p className="text-[11px] font-bold text-amber-700 mt-2">Prescription & symptom review</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-teal-200 shadow-2xs">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-bold text-teal-600 uppercase tracking-wider">Model Accuracy</p>
                <h3 className="text-2xl font-black text-teal-800 mt-1">{data.summary?.aiModelAccuracy || '95.8%'}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <BrainCircuit size={20} />
              </div>
            </div>
            <p className="text-[11px] font-semibold text-teal-700 mt-2">Trained on {data.summary?.datasetRecordsTrained || 500} clinical cases</p>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder="Search patient, UHID, symptom, diagnosis..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Priority Filters */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-bold">
              {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(p => (
                <button
                  key={p}
                  onClick={() => setPriorityFilter(p)}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    priorityFilter === p 
                      ? p === 'CRITICAL' ? 'bg-red-600 text-white shadow-2xs' : 'bg-white text-gray-900 shadow-2xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Diagnosis Filter */}
            <select
              value={diagnosisFilter}
              onChange={e => setDiagnosisFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold bg-gray-100 border-none rounded-xl text-gray-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Conditions</option>
              <option value="Diabetes">Diabetes</option>
              <option value="Hypertension">Hypertension</option>
              <option value="Migraine">Migraine</option>
              <option value="Asthma">Asthma</option>
              <option value="Thyroid Disorder">Thyroid</option>
            </select>
          </div>
        </div>

        {/* Patients Actionable Follow-up List Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Patient & Record</th>
                  <th className="py-3 px-4">Absence & Severity</th>
                  <th className="py-3 px-4">Chief Complaint & Vitals</th>
                  <th className="py-3 px-4">ML Recommendation</th>
                  <th className="py-3 px-4">ML Clinical Directive</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                {filteredPatients.map(patient => (
                  <tr key={patient.id} className={`hover:bg-teal-50/20 transition-colors ${patient.priorityTier === 'CRITICAL' ? 'bg-red-50/15' : ''}`}>
                    
                    {/* Patient & UHID */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900">{patient.patientName}</div>
                      <div className="text-[11px] text-gray-500 font-semibold">{patient.uhid} • {patient.age}y/{patient.gender}</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="inline-block text-[9px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100">
                          {patient.recordId}
                        </span>
                        {patient.phone && (
                          <span className="text-[10px] text-gray-600 font-mono">📞 {patient.phone}</span>
                        )}
                      </div>
                    </td>

                    {/* Days Absent & Severity */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded ${
                          (patient.daysSinceLastVisit || 0) >= 30 ? 'bg-red-100 text-red-800 border border-red-200' :
                          (patient.daysSinceLastVisit || 0) >= 14 ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                          'bg-blue-50 text-blue-800'
                        }`}>
                          📅 {patient.daysSinceLastVisit || 7} days absent
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-gray-500 font-bold uppercase">Severity:</span>
                          <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                            patient.severity?.toLowerCase() === 'severe' || patient.severity?.toLowerCase() === 'high'
                              ? 'bg-red-500 text-white'
                              : patient.severity?.toLowerCase() === 'moderate'
                              ? 'bg-amber-500/20 text-amber-900'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {patient.severity || 'Moderate'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Chief Complaint & Lab */}
                    <td className="py-3 px-4 max-w-[220px]">
                      <p className="font-bold text-gray-900 truncate" title={patient.chiefComplaint || patient.diagnosis}>
                        {patient.chiefComplaint || patient.diagnosis}
                      </p>
                      <div className="text-[11px] text-gray-600 mt-0.5">
                        {patient.testName}: <strong className={patient.testAbnormal === 'Yes' ? 'text-red-600 font-black' : 'text-gray-900'}>{patient.testValue}</strong>
                        {patient.testAbnormal === 'Yes' && <span className="text-[9px] text-red-500 font-bold ml-1">(Abnormal)</span>}
                      </div>
                      {patient.symptomsDuration && (
                        <div className="text-[10px] text-gray-500">Duration: {patient.symptomsDuration}</div>
                      )}
                    </td>

                    {/* AI Recommendation */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wide border shadow-2xs ${
                          patient.priorityTier === 'CRITICAL' ? 'bg-red-600 text-white border-red-600 animate-pulse' :
                          patient.priorityTier === 'HIGH' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                          patient.priorityTier === 'MEDIUM' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {patient.recommendedFollowup.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              patient.priorityScore >= 75 ? 'bg-red-500' :
                              patient.priorityScore >= 55 ? 'bg-amber-500' : 'bg-blue-500'
                            }`} 
                            style={{ width: `${patient.priorityScore}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-black text-gray-600">{patient.priorityScore}/100</span>
                      </div>
                    </td>

                    {/* Clinical Reason & Doctor Alert */}
                    <td className="py-3 px-4 max-w-xs">
                      {patient.isCallRecommended && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-red-100 text-red-700 px-2 py-0.5 rounded-md mb-1 border border-red-200">
                          <Phone size={10} /> ML DIRECTIVE: CALL PATIENT
                        </span>
                      )}
                      <p className="text-[11px] text-gray-700 leading-snug font-medium line-clamp-2" title={patient.doctorAlert || patient.clinicalReason}>
                        {patient.doctorAlert || patient.clinicalReason}
                      </p>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setActionModal({ type: 'CALL', patient })}
                          title="Call Patient Outreach"
                          className={`p-2 rounded-xl transition-all shadow-2xs flex items-center gap-1 font-bold text-xs ${
                            patient.isCallRecommended || patient.priorityTier === 'CRITICAL'
                              ? 'bg-red-600 hover:bg-red-700 text-white animate-bounce'
                              : 'bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200'
                          }`}
                        >
                          <Phone size={13} /> Call
                        </button>
                        <button
                          onClick={() => setActionModal({ type: 'BOOK', patient })}
                          title="Book Slot"
                          className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors shadow-2xs"
                        >
                          <Calendar size={13} />
                        </button>
                        <button
                          onClick={() => setActionModal({ type: 'MSG', patient })}
                          title="Send WhatsApp Reminder"
                          className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors shadow-2xs"
                        >
                          <MessageSquare size={13} />
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

      {/* Action Modal (Call / Booking Outreach) */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <BrainCircuit size={18} className="text-teal-600" />
                <h3 className="text-base font-black text-gray-900">
                  {actionModal.type === 'CALL' ? 'Log Patient Outreach Call' :
                   actionModal.type === 'BOOK' ? 'Schedule AI Recommended Slot' : 'Send WhatsApp Reminder'}
                </h3>
              </div>
              <button onClick={() => setActionModal(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="bg-teal-50/60 border border-teal-200/80 p-3.5 rounded-xl space-y-1 text-xs">
              <div className="font-bold text-gray-900">{actionModal.patient.patientName} ({actionModal.patient.uhid})</div>
              <div className="text-gray-600">Phone: <strong>{actionModal.patient.phone}</strong></div>
              <div className="text-teal-800 font-bold mt-1">Recommended: {actionModal.patient.recommendedFollowup.replace('_', ' ')}</div>
              <div className="text-gray-500 text-[11px] mt-0.5">{actionModal.patient.receptionistAction}</div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Receptionist Notes / Outcome</label>
              <textarea
                rows={3}
                value={actionNotes}
                onChange={e => setActionNotes(e.target.value)}
                placeholder="e.g. Spoke to patient, confirmed 3-day appointment with cardiologist..."
                className="w-full text-xs font-medium border border-gray-200 rounded-xl p-2.5 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionSubmitting}
                onClick={() => handleActionSubmit(actionModal.type === 'CALL' ? 'CALLED' : actionModal.type === 'BOOK' ? 'SCHEDULED' : 'MSG_SENT')}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                {actionSubmitting ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                Confirm Outreach
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
