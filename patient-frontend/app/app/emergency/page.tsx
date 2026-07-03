"use client";

import { motion } from "motion/react";
import { Phone, Ambulance, MapPin, Users, AlertCircle, Heart } from "lucide-react";

export default function EmergencyAssistance() {
  const emergencyContacts = [
    { name: "Emergency Services", number: "108", type: "National Emergency" },
    { name: "Ambulance", number: "102", type: "Medical Emergency" },
  ];

  const nearbyHospitals: any[] = [];

  const cardCls =
    "bg-white dark:bg-[#1A2332] border border-gray-100 dark:border-[#2A3A4E] rounded-3xl shadow-sm dark:shadow-black/20";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B0F14] pb-6">
      {/* Header — red is intentional even in dark mode for emergency context */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 pt-12 pb-8 px-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center mb-4"
        >
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mr-4">
            <AlertCircle className="w-7 h-7 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Emergency</h1>
            <p className="text-white/80">Immediate assistance</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white/20 backdrop-blur-lg rounded-2xl p-4 border border-white/30"
        >
          <p className="text-white text-sm">
            <strong>Important:</strong> For life-threatening emergencies, call 108 immediately or go to the nearest emergency room.
          </p>
        </motion.div>
      </div>

      <div className="px-6 py-6">
        {/* Quick Emergency Actions */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`${cardCls} p-6 mb-6`}
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>

          <div className="grid grid-cols-2 gap-3">
            <button className="bg-red-50 dark:bg-red-500/10 border-2 border-red-200 dark:border-red-500/30 rounded-2xl p-5 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors">
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <p className="text-red-900 dark:text-red-300 font-semibold text-sm">Call Hospital</p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">Direct line</p>
            </button>

            <button className="bg-red-50 dark:bg-red-500/10 border-2 border-red-200 dark:border-red-500/30 rounded-2xl p-5 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors">
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Ambulance className="w-6 h-6 text-white" />
              </div>
              <p className="text-red-900 dark:text-red-300 font-semibold text-sm">Call Ambulance</p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">102 / 108</p>
            </button>

            <button className="bg-blue-50 dark:bg-blue-500/10 border-2 border-blue-200 dark:border-blue-500/30 rounded-2xl p-5 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <p className="text-blue-900 dark:text-blue-300 font-semibold text-sm">Share Location</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">GPS location</p>
            </button>

            <button className="bg-purple-50 dark:bg-purple-500/10 border-2 border-purple-200 dark:border-purple-500/30 rounded-2xl p-5 hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-colors">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-white" />
              </div>
              <p className="text-purple-900 dark:text-purple-300 font-semibold text-sm">Notify Contact</p>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Emergency person</p>
            </button>
          </div>
        </motion.div>

        {/* Emergency Contacts */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={`${cardCls} p-6 mb-6`}
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Emergency Contacts</h3>

          <div className="space-y-3">
            {emergencyContacts.map((contact, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#0F1722] border border-gray-100 dark:border-[#2A3A4E] rounded-2xl"
              >
                <div className="flex items-center flex-1">
                  <div className="w-10 h-10 bg-red-50 dark:bg-red-500/15 rounded-xl flex items-center justify-center mr-4">
                    <Phone className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-gray-900 dark:text-white font-medium">{contact.name}</p>
                    <p className="text-xs text-gray-500 dark:text-[#94A3B8]">{contact.type}</p>
                  </div>
                </div>
                <button className="bg-red-500 text-white px-6 py-2 rounded-xl font-medium hover:bg-red-600 transition-colors whitespace-nowrap">
                  {contact.number}
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Nearby Hospitals */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className={`${cardCls} p-6 mb-6`}
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Nearby Hospitals</h3>

          <div className="space-y-3">
            {nearbyHospitals.map((hospital, index) => (
              <div key={index} className="p-4 bg-gray-50 dark:bg-[#0F1722] border border-gray-100 dark:border-[#2A3A4E] rounded-2xl">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center mb-1 flex-wrap gap-2">
                      <h4 className="text-gray-900 dark:text-white font-medium">{hospital.name}</h4>
                      {hospital.emergency && (
                        <span className="px-2 py-0.5 bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400 text-xs rounded-full font-medium">
                          24/7 Emergency
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-[#94A3B8] mb-1">{hospital.address}</p>
                    <div className="flex items-center text-xs text-gray-500 dark:text-[#94A3B8]">
                      <MapPin className="w-3 h-3 mr-1" />
                      {hospital.distance} away
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button className="flex-1 bg-teal-500 dark:bg-emerald-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-teal-600 dark:hover:bg-emerald-500 transition-colors">
                    Get Directions
                  </button>
                  <button className="flex-1 border-2 border-gray-200 dark:border-[#2A3A4E] text-gray-700 dark:text-[#CBD5E1] py-2 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-[#223040] transition-colors">
                    Call Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Medical Info */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className={`${cardCls} p-6 mb-6`}
        >
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/15 rounded-xl flex items-center justify-center mr-3">
              <Heart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Your Medical Info</h3>
          </div>

          <div className="space-y-3 text-sm">
            {[
              ["Blood Type", "O+"],
              ["Allergies", "Penicillin"],
              ["Chronic Conditions", "None"],
              ["Emergency Contact", "Jane Doe"],
            ].map(([label, value], i, arr) => (
              <div key={label} className={`flex justify-between py-2 ${i < arr.length - 1 ? "border-b border-gray-100 dark:border-[#2A3A4E]" : ""}`}>
                <span className="text-gray-600 dark:text-[#94A3B8]">{label}</span>
                <span className="text-gray-900 dark:text-white font-medium">{value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Disclaimer */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-yellow-50 dark:bg-yellow-500/10 border-2 border-yellow-200 dark:border-yellow-500/30 rounded-2xl p-4"
        >
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-yellow-900 dark:text-yellow-300">
              This feature is for emergency assistance only. For non-urgent matters, please book a regular appointment or consult your doctor.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

