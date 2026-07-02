"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function VerifyPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    // Supabase will automatically parse the token from the URL
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setMessage("Email verified! Redirecting to login...");
        setTimeout(() => router.push('/login'), 2000);
      } else {
        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
            setMessage("Email verified! Redirecting to login...");
            setTimeout(() => router.push('/login'), 2000);
          }
        });
        
        return () => subscription.unsubscribe();
      }
    });
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="p-8 bg-white shadow-lg rounded-2xl max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Email Verification</h2>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}
