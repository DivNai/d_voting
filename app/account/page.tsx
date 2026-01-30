"use client";
import React from 'react';
import { useWeb3 } from '@/context/Web3Context';
import { useRouter } from 'next/navigation';

const AccountPage = () => {
  const { userInfo, account, hasVoted, dates, loading } = useWeb3();
  const router = useRouter();

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-emerald-500">Loading profile...</div>;

  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4 bg-[url('/assets/eth-bg.jpg')] bg-cover bg-fixed">
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/70 z-0"></div>

      <div className="relative z-10 max-w-2xl mx-auto">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
          
          {/* Header Section */}
          <div className="flex flex-col items-center mb-10">
            <div className="h-24 w-24 bg-gradient-to-tr from-emerald-500 to-blue-500 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-lg mb-4">
              {userInfo?.name ? userInfo.name[0].toUpperCase() : "V"}
            </div>
            <h1 className="text-3xl font-bold text-white">{userInfo?.name}</h1>
            <p className="text-emerald-400 font-mono text-sm">{userInfo?.email}</p>
          </div>

          {/* Details Grid */}
          <div className="space-y-6">
            <div className="bg-black/30 p-4 rounded-xl border border-white/5">
              <label className="text-xs text-gray-400 uppercase tracking-widest block mb-1">Blockchain Identity (Wallet)</label>
              <p className="font-mono text-xs md:text-sm text-gray-200 break-all">{account || "Not Connected"}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/30 p-4 rounded-xl border border-white/5 text-center">
                <label className="text-xs text-gray-400 uppercase tracking-widest block mb-1">Voting Status</label>
                {hasVoted ? (
                  <span className="text-emerald-400 font-bold text-sm">✓ COMPLETED</span>
                ) : (
                  <span className="text-amber-400 font-bold text-sm">! PENDING</span>
                )}
              </div>
              <div className="bg-black/30 p-4 rounded-xl border border-white/5 text-center">
                <label className="text-xs text-gray-400 uppercase tracking-widest block mb-1">Network ID</label>
                <span className="text-blue-400 font-bold text-sm">1337 (Ganache)</span>
              </div>
            </div>

            <div className="bg-black/30 p-4 rounded-xl border border-white/5">
              <label className="text-xs text-gray-400 uppercase tracking-widest block mb-1">Active Election Timeline</label>
              <p className="text-sm text-white">{dates.start} — {dates.end}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-10 flex gap-4">
            <button 
              onClick={() => router.push('/voting')}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95"
            >
              Go to Vote
            </button>
            <button 
              onClick={() => router.push('/results')}
              className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl border border-white/10 transition-all shadow-lg active:scale-95"
            >
              View Results
            </button>
          </div>
        </div>

        <p className="text-center mt-6 text-gray-500 text-xs">
          Your data is secured using keccak256 Hashing on the Ethereum Blockchain.
        </p>
      </div>
    </div>
  );
};

export default AccountPage;