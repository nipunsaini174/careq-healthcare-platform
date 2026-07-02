"use client";
import React, { useState, useEffect } from 'react';
import { 
  Activity, LayoutDashboard, Stethoscope, List, Calendar, Users, Bell, 
  Settings, ChevronDown, Search, Clock, Plus, LayoutGrid, Ticket, AlertTriangle,
  Play, Siren, MapPin, X, Building2
} from 'lucide-react';

export default function ReceptionDashboard() {
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [searchToken, setSearchToken] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [time, setTime] = useState(new Date());

  const [regName, setRegName] = useState('');
  const [regAge, setRegAge] = useState('');
  const [regType, setRegType] = useState('New Patient');
  const [regUrgency, setRegUrgency] = useState('Normal');
  const [regAppointment, setRegAppointment] = useState('Walk-in');

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearchToken(val);
    if (val.length > 2) {
      setIsSearching(true);
      setTimeout(() => {
        setIsSearching(false);
        setSearchResult({
          token: val.toUpperCase(),
          patient: "Rajesh Kumar",
          age: 45,
          type: "Follow-up",
          status: "Waiting",
          doctor: "Dr. Smith",
          waitTime: "18 mins"
        });
      }, 500);
    } else {
      setSearchResult(null);
    }
  };

  const handleGenerateToken = () => {
    setShowRegistration(false);
    setToastMessage(`Token D-040 generated for ${regName || 'Patient'}`);
    setTimeout(() => setToastMessage(''), 3000);
    setRegName(''); setRegAge(''); setRegType('New Patient'); setRegUrgency('Normal'); setRegAppointment('Walk-in');
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
  };

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Doctors', icon: Stethoscope },
    { name: 'Live Queue', icon: List },
    { name: 'Appointments', icon: Calendar },
    { name: 'Patients', icon: Users },
    { name: 'Notifications', icon: Bell },
    { name: 'Settings', icon: Settings }
  ];

  const stats = [
    { label: "TODAY'S PATIENTS", value: "50", delta: "+12%", deltaColor: "#16A34A", icon: Users, iconBg: "#EFF6FF", iconColor: "#3B82F6" },
    { label: "ACTIVE TOKENS", value: "7", delta: "Stable", deltaColor: "#16A34A", icon: LayoutGrid, iconBg: "#F5F3FF", iconColor: "#8B5CF6" },
    { label: "AVG WAIT TIME", value: "18m", delta: "-2m", deltaColor: "#DC2626", icon: Clock, iconBg: "#F0FDF9", iconColor: "#00A693" },
    { label: "DOCTORS ONLINE", value: "8/12", delta: "4 offline", deltaColor: "#DC2626", icon: Activity, iconBg: "#FFF1F2", iconColor: "#FB7185" },
    { label: "TOKENS SKIPPED", value: "8", delta: "+24", deltaColor: "#16A34A", icon: Ticket, iconBg: "#FAF5FF", iconColor: "#A855F7" },
    { label: "DELAYED TOKENS", value: "3", delta: "+1", deltaColor: "#DC2626", icon: AlertTriangle, iconBg: "#FFF7ED", iconColor: "#F97316" }
  ];

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: '#F4F6F9' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
        .transition-all { transition: all 0.15s ease; }
        .sidebar-item:hover:not(.active) { background-color: rgba(255,255,255,0.05); }
        .sidebar-item.active { background-color: #1A6B5A; }
        .pulse-dot { animation: pulse 1.5s infinite; }
        @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.4); } 100% { transform: scale(1); } }
        input:focus { outline: 2px solid #00A693; outline-offset: 1px; }
        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 4px; }
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
      
      <div style={{ width: '240px', flexShrink: 0, height: '100%', backgroundColor: '#0F1824', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <div style={{ padding: '20px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', backgroundColor: '#00A693', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={18} color="white" />
          </div>
          <div>
            <div style={{ color: 'white', fontSize: '16px', fontWeight: 700 }}>MedHarvix</div>
            <div style={{ color: '#00A693', fontSize: '9px', fontWeight: 600, letterSpacing: '0.15em', marginTop: '2px' }}>SMARTQUEUE</div>
          </div>
        </div>
        
        <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.12em', color: '#4A6380', margin: '24px 16px 8px' }}>
          MAIN MENU
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '0 8px' }}>
          {navItems.map(item => {
            const isActive = activeNav === item.name;
            const color = isActive ? '#FFFFFF' : '#8B9EB7';
            return (
              <div 
                key={item.name}
                className={`sidebar-item transition-all ${isActive ? 'active' : ''}`}
                onClick={() => setActiveNav(item.name)}
                style={{ height: '40px', padding: '0 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', position: 'relative' }}
              >
                <item.icon size={18} color={color} />
                <span style={{ color, fontSize: '14px', fontWeight: 500 }}>{item.name}</span>
                {isActive && item.name === 'Dashboard' && (
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4ADE80', position: 'absolute', right: '12px' }} />
                )}
              </div>
            );
          })}
        </div>

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#2D5A4A', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 600 }}>
            N
          </div>
          <div>
            <div style={{ color: 'white', fontSize: '14px', fontWeight: 600 }}>Jane Doe</div>
            <div style={{ color: '#8B9EB7', fontSize: '12px' }}>Head Receptionist</div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        
        <div style={{ height: '56px', backgroundColor: '#FFFFFF', borderBottom: '1px solid #E8ECF1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ paddingLeft: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Building2 size={18} color="#64748B" />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#1A2332', fontSize: '14px', fontWeight: 600 }}>
                City Center Branch <ChevronDown size={14} color="#64748B" />
              </div>
              <div style={{ color: '#94A3B8', fontSize: '12px' }}>Main Hospital</div>
            </div>
          </div>

          <div style={{ position: 'relative', width: '520px' }}>
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
              <Search size={16} color="#94A3B8" />
            </div>
            <input 
              type="text" 
              placeholder="Search tokens, patients, doctors or departments... (Press '/')"
              style={{ width: '100%', height: '36px', backgroundColor: '#F4F6F9', border: '1px solid #E2E8F0', borderRadius: '18px', paddingLeft: '36px', fontSize: '13px', color: '#1A2332' }}
            />
          </div>

          <div style={{ paddingRight: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} color="#64748B" />
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#1A2332' }}>{formatTime(time)}</div>
                <div style={{ fontSize: '10px', color: '#94A3B8' }}>{formatDate(time)}</div>
              </div>
            </div>
            <div style={{ position: 'relative', cursor: 'pointer' }}>
              <Bell size={20} color="#64748B" />
              <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '6px', height: '6px', backgroundColor: '#EF4444', borderRadius: '50%' }}></div>
            </div>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#2563EB', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600 }}>
              JD
            </div>
          </div>
        </div>

        <div className="custom-scroll" style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', position: 'relative' }}>
          
          {emergencyMode && (
            <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', padding: '12px 16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: '#DC2626', fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={16} /> ⚠ Emergency mode activated. All non-critical tokens paused.
              </div>
              <X size={16} color="#DC2626" cursor="pointer" onClick={() => setEmergencyMode(false)} />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#1A2332' }}>Real-time Operations Dashboard</h1>
              <div style={{ fontSize: '14px', color: '#64748B', marginTop: '4px' }}>Monitor live queues, doctor availability, and hospital efficiency.</div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="transition-all" style={{ border: '1px solid #E2E8F0', backgroundColor: 'white', color: '#1A2332', fontSize: '13px', fontWeight: 500, padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>
                Export Report
              </button>
              <button 
                onClick={() => setShowRegistration(true)}
                className="transition-all" 
                style={{ backgroundColor: '#00A693', color: 'white', border: 'none', fontSize: '13px', fontWeight: 600, padding: '8px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
              >
                <Plus size={14} /> New Registration
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            {stats.map((stat, i) => (
              <div key={i} style={{ flex: 1, backgroundColor: 'white', border: '1px solid #E8ECF1', borderRadius: '12px', padding: '20px', height: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: stat.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <stat.icon size={20} color={stat.iconColor} />
                  </div>
                  <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B' }}>
                    {stat.label}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: '#1A2332', lineHeight: 1 }}>{stat.value}</div>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: stat.deltaColor }}>{stat.delta}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '24px' }}>
            
            <div style={{ flex: '0 0 65%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ backgroundColor: 'white', border: '1px solid #E8ECF1', borderRadius: '16px', padding: '24px' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Play size={16} color="#00A693" fill="#00A693" />
                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#1A2332' }}>Live Queue Command Center</div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button 
                      onClick={() => setEmergencyMode(true)}
                      className="transition-all"
                      style={{ backgroundColor: '#E53935', color: 'white', border: 'none', borderRadius: '8px', padding: '7px 14px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                    >
                      <Siren size={14} /> Emergency Push
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(34, 197, 94, 0.1)', padding: '6px 10px', borderRadius: '16px' }}>
                      <div className="pulse-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22C55E' }}></div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: '#22C55E', letterSpacing: '0.05em' }}>LIVE UPDATES</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                  
                  <div style={{ width: '260px', background: 'linear-gradient(135deg, #00A693, #00897B)', borderRadius: '16px', padding: '24px', minHeight: '240px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.8)' }}>CURRENT TOKEN</div>
                      <div style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#FCD34D' }}></div>
                        <div style={{ fontSize: '11px', color: 'white' }}>Waiting</div>
                      </div>
                    </div>
                    
                    <div style={{ fontSize: '72px', fontWeight: 800, color: 'white', letterSpacing: '-0.02em', marginTop: '8px', marginBottom: '16px', lineHeight: 1 }}>D-039</div>
                    
                    <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                      <div style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '16px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={12} color="rgba(255,255,255,0.7)" />
                        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: 'white' }}>04:12</span>
                          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)' }}>Elapsed</span>
                        </div>
                      </div>
                      <div style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '16px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={12} color="rgba(255,255,255,0.7)" />
                        <span style={{ fontSize: '12px', fontWeight: 500, color: 'white' }}>Dr. Smith</span>
                      </div>
                      <div style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '16px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 500, color: 'white' }}>Cardi...</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ backgroundColor: 'white', border: '1px solid #E8ECF1', borderRadius: '12px', padding: '16px' }}>
                      <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.05em', color: '#64748B', marginBottom: '12px' }}>ATTENDANCE ANALYTICS</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '24px', fontWeight: 700, color: '#16A34A', lineHeight: 1 }}>156</div>
                          <div style={{ fontSize: '10px', color: '#94A3B8', textTransform: 'uppercase', marginTop: '4px' }}>PRESENT</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '24px', fontWeight: 700, color: '#DC2626', lineHeight: 1 }}>12</div>
                          <div style={{ fontSize: '10px', color: '#94A3B8', textTransform: 'uppercase', marginTop: '4px' }}>ABSENT</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '24px', fontWeight: 700, color: '#2563EB', lineHeight: 1 }}>4</div>
                          <div style={{ fontSize: '10px', color: '#94A3B8', textTransform: 'uppercase', marginTop: '4px' }}>RECALL</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '24px', fontWeight: 700, color: '#1A2332', lineHeight: 1 }}>93%</div>
                          <div style={{ fontSize: '10px', color: '#94A3B8', textTransform: 'uppercase', marginTop: '4px' }}>RATE</div>
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
                      <div style={{ flex: 1, backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ fontSize: '10px', color: '#94A3B8', textTransform: 'uppercase' }}>WAITING PATIENTS</div>
                        <div style={{ fontSize: '28px', fontWeight: 700, color: '#1A2332', marginTop: '4px' }}>21</div>
                      </div>
                      <div style={{ flex: 1, backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ fontSize: '10px', color: '#94A3B8', textTransform: 'uppercase' }}>EST. WAIT TIME</div>
                        <div style={{ fontSize: '28px', fontWeight: 700, color: '#1A2332', marginTop: '4px' }}>
                          18 <span style={{ fontSize: '14px', fontWeight: 400 }}>mins</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: 'white', border: '1px solid #E8ECF1', borderRadius: '16px', padding: '24px' }}>
                <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', color: '#64748B', marginBottom: '16px' }}>PATIENT VISIT STATUS</div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ width: '120px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>
                      <span>New</span>
                      <span style={{ fontWeight: 600, color: '#1A2332' }}>70%</span>
                    </div>
                  </div>
                  <div style={{ flex: 1, height: '8px', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '70%', height: '100%', backgroundColor: '#00A693' }}></div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '12px' }}>
                  <div style={{ width: '120px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>
                      <span>Follow-up</span>
                      <span style={{ fontWeight: 600, color: '#1A2332' }}>30%</span>
                    </div>
                  </div>
                  <div style={{ flex: 1, height: '8px', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '30%', height: '100%', backgroundColor: '#2563EB' }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ flex: '1', minWidth: '320px', backgroundColor: 'white', border: '1px solid #E8ECF1', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={16} color="#00A693" />
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#1A2332' }}>Live Token Tracking</div>
              </div>

              <div style={{ marginTop: '16px', position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                  <Search size={16} color="#94A3B8" />
                </div>
                <input 
                  type="text" 
                  value={searchToken}
                  onChange={handleSearch}
                  placeholder="Enter token number (e.g., A-045)"
                  style={{ width: '100%', height: '40px', backgroundColor: 'white', border: '1px solid #E8ECF1', borderRadius: '10px', paddingLeft: '36px', fontSize: '13px', color: '#1A2332' }}
                />
              </div>

              {isSearching ? (
                <div style={{ marginTop: '48px', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>Searching...</div>
              ) : searchResult ? (
                <div style={{ marginTop: '24px', border: '1px solid #E8ECF1', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <div style={{ fontSize: '24px', fontWeight: 700, color: '#1A2332' }}>{searchResult.token}</div>
                      <div style={{ fontSize: '14px', color: '#64748B', marginTop: '4px' }}>{searchResult.patient} ({searchResult.age}y)</div>
                    </div>
                    <div style={{ backgroundColor: '#FEF3C7', color: '#D97706', padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>
                      {searchResult.status}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#64748B', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Type:</span> <span style={{ color: '#1A2332', fontWeight: 500 }}>{searchResult.type}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Doctor:</span> <span style={{ color: '#1A2332', fontWeight: 500 }}>{searchResult.doctor}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Est. Wait:</span> <span style={{ color: '#1A2332', fontWeight: 500 }}>{searchResult.waitTime}</span></div>
                  </div>
                  <button style={{ width: '100%', backgroundColor: '#F0FDF9', color: '#00A693', border: '1px solid #CCFBF1', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                    View Full Details
                  </button>
                </div>
              ) : (
                <div style={{ marginTop: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Search size={32} color="#CBD5E1" />
                  </div>
                  <div style={{ fontSize: '14px', color: '#94A3B8', marginTop: '16px', textAlign: 'center' }}>
                    Search for a token to view details.
                  </div>
                </div>
              )}
            </div>
            
          </div>
        </div>
      </div>

      {showRegistration && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 24, 36, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', width: '480px', margin: 'auto', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E8ECF1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#1A2332' }}>New Patient Registration</div>
              <X size={20} color="#64748B" cursor="pointer" onClick={() => setShowRegistration(false)} />
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '6px' }}>Patient Name</label>
                <input value={regName} onChange={e => setRegName(e.target.value)} type="text" style={{ width: '100%', border: '1px solid #E2E8F0', padding: '10px 12px', borderRadius: '8px', fontSize: '14px' }} placeholder="Enter full name" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '6px' }}>Age</label>
                <input value={regAge} onChange={e => setRegAge(e.target.value)} type="number" style={{ width: '100%', border: '1px solid #E2E8F0', padding: '10px 12px', borderRadius: '8px', fontSize: '14px' }} placeholder="e.g. 45" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '6px' }}>Patient Type</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['New Patient', 'Follow-up'].map(type => (
                    <button key={type} onClick={() => setRegType(type)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: type === regType ? '1px solid #00A693' : '1px solid #E2E8F0', backgroundColor: type === regType ? '#F0FDF9' : 'white', color: type === regType ? '#00A693' : '#64748B', fontWeight: 500, fontSize: '13px', cursor: 'pointer' }}>{type}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '6px' }}>Urgency Level</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {['Normal', 'Senior', 'Child', 'Pregnant', 'Critical'].map(urg => (
                    <button key={urg} onClick={() => setRegUrgency(urg)} style={{ padding: '6px 12px', borderRadius: '20px', border: urg === regUrgency ? '1px solid #00A693' : '1px solid #E2E8F0', backgroundColor: urg === regUrgency ? '#00A693' : 'white', color: urg === regUrgency ? 'white' : '#64748B', fontWeight: 500, fontSize: '12px', cursor: 'pointer' }}>{urg}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '6px' }}>Visit Mode</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['Walk-in', 'Appointed'].map(mode => (
                    <button key={mode} onClick={() => setRegAppointment(mode)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: mode === regAppointment ? '1px solid #00A693' : '1px solid #E2E8F0', backgroundColor: mode === regAppointment ? '#F0FDF9' : 'white', color: mode === regAppointment ? '#00A693' : '#64748B', fontWeight: 500, fontSize: '13px', cursor: 'pointer' }}>{mode}</button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #E8ECF1', display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowRegistration(false)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: 'white', color: '#64748B', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleGenerateToken} style={{ flex: 2, padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#00A693', color: 'white', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>Generate Token</button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', backgroundColor: 'white', border: '1px solid #E8ECF1', borderLeft: '4px solid #00A693', borderRadius: '8px', padding: '16px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', display: 'flex', alignItems: 'center', gap: '12px', zIndex: 1000, animation: 'slideIn 0.3s ease' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#F0FDF9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00A693' }}></div>
          </div>
          <div style={{ fontSize: '14px', fontWeight: 500, color: '#1A2332' }}>{toastMessage}</div>
        </div>
      )}

    </div>
  );
}
