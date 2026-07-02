"use client";
"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus } from 'lucide-react';
import Header from '@/components/receptionist/ReceptionHeader';
import BottomNav from './components/BottomNav';
import DoctorBoard from './components/DoctorBoard';
import QueueOverview from './components/QueueOverview';
import DoctorsView from './components/DoctorsView';
import PatientsView from './components/PatientsView';
import SettingsView from './components/SettingsView';
import PatientRegistrationModal from './components/Modals/PatientRegistrationModal';
import QueueActionModal from './components/Modals/QueueActionModal';
import MassDelayModal from './components/Modals/MassDelayModal';
import PaymentModal from './components/Modals/PaymentModal';
import PatientJourneyModal from './components/Modals/PatientJourneyModal';
import MobileBillingView from './components/MobileBillingView';

export default function ReceptionApp() {
  const [activeTab, setActiveTab] = useState('home');
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  
  // Modals state
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [journeyPatient, setJourneyPatient] = useState(null);
  const [paymentPatient, setPaymentPatient] = useState(null);
  const [delayedDoctor, setDelayedDoctor] = useState(null);
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleNotifyDelayed = (doctor) => {
    setDelayedDoctor(doctor);
  };

  const handleQueueAction = (patient) => {
    setSelectedPatient(patient);
  };

  return (
    <div className="max-w-md mx-auto relative min-h-screen bg-gray-50 shadow-2xl overflow-hidden font-sans">
      <Header onOpenSearch={() => setIsRegistrationOpen(true)} />
      
      <main className="px-5 -mt-14 relative z-20 h-[calc(100vh-160px)] overflow-y-auto hide-scrollbar pb-10">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <DoctorBoard onNotifyDelayed={handleNotifyDelayed} />
              <QueueOverview onActionClick={handleQueueAction} onCardClick={(p) => setJourneyPatient(p)} />
            </motion.div>
          )}
          {activeTab === 'queue' && (
            <motion.div
              key="queue"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <QueueOverview onActionClick={handleQueueAction} onCardClick={(p) => setJourneyPatient(p)} />
            </motion.div>
          )}
          {activeTab === 'doctors' && <DoctorsView key="doctors" />}
          {activeTab === 'billing' && <MobileBillingView key="billing" onOpenPayment={(p) => setPaymentPatient(p)} />}
          {activeTab === 'settings' && <SettingsView key="settings" isDarkMode={isDarkMode} toggleDarkMode={() => setIsDarkMode(!isDarkMode)} />}
        </AnimatePresence>
      </main>

      {/* Floating Action Button for Registration */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.5 }}
        onClick={() => setIsRegistrationOpen(true)}
        className="absolute bottom-24 right-6 w-14 h-14 bg-[#58D0A7] text-white rounded-2xl shadow-lg flex items-center justify-center hover:bg-[#3AB58F] transition-colors z-40"
      >
        <Plus size={28} />
      </motion.button>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Modals */}
      <PatientRegistrationModal 
        isOpen={isRegistrationOpen} 
        onClose={() => setIsRegistrationOpen(false)} 
      />
      
      <QueueActionModal 
        isOpen={!!selectedPatient} 
        onClose={() => setSelectedPatient(null)} 
        patient={selectedPatient}
        onOpenPayment={(p) => setPaymentPatient(p)}
      />

      <PatientJourneyModal 
        isOpen={!!journeyPatient}
        onClose={() => setJourneyPatient(null)}
        patient={journeyPatient}
      />
      
      <MassDelayModal 
        isOpen={!!delayedDoctor} 
        onClose={() => setDelayedDoctor(null)} 
        doctor={delayedDoctor}
      />

      <PaymentModal 
        isOpen={!!paymentPatient} 
        onClose={() => setPaymentPatient(null)} 
        patient={paymentPatient}
      />
    </div>
  );
}
