"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Bell, Shield, Globe, Moon, Building2, Smartphone, Activity } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useLayout } from "@/contexts/LayoutContext";
import { useRouter } from "next/navigation";

export default function Settings() {
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const { isMobileView, toggleMobileView } = useLayout();
  const [settings, setSettings] = useState({
    notifications: true,
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    language: "English",
    hospitalPreference: "government" as "government" | "private",
  });

  return (
    <div className="min-h-full bg-gray-50 dark:bg-[#0B0F14]">
      {/* Mobile Header */}
      <div className={`${isMobileView ? '' : 'lg:hidden'} bg-gradient-to-br from-teal-400 to-teal-500 dark:from-[#064E3B] dark:via-[#047857] dark:to-[#065F46] pt-12 pb-16 px-6 rounded-b-[40px]`}>
        <motion.h1
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-2xl font-semibold text-white mb-1"
        >
          Settings
        </motion.h1>
        <p className="text-white/80">Manage your preferences</p>
      </div>

      {/* Desktop Header */}
      <div className={`${isMobileView ? 'hidden' : 'hidden lg:block'} mb-6`}>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your preferences</p>
      </div>

      <div className={`px-6 -mt-8 pb-6 ${isMobileView ? '' : 'lg:mt-0 lg:px-0 lg:grid lg:grid-cols-2 lg:gap-6'}`}>
        {/* Notifications */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-[#1A2332] rounded-3xl shadow-lg dark:shadow-black/20 p-6 mb-6"
        >
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mr-3">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg text-gray-900 dark:text-white">Notifications</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-900 dark:text-white font-medium">All Notifications</p>
                <p className="text-sm text-gray-500">
                  Enable all notification types
                </p>
              </div>
              <button
                onClick={() =>
                  setSettings({
                    ...settings,
                    notifications: !settings.notifications,
                  })
                }
                className={`w-14 h-8 rounded-full transition-colors ${
                  settings.notifications ? "bg-teal-500 dark:bg-emerald-600" : "bg-gray-300"
                }`}
              >
                <div
                  className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                    settings.notifications ? "translate-x-7" : "translate-x-1"
                  }`}
                ></div>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-900 dark:text-white">Email Notifications</p>
                <p className="text-sm text-gray-500">Receive updates via email</p>
              </div>
              <button
                onClick={() =>
                  setSettings({
                    ...settings,
                    emailNotifications: !settings.emailNotifications,
                  })
                }
                className={`w-14 h-8 rounded-full transition-colors ${
                  settings.emailNotifications ? "bg-teal-500 dark:bg-emerald-600" : "bg-gray-300"
                }`}
              >
                <div
                  className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                    settings.emailNotifications ? "translate-x-7" : "translate-x-1"
                  }`}
                ></div>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-900 dark:text-white">SMS Notifications</p>
                <p className="text-sm text-gray-500">Receive SMS updates</p>
              </div>
              <button
                onClick={() =>
                  setSettings({
                    ...settings,
                    smsNotifications: !settings.smsNotifications,
                  })
                }
                className={`w-14 h-8 rounded-full transition-colors ${
                  settings.smsNotifications ? "bg-teal-500 dark:bg-emerald-600" : "bg-gray-300"
                }`}
              >
                <div
                  className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                    settings.smsNotifications ? "translate-x-7" : "translate-x-1"
                  }`}
                ></div>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-900 dark:text-white">Push Notifications</p>
                <p className="text-sm text-gray-500">Receive app notifications</p>
              </div>
              <button
                onClick={() =>
                  setSettings({
                    ...settings,
                    pushNotifications: !settings.pushNotifications,
                  })
                }
                className={`w-14 h-8 rounded-full transition-colors ${
                  settings.pushNotifications ? "bg-teal-500 dark:bg-emerald-600" : "bg-gray-300"
                }`}
              >
                <div
                  className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                    settings.pushNotifications ? "translate-x-7" : "translate-x-1"
                  }`}
                ></div>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Privacy */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-[#1A2332] rounded-3xl shadow-lg dark:shadow-black/20 p-6 mb-6"
        >
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mr-3">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-lg text-gray-900 dark:text-white">Privacy</h3>
          </div>

          <button className="w-full text-left py-3 border-b border-gray-100 dark:border-[#2A3A4E]">
            <p className="text-gray-900 dark:text-white font-medium">Data Sharing Preferences</p>
          </button>
          <button className="w-full text-left py-3 border-b border-gray-100 dark:border-[#2A3A4E]">
            <p className="text-gray-900 dark:text-white font-medium">Privacy Policy</p>
          </button>
          <button className="w-full text-left py-3">
            <p className="text-gray-900 dark:text-white font-medium">Terms of Service</p>
          </button>
        </motion.div>

        {/* Language */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="bg-white dark:bg-[#1A2332] rounded-3xl shadow-lg dark:shadow-black/20 p-6 mb-6"
        >
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mr-3">
              <Globe className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-lg text-gray-900 dark:text-white">Language</h3>
          </div>

          <select
            value={settings.language}
            onChange={(e) =>
              setSettings({ ...settings, language: e.target.value })
            }
            className="w-full bg-gray-50 dark:bg-[#223040] dark:text-white rounded-2xl px-4 py-3 outline-none border-2 border-transparent focus:border-teal-500 dark:focus:border-emerald-500 transition-colors"
          >
            <option value="English">English</option>
            <option value="Hindi">à¤¹à¤¿à¤‚à¤¦à¥€ (Hindi)</option>
            <option value="Tamil">à®¤à®®à®¿à®´à¯ (Tamil)</option>
            <option value="Telugu">à°¤à±†à°²à±à°—à± (Telugu)</option>
            <option value="Bengali">à¦¬à¦¾à¦‚à¦²à¦¾ (Bengali)</option>
          </select>
        </motion.div>

        {/* Appearance */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-[#1A2332] rounded-3xl shadow-lg dark:shadow-black/20 p-6 mb-6"
        >
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mr-3">
              <Moon className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="text-lg text-gray-900 dark:text-white">Appearance</h3>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-900 dark:text-white">Dark Mode</p>
              <p className="text-sm text-gray-500">Switch to dark theme</p>
            </div>
            <button
              onClick={toggleTheme}
              className={`w-14 h-8 rounded-full transition-colors ${
                isDark ? "bg-teal-500 dark:bg-emerald-500" : "bg-gray-300 dark:bg-[#2A3A4E]"
              }`}
            >
              <div
                className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                  isDark ? "translate-x-7" : "translate-x-1"
                }`}
              ></div>
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-900 dark:text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-gray-400" /> Mobile Layout Preview
              </p>
              <p className="text-sm text-gray-500">Force mobile app interface</p>
            </div>
            <button
              onClick={toggleMobileView}
              className={`w-14 h-8 rounded-full transition-colors ${
                isMobileView ? "bg-teal-500 dark:bg-emerald-600" : "bg-gray-300"
              }`}
            >
              <div
                className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                  isMobileView ? "translate-x-7" : "translate-x-1"
                }`}
              ></div>
            </button>
          </div>
        </motion.div>

        {/* Hospital Preference */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="bg-white dark:bg-[#1A2332] rounded-3xl shadow-lg dark:shadow-black/20 p-6 mb-6"
        >
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mr-3">
              <Building2 className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="text-lg text-gray-900 dark:text-white">Hospital Preference</h3>
          </div>

          <div className="flex bg-gray-100 dark:bg-[#223040] rounded-2xl p-1">
            <button
              onClick={() =>
                setSettings({ ...settings, hospitalPreference: "government" })
              }
              className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                settings.hospitalPreference === "government"
                  ? "bg-teal-500 dark:bg-emerald-500 text-white shadow-md"
                  : "text-gray-700 dark:text-[#94A3B8]"
              }`}
            >
              Government
            </button>
            <button
              onClick={() =>
                setSettings({ ...settings, hospitalPreference: "private" })
              }
              className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                settings.hospitalPreference === "private"
                  ? "bg-teal-500 dark:bg-emerald-500 text-white shadow-md"
                  : "text-gray-700 dark:text-[#94A3B8]"
              }`}
            >
              Private
            </button>
          </div>
        </motion.div>

        {/* Save Button */}
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="w-full bg-teal-500 dark:bg-emerald-600 text-white py-4 rounded-2xl font-medium shadow-lg dark:shadow-emerald-600/20"
        >
          Save Settings
        </motion.button>
      </div>
    </div>
  );
}

