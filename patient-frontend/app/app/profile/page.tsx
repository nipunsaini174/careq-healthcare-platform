"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  User,
  Phone,
  Mail,
  CreditCard,
  Settings,
  Shield,
  Bell,
  HelpCircle,
  LogOut,
  ChevronRight,
  Edit,
  X,
  Activity,
} from "lucide-react";
import { patientApi, type ApiAppointment } from "../../../services/api/patientApi";
import { useLayout } from "@/contexts/LayoutContext";
import { usePeople } from "@/hooks/usePeople";
import { getPersonByName } from "@/lib/people";
import { PeopleFilterBar, ALL_PEOPLE } from "@/components/people/PeopleFilterBar";

export default function Profile() {
  const router = useRouter();
  const { isMobileView } = useLayout();
  const { people } = usePeople();
  const [appointments, setAppointments] = useState<ApiAppointment[]>([]);
  const [showAllAppointments, setShowAllAppointments] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState<string>(ALL_PEOPLE);

  const [profileData, setProfileData] = useState({
    name: "",
    phone: "",
    email: "",
    abhaId: "",
    dob: "",
  });
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingSecurity, setIsEditingSecurity] = useState(false);
  const [tempProfileData, setTempProfileData] = useState(profileData);
  const [passwordData, setPasswordData] = useState({ current: "", new: "", confirm: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [rebookApt, setRebookApt] = useState<any | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const patientData = await patientApi.getProfile();
        const formattedData = {
          name: patientData.full_name || "Unknown",
          phone: patientData.phone || "",
          email: patientData.email || "",
          abhaId: patientData.abha_id || "",
          dob: patientData.dob ? patientData.dob.split("T")[0] : "",
        };
        setProfileData(formattedData);
        setTempProfileData(formattedData);
      } catch (error) {
        console.error("Failed to fetch profile", error);
        // Fallback or handle error silently
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();

    let cancelled = false;
    (async () => {
      try {
        const list = await patientApi.getAppointments();
        if (!cancelled) setAppointments(list);
      } catch (_e) {
        if (!cancelled) setAppointments([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const saveProfile = async () => {
    try {
      await patientApi.updateProfile({
        full_name: tempProfileData.name,
        phone: tempProfileData.phone,
        email: tempProfileData.email,
        dob: tempProfileData.dob,
        abha_id: tempProfileData.abhaId,
      });
      setProfileData(tempProfileData);
      setIsEditingProfile(false);
    } catch (error) {
      console.error("Failed to save profile", error);
      alert("Failed to update profile.");
    }
  };

  const saveSecurity = () => {
    if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
      alert("Please fill all fields");
      return;
    }
    if (passwordData.new !== passwordData.confirm) {
      alert("Passwords do not match!");
      return;
    }
    alert("Password updated successfully!");
    setIsEditingSecurity(false);
    setPasswordData({ current: "", new: "", confirm: "" });
  };

  const handleRebook = async () => {
    if (!rebookApt) return;
    try {
      // Real booking via backend — same endpoint as the booking flow.
      const newApt: any = await patientApi.bookAppointment({
        doctorId: rebookApt.doctorId,
        department: rebookApt.department,
        bookingType: rebookApt.bookingType || "self",
        patientName: rebookApt.patientName,
        relationship: rebookApt.relationship,
      });
      // Re-fetch authoritative list so the rebooked appointment shows up.
      const refreshed = await patientApi.getAppointments();
      setAppointments(refreshed);
      setRebookApt(null);
      const newToken = newApt?.appointment_id ? `T-${String(newApt.appointment_id)}` : "your new token";
      alert(`Successfully rebooked! Your new token is ${newToken}.`);
    } catch (e) {
      console.error("Rebook failed", e);
      alert("Could not rebook. Please try again.");
    }
  };

  const resolvePersonId = (apt: any): string => {
    if (apt.personId) return apt.personId;
    if (apt.relationship === "Self" || apt.bookingType === "self") return "self";
    return getPersonByName(apt.patientName)?.id || "";
  };

  const filteredAppointments = useMemo(() => {
    if (selectedPersonId === ALL_PEOPLE) return appointments;
    return appointments.filter((apt) => resolvePersonId(apt) === selectedPersonId);
  }, [appointments, selectedPersonId]);

  const displayedAppointments = showAllAppointments ? filteredAppointments : filteredAppointments.slice(0, 2);

  const menuItems = [
    {
      icon: Edit,
      label: "Edit Profile",
      action: () => {
        setTempProfileData(profileData);
        setIsEditingProfile(true);
      },
      color: "blue",
    },
    {
      icon: Settings,
      label: "Settings",
      action: () => router.push("/app/settings"),
      color: "purple",
    },
    {
      icon: Shield,
      label: "Security",
      action: () => setIsEditingSecurity(true),
      color: "green",
    },
    {
      icon: Bell,
      label: "Notifications",
      action: () => router.push("/app/notifications"),
      color: "orange",
    },
    {
      icon: HelpCircle,
      label: "Help & Support",
      action: () => router.push("/app/help"),
      color: "blue",
    },
  ];

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString('en-US', options);
  };

  return (
    <div className="min-h-full bg-gray-50 dark:bg-[#0B0F14] relative">
      {/* Mobile Header */}
      <div className={`${isMobileView ? '' : 'lg:hidden'} bg-gradient-to-br from-teal-400 to-teal-500 dark:from-[#064E3B] dark:via-[#047857] dark:to-[#065F46] pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-16 px-6 rounded-b-[40px]`}>
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex flex-col items-center"
        >
          {/* Profile Photo */}
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-4xl mb-4 shadow-lg">
            👤
          </div>
          <h1 className="text-2xl text-white mb-1">{profileData.name}</h1>
          <p className="text-white/80 mb-4">Patient ID: PAT-2024-6789</p>

          {/* Quick Stats */}
          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-2xl text-white font-medium">12</p>
              <p className="text-white/70 text-xs">Appointments</p>
            </div>
            <div className="w-px bg-white/30"></div>
            <div className="text-center">
              <p className="text-2xl text-white font-medium">24</p>
              <p className="text-white/70 text-xs">Reports</p>
            </div>
            <div className="w-px bg-white/30"></div>
            <div className="text-center">
              <p className="text-2xl text-white font-medium">8</p>
              <p className="text-white/70 text-xs">Prescriptions</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Desktop Header */}
      <div className={`${isMobileView ? 'hidden' : 'hidden lg:block'} mb-6`}>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your personal information</p>
      </div>

      <div className={`px-6 mt-6 pb-6 ${isMobileView ? '' : 'lg:mt-0 lg:px-0'}`}>


        {/* Personal Information */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-[#1A2332] rounded-3xl shadow-lg p-6 mb-6"
        >
          <h3 className="text-lg text-gray-900 dark:text-white mb-4">Personal Information</h3>

          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mr-4">
                <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-[#94A3B8]">Phone Number</p>
                <p className="text-gray-900 dark:text-white">{profileData.phone}</p>
              </div>
            </div>

            <div className="flex items-center">
              <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center mr-4">
                <Mail className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-[#94A3B8]">Email</p>
                <p className="text-gray-900 dark:text-white">{profileData.email}</p>
              </div>
            </div>

            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center mr-4">
                <CreditCard className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-[#94A3B8]">ABHA ID</p>
                <p className="text-gray-900 dark:text-white">{profileData.abhaId}</p>
              </div>
            </div>

            <div className="flex items-center">
              <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-xl flex items-center justify-center mr-4">
                <User className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-[#94A3B8]">Date of Birth</p>
                <p className="text-gray-900 dark:text-white">{formatDate(profileData.dob)}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Appointment History */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="bg-white dark:bg-[#1A2332] rounded-3xl shadow-lg p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg text-gray-900 dark:text-white">Appointment History</h3>
            {filteredAppointments.length > 2 && (
              <button 
                onClick={() => setShowAllAppointments(!showAllAppointments)}
                className="text-sm text-teal-500 dark:text-emerald-400 font-medium transition-colors hover:text-[#0f766e]"
              >
                {showAllAppointments ? "View Less" : "View All"}
              </button>
            )}
          </div>

          {/* People Filter */}
          <div className="mb-4 -mx-2 px-2">
            <PeopleFilterBar
              people={people}
              selectedId={selectedPersonId}
              onSelect={setSelectedPersonId}
              className="pt-1"
            />
          </div>

          <div className="space-y-4">
            {displayedAppointments.length === 0 && (
              <p className="text-center text-gray-500 dark:text-[#94A3B8] py-6 text-sm">
                No appointments for this person.
              </p>
            )}
            {displayedAppointments.map((apt: any) => (
              <div key={apt.id} className="border border-gray-100 dark:border-[#2A3A4E] rounded-2xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{apt.doctorName}</h4>
                    <p className="text-xs text-gray-500 dark:text-[#94A3B8]">{apt.department}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${apt.status === "Completed" ? "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400" : "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"}`}>
                      {apt.status}
                    </span>
                    {apt.status === "Completed" && (
                      <button 
                        onClick={() => setRebookApt(apt)}
                        className="px-3 py-1 text-[10px] uppercase tracking-wider rounded-full font-bold bg-white dark:bg-[#223040] text-teal-500 dark:text-emerald-400 border border-teal-500/30 hover:bg-teal-500 dark:bg-emerald-600 hover:text-white transition-all shadow-sm"
                      >
                        Rebook Follow-up
                      </button>
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-[#223040] rounded-xl p-3 mt-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500 dark:text-[#94A3B8]">Patient:</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {apt.patientName}
                      {apt.relationship && (
                        <span className="text-gray-500 text-xs"> ({apt.relationship})</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-[#94A3B8]">Date:</span>
                    <span className="text-gray-900 dark:text-white">{apt.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Menu Items */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-[#1A2332] rounded-3xl shadow-lg overflow-hidden mb-6"
        >
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const colorClasses = {
              blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
              purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
              green: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
              orange: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
            }[item.color as "blue" | "purple" | "green" | "orange"];

            return (
              <button
                key={index}
                onClick={item.action}
                className={`w-full flex items-center justify-between p-4 ${
                  index !== menuItems.length - 1 ? "border-b border-gray-100 dark:border-[#2A3A4E]" : ""
                } hover:bg-gray-50 dark:hover:bg-[#223040] transition-colors`}
              >
                <div className="flex items-center">
                  <div
                    className={`w-10 h-10 ${colorClasses} rounded-xl flex items-center justify-center mr-4`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-gray-900 dark:text-white">{item.label}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            );
          })}
        </motion.div>

        {/* Logout Button */}
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          onClick={() => router.push("/")}
          className="w-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 py-4 rounded-2xl font-medium flex items-center justify-center"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Logout
        </motion.button>
      </div>

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-[#1A2332] rounded-3xl w-full max-w-md p-6 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-medium text-gray-900 dark:text-white">Edit Profile</h3>
              <button onClick={() => setIsEditingProfile(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-[#223040] rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500 dark:text-[#94A3B8]" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-[#94A3B8] mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={tempProfileData.name} 
                  onChange={(e) => setTempProfileData({...tempProfileData, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#2A3A4E] bg-white dark:bg-[#1A2332] focus:ring-2 focus:ring-[#10B981] outline-none transition-all dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-[#94A3B8] mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  value={tempProfileData.phone} 
                  onChange={(e) => setTempProfileData({...tempProfileData, phone: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#2A3A4E] bg-white dark:bg-[#1A2332] focus:ring-2 focus:ring-[#10B981] outline-none transition-all dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-[#94A3B8] mb-1">Email</label>
                <input 
                  type="email" 
                  value={tempProfileData.email} 
                  onChange={(e) => setTempProfileData({...tempProfileData, email: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#2A3A4E] bg-white dark:bg-[#1A2332] focus:ring-2 focus:ring-[#10B981] outline-none transition-all dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-[#94A3B8] mb-1">ABHA ID</label>
                <input 
                  type="text" 
                  value={tempProfileData.abhaId} 
                  onChange={(e) => setTempProfileData({...tempProfileData, abhaId: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#2A3A4E] bg-white dark:bg-[#1A2332] focus:ring-2 focus:ring-[#10B981] outline-none transition-all dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-[#94A3B8] mb-1">Date of Birth</label>
                <input 
                  type="date" 
                  value={tempProfileData.dob} 
                  onChange={(e) => setTempProfileData({...tempProfileData, dob: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#2A3A4E] bg-white dark:bg-[#1A2332] focus:ring-2 focus:ring-[#10B981] outline-none transition-all dark:text-white"
                />
              </div>
            </div>
            
            <button 
              onClick={saveProfile} 
              className="w-full mt-6 bg-teal-500 dark:bg-emerald-600 text-white py-4 rounded-xl font-medium shadow-lg hover:bg-[#46bd96] transition-colors"
            >
              Save Changes
            </button>
          </motion.div>
        </div>
      )}

      {/* Security Modal */}
      {isEditingSecurity && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-[#1A2332] rounded-3xl w-full max-w-md p-6 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-medium text-gray-900 dark:text-white">Security Settings</h3>
              <button onClick={() => setIsEditingSecurity(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-[#223040] rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500 dark:text-[#94A3B8]" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-[#94A3B8] mb-1">Current Password</label>
                <input 
                  type="password" 
                  value={passwordData.current} 
                  onChange={(e) => setPasswordData({...passwordData, current: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#2A3A4E] bg-white dark:bg-[#1A2332] focus:ring-2 focus:ring-[#10B981] outline-none transition-all dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-[#94A3B8] mb-1">New Password</label>
                <input 
                  type="password" 
                  value={passwordData.new} 
                  onChange={(e) => setPasswordData({...passwordData, new: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#2A3A4E] bg-white dark:bg-[#1A2332] focus:ring-2 focus:ring-[#10B981] outline-none transition-all dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-[#94A3B8] mb-1">Confirm New Password</label>
                <input 
                  type="password" 
                  value={passwordData.confirm} 
                  onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#2A3A4E] bg-white dark:bg-[#1A2332] focus:ring-2 focus:ring-[#10B981] outline-none transition-all dark:text-white"
                />
              </div>
            </div>
            
            <button 
              onClick={saveSecurity} 
              className="w-full mt-6 bg-teal-500 dark:bg-emerald-600 text-white py-4 rounded-xl font-medium shadow-lg hover:bg-[#46bd96] transition-colors"
            >
              Update Password
            </button>
          </motion.div>
        </div>
      )}

      {/* Rebook Modal */}
      {rebookApt && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-[#1A2332] rounded-3xl w-full max-w-md p-6 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-medium text-gray-900 dark:text-white">Rebook Appointment</h3>
              <button onClick={() => setRebookApt(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-[#223040] rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500 dark:text-[#94A3B8]" />
              </button>
            </div>
            
            <div className="bg-gray-50 dark:bg-[#223040] rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-500 dark:text-[#94A3B8] mb-1">Hospital</p>
              <p className="font-medium text-gray-900 dark:text-white mb-3">Apollo Hospitals</p>
              
              <p className="text-sm text-gray-500 dark:text-[#94A3B8] mb-1">Doctor</p>
              <p className="font-medium text-gray-900 dark:text-white mb-3">{rebookApt.doctorName}</p>
              
              <p className="text-sm text-gray-500 dark:text-[#94A3B8] mb-1">Department</p>
              <p className="font-medium text-gray-900 dark:text-white">{rebookApt.department}</p>
            </div>

            <p className="text-center text-gray-700 dark:text-[#94A3B8] mb-6">Do you want to re-appoint?</p>
            
            <div className="flex gap-4">
              <button 
                onClick={() => setRebookApt(null)} 
                className="flex-1 py-3 rounded-xl font-medium border border-gray-200 dark:border-[#2A3A4E] text-gray-700 dark:text-[#94A3B8] hover:bg-gray-50 dark:hover:bg-[#223040] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleRebook} 
                className="flex-1 bg-teal-500 dark:bg-emerald-600 text-white py-3 rounded-xl font-medium shadow-lg hover:bg-teal-600 transition-colors"
              >
                Yes, Rebook
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
