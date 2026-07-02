"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  MessageCircle,
  Phone,
  Mail,
  FileText,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Send,
} from "lucide-react";

export default function HelpAndSupport() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [ticketMessage, setTicketMessage] = useState("");

  const faqs = [
    {
      question: "How do I book an appointment?",
      answer:
        "You can book an appointment by navigating to the 'Book' tab, selecting your preferred hospital, department, and doctor, then choosing an available time slot.",
    },
    {
      question: "How can I view my lab reports?",
      answer:
        "Go to the 'Reports' tab to view all your lab reports, prescriptions, and invoices. You can download or share them directly from there.",
    },
    {
      question: "What is a Virtual Walk-In Token?",
      answer:
        "A Virtual Walk-In Token allows you to join a queue remotely without physically waiting at the hospital. You'll be notified when it's your turn.",
    },
    {
      question: "How do I cancel an appointment?",
      answer:
        "You can cancel an appointment from your Queue or Appointment Details screen at least 2 hours before the scheduled time.",
    },
    {
      question: "Is my health data secure?",
      answer:
        "Yes, all your health data is encrypted and stored securely. We follow strict privacy guidelines and HIPAA compliance standards.",
    },
  ];

  const cardCls =
    "bg-white dark:bg-[#1A2332] border border-gray-100 dark:border-[#2A3A4E] rounded-3xl shadow-sm dark:shadow-black/20";

  return (
    <div className="min-h-full bg-gray-50 dark:bg-[#0B0F14] pb-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-400 to-teal-500 dark:from-[#064E3B] dark:via-[#047857] dark:to-[#065F46] pt-12 pb-8 px-6 rounded-b-[40px]">
        <motion.h1
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-2xl font-bold text-white mb-2"
        >
          Help & Support
        </motion.h1>
        <p className="text-white/80">We're here to help you</p>
      </div>

      <div className="px-6 py-6">
        {/* Quick Actions */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3 mb-6"
        >
          <button className={`${cardCls} p-5 hover:shadow-md transition-shadow`}>
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/15 rounded-xl flex items-center justify-center mx-auto mb-3">
              <MessageCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-gray-900 dark:text-white font-medium text-sm">Chat Support</p>
            <p className="text-xs text-gray-500 dark:text-[#94A3B8] mt-1">Available 24/7</p>
          </button>

          <button className={`${cardCls} p-5 hover:shadow-md transition-shadow`}>
            <div className="w-12 h-12 bg-green-50 dark:bg-emerald-500/15 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Phone className="w-6 h-6 text-green-600 dark:text-emerald-400" />
            </div>
            <p className="text-gray-900 dark:text-white font-medium text-sm">Call Hospital</p>
            <p className="text-xs text-gray-500 dark:text-[#94A3B8] mt-1">1800-XXX-XXXX</p>
          </button>
        </motion.div>

        {/* FAQs */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Frequently Asked Questions
          </h3>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={index} className={`${cardCls} overflow-hidden`}>
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-[#223040] transition-colors"
                >
                  <span className="text-gray-900 dark:text-white font-medium pr-4">{faq.question}</span>
                  {expandedFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-400 dark:text-[#64748B] flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 dark:text-[#64748B] flex-shrink-0" />
                  )}
                </button>

                {expandedFaq === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 pb-4"
                  >
                    <p className="text-sm text-gray-600 dark:text-[#CBD5E1] leading-relaxed">{faq.answer}</p>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Raise Ticket */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={`${cardCls} p-6 mb-6`}
        >
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-orange-50 dark:bg-orange-500/15 rounded-xl flex items-center justify-center mr-3">
              <FileText className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Raise a Support Ticket</h3>
          </div>

          <div className="mb-4">
            <label className="text-sm text-gray-600 dark:text-[#94A3B8] mb-2 block">Describe your issue</label>
            <textarea
              placeholder="Tell us what you need help with..."
              value={ticketMessage}
              onChange={(e) => setTicketMessage(e.target.value)}
              rows={4}
              className="w-full bg-gray-50 dark:bg-[#0F1722] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#64748B] rounded-2xl px-4 py-3 outline-none border-2 border-transparent focus:border-teal-500 dark:focus:border-emerald-500 transition-colors resize-none"
            />
          </div>

          <button className="w-full bg-teal-500 dark:bg-emerald-600 text-white py-4 rounded-2xl font-medium flex items-center justify-center shadow-sm shadow-teal-500/20 dark:shadow-emerald-600/30 hover:bg-teal-600 dark:hover:bg-emerald-500 transition-colors">
            <Send className="w-5 h-5 mr-2" />
            Submit Ticket
          </button>
        </motion.div>

        {/* Contact Methods */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className={`${cardCls} p-6 mb-6`}
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Other Ways to Reach Us</h3>

          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/15 rounded-xl flex items-center justify-center mr-4">
                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-[#94A3B8]">Email</p>
                <p className="text-gray-900 dark:text-white font-medium">support@suvidhaq.com</p>
              </div>
            </div>

            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-50 dark:bg-emerald-500/15 rounded-xl flex items-center justify-center mr-4">
                <Phone className="w-5 h-5 text-green-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-[#94A3B8]">Helpline</p>
                <p className="text-gray-900 dark:text-white font-medium">1800-XXX-XXXX</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Emergency */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-red-50 dark:bg-red-500/10 border-2 border-red-200 dark:border-red-500/30 rounded-2xl p-4"
        >
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-red-900 dark:text-red-300 font-semibold mb-1">Medical Emergency?</p>
              <p className="text-xs text-red-700 dark:text-red-300/80 mb-3">
                For immediate medical assistance, please call emergency services or visit the nearest hospital.
              </p>
              <button className="text-sm text-red-600 dark:text-red-400 font-medium hover:underline">
                Emergency Contacts →
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

