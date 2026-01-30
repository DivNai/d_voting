"use client";
import React from 'react';
import Link from 'next/link';
import { useWeb3 } from '@/context/Web3Context';
import { useRouter } from 'next/navigation';
// Change from '@/lib/supabase' to '@/lib/supabaseClient'
import { supabase } from '@/lib/supabaseClient';// Ensure you import your supabase client

const NavBar = () => {
  const { userInfo, setUserInfo } = useWeb3();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // setUserInfo(null); // Clear context state
    router.push('/');  // Send back to Login/Home
  };

  return (
    <nav className="z-50 sticky top-0 bg-slate-900/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex justify-between items-center text-white">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 bg-emerald-500 rounded-lg flex items-center justify-center font-bold">V</div>
        <span className="font-bold text-xl tracking-tight hidden md:block">Next-DVoting</span>
      </div>

      <div className="flex items-center gap-6">
        {/* Public Links */}
        <Link href="/results" className="text-sm hover:text-emerald-400 transition">Results</Link>

        {/* Protected Links - Only show if userInfo exists */}
        {userInfo ? (
          <>
            <Link href="/voting" className="text-sm hover:text-emerald-400 transition">Vote Now</Link>
            <Link href="/account" className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10 hover:bg-white/10 transition">
              <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-sm font-medium">{userInfo.name}</span>
            </Link>
            <button 
              onClick={handleLogout}
              className="text-sm text-red-400 hover:text-red-300 font-medium ml-2"
            >
              Logout
            </button>
          </>
        ) : (
          <Link href="/" className="bg-emerald-600 hover:bg-emerald-500 px-5 py-2 rounded-lg text-sm font-bold transition">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
};

export default NavBar;