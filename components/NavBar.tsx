"use client";
import React from 'react';
import Link from 'next/link';
import { useWeb3 } from '@/context/Web3Context';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

const NavBar = () => {
  const { userInfo } = useWeb3();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  // If we are on the login page (root route), do not render the NavBar
  if (pathname === '/') return null;

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed top-0 left-0 w-full z-[100] bg-slate-900/80 backdrop-blur-xl border-b border-white/10 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-end items-center">
        
        {/* Brand Area */}
        {/* <Link href="/" className="flex items-center gap-3 group transition-transform active:scale-95">
          <div className="h-10 w-10 bg-gradient-to-tr from-emerald-600 to-emerald-400 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <span className="text-slate-900 font-black text-xl">V</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight text-white leading-none">Next-DVoting</span>
            <span className="text-[9px] text-emerald-500 font-mono uppercase tracking-[0.2em] font-black mt-1">Blockchain Ledger</span>
          </div>
        </Link> */}

        {/* Action Area */}
        <div className="flex items-center gap-4 md:gap-8">
          
          <Link 
            href="/results" 
            className={`text-xs uppercase tracking-widest font-bold transition-colors ${isActive('/results') ? 'text-emerald-400' : 'text-gray-400 hover:text-white'}`}
          >
            Results
          </Link>

          {userInfo ? (
            <div className="flex items-center gap-3 pl-6 border-l border-white/10">
              
              {/* ADMIN ONLY LINK: Only shows if role is 'admin' */}
              {userInfo.role === 'admin' && (
                <Link 
                  href="/admin" 
                  className={`text-xs uppercase tracking-widest font-bold transition-colors border border-emerald-500/30 px-3 py-1.5 rounded-lg hover:bg-emerald-500/10 ${isActive('/admin') ? 'text-emerald-400 border-emerald-500' : 'text-emerald-500/80'}`}
                >
                  Admin Panel
                </Link>
              )}

              <Link 
                href="/voting" 
                className={`text-xs uppercase tracking-widest font-bold transition-colors border border-emerald-500/30 px-3 py-1.5 rounded-lg hover:bg-emerald-500/10 ${isActive('/voting') ? 'text-emerald-400 border-emerald-500' : 'text-emerald-500/80'}`}
              >
                Vote Here
              </Link>

              <Link 
                href="/account" 
                className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/10 hover:border-emerald-500/30 transition-all"
              >
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </div>
                <span className="text-sm font-semibold text-gray-200">
                  {userInfo.name || "Voter"}
                </span>
              </Link>

              <button 
                onClick={handleLogout}
                className="text-xs font-black text-red-500/70 hover:text-red-500 transition-colors ml-2 uppercase tracking-tighter"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link 
              href="/" 
              className="bg-emerald-500 hover:bg-emerald-400 px-6 py-2.5 rounded-xl text-xs font-black text-slate-900 shadow-xl shadow-emerald-500/10 transition-all uppercase tracking-widest"
            >
              Secure Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;