"use client";

import React from "react";
import { MoreHorizontal } from "lucide-react";

interface LiveQueueTrackerProps {
  currentToken?: number;
  userToken?: number;
}

export function LiveQueueTracker({ currentToken = 40, userToken = 53 }: LiveQueueTrackerProps) {
  const formatToken = (num: number) => num.toString().padStart(3, "0");

  return (
    <div className="bg-white dark:bg-[#1A2332] rounded-3xl shadow-sm border border-gray-100 dark:border-[#2A3A4E] p-3 w-full mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-bold text-gray-900 dark:text-[#F1F5F9] tracking-tight">Live Queue</h2>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>
        <div className="bg-teal-50 dark:bg-emerald-900/30 border border-teal-100 dark:border-emerald-700/30 rounded-xl px-3 py-1.5 flex flex-col items-center shadow-sm">
          <span className="text-[10px] text-teal-600 dark:text-emerald-400 font-bold uppercase tracking-wider mb-0.5">Arrive By</span>
          <span className="text-sm font-bold text-teal-900 dark:text-emerald-200 leading-none">
            {new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
          </span>
        </div>
      </div>

      {/* Horizontal Timeline (Non-Scrollable) */}
      <div className="relative flex items-start justify-between pb-2 px-1">
        
        {/* Connecting Dotted Line */}
        <div className="absolute left-[2.75rem] right-[2.75rem] top-[1.375rem] h-0 border-t-[3px] border-dotted border-gray-300 dark:border-[#2A3A4E] z-0"></div>
        
        {/* Current Token */}
        <div className="relative z-10 flex flex-col items-center bg-white dark:bg-[#1A2332] rounded-2xl">
          <span className="absolute -top-6 text-[11px] font-bold text-green-500 uppercase tracking-wider">
            Now
          </span>
          <div className="w-11 h-11 bg-green-50 dark:bg-green-950/30 border-[2px] border-green-400 text-green-600 dark:text-green-400 font-bold rounded-2xl flex items-center justify-center text-base mb-1 shadow-[0_0_15px_rgba(74,222,128,0.2)]">
            {formatToken(currentToken)}
          </div>
          <span className="text-[11px] text-green-600 dark:text-green-400 font-medium">Current</span>
        </div>

        {/* One Token Before Me */}
        <div className="relative z-10 flex flex-col items-center bg-white dark:bg-[#1A2332] rounded-2xl">
          <div className="w-11 h-11 bg-white dark:bg-[#223040] border-2 border-gray-400 dark:border-[#64748B] text-gray-700 dark:text-[#94A3B8] font-bold rounded-2xl flex items-center justify-center text-base mb-1">
            {formatToken(userToken - 1)}
          </div>
          <span className="text-[11px] text-gray-600 dark:text-[#94A3B8] font-medium">Upcoming</span>
        </div>

        {/* User's Token */}
        <div className="relative z-10 flex flex-col items-center bg-white dark:bg-[#1A2332] rounded-2xl">
          <span className="absolute -top-6 text-[11px] font-bold text-blue-600 capitalize">
            You
          </span>
          <div className="w-11 h-11 bg-blue-50 dark:bg-blue-950/30 border-[2px] border-blue-500 text-blue-600 dark:text-blue-400 font-bold rounded-2xl flex items-center justify-center text-base mb-1">
            {formatToken(userToken)}
          </div>
          <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium text-center leading-tight">
            Your<br/>Token
          </span>
        </div>
      </div>
    </div>
  );
}
