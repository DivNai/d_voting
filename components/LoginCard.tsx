"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast'; // Import toast

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
      // 1. Authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Fetch User Role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authData.user.id)
          .single();

        if (profileError) {
          toast.error("Profile access restricted.");
          router.push('/account');
          return;
        }

        if (profile) {
          onLogin(profile.role);
          toast.success(`Access Granted: ${profile.role} session active`);
          
          if (profile.role === 'admin') {
            router.push('/admin');
          } else {
            router.push('/account');
          }
        }
      }
    } catch (error: any) {
      // 3. Replace alert with toast
      toast.error(error.message || "Invalid credentials provided.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-20 relative px-4">
      <div className="z-10 w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-2xl p-10 rounded-[2.5rem] border border-white/10 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
             {/* Brand Icon to match NavBar */}
             <div className="h-12 w-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4">
                <span className="text-slate-900 font-black text-2xl">V</span>
             </div>
             <h2 className="text-2xl font-black text-white text-center tracking-tight uppercase">
               Authorize Access
             </h2>
             <p className="text-[10px] text-emerald-500 font-mono tracking-[0.3em] uppercase mt-2">Secure Voter Gateway</p>
          </div>
          
          <form className="space-y-5" onSubmit={handleLogin}>
            <div className="space-y-1">
              <label className="text-[10px] uppercase text-gray-400 font-bold ml-1">Email Identity</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voter@example.com"
                required
                className="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-emerald-500 text-white outline-none transition-all placeholder:text-gray-700"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase text-gray-400 font-bold ml-1">Secret Key</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-emerald-500 text-white outline-none transition-all placeholder:text-gray-700"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-gray-600 text-slate-900 font-black rounded-xl shadow-xl shadow-emerald-600/10 transition-all active:scale-95 uppercase tracking-widest text-xs mt-4"
            >
              {loading ? "Decrypting..." : "Open Secure Session"}
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-white/5 flex justify-center text-[9px] text-gray-500 font-mono uppercase tracking-[0.2em]">
            Blockchain Ledger Node Active
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginCard;