"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CreditCard, Banknote, Smartphone, CheckCircle } from 'lucide-react';

export default function PaymentModal({ isOpen, onClose, patient }) {
  const [selectedMethod, setSelectedMethod] = useState('UPI');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!patient) return null;

  const handlePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2000);
    }, 1500);
  };

  const methods = [
    { id: 'UPI', icon: Smartphone, label: 'UPI / QR' },
    { id: 'CARD', icon: CreditCard, label: 'Card' },
    { id: 'CASH', icon: Banknote, label: 'Cash' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isProcessing ? onClose : undefined}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 max-w-md mx-auto"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-3xl z-50 p-6 pb-safe"
          >
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-200 rounded-full" />
            
            {isSuccess ? (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center justify-center py-12"
              >
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-500 mb-4">
                  <CheckCircle size={40} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful</h2>
                <p className="text-gray-500">Receipt sent to {patient.name}'s phone</p>
              </motion.div>
            ) : (
              <>
                <div className="flex justify-between items-start mt-2 mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Collect Payment</h2>
                    <p className="text-sm text-gray-500 mt-1">Patient: {patient.name} ({patient.token})</p>
                  </div>
                  <button 
                    onClick={onClose}
                    disabled={isProcessing}
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 disabled:opacity-50"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Amount Display & Billing Details */}
                  <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm text-blue-600 font-semibold">Billing Details</p>
                    </div>
                    <div className="space-y-2 mb-3 border-b border-blue-200/50 pb-3">
                      <div className="flex justify-between text-sm text-blue-800">
                        <span>Consultation Fee</span>
                        <span>₹500</span>
                      </div>
                      <div className="flex justify-between text-sm text-blue-800">
                        <span>Registration Fee</span>
                        <span>₹250</span>
                      </div>
                      <div className="flex justify-between text-sm text-blue-800">
                        <span>Taxes (18% GST)</span>
                        <span>₹100</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-blue-600 font-bold">Total Due</p>
                      <p className="text-2xl font-bold text-blue-700">₹850</p>
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Payment Method</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {methods.map(method => {
                        const Icon = method.icon;
                        const isSelected = selectedMethod === method.id;
                        return (
                          <button
                            key={method.id}
                            onClick={() => setSelectedMethod(method.id)}
                            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                              isSelected 
                                ? 'border-[#58D0A7] bg-[#58D0A7]/10 text-[#58D0A7]' 
                                : 'border-gray-100 bg-white text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            <Icon size={24} className="mb-2" />
                            <span className="text-xs font-bold">{method.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Action Button */}
                  <button 
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className="w-full bg-[#58D0A7] hover:bg-[#3AB58F] disabled:bg-gray-300 disabled:text-gray-500 text-white rounded-2xl py-4 font-bold text-lg shadow-md transition-colors flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <span className="animate-pulse">Processing...</span>
                    ) : (
                      `Confirm ${selectedMethod} Payment`
                    )}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
