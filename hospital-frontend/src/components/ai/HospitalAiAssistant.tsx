"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Sparkles,
  X,
  Send,
  User,
  CheckCircle2,
  Calendar,
  Clock,
  Search,
  Stethoscope,
  ChevronDown,
  Minimize2,
  Maximize2,
  FileText,
  Activity,
  Phone,
  Shield,
  Layers,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  AlertTriangle,
  Users,
  Copy,
  Check,
} from "lucide-react";
import { hospitalAiApi, StaffAiChatMessage } from "@/services/aiApi";

const STAFF_QUICK_ACTIONS = [
  { label: "🔍 Search UHID-1001", prompt: "Find patient record for UHID-1001" },
  { label: "📋 Records of Rahul Verma", prompt: "Show EHR records for patient Rahul Verma" },
  { label: "📝 Patient Intake & Visit Gap", prompt: "Show pre-consultation intake details and visit history for patient Rahul Verma" },
  { label: "📊 Live Queue Status", prompt: "What is the status of active appointments and OPD queue tokens right now?" },
  { label: "🩺 Doctor OPD Schedules", prompt: "Which doctors are on duty today and what are their room allocations?" },
  { label: "🧪 Pending Lab Reports", prompt: "Show pending lab reports awaiting doctor review" },
  { label: "📉 High-Risk Retention", prompt: "Show high-risk chronic patients and missed appointment alerts" },
  { label: "⚡ Walk-in for Cardiologist", prompt: "Book an OPD walk-in appointment with Cardiologist Dr. John Doe" },
];

export function HospitalAiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const [messages, setMessages] = useState<StaffAiChatMessage[]>([
    {
      role: "assistant",
      content:
        "👋 Welcome to **CareQ Staff & Doctor AI Copilot**.\n\nI am trained on our hospital records, EHR systems, live queue metrics, doctor schedules, and chronic care retention. How can I assist your workflow?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  // Speech-to-Text Setup
  const toggleListening = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Google Chrome or Edge.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-IN";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputMessage((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: StaffAiChatMessage = {
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const response = await hospitalAiApi.sendMessage(text, history);

      const botMsg: StaffAiChatMessage = {
        role: "assistant",
        content: response?.reply || "Processed request.",
        actionType: response?.actionType,
        actionData: response?.actionData,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMsg]);

      // Read speech aloud if enabled
      if (soundEnabled && typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const plainText = botMsg.content.replace(/[*#`_~]/g, "");
        const utterance = new SpeechSynthesisUtterance(plainText.slice(0, 250));
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.error("[HospitalAiAssistant] Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Encountered an issue processing that query. Please try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const renderFormattedText = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      if (line.startsWith("### ")) {
        return (
          <h4 key={idx} className="font-bold text-slate-900 dark:text-white text-sm mt-2 mb-1">
            {line.replace("### ", "")}
          </h4>
        );
      }
      if (line.startsWith("#### ")) {
        return (
          <h5 key={idx} className="font-semibold text-slate-800 dark:text-slate-200 text-xs mt-1.5 mb-0.5">
            {line.replace("#### ", "")}
          </h5>
        );
      }
      if (line.startsWith("> ")) {
        return (
          <div key={idx} className="p-2 my-1.5 rounded-lg bg-amber-500/10 border-l-4 border-amber-500 text-xs text-amber-800 dark:text-amber-300">
            {parseInlineFormatting(line.replace(/^>\s*/, ""))}
          </div>
        );
      }
      if (line.startsWith("* ") || line.startsWith("• ") || line.startsWith("- ")) {
        const content = line.replace(/^[\*\•\-]\s+/, "");
        return (
          <div key={idx} className="flex items-start gap-1.5 my-0.5 ml-1">
            <span className="text-teal-500 dark:text-teal-400 font-bold">•</span>
            <span className="text-xs">{parseInlineFormatting(content)}</span>
          </div>
        );
      }
      if (!line.trim()) {
        return <div key={idx} className="h-1" />;
      }
      return (
        <p key={idx} className="my-0.5 leading-relaxed text-xs">
          {parseInlineFormatting(line)}
        </p>
      );
    });
  };

  const parseInlineFormatting = (content: string) => {
    const parts = content.split(/(\*\*.*?\*\*|\`.*?\`)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold text-slate-900 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={i}
            className="px-1.5 py-0.5 bg-teal-500/10 text-teal-700 dark:text-teal-300 dark:bg-teal-500/15 rounded text-[11px] font-mono font-bold"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <>
      {/* ───────────────────────────────────────────────────────────── */}
      {/* Floating Staff Copilot Trigger Button */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-50 pointer-events-auto">
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setIsOpen((prev) => !prev)}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl shadow-xl transition-all duration-300 ${
            isOpen
              ? "bg-slate-800 text-white dark:bg-slate-700"
              : "bg-gradient-to-r from-teal-600 via-teal-700 to-cyan-700 text-white hover:shadow-teal-500/25 hover:shadow-2xl"
          }`}
          aria-label="Toggle Staff AI Copilot"
        >
          <div className="relative flex items-center justify-center">
            {isOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <div className="relative">
                <Bot className="w-5 h-5" />
                <Sparkles className="w-3 h-3 text-cyan-200 absolute -top-1 -right-1 animate-spin" style={{ animationDuration: "5s" }} />
              </div>
            )}
          </div>

          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-bold leading-tight flex items-center gap-1.5">
              Staff Copilot
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </span>
            <span className="text-[10px] text-teal-100/90 leading-tight">
              Hospital Records & OPD AI
            </span>
          </div>
        </motion.button>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* AI Copilot Drawer / Modal */}
      {/* ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 25, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 25, scale: 0.96 }}
            transition={{ type: "spring", damping: 26, stiffness: 360 }}
            className={`fixed bottom-20 right-4 sm:right-6 z-50 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.25)] overflow-hidden transition-all duration-300 ${
              isExpanded
                ? "w-[calc(100vw-32px)] sm:w-[580px] h-[84vh] max-h-[760px]"
                : "w-[calc(100vw-32px)] sm:w-[440px] h-[580px] max-h-[80vh]"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white border-b border-teal-500/20 select-none">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-teal-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-xs leading-tight text-white">CareQ Staff Copilot</h3>
                    <span className="px-1.5 py-0.2 bg-teal-500/30 text-teal-200 text-[9px] font-semibold rounded-full border border-teal-400/30">
                      EHR LINKED
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-300 leading-tight">
                    Clinical EMR, Queue Operations & Doctor Roster
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Voice Output Toggle */}
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition"
                  title={soundEnabled ? "Mute voice readout" : "Enable voice readout"}
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-teal-300" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
                </button>

                {/* Expand */}
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="hidden sm:block p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition"
                  title={isExpanded ? "Collapse" : "Expand"}
                >
                  {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>

                {/* Close */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/70 dark:bg-slate-950/80 scrollbar-thin">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`relative max-w-[90%] rounded-2xl p-3 text-xs shadow-xs group ${
                      msg.role === "user"
                        ? "bg-gradient-to-r from-teal-600 to-cyan-700 text-white rounded-tr-none"
                        : "bg-white dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700 rounded-tl-none shadow-xs"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <div className="flex items-center justify-between mb-1.5 text-teal-600 dark:text-teal-400 font-bold text-[11px]">
                        <div className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          <span>Copilot AI</span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(msg.content, i)}
                          className="opacity-0 group-hover:opacity-100 transition text-slate-400 hover:text-teal-500 p-0.5"
                          title="Copy text"
                        >
                          {copiedIndex === i ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    )}

                    <div className="space-y-1">{renderFormattedText(msg.content)}</div>

                    {/* Rich Action Card: Appointment Created */}
                    {msg.actionType === "APPOINTMENT_BOOKED" && msg.actionData && (
                      <div className="mt-2.5 p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 text-slate-900 dark:text-white">
                        <div className="flex items-center justify-between border-b border-teal-500/20 pb-1.5 mb-1.5">
                          <div className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400 font-bold text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Walk-in Token Confirmed
                          </div>
                          <span className="px-2 py-0.5 bg-teal-600 text-white font-mono font-bold rounded text-[10px]">
                            {msg.actionData.tokenCode}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                          <div>
                            <span className="text-slate-500 dark:text-slate-400 block text-[9px]">Doctor:</span>
                            <span className="font-semibold">{msg.actionData.doctorName}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 dark:text-slate-400 block text-[9px]">Department:</span>
                            <span className="font-semibold">{msg.actionData.department}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 dark:text-slate-400 block text-[9px]">Date & Time:</span>
                            <span className="font-semibold">{msg.actionData.appointmentDate} • {msg.actionData.timeSlot}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 dark:text-slate-400 block text-[9px]">Queue Position:</span>
                            <span className="font-semibold text-teal-600 dark:text-teal-400">
                              #{msg.actionData.queuePosition} (~{msg.actionData.estimatedWaitTime}m)
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div
                      className={`text-[9px] mt-1 text-right opacity-60 ${
                        msg.role === "user" ? "text-teal-100" : "text-slate-400"
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs bg-white dark:bg-slate-800 p-2.5 rounded-xl rounded-tl-none w-fit border border-slate-200 dark:border-slate-700 shadow-xs">
                  <Bot className="w-3.5 h-3.5 text-teal-500 animate-spin" />
                  <span className="text-[11px] font-medium">Scanning Hospital Records...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Staff Action Chips */}
            <div className="px-3 py-2 bg-slate-100/90 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-none flex gap-1.5">
              {STAFF_QUICK_ACTIONS.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(action.prompt)}
                  disabled={isLoading}
                  className="shrink-0 text-[11px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-teal-500 dark:hover:border-teal-400 hover:text-teal-600 dark:hover:text-teal-300 transition font-medium whitespace-nowrap shadow-2xs"
                >
                  {action.label}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-2xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-teal-500 transition">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask UHID, queue load, doctor schedule, lab reports..."
                  disabled={isLoading}
                  className="flex-1 bg-transparent text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
                />

                {/* Voice Input Button */}
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-1.5 rounded-lg transition ${
                    isListening
                      ? "bg-rose-500 text-white animate-pulse"
                      : "text-slate-400 hover:text-teal-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                  title={isListening ? "Listening... click to stop" : "Voice input"}
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                </button>

                {/* Send Button */}
                <button
                  onClick={() => handleSend()}
                  disabled={!inputMessage.trim() || isLoading}
                  className={`p-1.5 rounded-xl transition ${
                    inputMessage.trim() && !isLoading
                      ? "bg-gradient-to-r from-teal-600 to-cyan-700 text-white shadow-xs hover:scale-105"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
                  }`}
                  aria-label="Send"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
