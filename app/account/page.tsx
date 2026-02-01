"use client";
import React from 'react';
import { useWeb3 } from '@/context/Web3Context';
import { useRouter } from 'next/navigation';

const AccountPage = () => {
  const { userInfo, account, hasVoted, dates, loading, electionStatus } = useWeb3();
  const router = useRouter();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-emerald-500">
        <div className="h-10 w-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
        <p className="font-mono text-xs uppercase tracking-widest">Accessing Ledger...</p>
      </div>
    );
  }

  // Helper to determine CTA button appearance and destination
  const getCTAConfig = () => {
    if (electionStatus === "CLOSED") {
      return {
        text: "View Final Results",
        path: "/results",
        style: "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20",
        disabled: false
      };
    }
    if (hasVoted) {
      return {
        text: "Vote Recorded",
        path: "#",
        style: "bg-slate-800 text-gray-500 cursor-not-allowed border border-white/5",
        disabled: true
      };
    }
    if (electionStatus === "UPCOMING") {
      return {
        text: "Polls Opening Soon",
        path: "#",
        style: "bg-amber-600/20 text-amber-500 border border-amber-500/30 cursor-wait",
        disabled: true
      };
    }
    return {
      text: "Enter Voting Booth",
      path: "/voting",
      style: "bg-emerald-500 hover:bg-emerald-400 text-slate-900 shadow-emerald-500/20",
      disabled: false
    };
  };

  const cta = getCTAConfig();

  return (
    <div className="min-h-screen pt-28 pb-12 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-slate-950/40 z-0 pointer-events-none"></div>

      <div className="relative z-10 max-w-4xl mx-auto">
        
        {/* TOP SECTION: PROFILE HEADER */}
        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 mb-6 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col md:flex-row items-center gap-10 text-center md:text-left">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-tr from-emerald-500 to-blue-500 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
              <div className="relative h-32 w-32 bg-slate-800 rounded-3xl flex items-center justify-center text-5xl font-black text-emerald-500 border border-white/10 shadow-2xl transition-transform duration-500 group-hover:scale-105">
                {userInfo?.name ? userInfo.name[0].toUpperCase() : "V"}
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center md:items-start">
              <p className="text-[10px] text-emerald-500 font-mono tracking-[0.4em] uppercase mb-2 font-black">
                {getGreeting()}
              </p>
              <h1 className="text-5xl font-black text-white tracking-tight leading-none mb-4">
                {userInfo?.name}
              </h1>
              <div className="flex flex-col gap-3">
                <span className="inline-flex text-blue-400 font-mono text-[10px] bg-blue-500/10 px-4 py-1.5 rounded-full border border-blue-500/20 uppercase tracking-[0.2em] font-black">
                  Authorized Role: {userInfo?.role || "Voter"}
                </span>
                <span className="text-gray-400 font-mono text-sm italic opacity-70 px-1">
                  {userInfo?.email}
                </span>
              </div>
            </div>

            <div className="hidden lg:block bg-white/5 p-6 rounded-3xl border border-white/5 text-right">
                <p className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em] mb-1">Participation</p>
                <p className={`text-3xl font-black ${hasVoted ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {hasVoted ? "100%" : "0%"}
                </p>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">Global Weight</p>
            </div>
          </div>
        </div>

        {/* MIDDLE SECTION: DATA GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-md">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-6">Security Metadata</h3>
            <div className="space-y-4">
              <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/5">
                <p className="text-[9px] text-emerald-500 font-black uppercase mb-2 tracking-widest">Public Address (ECDSA)</p>
                <p className="font-mono text-xs text-gray-300 break-all leading-relaxed">
                  {account || "Waiting for Wallet Authorization..."}
                </p>
              </div>
              <div className="flex justify-between items-center bg-slate-900/60 p-5 rounded-2xl border border-white/5">
                <div>
                  <p className="text-[9px] text-blue-400 font-black uppercase mb-1 tracking-widest">Network Authority</p>
                  <p className="text-xs text-white font-mono">1337 • Ganache Localhost</p>
                </div>
                <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span className="text-[9px] text-emerald-500 font-black">ACTIVE</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-md flex flex-col justify-between items-center text-center">
             <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Integrity</h3>
             <div className="py-2">
                {hasVoted ? (
                    <div className="space-y-2">
                        <div className="h-16 w-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center text-2xl mx-auto border border-emerald-500/20">✓</div>
                        <p className="text-lg font-black text-white uppercase tracking-tighter">SECURED</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="h-16 w-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center text-2xl mx-auto border border-amber-500/20 animate-pulse font-serif italic">?</div>
                        <p className="text-lg font-black text-white uppercase tracking-tighter">{electionStatus === "CLOSED" ? "EXPIRED" : "PENDING"}</p>
                    </div>
                )}
             </div>
             <p className="text-[10px] text-gray-500 uppercase leading-tight font-medium">
                {hasVoted ? "Hash recorded in Ledger" : electionStatus === "CLOSED" ? "Election window ended" : "Awaiting signature"}
             </p>
          </div>
        </div>

        {/* TIMELINE & CTA SECTION */}
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] p-8 mb-10 flex flex-col md:flex-row items-center justify-between gap-8 backdrop-blur-xl shadow-2xl shadow-emerald-500/5">
            <div className="space-y-4">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded font-black text-[9px] uppercase tracking-widest ${
                  electionStatus === "OPEN" ? "bg-emerald-500 text-slate-900" : 
                  electionStatus === "CLOSED" ? "bg-red-500/20 text-red-500" : "bg-amber-500 text-slate-900"
                }`}>
                    {electionStatus}
                </div>
                <div className="flex items-center gap-8">
                    <div>
                        <p className="text-[9px] text-gray-500 uppercase font-black mb-1">Window Opens</p>
                        <p className="font-mono text-sm text-white">{dates.start || "..."}</p>
                    </div>
                    <div className="h-10 w-[1px] bg-white/10"></div>
                    <div>
                        <p className="text-[9px] text-gray-500 uppercase font-black mb-1">Window Closes</p>
                        <p className="font-mono text-sm text-white">{dates.end || "..."}</p>
                    </div>
                </div>
            </div>
            
            <button 
              onClick={() => !cta.disabled && router.push(cta.path)}
              disabled={cta.disabled}
              className={`w-full md:w-56 py-5 rounded-2xl font-black transition-all active:scale-95 uppercase text-xs tracking-[0.2em] shadow-xl ${cta.style}`}
            >
              {cta.text}
            </button>
        </div>

        <div className="flex justify-center items-center gap-4 opacity-30 group cursor-default">
            <div className="h-[1px] w-12 bg-gray-500"></div>
            <p className="text-[10px] font-mono text-gray-400 uppercase tracking-[0.5em] group-hover:text-emerald-500 transition-colors">
              Trustless Architecture v2.0
            </p>
            <div className="h-[1px] w-12 bg-gray-500"></div>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;