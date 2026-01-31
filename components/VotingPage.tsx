"use client";
import React, { useState,useEffect } from 'react';
import { useWeb3 } from '@/context/Web3Context';

const VotingPage = () => {
  // We extract 'loading' from context and rename it to 'web3Loading' here
const { candidates, userInfo, vote, hasVoted, contract, account, refreshData, loading: web3Loading, txLoading } = useWeb3();
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);

  const handleVote = async () => {
    if (selectedCandidate === null) return alert("Please select a candidate!");
    if (hasVoted) return alert("You have already cast your vote!");
    if (!userInfo?.id) return alert("Please log in first!");

    try {
      await vote(selectedCandidate, userInfo.id);
      alert("Success! Your vote is secured on the Blockchain.");
    } catch (err: any) {
      alert(err.reason || "Transaction failed");
    }
  };

  // Force the page to ask the context for data on mount
  // Uncommented and updated to ensure it has all dependencies
  useEffect(() => {
    if (contract) {
      refreshData(contract, account, userInfo?.id);
    }
  }, [contract, account, userInfo?.id, refreshData]);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 md:p-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-black/60 opacity-40 pointer-events-none"></div>

      <div className="relative z-10 max-w-5xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tighter uppercase mb-2">E-Voting Portal</h1>
          <p className="text-emerald-500 font-mono text-sm">Voter ID: {userInfo?.id?.slice(0, 15)}...</p>
        </header>

        <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            Live Ballot
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-sm uppercase">
                  <th className="py-4 px-2">Select</th>
                  <th className="py-4">Candidate</th>
                  <th className="py-4">Party</th>
                  {/* <th className="py-4 text-right">Blockchain Count</th> */}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {candidates && candidates.length > 0 ? (
                  candidates.map((candidate) => (
                    <tr key={candidate.id} className="group hover:bg-emerald-500/5 transition-colors">
                      <td className="py-6 px-2">
                        <input 
                          type="radio" 
                          name="candidate"
                          value={candidate.id}
                          disabled={hasVoted}
                          onChange={() => setSelectedCandidate(candidate.id)}
                          className="w-5 h-5 accent-emerald-500 cursor-pointer" 
                        />
                      </td>
                      <td className="py-6 font-medium text-lg">{candidate.name}</td>
                      <td className="py-6 text-gray-400">{candidate.party}</td>
                      {/* <td className="py-6 text-right font-mono text-emerald-400 text-xl font-bold">
                        {candidate.voteCount}
                      </td> */}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-20 text-center text-gray-500 italic">
                      {web3Loading ? "Synchronizing with node..." : "Waiting for Admin to add candidates..."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-12 flex flex-col items-center">
            {hasVoted ? (
              <div className="w-full py-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-2xl text-center font-semibold">
                ✓ Your vote has been successfully mined on the ledger.
              </div>
            ) : (
              <button 
                onClick={handleVote}
                disabled={txLoading || selectedCandidate === null}
                className="w-full md:w-1/2 py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-800 disabled:text-gray-500 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-emerald-900/20"
              >
                {txLoading ? "Processing Transaction..." : "Cast Secure Vote"}
              </button>
            )}
          </div>
        </div>

        <footer className="mt-12 text-center text-gray-500 text-xs font-mono">
           Connected Wallet: {account || "Establishing link..."}
        </footer>
      </div>
    </div>
  );
};

export default VotingPage;