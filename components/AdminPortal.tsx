"use client";
import React, { useState } from 'react';
import { useWeb3 } from '@/context/Web3Context';

const AdminPortal = () => {
  const { 
    contract, 
    loading, 
    txLoading, 
    pushElectionData,
    resetBlockchainData, // Destructured to fix ReferenceError
    candidates = [], 
    dates = { start: "", end: "" } 
  } = useWeb3();
  
  const [formData, setFormData] = useState({
    name: "",
    party: "",
    startDate: "",
    endDate: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.party || !formData.startDate || !formData.endDate) {
      return alert("All fields are required before pushing to blockchain.");
    }

    try {
      await pushElectionData(
        formData.name, 
        formData.party, 
        formData.startDate, 
        formData.endDate
      );
      
      alert("Success! Candidate and Timeline are now live on the Blockchain.");
      setFormData({ name: "", party: "", startDate: "", endDate: "" });
    } catch (err: any) {
      alert("Transaction Error: " + (err.reason || "Check MetaMask console"));
    }
  };

  if (loading || !contract) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-emerald-500">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-emerald-500 mb-4"></div>
        <p className="font-mono text-sm uppercase tracking-widest">Synchronizing Node...</p>
      </div>
    );
  }

  return (
    <div className="p-2 bg-slate-900 min-h-screen text-white">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-emerald-500 mb-2 uppercase tracking-tight">Admin Portal</h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Manage election candidates and timelines directly on the blockchain. 
          Use the form below to add candidates and set election start/end times.
        </p>
      </header>

      {/* Main Grid: Form on Left, Data on Right */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* LEFT SIDE: FORM */}
        <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 shadow-2xl">
          <h2 className="text-xl font-semibold mb-8 border-b border-emerald-500/50 pb-3 flex items-center gap-2">
            <span className="p-1 bg-emerald-500 rounded text-slate-900 text-xs font-bold">STEP 1 & 2</span>
            Configure Election Data
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs text-emerald-500 uppercase font-bold mb-2">Candidate Name</label>
                <input
                  type="text"
                  placeholder="Ex: John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full p-3 bg-slate-800 rounded-lg border border-white/10 focus:border-emerald-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs text-emerald-500 uppercase font-bold mb-2">Political Party</label>
                <input
                  type="text"
                  placeholder="Ex: Tech Party"
                  value={formData.party}
                  onChange={(e) => setFormData({...formData, party: e.target.value})}
                  className="w-full p-3 bg-slate-800 rounded-lg border border-white/10 focus:border-emerald-500 outline-none transition"
                />
              </div>
            </div>

            <hr className="border-white/5" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-emerald-500 uppercase font-bold mb-2">Start Time</label>
                <input
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  className="w-full p-3 bg-slate-800 rounded-lg border border-white/10 focus:border-emerald-500 outline-none transition text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-emerald-500 uppercase font-bold mb-2">End Time</label>
                <input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  className="w-full p-3 bg-slate-800 rounded-lg border border-white/10 focus:border-emerald-500 outline-none transition text-sm"
                />
              </div>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={txLoading}
                className="w-full group relative flex justify-center py-4 px-4 border border-transparent text-lg font-black rounded-xl text-slate-900 bg-emerald-500 hover:bg-emerald-400 focus:outline-none transition-all disabled:bg-slate-700 disabled:text-slate-500"
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  {txLoading ? "⚡" : "🚀"}
                </span>
                {txLoading ? "Processing on Blockchain..." : "Push All to Blockchain"}
              </button>
              <p className="text-center text-[10px] text-gray-500 mt-4 uppercase tracking-widest font-mono">
                This action will require 2 MetaMask confirmations
              </p>
            </div>
            
{/* <input
  type="text"
  disabled={txLoading} // Prevent changes during sync
  value={formData.name}
  onChange={(e) => setFormData({...formData, name: e.target.value})}
  className="w-full p-3 bg-slate-800 rounded-lg disabled:opacity-50"
/> */}

{txLoading && (
  <p className="text-center text-emerald-400 animate-pulse text-[10px] mt-2 font-mono">
    Transaction pending... Please do not refresh the page.
  </p>
)}
          </form>
        </div>

        {/* RIGHT SIDE: LIVE DATA & DANGER ZONE */}
        <section className="space-y-8">
          {/* Timeline View */}
          <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-xl">
            <h3 className="text-emerald-500 text-sm font-bold uppercase mb-4 tracking-widest">Active Timeline</h3>
            <div className="flex justify-between text-center">
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Starts</p>
                <p className="font-mono text-sm">{dates.start || "Not Set"}</p>
              </div>
              <div className="h-10 w-[1px] bg-white/10 mx-2"></div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Ends</p>
                <p className="font-mono text-sm">{dates.end || "Not Set"}</p>
              </div>
            </div>
          </div>

          {/* Candidates View */}
          <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-xl overflow-hidden">
            <h3 className="text-emerald-500 text-sm font-bold uppercase mb-4 tracking-widest flex justify-between">
              Registered Candidates
              <span className="text-[10px] bg-emerald-500/10 px-2 py-1 rounded text-emerald-400">{candidates.length}</span>
            </h3>
            <div className="max-h-60 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-emerald-500">
              {candidates.length > 0 ? (
                candidates.map((c: any) => (
                  <div key={c.id} className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg border border-white/5">
                    <div>
                      <p className="font-bold text-white">{c.name}</p>
                      <p className="text-xs text-gray-400 uppercase tracking-tighter">{c.party}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-emerald-400 font-mono font-bold text-lg">{c.voteCount}</p>
                      <p className="text-[8px] text-gray-500 uppercase">Votes</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 italic py-4 text-sm">No candidates on ledger.</p>
              )}
            </div>
          </div>

          {/* DANGER ZONE */}
          {/* <div className="bg-red-500/5 backdrop-blur-md p-6 rounded-3xl border border-red-500/20 shadow-xl">
            <h3 className="text-red-500 text-sm font-bold uppercase mb-4 tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              System Danger Zone
            </h3>
            <p className="text-[10px] text-gray-500 mb-4 italic">
              Resetting will wipe all candidates and timelines from the current contract instance.
            </p>
            <button
              onClick={() => {
                if(confirm("Are you sure? This will wipe the blockchain registry!")) {
                  resetBlockchainData();
                }
              }}
              disabled={txLoading}
              className="w-full py-3 bg-transparent border border-red-500/40 hover:bg-red-500/10 text-red-500 rounded-xl text-xs font-bold transition-all uppercase tracking-widest disabled:opacity-30"
            >
              {txLoading ? "Clearing Ledger..." : "Reset Election Ledger"}
            </button>
          </div> */}
        </section>

      </div>
    </div>
  );
};

export default AdminPortal;