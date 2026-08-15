"use client";

import React from "react";
import { Clock } from "lucide-react";

interface LiveQueueTrackerProps {
  tokens?: string[];
  userToken?: string;
  arriveByTime?: string;
}

export function LiveQueueTracker({ tokens = [], userToken, arriveByTime = "10:15 AM" }: LiveQueueTrackerProps) {
  // If userToken is not explicitly passed, infer from tokens if available
  const allTokens = tokens.length > 0 ? tokens : (userToken ? [userToken] : ["T-101"]);
  const userIdx = userToken ? allTokens.indexOf(userToken) : allTokens.length - 1;

  return (
    <div className="bg-white dark:bg-[#1A2332] rounded-3xl shadow-sm border border-gray-100 dark:border-[#2A3A4E] p-3.5 w-full mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-bold text-gray-900 dark:text-[#F1F5F9] tracking-tight">Live Queue</h2>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-[#94A3B8] font-medium">
            {allTokens.length} {allTokens.length === 1 ? 'patient' : 'patients'} in live queue
          </p>
        </div>
        <div className="bg-teal-50 dark:bg-emerald-900/30 border border-teal-100 dark:border-emerald-700/30 rounded-xl px-3 py-1.5 flex flex-col items-center shadow-sm">
          <span className="text-[10px] text-teal-600 dark:text-emerald-400 font-bold uppercase tracking-wider mb-0.5">Arrive By</span>
          <span className="text-sm font-bold text-teal-900 dark:text-emerald-200 leading-none">{arriveByTime}</span>
        </div>
      </div>

      {/* Horizontal Timeline (Scrollable for full queue) */}
      <div className="relative overflow-x-auto no-scrollbar py-2 px-1">
        <div className="flex items-center gap-6 min-w-max relative z-10 px-2">
          {allTokens.map((token, idx) => {
            const isServing = idx === 0;
            const isUser = userToken ? token === userToken : (userIdx !== -1 ? idx === userIdx : idx === allTokens.length - 1);
            const isAhead = userIdx !== -1 && idx < userIdx && !isServing;
            const isLater = userIdx !== -1 && idx > userIdx;

            if (isUser) {
              return (
                <div key={token + idx} className="relative z-10 flex flex-col items-center">
                  <span className="text-[10px] font-extrabold text-teal-600 dark:text-emerald-400 uppercase tracking-wider mb-1 bg-teal-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-teal-200 dark:border-emerald-700/40">
                    You
                  </span>
                  <div className="w-auto min-w-[3rem] px-3 h-11 bg-teal-500 dark:bg-emerald-600 text-white font-black rounded-2xl flex items-center justify-center text-sm shadow-[0_0_15px_rgba(20,184,166,0.35)]">
                    {token}
                  </div>
                  <span className="text-[11px] text-teal-600 dark:text-emerald-400 font-bold mt-1">Your Token</span>
                </div>
              );
            }

            if (isServing) {
              return (
                <div key={token + idx} className="relative z-10 flex flex-col items-center">
                  <span className="text-[10px] font-bold text-green-500 uppercase tracking-wider mb-1">
                    Serving
                  </span>
                  <div className="w-auto min-w-[2.75rem] px-2.5 h-11 bg-green-50 dark:bg-green-950/30 border-2 border-green-400 text-green-600 dark:text-green-400 font-bold rounded-2xl flex items-center justify-center text-sm shadow-[0_0_12px_rgba(74,222,128,0.2)]">
                    {token}
                  </div>
                  <span className="text-[11px] text-green-600 dark:text-green-400 font-medium mt-1">Now</span>
                </div>
              );
            }

            if (isAhead) {
              return (
                <div key={token + idx} className="relative z-10 flex flex-col items-center">
                  <span className="text-[10px] font-medium text-amber-500 uppercase tracking-wider mb-1">
                    Ahead
                  </span>
                  <div className="w-auto min-w-[2.75rem] px-2.5 h-11 bg-amber-50/60 dark:bg-amber-950/20 border-2 border-amber-300 dark:border-amber-700/50 text-amber-700 dark:text-amber-300 font-bold rounded-2xl flex items-center justify-center text-sm">
                    {token}
                  </div>
                  <span className="text-[11px] text-gray-500 dark:text-[#94A3B8] font-medium mt-1">Waiting</span>
                </div>
              );
            }

            return (
              <div key={token + idx} className="relative z-10 flex flex-col items-center opacity-85">
                <span className="text-[10px] font-medium text-gray-400 dark:text-[#64748B] uppercase tracking-wider mb-1">
                  Later
                </span>
                <div className="w-auto min-w-[2.75rem] px-2.5 h-11 bg-gray-50 dark:bg-[#223040] border-2 border-gray-200 dark:border-[#2A3A4E] text-gray-600 dark:text-[#94A3B8] font-bold rounded-2xl flex items-center justify-center text-sm">
                  {token}
                </div>
                <span className="text-[11px] text-gray-400 dark:text-[#64748B] font-medium mt-1">Scheduled</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
