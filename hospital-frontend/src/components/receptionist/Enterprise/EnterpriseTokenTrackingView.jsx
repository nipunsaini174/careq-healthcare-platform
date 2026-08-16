"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, MapPin, User, Stethoscope, Clock, CheckCircle2, 
  FileText, Beaker, Receipt, Loader2, AlertCircle, RefreshCw, 
  UserCheck, Sparkles, ArrowRight, HeartPulse
} from 'lucide-react';
import api from '@/services/api';
import { useSocket } from '@/contexts/SocketContext';

export default function EnterpriseTokenTrackingView() {
  const [searchInput, setSearchInput] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [trackingData, setTrackingData] = useState(null);
  const [recentTokens, setRecentTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { socket } = useSocket();

  // Load recent tokens & default tracking data
  const fetchActiveTokens = useCallback(async () => {
    try {
      const res = await api.get('/receptionist/active-tokens');
      const list = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      setRecentTokens(list);
      return list;
    } catch {
      return [];
    }
  }, []);

  const fetchTrackingData = useCallback(async (query) => {
    try {
      setLoading(true);
      setError('');
      const endpoint = query ? `/receptionist/tracking/${encodeURIComponent(query)}` : '/receptionist/tracking';
      const res = await api.get(endpoint);
      if (res.data?.data) {
        setTrackingData(res.data.data);
        setActiveQuery(res.data.data.tokenCode);
        setSearchInput(res.data.data.tokenCode);
      } else {
        setError('No tracking data found for this token.');
      }
    } catch (err) {
      console.error('Track token failed:', err);
      setError('Token not found. Please verify token number (e.g. A-001, T44) or patient name.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function init() {
      const list = await fetchActiveTokens();
      const firstCode = list[0]?.tokenCode || 'A-001';
      setSearchInput(firstCode);
      await fetchTrackingData(firstCode);
    }
    init();
  }, [fetchActiveTokens, fetchTrackingData]);

  // Real-time socket sync
  useEffect(() => {
    if (!socket) return;

    const handleRealtimeUpdate = () => {
      fetchActiveTokens();
      if (activeQuery) {
        fetchTrackingData(activeQuery);
      }
    };

    socket.on('queue_updated', handleRealtimeUpdate);
    socket.on('token_status_changed', handleRealtimeUpdate);
    socket.on('token_called', handleRealtimeUpdate);
    socket.on('consultation_completed', handleRealtimeUpdate);
    socket.on('appointment_updated', handleRealtimeUpdate);

    return () => {
      socket.off('queue_updated', handleRealtimeUpdate);
      socket.off('token_status_changed', handleRealtimeUpdate);
      socket.off('token_called', handleRealtimeUpdate);
      socket.off('consultation_completed', handleRealtimeUpdate);
      socket.off('appointment_updated', handleRealtimeUpdate);
    };
  }, [socket, activeQuery, fetchActiveTokens, fetchTrackingData]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    fetchTrackingData(searchInput.trim());
  };

  const handleSelectRecentToken = (tokenCode) => {
    setSearchInput(tokenCode);
    fetchTrackingData(tokenCode);
  };

  // Map icon names to components
  const getStepIcon = (iconName) => {
    switch (iconName) {
      case 'FileText': return FileText;
      case 'CheckCircle2': return HeartPulse;
      case 'Clock': return Clock;
      case 'Stethoscope': return Stethoscope;
      case 'User': return User;
      case 'Beaker': return Beaker;
      case 'Receipt': return Receipt;
      default: return MapPin;
    }
  };

  return (
    <div className="flex-1 min-w-0 overflow-x-auto overflow-y-auto bg-gray-50/50 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-[1200px] mx-auto min-w-0 space-y-6 pb-8 sm:space-y-8 sm:pb-12">
        
        {/* Page Header & Search */}
        <div className="text-center space-y-4 mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 mb-1 shadow-xs border border-teal-100">
            <MapPin size={32} />
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">Token Journey Tracker</h2>
          <p className="text-gray-500 max-w-lg mx-auto text-sm">
            Enter any patient's token number or name to instantly track their exact live location and clinical status across hospital departments.
          </p>
          
          {/* Main Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative max-w-2xl mx-auto mt-6">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={22} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Enter Token (e.g. A-001, T44, UHID-1001, or Name)..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="block w-full pl-12 pr-32 py-4 border-2 border-gray-200 rounded-2xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 text-xl font-bold tracking-wider uppercase transition-all shadow-md"
            />
            <button 
              type="submit"
              disabled={loading}
              className="absolute inset-y-2 right-2 bg-teal-600 hover:bg-teal-700 text-white font-bold px-6 rounded-xl transition-colors shadow-xs flex items-center gap-2 text-sm disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Track'}
            </button>
          </form>

          {/* Quick Token Shortcuts */}
          {recentTokens.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2 max-w-3xl mx-auto">
              <span className="text-xs font-semibold text-gray-400">Quick Track:</span>
              {recentTokens.slice(0, 7).map((tok, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectRecentToken(tok.tokenCode)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeQuery === tok.tokenCode
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-white border border-gray-200 text-gray-700 hover:border-teal-300 hover:bg-teal-50/50 shadow-2xs'
                  }`}
                >
                  <span>{tok.tokenCode}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    (tok.status || '').toUpperCase() === 'COMPLETED' ? 'bg-emerald-400' :
                    (tok.status || '').toUpperCase() === 'IN_PROGRESS' ? 'bg-purple-400' : 'bg-blue-400'
                  }`}></span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl flex items-center justify-between max-w-2xl mx-auto text-sm">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-rose-500 flex-shrink-0" />
              <p className="font-medium">{error}</p>
            </div>
            <button 
              onClick={() => {
                const first = recentTokens[0]?.tokenCode || 'A-001';
                setSearchInput(first);
                fetchTrackingData(first);
              }}
              className="text-xs font-bold underline hover:no-underline ml-4"
            >
              Reset
            </button>
          </div>
        )}

        {/* Results Panel */}
        {trackingData && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
            
            {/* Top Patient & Stage Banner */}
            <div className="p-6 sm:p-8 border-b border-gray-100 bg-gradient-to-br from-gray-50/80 via-white to-teal-50/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-teal-50 border-2 border-teal-200/80 flex items-center justify-center flex-col flex-shrink-0 shadow-xs">
                  <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">Token</span>
                  <span className="text-2xl sm:text-3xl font-black text-teal-800 tracking-tight">{trackingData.tokenCode}</span>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 mb-1">{trackingData.patientName}</h3>
                  <p className="text-gray-500 font-medium text-xs sm:text-sm">
                    {trackingData.patientGender !== 'Not Specified' ? `${trackingData.patientGender}` : 'Patient'}
                    {trackingData.patientAge ? `, ${trackingData.patientAge} yrs` : ''} 
                    {trackingData.patientUhid && ` • ${trackingData.patientUhid}`}
                    {trackingData.bloodGroup && trackingData.bloodGroup !== 'Unknown' && ` • Blood: ${trackingData.bloodGroup}`}
                  </p>
                  
                  {/* Active Location Indicator */}
                  <div className="flex flex-wrap items-center gap-2.5 mt-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-md border shadow-2xs ${
                      trackingData.currentBadge === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      trackingData.currentBadge === 'IN_CONSULTATION' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                      trackingData.currentBadge === 'CALLED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      'bg-teal-50 text-teal-700 border-teal-200'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        trackingData.currentBadge === 'COMPLETED' ? 'bg-emerald-500' :
                        trackingData.currentBadge === 'IN_CONSULTATION' ? 'bg-purple-500 animate-ping' :
                        'bg-blue-500 animate-pulse'
                      }`}></span>
                      {trackingData.currentStage}
                    </span>
                    <span className="text-xs font-bold text-gray-600 flex items-center gap-1">
                      <MapPin size={13} className="text-teal-600" />
                      {trackingData.currentStageDesc}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Stat Cards */}
              <div className="flex flex-wrap gap-3 w-full md:w-auto">
                <div className="bg-white border border-gray-200 rounded-xl p-3.5 min-w-[120px] flex-1 md:flex-initial text-center shadow-2xs">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Est. Wait Time</p>
                  <p className="text-lg font-black text-gray-900">{trackingData.totalWaitTime}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-3.5 min-w-[140px] flex-1 md:flex-initial text-center shadow-2xs">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Consulting Doctor</p>
                  <p className="text-sm font-black text-gray-900 truncate">{trackingData.assignedDoctor}</p>
                  <p className="text-[10px] text-teal-600 font-bold truncate">{trackingData.department}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-3.5 min-w-[110px] flex-1 md:flex-initial text-center shadow-2xs">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Assigned Room</p>
                  <p className="text-sm font-black text-gray-900">{trackingData.opdRoom}</p>
                </div>
              </div>
            </div>

            {/* Detailed Journey Timeline */}
            <div className="p-6 sm:p-10 relative">
              
              {/* Vertical connecting line */}
              <div className="absolute top-12 bottom-12 left-[44px] sm:left-[58px] w-1 bg-gray-100 rounded-full"></div>
              
              <div className="space-y-7">
                {trackingData.steps.map((step, idx) => {
                  const IconComponent = getStepIcon(step.icon);
                  const isCompleted = step.status === 'completed';
                  const isActive = step.status === 'active';
                  const isPending = step.status === 'pending';

                  return (
                    <div key={idx} className="flex gap-4 sm:gap-6 relative group">
                      
                      {/* Step Time */}
                      <div className="w-16 sm:w-20 text-right pt-2 flex-shrink-0">
                        <p className={`text-xs sm:text-sm font-bold ${
                          isActive ? 'text-teal-700 font-black' : isPending ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {step.time}
                        </p>
                      </div>
                      
                      {/* Step Icon Badge */}
                      <div className="relative z-10 flex flex-col items-center flex-shrink-0">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-4 transition-all ${
                          isCompleted ? 'bg-teal-600 border-white text-white shadow-xs' :
                          isActive ? 'bg-white border-blue-500 text-blue-600 shadow-[0_0_0_4px_rgba(59,130,246,0.2)] animate-pulse' :
                          'bg-white border-gray-100 text-gray-300'
                        }`}>
                          <IconComponent size={18} />
                        </div>
                      </div>

                      {/* Step Content Box */}
                      <div className={`flex-1 rounded-2xl border p-4 sm:p-5 transition-all ${
                        isActive 
                          ? 'border-blue-300 shadow-md bg-blue-50/30' 
                          : isCompleted 
                          ? 'border-gray-200/90 bg-white shadow-2xs group-hover:border-teal-200' 
                          : 'border-gray-100 bg-gray-50/40 text-gray-400'
                      }`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                          <h4 className={`text-base font-bold ${
                            isActive ? 'text-blue-900 font-black' : isPending ? 'text-gray-400' : 'text-gray-900'
                          }`}>
                            {step.title}
                          </h4>
                          {step.location && (
                            <span className="text-[11px] font-semibold text-gray-500 flex items-center gap-1">
                              <MapPin size={11} className={isActive ? 'text-blue-600' : 'text-gray-400'} />
                              {step.location}
                            </span>
                          )}
                        </div>
                        <p className={`text-xs sm:text-sm leading-relaxed ${
                          isPending ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
