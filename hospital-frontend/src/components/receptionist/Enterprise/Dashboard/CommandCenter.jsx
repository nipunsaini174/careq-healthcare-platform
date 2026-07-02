"use client";
import React, { useState, useEffect } from 'react';
import { PlayCircle, Clock, CheckCircle2, Siren, FileText, AlertCircle, TrendingUp, X, UserX, UserCheck, RotateCcw } from 'lucide-react';
import { useQueue } from '@/hooks/useQueue';

export default function CommandCenter() {
  const { queue } = useQueue();
  
  // Queue State - dynamically pulled from useQueue
  const [currentToken, setCurrentToken] = useState('Waiting...');
  const [nextTokens, setNextTokens] = useState([]);
  
  useEffect(() => {
    if (queue && queue.length > 0) {
      const active = queue.find(q => q.status === 'IN_CONSULTATION');
      const nextOps = queue.filter(q => q.status === 'WAITING').map(q => q.tokenNumber);
      
      setCurrentToken(active ? active.tokenNumber : (nextOps[0] || 'Empty'));
      setNextTokens(nextOps.slice(active ? 0 : 1, 6)); // show next 5
    }
  }, [queue]);

  // Patient Journey State
  // Stages: 0 = Waiting, 1 = Check-In, 2 = Consultation, 3 = Billing, 4 = Check-Out
  const [visitStage, setVisitStage] = useState(0); 
  const [visitStartTime, setVisitStartTime] = useState(null);
  const [visitDuration, setVisitDuration] = useState(null);
  const [isPresent, setIsPresent] = useState(false);

  // Attendance State
  const [absentPatients, setAbsentPatients] = useState([]);
  const [attendanceMetrics, setAttendanceMetrics] = useState({ present: 0, absent: 0, recalled: 0 });

  // Emergency Modal State
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyCounter, setEmergencyCounter] = useState(1);
  const [recallCounter, setRecallCounter] = useState(1);

  // Progress logic
  const progressPercentage = visitStage === 0 ? 0 : visitStage === 1 ? 25 : visitStage === 2 ? 50 : visitStage === 3 ? 75 : 100;

  const handleMarkPresent = () => {
    setIsPresent(true);
    setAttendanceMetrics(prev => ({ ...prev, present: prev.present + 1 }));
  };

  const handleCheckIn = () => {
    setVisitStage(1); // Checked In -> Consultation
    setVisitStartTime(new Date());
  };

  const handleMarkAbsent = () => {
    const patientInfo = queue?.find(q => q.tokenNumber === currentToken);
    
    // Add to absent list
    const newAbsent = {
      token: currentToken,
      name: patientInfo?.patientName || 'Unknown Patient',
      id: patientInfo?.patientId || 'PT-' + Math.floor(1000 + Math.random() * 9000),
      doctor: patientInfo?.doctorName || 'Assigned Doctor',
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      recalled: false
    };
    setAbsentPatients([newAbsent, ...absentPatients]);
    
    // Update metrics
    setAttendanceMetrics(prev => ({ ...prev, absent: prev.absent + 1 }));

    // Simulate Notification
    console.log(`Notification Sent: Your token ${currentToken} was called, but you were marked absent.`);

    // Advance Queue immediately
    advanceQueue();
  };

  const handleRecall = (index) => {
    const updatedAbsent = [...absentPatients];
    const patient = updatedAbsent[index];
    
    if (patient.recalled) return;
    
    patient.recalled = true;
    setAbsentPatients(updatedAbsent);
    
    // Generate Recall Token
    const recallToken = `R-00${recallCounter}`;
    setRecallCounter(c => c + 1);
    
    // Insert into queue
    setNextTokens([...nextTokens, recallToken]);
    
    // Update metrics
    setAttendanceMetrics(prev => ({ ...prev, recalled: prev.recalled + 1 }));
  };

  const handleCheckOut = () => {
    setVisitStage(4); // Completed
    
    if (visitStartTime) {
      const diff = Math.floor((new Date() - visitStartTime) / 60000);
      setVisitDuration(diff < 1 ? 1 : diff);
    }
    
    setAttendanceMetrics(prev => ({ ...prev, present: prev.present + 1 }));

    setTimeout(() => {
      advanceQueue();
    }, 1500);
  };

  const advanceStage = () => {
    if (visitStage > 0 && visitStage < 3) setVisitStage(visitStage + 1);
  };

  const advanceQueue = () => {
    if (nextTokens.length > 0) {
      const next = nextTokens[0];
      setCurrentToken(next);
      setNextTokens(nextTokens.slice(1));
      
      setVisitStage(0);
      setVisitStartTime(null);
      setVisitDuration(null);
    }
  };

  const handleGenerateEmergency = (e) => {
    e.preventDefault();
    const eToken = `E-00${emergencyCounter}`;
    setEmergencyCounter(c => c + 1);
    
    setNextTokens([eToken, ...nextTokens]);
    setIsEmergencyModalOpen(false);
    setEmergencyName('');
  };

  const attendanceRate = Math.round((attendanceMetrics.present / (attendanceMetrics.present + attendanceMetrics.absent)) * 100) || 100;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full relative">
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <PlayCircle size={18} className="text-teal-600" />
          Live Queue Command Center
        </h3>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsEmergencyModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm shadow-red-600/30"
          >
            <Siren size={14} />
            Emergency Push
          </button>
          <div className="h-4 w-px bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
            </span>
            <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider">Live Updates</span>
          </div>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
        
        {/* Top Row: Current Token & Queue Progress */}
        <div className="grid grid-cols-2 gap-8">
          {/* Current Serving Box */}
          <div className={`rounded-[26px] p-8 text-white relative overflow-hidden transition-all duration-500 ${
            currentToken.startsWith('E-') 
            ? 'bg-[linear-gradient(135deg,#EF4444_0%,#DC2626_50%,#B91C1C_100%)] shadow-[0_12px_30px_rgba(239,68,68,0.35)]' 
            : currentToken.startsWith('R-')
            ? 'bg-[linear-gradient(135deg,#3B82F6_0%,#2563EB_50%,#1D4ED8_100%)] shadow-[0_12px_30px_rgba(37,99,235,0.35)]'
            : 'bg-[linear-gradient(135deg,#12D6C5_0%,#08B7A7_50%,#089C8E_100%)] shadow-[0_12px_30px_rgba(8,183,167,0.35)]'
          }`}>
            <div className="absolute -right-8 -top-12 w-48 h-48 bg-white rounded-full opacity-10 mix-blend-overlay blur-sm"></div>
            <div className="absolute right-12 -top-4 w-32 h-32 bg-white rounded-full opacity-[0.08] mix-blend-overlay"></div>
            <div className="absolute -left-12 -bottom-12 w-40 h-40 bg-black rounded-full opacity-5 blur-[40px]"></div>
            
            <div className="relative z-10 flex justify-between items-start mb-2">
              <p className="text-white/80 text-xs font-bold uppercase tracking-[0.15em] drop-shadow-sm">Current Token</p>
              
              <div className="flex items-center gap-2">
                {/* Live Attendance Badge */}
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-sm flex items-center gap-1.5 backdrop-blur-md ${
                  visitStage === 0 ? 'bg-yellow-500/20 border-yellow-200/40 text-yellow-50' :
                  visitStage === 4 ? 'bg-green-500/20 border-green-200/40 text-green-50' :
                  'bg-white/20 border-white/40 text-white'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    visitStage === 0 ? 'bg-yellow-300' :
                    visitStage === 4 ? 'bg-green-300' :
                    'bg-white'
                  }`}></span>
                  {visitStage === 0 ? 'Waiting' : visitStage === 4 ? 'Completed' : 'Present'}
                </span>

                {currentToken.startsWith('E-') && (
                  <span className="bg-red-900/60 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1 rounded-full border border-red-300/30 shadow-sm flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse"></span>
                    Emergency Priority
                  </span>
                )}
                {currentToken.startsWith('R-') && (
                  <span className="bg-blue-900/60 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1 rounded-full border border-blue-300/30 shadow-sm flex items-center gap-1.5">
                    <RotateCcw size={10} />
                    Recalled Patient
                  </span>
                )}
              </div>
            </div>
            
            <h1 className="relative z-10 text-[64px] leading-none font-black tracking-tighter drop-shadow-md mb-6">{currentToken}</h1>
            
            <div className="relative z-10 flex items-center gap-3 text-xs font-semibold">
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                <Clock size={14} className="text-white/90" />
                <span>04:12 Elapsed</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                <CheckCircle2 size={14} className="text-white/90" />
                <span>Dr. Smith</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
                <span className="text-white/90">Cardiology</span>
              </div>
            </div>
          </div>

          {/* Analytics & Queue Stats */}
          <div className="flex flex-col justify-center space-y-4">
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">Attendance Analytics</p>
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center">
                  <p className="text-lg font-black text-green-600">{attendanceMetrics.present}</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Present</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-black text-red-600">{attendanceMetrics.absent}</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Absent</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-black text-blue-600">{attendanceMetrics.recalled}</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Recall</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-black text-gray-900">{attendanceRate}%</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Rate</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Waiting Patients</p>
                <p className="text-xl font-black text-gray-900">{nextTokens.length + 15}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Est. Wait Time</p>
                <p className="text-xl font-black text-gray-900">18 <span className="text-xs font-bold text-gray-500">mins</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Section: Patient Visit Status & Controls */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Patient Visit Status</p>
            <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">Progress: {progressPercentage}%</span>
          </div>

          <div className="flex items-center justify-between relative px-2 mb-6">
            <div className="absolute top-1/2 left-8 right-8 h-1 bg-gray-100 -translate-y-1/2 z-0 rounded-full"></div>
            <div 
              className="absolute top-1/2 left-8 h-1 bg-teal-500 -translate-y-1/2 z-0 transition-all duration-500 rounded-full"
              style={{ width: `calc(${progressPercentage}% - 64px)` }}
            ></div>

            {['Check-In', 'Consultation', 'Billing', 'Check-Out'].map((label, idx) => {
              const stepIndex = idx + 1;
              const isCompleted = visitStage > stepIndex || (visitStage === 4);
              const isActive = visitStage === stepIndex && visitStage !== 4;
              
              return (
                <div key={idx} className="relative z-10 flex flex-col items-center gap-2 bg-white px-2 cursor-pointer" onClick={visitStage > 0 ? advanceStage : undefined}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isCompleted ? 'bg-teal-500 border-teal-500 text-white' :
                    isActive ? 'bg-white border-blue-500 text-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.1)]' :
                    'bg-white border-gray-200 text-gray-300'
                  }`}>
                    {isCompleted && <CheckCircle2 size={16} />}
                    {isActive && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></div>}
                    {!isCompleted && !isActive && <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    isCompleted ? 'text-teal-600' :
                    isActive ? 'text-blue-600' :
                    'text-gray-400'
                  }`}>
                    {label} {isActive && <span className="block text-center text-[8px] opacity-70">(In Progress)</span>}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center bg-gray-50/50 p-3 rounded-lg border border-gray-100">
            {visitStage === 4 && visitDuration && (
              <span className="text-sm font-bold text-green-600 flex items-center gap-2"><CheckCircle2 size={16} /> Visit Completed ({visitDuration} mins)</span>
            )}
            {visitStage !== 4 && !visitDuration && (
              <span className="text-xs font-semibold text-gray-500">Attendance Controls</span>
            )}
            
            <div className="flex gap-3 ml-auto">
              <button 
                onClick={handleMarkPresent}
                disabled={visitStage > 0 || isPresent}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                  visitStage === 0 && !isPresent
                  ? 'bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100' 
                  : visitStage === 0 && isPresent
                  ? 'bg-blue-600 text-white shadow-sm cursor-default'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 size={16} /> {isPresent ? 'Present' : 'Mark Present'}
              </button>
              <button 
                onClick={handleCheckIn}
                disabled={visitStage > 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                  visitStage === 0 
                  ? 'bg-green-600 text-white shadow-sm hover:bg-green-700' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <UserCheck size={16} /> Check In
              </button>
              <button 
                onClick={handleMarkAbsent}
                disabled={visitStage > 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                  visitStage === 0 
                  ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' 
                  : 'bg-gray-50 border border-transparent text-gray-300 cursor-not-allowed'
                }`}
              >
                <UserX size={16} /> Mark Absent
              </button>
              <button 
                onClick={handleCheckOut}
                disabled={visitStage < 2 || visitStage === 4}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                  visitStage >= 2 && visitStage < 4
                  ? 'bg-teal-600 text-white shadow-sm hover:bg-teal-700' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 size={16} /> Check Out
              </button>
            </div>
          </div>
        </div>



        {/* Bottom Section: Absent & Upcoming Tokens Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upcoming Tokens */}
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Upcoming Tokens</p>
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
              {nextTokens.map((token, i) => (
                <div key={token} className={`flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-xl border transition-colors ${
                  token.startsWith('E-') ? 'bg-red-50 border-red-200 text-red-700 shadow-sm relative' :
                  token.startsWith('R-') ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' :
                  i === 0 ? 'bg-teal-50 border-teal-200 text-teal-700 shadow-sm' : 'bg-white border-gray-200 text-gray-600'
                }`}>
                  {token.startsWith('E-') && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border border-white"></span>}
                  <span className="text-[10px] font-bold opacity-70 mb-0.5">Next</span>
                  <span className="text-sm font-black">{token}</span>
                </div>
              ))}
              {nextTokens.length === 0 && <p className="text-xs text-gray-400 font-bold italic py-4">Queue is empty.</p>}
            </div>
          </div>

          {/* Absent Queue Management */}
          <div>
            <div className="flex justify-between items-end mb-2">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Absent Patients</p>
              <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 rounded-full">{absentPatients.filter(p => !p.recalled).length} Pending</span>
            </div>
            <div className="flex flex-col gap-2 max-h-[80px] overflow-y-auto pr-1">
              {absentPatients.map((patient, i) => (
                <div key={i} className={`flex items-center justify-between p-2 rounded-lg border text-xs ${patient.recalled ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-red-100 shadow-sm'}`}>
                  <div className="flex items-center gap-3">
                    <span className={`font-black w-10 text-center ${patient.recalled ? 'text-gray-400' : 'text-red-600'}`}>{patient.token}</span>
                    <div>
                      <p className="font-bold text-gray-900">{patient.name}</p>
                      <p className="text-[9px] text-gray-500 font-bold tracking-wider">{patient.id} <span className="opacity-50 font-normal">| Missed: {patient.time} • {patient.doctor}</span></p>
                    </div>
                  </div>
                  {patient.recalled ? (
                    <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md flex items-center gap-1"><RotateCcw size={10}/> Recalled</span>
                  ) : (
                    <button 
                      onClick={() => handleRecall(i)}
                      className="text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md border border-blue-200 transition-colors"
                    >
                      Recall Patient
                    </button>
                  )}
                </div>
              ))}
              {absentPatients.length === 0 && <p className="text-xs text-gray-400 font-bold italic py-4 text-center border rounded-lg bg-gray-50">No absent patients.</p>}
            </div>
          </div>
        </div>

      </div>

      {/* Emergency Modal Overlay */}
      {isEmergencyModalOpen && (
        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border-2 border-red-100">
            <div className="bg-red-600 px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Siren size={18} />
                Emergency Patient
              </h3>
              <button onClick={() => setIsEmergencyModalOpen(false)} className="text-red-100 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleGenerateEmergency} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Patient Name</label>
                  <input 
                    type="text" 
                    required
                    value={emergencyName}
                    onChange={e => setEmergencyName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-semibold" 
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Patient ID</label>
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-semibold text-gray-500" 
                    placeholder="PT-XXXX"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Mobile</label>
                  <input type="tel" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500" placeholder="+91" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Priority Level</label>
                  <select className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-bold text-red-600">
                    <option>Critical</option>
                    <option>High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Emergency Type</label>
                <select className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-semibold">
                  <option>Cardiac Arrest</option>
                  <option>Trauma / Accident</option>
                  <option>Respiratory Distress</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="pt-4 mt-6 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsEmergencyModalOpen(false)} className="px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-6 py-2.5 text-sm font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm">Generate Emergency Token</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
