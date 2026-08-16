"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import {
  Bot,
  Sparkles,
  X,
  Send,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Stethoscope,
  ChevronDown,
  Minimize2,
  Maximize2,
  FileText,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Phone,
  AlertTriangle,
  Copy,
  Check,
  ShieldCheck,
  Building2,
  Pill,
} from "lucide-react";
import { aiApi, AiChatMessage } from "@/services/api/aiApi";

interface CategoryQuickAction {
  category: string;
  actions: { label: string; prompt: string }[];
}

const CATEGORIZED_ACTIONS: CategoryQuickAction[] = [
  {
    category: "⚡ Quick Help",
    actions: [
      { label: "🎫 My Live Token & Queue", prompt: "What is my current queue position, token number, and estimated wait time?" },
      { label: "📅 Kitne dino se aya hu?", prompt: "Main hospital kitne dino baad ya kab aaya hu? Meri visit history aur booking intake details batao." },
      { label: "📝 Form me kya details bhari?", prompt: "Maine appointment form me kya symptoms aur medical details bhari thi? Show my case summary." },
      { label: "⚡ Book with Cardiologist", prompt: "Book an appointment with Cardiologist Dr. John Doe" },
      { label: "🩺 Doctor OPD Timings", prompt: "Which doctors are available today and what are their OPD timings?" },
    ],
  },
  {
    category: "📋 Visit History & Intake",
    actions: [
      { label: "📅 Last Visit Gap (Days)", prompt: "Main kitne dino se hospital nahi aaya ya meri aakhri visit kab thi?" },
      { label: "📝 My Intake Case Summary", prompt: "Maine appointment booking me kya details aur symptoms bhare the?" },
      { label: "💊 Medications & Allergies", prompt: "What ongoing medications, medical history and allergies did I submit?" },
    ],
  },
  {
    category: "🩺 Symptoms & Triage",
    actions: [
      { label: "🚨 Chest Discomfort", prompt: "I am feeling chest heaviness and sweating, what should I do?" },
      { label: "🤕 Severe Headache & Dizzy", prompt: "I have a severe migraine and dizziness for 2 days, which doctor should I see?" },
      { label: "🦵 Knee & Joint Pain", prompt: "I have knee pain when climbing stairs, which department should I consult?" },
      { label: "👶 Child Fever & Cough", prompt: "My child has fever and cough, what is the guidance?" },
      { label: "🤢 Acidity & Stomach Ache", prompt: "I have stomach pain and severe acidity, who should I consult?" },
    ],
  },
  {
    category: "🧪 Lab & Diagnostics",
    actions: [
      { label: "🩸 Fasting for Blood Sugar", prompt: "Do I need to fast for blood sugar and lipid profile test?" },
      { label: "🩺 Ultrasound Guidelines", prompt: "What are the preparation guidelines for an ultrasound abdomen test?" },
      { label: "🩻 MRI / CT Scan Instructions", prompt: "What should I know before my CT scan or MRI?" },
      { label: "📄 Download My Lab Reports", prompt: "Where can I view and download my lab test reports?" },
    ],
  },
  {
    category: "💳 Ayushman & Insurance",
    actions: [
      { label: "🌟 Ayushman Bharat (PM-JAY)", prompt: "Do you accept Ayushman Bharat card and how does free treatment work?" },
      { label: "🛡️ Cashless Mediclaim / TPA", prompt: "How do I claim cashless insurance for hospital admission?" },
      { label: "💵 OPD Fees & Payment Modes", prompt: "What are the OPD consultation fees and payment options accepted?" },
    ],
  },
  {
    category: "🏥 Hospital Facilities",
    actions: [
      { label: "🕒 OPD & Visiting Hours", prompt: "What are the hospital OPD timings and inpatient visiting hours?" },
      { label: "🚨 24x7 Emergency Contact", prompt: "What is the 24x7 emergency and ambulance helpline number?" },
      { label: "💊 24x7 Pharmacy Location", prompt: "Where is the 24x7 hospital pharmacy located?" },
    ],
  },
  {
    category: "💊 Medicines & Rx",
    actions: [
      { label: "📖 Decode Prescription (TDS/PC)", prompt: "What do doctor abbreviations OD, BD, TDS, AC, and PC mean?" },
      { label: "🌿 Treatment Journey Score", prompt: "Show my chronic care treatment journey and adherence score" },
    ],
  },
];

export function PatientAiAssistant() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("⚡ Quick Help");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      role: "assistant",
      content:
        "👋 Hello! I am **CareQ AI**, your intelligent hospital queue & healthcare assistant. 🏥\n\nI can help you check live queue status, book appointments, decode prescriptions, check lab test guidelines, explain Ayushman Bharat insurance, and recommend specialists. How can I help you today?",
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

  // Web Speech API: Voice-to-Text
  const toggleListening = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice recognition is not supported on this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-IN"; // Supports English and Indian accents
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

    const userMsg: AiChatMessage = {
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const response = await aiApi.sendMessage(text, history);

      const botMsg: AiChatMessage = {
        role: "assistant",
        content: response?.reply || "I've processed your request.",
        actionType: response?.actionType,
        actionData: response?.actionData,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMsg]);

      // Soft audio feedback & Text-to-speech if enabled
      if (soundEnabled && typeof window !== "undefined") {
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(587.33, ctx.currentTime);
          gain.gain.setValueAtTime(0.04, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.25);
        } catch {
          // ignore audio failure
        }
      }
    } catch (err) {
      console.error("[PatientAiAssistant] Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I had trouble processing that. Please try asking again!",
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

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Text-to-speech for specific message
  const speakMessage = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#`_~]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const renderFormattedText = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      // Header 3
      if (line.startsWith("### ")) {
        return (
          <h4 key={idx} className="font-bold text-gray-900 dark:text-white text-base mt-2 mb-1">
            {line.replace("### ", "")}
          </h4>
        );
      }
      // Header 4
      if (line.startsWith("#### ")) {
        return (
          <h5 key={idx} className="font-semibold text-gray-800 dark:text-gray-200 text-sm mt-1.5 mb-0.5">
            {line.replace("#### ", "")}
          </h5>
        );
      }
      // Alerts & Quotes
      if (line.startsWith("> ")) {
        return (
          <div key={idx} className="p-2.5 my-1.5 rounded-xl bg-amber-500/10 border-l-4 border-amber-500 text-xs text-amber-900 dark:text-amber-300 font-medium">
            {parseInlineFormatting(line.replace(/^>\s*/, ""))}
          </div>
        );
      }
      // Bullet points
      if (line.startsWith("* ") || line.startsWith("• ") || line.startsWith("- ")) {
        const content = line.replace(/^[\*\•\-]\s+/, "");
        return (
          <div key={idx} className="flex items-start gap-1.5 my-0.5 ml-1">
            <span className="text-teal-500 dark:text-emerald-400 font-bold">•</span>
            <span>{parseInlineFormatting(content)}</span>
          </div>
        );
      }
      // Empty line
      if (!line.trim()) {
        return <div key={idx} className="h-1.5" />;
      }
      // Regular line
      return (
        <p key={idx} className="my-0.5 leading-relaxed">
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
          <strong key={i} className="font-semibold text-gray-900 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={i}
            className="px-1.5 py-0.5 bg-teal-500/10 text-teal-600 dark:text-emerald-400 dark:bg-emerald-500/15 rounded text-xs font-mono font-bold"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  const currentCategoryActions =
    CATEGORIZED_ACTIONS.find((c) => c.category === selectedCategory)?.actions ||
    CATEGORIZED_ACTIONS[0].actions;

  return (
    <>
      {/* ───────────────────────────────────────────────────────────── */}
      {/* Floating AI Trigger Button */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="fixed bottom-20 right-4 lg:bottom-8 lg:right-8 z-50 pointer-events-auto">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setIsOpen((prev) => !prev)}
          className={`relative flex items-center gap-2.5 px-4 py-3 rounded-full shadow-[0_10px_30px_rgba(20,184,166,0.35)] transition-all duration-300 ${
            isOpen
              ? "bg-gray-800 text-white dark:bg-gray-700"
              : "bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-600 text-white"
          }`}
          aria-label="Open CareQ AI Assistant"
        >
          {!isOpen && (
            <span className="absolute -inset-1 rounded-full bg-teal-400/40 animate-ping pointer-events-none" />
          )}

          <div className="relative flex items-center justify-center">
            {isOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <div className="relative">
                <Bot className="w-6 h-6 animate-pulse" />
                <Sparkles className="w-3.5 h-3.5 text-amber-300 absolute -top-1.5 -right-1.5 animate-spin" style={{ animationDuration: "6s" }} />
              </div>
            )}
          </div>

          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-bold leading-tight flex items-center gap-1">
              CareQ AI
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
            </span>
            <span className="text-[10px] text-teal-100 opacity-90 leading-tight">
              Hospital & Queue AI
            </span>
          </div>
        </motion.button>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* AI Assistant Chat Modal / Drawer */}
      {/* ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className={`fixed bottom-24 right-3 sm:right-6 lg:bottom-24 lg:right-8 z-50 flex flex-col bg-white dark:bg-[#111820] border border-gray-200 dark:border-[#2A3A4E] rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.25)] overflow-hidden transition-all duration-300 ${
              isExpanded
                ? "w-[calc(100vw-24px)] sm:w-[560px] h-[84vh] max-h-[760px]"
                : "w-[calc(100vw-24px)] sm:w-[430px] h-[580px] max-h-[80vh]"
            }`}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-700 text-white select-none">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-md">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm leading-tight text-white">CareQ AI</h3>
                    <span className="px-1.5 py-0.2 bg-emerald-400/25 text-emerald-200 text-[10px] font-semibold rounded-full border border-emerald-300/30">
                      LIVE
                    </span>
                  </div>
                  <p className="text-[11px] text-teal-100 opacity-90 leading-tight">
                    Smart Queue, Booking & Hospital Copilot
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Sound Toggle */}
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="p-1.5 rounded-lg hover:bg-white/15 text-white/80 hover:text-white transition"
                  title={soundEnabled ? "Mute audio" : "Unmute audio"}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-white/50" />}
                </button>

                {/* Expand / Minimize */}
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="hidden sm:block p-1.5 rounded-lg hover:bg-white/15 text-white/80 hover:text-white transition"
                  title={isExpanded ? "Collapse" : "Expand"}
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>

                {/* Close */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/15 text-white/80 hover:text-white transition"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-gray-50/60 dark:bg-[#0B0F14]/70 scrollbar-thin">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`relative max-w-[88%] rounded-2xl p-3.5 text-sm shadow-xs group ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-tr-none"
                        : "bg-white dark:bg-[#1A2332] text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-[#2A3A4E] rounded-tl-none shadow-xs"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <div className="flex items-center justify-between mb-1.5 text-teal-600 dark:text-emerald-400 font-semibold text-xs">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>CareQ AI</span>
                        </div>
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition">
                          <button
                            onClick={() => speakMessage(msg.content)}
                            className="text-gray-400 hover:text-teal-500 p-0.5"
                            title="Read aloud"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => copyToClipboard(msg.content, i)}
                            className="text-gray-400 hover:text-teal-500 p-0.5"
                            title="Copy reply"
                          >
                            {copiedIndex === i ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="text-sm space-y-1">{renderFormattedText(msg.content)}</div>

                    {/* Rich Action Card: Appointment Confirmation */}
                    {msg.actionType === "APPOINTMENT_BOOKED" && msg.actionData && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-3 p-3.5 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 dark:border-emerald-500/20 text-gray-900 dark:text-white"
                      >
                        <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2 mb-2">
                          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                            <CheckCircle2 className="w-4 h-4" />
                            Confirmed Booking
                          </div>
                          <span className="px-2 py-0.5 bg-emerald-500 text-white text-[11px] font-mono font-bold rounded-md">
                            {msg.actionData.tokenCode}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs py-1">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400 block text-[10px]">Doctor:</span>
                            <span className="font-semibold text-gray-800 dark:text-gray-100">
                              {msg.actionData.doctorName}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400 block text-[10px]">Department:</span>
                            <span className="font-semibold text-gray-800 dark:text-gray-100">
                              {msg.actionData.department}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400 block text-[10px]">Date & Time:</span>
                            <span className="font-semibold text-gray-800 dark:text-gray-100">
                              {msg.actionData.appointmentDate} • {msg.actionData.timeSlot}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400 block text-[10px]">Queue Pos / Wait:</span>
                            <span className="font-semibold text-teal-600 dark:text-emerald-400">
                              #{msg.actionData.queuePosition} (~{msg.actionData.estimatedWaitTime}m)
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setIsOpen(false);
                            router.push("/app/queue");
                          }}
                          className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white text-xs font-semibold rounded-lg hover:brightness-105 transition shadow-xs"
                        >
                          <span>Track Live in Queue Tab</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    )}

                    <div
                      className={`text-[10px] mt-1.5 text-right opacity-70 ${
                        msg.role === "user" ? "text-teal-100" : "text-gray-400"
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs bg-white dark:bg-[#1A2332] p-3 rounded-2xl rounded-tl-none w-fit border border-gray-100 dark:border-[#2A3A4E] shadow-sm"
                >
                  <Bot className="w-4 h-4 text-teal-500 animate-spin" />
                  <span className="font-medium">CareQ AI is thinking...</span>
                  <span className="flex gap-1 ml-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </span>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Category Tabs */}
            <div className="px-3 pt-2 bg-gray-100/90 dark:bg-[#141C26] border-t border-gray-200/60 dark:border-[#2A3A4E] flex gap-1.5 overflow-x-auto scrollbar-none">
              {CATEGORIZED_ACTIONS.map((cat, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedCategory(cat.category)}
                  className={`text-[11px] px-2.5 py-1 rounded-t-lg transition-all font-semibold whitespace-nowrap ${
                    selectedCategory === cat.category
                      ? "bg-white dark:bg-[#1A2332] text-teal-600 dark:text-emerald-400 border-t-2 border-teal-500"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                >
                  {cat.category}
                </button>
              ))}
            </div>

            {/* Quick Action Suggestion Pills for active category */}
            <div className="px-3 py-2 bg-white dark:bg-[#1A2332] border-b border-gray-200/60 dark:border-[#2A3A4E] overflow-x-auto scrollbar-none flex gap-1.5">
              {currentCategoryActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(action.prompt)}
                  disabled={isLoading}
                  className="shrink-0 text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-[#243042] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#2A3A4E] hover:border-teal-500 dark:hover:border-emerald-500 hover:text-teal-600 dark:hover:text-emerald-400 transition-all font-medium whitespace-nowrap shadow-2xs"
                >
                  {action.label}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-white dark:bg-[#111820] border-t border-gray-200 dark:border-[#2A3A4E]">
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-[#1A2332] rounded-2xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-teal-500 dark:focus-within:ring-emerald-500 transition-all">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about tokens, doctors, lab tests, Ayushman Bharat..."
                  disabled={isLoading}
                  className="flex-1 bg-transparent text-xs sm:text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none"
                />

                {/* Voice Input (Speech-to-Text) */}
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-1.5 rounded-xl transition ${
                    isListening
                      ? "bg-rose-500 text-white animate-pulse"
                      : "text-gray-400 hover:text-teal-500 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                  title={isListening ? "Listening... click to stop" : "Voice input (Speak in English / Hindi)"}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                {/* Send Button */}
                <button
                  onClick={() => handleSend()}
                  disabled={!inputMessage.trim() || isLoading}
                  className={`p-2 rounded-xl transition-all ${
                    inputMessage.trim() && !isLoading
                      ? "bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md hover:scale-105 active:scale-95"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                  }`}
                  aria-label="Send Message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
