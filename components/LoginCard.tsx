"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

interface LoginCardProps {
  onLogin: (role: string) => void;
}

const LoginCard: React.FC<LoginCardProps> = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Fetch User Role from the 'profiles' table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authData.user.id)
          .single();

        if (profileError) {
          console.error("Profile Fetch Error:", profileError.message);
          // Fallback: If profile doesn't exist, assume 'voter' or redirect anyway
          router.push('/account');
          return;
        }

        // 3. Trigger the onLogin callback (used for state management in parent)
        if (profile) {
          onLogin(profile.role);
          
          // 4. Redirect based on role
          if (profile.role === 'admin') {
            router.push('/admin');
          } else {
            router.push('/account');
          }
        }
      }
    } catch (error: any) {
      console.error("Login Process Error:", error.message || error);
      alert(error.message || "An unexpected error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 bg-[url('/assets/eth5.jpg')] bg-cover bg-center bg-fixed relative">
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60 z-0 pointer-events-none"></div>

      <div className="z-10 w-full max-w-md px-4">
        <div className="bg-black/40 backdrop-blur-md p-8 rounded-xl border border-white/10 shadow-2xl">
          <h2 className="text-2xl font-semibold text-white mb-6 text-center tracking-wide uppercase">
            Voter Login
          </h2>
          
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voter@example.com"
                required
                className="w-full px-4 py-3 rounded-lg bg-white/90 focus:ring-2 focus:ring-emerald-500 text-gray-900 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-lg bg-white/90 focus:ring-2 focus:ring-emerald-500 text-gray-900 outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-600 text-white font-bold rounded-lg shadow-lg transition duration-300 uppercase tracking-wider"
            >
              {loading ? "Authenticating..." : "Login"}
            </button>
          </form>
          
          <p className="mt-4 text-center text-xs text-gray-400 font-mono">
            Secured by Ethereum & Supabase
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginCard;