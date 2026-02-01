"use client";
import React, { useState, useEffect } from 'react';
import { useWeb3 } from '@/context/Web3Context';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const VotingPage = () => {
  const { 
    candidates, 
    userInfo, 
    vote, 
    hasVoted, 
    contract, 
    account, 
    refreshData, 
    loading: web3Loading, 
    isTransacting, 
    electionStatus, 
    dates
  } = useWeb3();

  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const router = useRouter();

  const handleVote = async () => {
    if (selectedCandidate === null) return toast.error("Please select a candidate!");
    if (hasVoted) return toast.error("You have already cast your vote!");
    if (!userInfo?.id) return toast.error("Please log in first!");
    if (electionStatus !== "OPEN") return toast.error("The polls are not currently open.");

    try {
      await vote(selectedCandidate);
    } catch (err: any) {
      console.error("Voting failed", err);
    }
  };

  useEffect(() => {
    if (contract) {
      refreshData(contract, userInfo?.id);
    }
  }, [contract, userInfo?.id, refreshData]);

  return (
    <div className="min-h-screen pt-32 pb-12 px-6 relative bg-transparent">
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-slate-900/40 z-0 pointer-events-none"></div>

      <div className="relative z-10 max-w-5xl mx-auto">
        <header className="mb-12 text-center">
          <span className="text-[10px] text-emerald-500 font-mono tracking-[0.4em] uppercase font-black mb-2 block">
            {electionStatus === "CLOSED" ? "Finalized Audit" : "Secure Decentralized Ballot"}
          </span>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">
            {electionStatus === "CLOSED" ? "Polls Terminated" : "E-Voting Portal"}
          </h1>
          <p className="text-gray-400 font-mono text-xs italic">
            {electionStatus === "CLOSED" ? "The election window has officially ended" : `Voter ID: ${userInfo?.id?.slice(0, 15)}...`}
          </p>
        </header>

        {/* TIMELINE LOGIC: DISAPPEARING CANDIDATES */}
        {electionStatus === "CLOSED" ? (
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-16 rounded-[2.5rem] text-center shadow-2xl">
             <div className="h-24 w-24 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-500/20">
                <span className="text-4xl">🔒</span>
             </div>
             <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Election is Closed</h2>
             <p className="text-gray-400 font-mono text-xs uppercase tracking-[0.2em] max-w-md mx-auto leading-relaxed">
               As per the blockchain protocol, the active ballot has been removed. 
               The election concluded at <span className="text-white">{dates.end}</span>.
             </p>
             <button 
                onClick={() => router.push('/results')}
                className="mt-10 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl transition-all uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-blue-500/20 active:scale-95"
             >
                View Final Consensus
             </button>
          </div>
        ) : (
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full animate-pulse ${electionStatus === "OPEN" ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                {electionStatus === "OPEN" ? "Live Ballot" : "Awaiting Opening"}
                </h3>
                <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full border border-white/5">
                    Closes: {dates.end || "TBD"}
                </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 text-xs uppercase">
                    <th className="py-4 px-2 font-black">Select</th>
                    <th className="py-4 font-black tracking-widest">Candidate</th>
                    <th className="py-4 font-black tracking-widest">Party Affinity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {candidates && candidates.length > 0 ? (
                    candidates.map((candidate: any) => (
                      <tr key={candidate.id} className="group hover:bg-emerald-500/5 transition-colors">
                        <td className="py-6 px-2">
                          <input 
                            type="radio" 
                            name="candidate"
                            value={candidate.id}
                            disabled={hasVoted || electionStatus === "UPCOMING"}
                            onChange={() => setSelectedCandidate(candidate.id)}
                            className="w-5 h-5 accent-emerald-500 cursor-pointer disabled:opacity-20" 
                          />
                        </td>
                        <td className="py-6 font-bold text-lg text-white">{candidate.name}</td>
                        <td className="py-6 text-gray-400 font-mono text-xs uppercase tracking-wider">{candidate.party}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-20 text-center text-gray-500 italic font-mono text-xs">
                        {web3Loading ? "Synchronizing ledger data..." : "No candidates registered on this chain."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-12 flex flex-col items-center">
              {hasVoted ? (
                <div className="w-full py-6 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-2xl text-center font-black uppercase tracking-widest text-xs">
                  ✓ Transaction confirmed. Your vote is immutable on the ledger.
                </div>
              ) : (
                <button 
                  onClick={handleVote}
                  disabled={isTransacting || selectedCandidate === null || electionStatus === "UPCOMING"}
                  className={`w-full md:w-1/2 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 ${
                    isTransacting 
                      ? 'bg-blue-600 text-white animate-pulse' 
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-900 shadow-emerald-500/10'
                  }`}
                >
                  {isTransacting ? "Broadcasting to Node..." : electionStatus === "UPCOMING" ? "Polls Locked" : "Submit Encrypted Vote"}
                </button>
              )}
            </div>
          </div>
        )}

        <footer className="mt-12 text-center text-gray-600 text-[10px] font-mono uppercase tracking-[0.3em]">
           Node Identity: {account || "Awaiting MetaMask Handshake..."}
        </footer>
      </div>
    </div>
  );
};

export default VotingPage;