"use client";
import React from 'react';
import { useWeb3 } from '@/context/Web3Context';
import { useRouter } from 'next/navigation';

const AccountPage = () => {
  const { userInfo, account, hasVoted, dates, loading } = useWeb3();
  const router = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-4 text-emerald-500">
        <div className="h-10 w-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
        <p className="font-mono text-xs uppercase tracking-widest">Accessing Secure Ledger...</p>
      </div>
    );
  }

  return (
    // pt-28 ensures it starts below the fixed NavBar
    <div className="min-h-screen bg-slate-900 pt-16 pb-8 px-4 bg-[url('/assets/eth-bg.jpg')] bg-cover bg-fixed relative overflow-hidden">
      
      {/* Refined Glassmorphism Overlay */}
      <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm z-0"></div>

      <div className="relative z-10 max-w-4xl mx-auto">
        
        {/* TOP SECTION: PROFILE HEADER */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 mb-6 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
            <div className="relative">
              <div className="h-32 w-32 bg-gradient-to-br from-emerald-400 to-blue-600 rounded-2xl flex items-center justify-center text-4xl font-black text-slate-900 shadow-2xl  hover:rotate-0 transition-transform duration-500">
                {userInfo?.name ? userInfo.name[0].toUpperCase() : "V"}
              </div>
              {/* <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-slate-900 text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-tighter shadow-xl">
                Verified Voter
              </div> */}
            </div>

            {/* <div className="flex-1">
              <h1 className="text-4xl font-black text-white tracking-tight mb-1">{userInfo?.name}</h1>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-2">
                <span className="text-emerald-400 font-mono text-sm bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 italic">
                  {userInfo?.email}
                </span>
                <span className="text-blue-400 font-mono text-sm bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 uppercase tracking-widest font-bold">
                  Role: {userInfo?.role || "Voter"}
                </span>
              </div>
            </div> */}
            <div className="flex-1 flex flex-col items-center md:items-start">
  {/* Username */}
  <h1 className="text-4xl font-black text-white tracking-tight leading-none mb-2">
    {userInfo?.name}
  </h1>

  {/* Role Badge - Now positioned directly below username */}
  <div className="mb-3">
    <span className="text-blue-400 font-mono text-[10px] bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20 uppercase tracking-[0.2em] font-black">
      Role: {userInfo?.role || "Voter"}
    </span>
  </div>

  {/* Email - Positioned as a secondary detail */}
  <div className="flex items-center gap-2">
    <span className="text-emerald-400 font-mono text-sm bg-emerald-500/5 px-3 py-1 rounded-full border border-emerald-500/10 italic opacity-80">
      {userInfo?.email}
    </span>
  </div>
</div>

            <div className="hidden lg:block text-right">
                <p className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em] mb-1">Account Standing</p>
                <p className="text-2xl font-black text-white">{hasVoted ? "100%" : "0%"}</p>
                <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest">Participation</p>
            </div>
          </div>
        </div>

        {/* MIDDLE SECTION: DATA GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Blockchain Wallet Info */}
          <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Web3 Identity Matrix</h3>
            <div className="space-y-4">
              <div className="bg-black/40 p-4 rounded-2xl border border-white/5 group hover:border-emerald-500/30 transition-colors">
                <p className="text-[10px] text-emerald-500 font-bold uppercase mb-2">Connected Wallet Address</p>
                <p className="font-mono text-xs text-gray-300 break-all leading-relaxed">
                  {account || "Awaiting MetaMask Connection..."}
                </p>
              </div>
              <div className="flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-white/5">
                <div>
                  <p className="text-[10px] text-blue-500 font-bold uppercase mb-1">Network Node</p>
                  <p className="text-xs text-white font-mono">1337 (Local RPC Ganache)</p>
                </div>
                <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></div>
              </div>
            </div>
          </div>

          {/* Status Column */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md flex flex-col justify-between">
             <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Ballot Status</h3>
             <div className="text-center py-6">
                {hasVoted ? (
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-12 w-12 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center text-xl">✓</div>
                        <p className="text-xl font-black text-white uppercase tracking-tighter">Vote Cast</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-12 w-12 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center text-xl animate-bounce">!</div>
                        <p className="text-xl font-black text-white uppercase tracking-tighter">Action Required</p>
                    </div>
                )}
             </div>
             <p className="text-[9px] text-gray-500 text-center uppercase leading-tight italic">
                {hasVoted ? "Transaction recorded on block" : "Ballot is ready for submission"}
             </p>
          </div>
        </div>

        {/* TIMELINE SECTION */}
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-6 mb-10 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-md">
            <div>
                <h3 className="text-xs font-black text-emerald-500 uppercase tracking-[0.2em] mb-2 text-center md:text-left">Live Election Timeline</h3>
                <div className="flex items-center gap-4">
                    <div className="text-center">
                        <p className="text-[9px] text-gray-500 uppercase">Commencement</p>
                        <p className="font-mono text-sm text-white">{dates.start || "TBD"}</p>
                    </div>
                    <div className="h-8 w-[1px] bg-white/10"></div>
                    <div className="text-center">
                        <p className="text-[9px] text-gray-500 uppercase">Conclusion</p>
                        <p className="font-mono text-sm text-white">{dates.end || "TBD"}</p>
                    </div>
                </div>
            </div>
            
            <div className="flex gap-3 w-full md:w-auto">
                <button 
                  onClick={() => router.push('/voting')}
                  className="flex-1 md:w-40 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black py-4 rounded-2xl transition-all shadow-xl shadow-emerald-500/10 active:scale-95 uppercase text-xs tracking-widest"
                >
                  Cast Vote
                </button>
                {/* <button 
                  onClick={() => router.push('/results')}
                  className="flex-1 md:w-40 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl border border-white/10 transition-all uppercase text-xs tracking-widest"
                >
                  Results
                </button> */}
            </div>
        </div>

        <p className="text-center text-gray-600 text-[10px] font-mono uppercase tracking-[0.3em]">
          End-to-End Verifiable • Decentralized Governance • Secure Ledger v2.0
        </p>
      </div>
    </div>
  );
};

export default AccountPage;