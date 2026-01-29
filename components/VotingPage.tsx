"use client";
import React, { useState } from 'react';
import { useWeb3 } from '@/context/Web3Context';

const VotingPage = () => {
  // Pulling real-time data from our Web3 Provider
  // Added 'user' here to support the Hybrid ID system we discussed
  const { account, candidates, dates, vote, hasVoted, user, loading: web3Loading } = useWeb3();
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // FIXED: Ensure this function is correctly closed before the return statement
  const handleVote = async () => {
    if (selectedCandidate === null) return alert("Please select a candidate!");
    if (hasVoted) return alert("You have already cast your vote!");
    if (!user?.id) return alert("Please log in first!");

    setLoading(true);
    try {
      // Passing both Candidate ID and Supabase User ID to the smart contract
      await vote(selectedCandidate, user.id);
      alert("Vote successfully cast on the blockchain!");
    } catch (error: any) {
      console.error(error);
      alert(error.reason || "Transaction failed");
    } finally {
      setLoading(false);
    }
  }; // <--- Ensure this curly brace is here!

  return (
    <div className="min-h-screen flex flex-col items-center py-10 bg-slate-900 bg-[url('/assets/eth5.jpg')] bg-cover bg-center bg-fixed relative">
      <div className="absolute inset-0 bg-black/60 z-0 pointer-events-none"></div>

      <div className="z-10 w-full max-w-4xl px-4">
        <header className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg uppercase tracking-tight">
            Decentralized Voting
          </h1>
          <h2 className="text-xl md:text-2xl text-emerald-400 font-medium font-mono">Blockchain Node: 1337</h2>
          <div className="mt-4 text-white font-semibold text-lg bg-emerald-900/30 inline-block px-4 py-1 rounded-full border border-emerald-500/30">
            Election Period: <span className="text-emerald-300">{dates.start} — {dates.end}</span>
          </div>
        </header>

        <div className="bg-black/40 backdrop-blur-md p-8 rounded-xl border border-white/10 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-center border-separate border-spacing-y-4">
              <thead>
                <tr className="text-emerald-400 uppercase tracking-wider text-sm">
                  <th className="pb-2">Select</th>
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Party</th>
                  <th className="pb-2">Current Votes</th>
                </tr>
              </thead>
              <tbody>
                {candidates.length > 0 ? (
                  candidates.map((candidate) => (
                    <tr key={candidate.id} className="bg-white/5 hover:bg-white/10 transition-all duration-200">
                      <td className="py-4 rounded-l-lg">
                        <input 
                          type="radio" 
                          name="candidate" 
                          value={candidate.id}
                          onChange={() => setSelectedCandidate(Number(candidate.id))}
                          className="w-5 h-5 accent-emerald-500 cursor-pointer" 
                        />
                      </td>
                      <td className="py-4 text-white font-medium">{candidate.name}</td>
                      <td className="py-4 text-gray-300">{candidate.party}</td>
                      <td className="py-4 text-emerald-400 rounded-r-lg font-mono font-bold">
                        {candidate.voteCount}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-10 text-gray-400 italic text-lg text-center">
                      No candidates have been added to the blockchain yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-10 text-center flex flex-col items-center">
            {hasVoted ? (
              <div className="bg-emerald-500/20 text-emerald-400 p-4 rounded-lg border border-emerald-500/50 w-full md:w-1/2">
                🎉 Your vote has been recorded on the ledger.
              </div>
            ) : (
              <>
                <p className="text-gray-300 mb-6 italic">
                  Review your choice carefully. Blockchain transactions are irreversible.
                </p>
                <button 
                  onClick={handleVote}
                  disabled={loading || web3Loading || selectedCandidate === null}
                  className="w-full md:w-1/2 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 text-white font-bold rounded-lg shadow-lg transition-all active:scale-95 uppercase tracking-wider"
                >
                  {loading ? "Processing..." : "Cast Your Vote"}
                </button>
              </>
            )}
          </div>
        </div>

        <footer className="mt-8 text-center">
          <div className="inline-block bg-black/50 backdrop-blur-sm px-6 py-2 rounded-full border border-white/10">
            <p className="text-xs font-mono text-gray-400">
              Connected Wallet: <span className="text-emerald-500">{account || "Not Connected"}</span>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default VotingPage;