"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient'; // Import your direct client

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
      // 1. Auth check
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // 2. Role check from your Supabase 'profiles' table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single();

      if (profileError) throw profileError;

      onLogin(profile.role);
      } catch (error: unknown) {
  // Narrow the type to access .message safely
  if (error instanceof Error) {
    alert(error.message);
  } else {
    alert("An unexpected error occurred");
  }
} finally {
  setLoading(false);
}

  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 bg-[url('/assets/eth5.jpg')] bg-cover bg-center bg-fixed relative">
      <div className="absolute inset-0 bg-black/60 z-0"></div>

      <div className="z-10 w-full max-w-md px-4">
        <div className="bg-black/40 backdrop-blur-md p-8 rounded-xl border border-white/10 shadow-2xl">
          <h2 className="text-2xl font-semibold text-white mb-6 text-center tracking-wide uppercase">Login</h2>
          
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
        </div>
      </div>
    </div>
  );
};

export default LoginCard;