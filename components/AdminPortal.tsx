"use client";
import React, { useState } from 'react';
import { useWeb3 } from '@/context/Web3Context';
import { toast } from 'react-hot-toast';

const AdminPortal = () => {
  const { 
    contract, 
    loading, 
    isTransacting, 
    pushElectionData,
    resetBlockchainData,
    candidates = [], 
    dates = { start: "", end: "" },
    electionStatus 
  } = useWeb3();
  
  const [formData, setFormData] = useState({
    name: "",
    party: "",
    startDate: "",
    endDate: ""
  });

  // Logic to determine if the form should be shown or the "Locked" screen
  // The form shows if:
  // 1. Election is NOT closed OR
  // 2. Dates are reset (empty or default Unix start)
  const isDatesReset = !dates.start || dates.start.includes("1970");
  const showForm = electionStatus !== "CLOSED" || isDatesReset;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.party || !formData.startDate || !formData.endDate) {
      return toast.error("All fields are required before pushing to blockchain.");
    }

    try {
      await pushElectionData(
        formData.name, 
        formData.party, 
        formData.startDate, 
        formData.endDate
      );
      setFormData({ name: "", party: "", startDate: "", endDate: "" });
    } catch (err: any) {
      console.error("Admin Form Error:", err);
    }
  };

  if (loading || !contract) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-transparent text-emerald-500">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-emerald-500 mb-4"></div>
        <p className="font-mono text-sm uppercase tracking-widest">Synchronizing Node...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-12 px-6 relative bg-transparent">
      <div className="relative z-10 max-w-6xl mx-auto">
        <header className="mb-10 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">Admin Control</h1>
            <p className="text-gray-400 font-mono text-[10px] mt-2 uppercase tracking-[0.2em] flex items-center gap-2 justify-center md:justify-start">
               Status: <span className={electionStatus === 'CLOSED' && !isDatesReset ? 'text-red-500' : 'text-emerald-500'}>
                 {isDatesReset ? "IDLE / READY" : electionStatus}
               </span>
               <span className={`h-1.5 w-1.5 rounded-full ${electionStatus === 'OPEN' ? 'bg-emerald-500 animate-pulse' : isDatesReset ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
            </p>
          </div>
          
          <button
            onClick={() => {
               if(confirm("Factory Reset will wipe all blockchain data and unlock the form. Continue?")) resetBlockchainData();
            }}
            disabled={isTransacting}
            className="text-[10px] font-black text-red-500 hover:text-white border border-red-500/20 px-4 py-2 rounded-lg transition-all hover:bg-red-600 disabled:opacity-20"
          >
            Reset Ledger State
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* LEFT SIDE: FORM (Now unlocks if dates are reset) */}
          {!showForm ? (
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-16 rounded-[2.5rem] text-center shadow-2xl flex flex-col items-center justify-center">
               <div className="h-16 w-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
                  <span className="text-2xl">🚫</span>
               </div>
               <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Management Locked</h2>
               <p className="text-gray-400 font-mono text-[10px] uppercase tracking-widest leading-relaxed">
                 The election window has concluded.<br/> Reset the ledger state to start a new session.
               </p>
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
              <h2 className="text-xl font-bold mb-8 border-b border-white/5 pb-4 flex items-center gap-3">
                <span className="h-2 w-2 bg-emerald-500 rounded-full"></span>
                {isDatesReset ? "New Election Setup" : "Add Candidate / Update Timeline"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] text-gray-500 uppercase font-black mb-2 tracking-widest">Candidate Name</label>
                    <input
                      type="text"
                      placeholder="Ex: John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full p-4 bg-white/5 rounded-xl border border-white/10 focus:border-emerald-500 outline-none transition text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 uppercase font-black mb-2 tracking-widest">Political Party</label>
                    <input
                      type="text"
                      placeholder="Ex: Tech Alliance"
                      value={formData.party}
                      onChange={(e) => setFormData({...formData, party: e.target.value})}
                      className="w-full p-4 bg-white/5 rounded-xl border border-white/10 focus:border-emerald-500 outline-none transition text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-gray-500 uppercase font-black mb-2 tracking-widest">Start Date</label>
                    <input
                      type="datetime-local"
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      className="w-full p-4 bg-white/5 rounded-xl border border-white/10 focus:border-emerald-500 outline-none transition text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 uppercase font-black mb-2 tracking-widest">End Date</label>
                    <input
                      type="datetime-local"
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                      className="w-full p-4 bg-white/5 rounded-xl border border-white/10 focus:border-emerald-500 outline-none transition text-white text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isTransacting}
                  className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 mt-4 ${
                    isTransacting 
                    ? 'bg-blue-600 text-white animate-pulse' 
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-900'
                  }`}
                >
                  {isTransacting ? "Pushing to Blockchain..." : "Deploy to Ledger"}
                </button>
              </form>
            </div>
          )}

          {/* RIGHT SIDE: LIVE DATA */}
          <section className="space-y-6">
            <div className="bg-white/5 backdrop-blur-md p-8 rounded-[2rem] border border-white/10 shadow-xl">
              <h3 className="text-[10px] text-gray-500 font-black uppercase mb-6 tracking-widest">Active Timeline</h3>
              <div className="flex justify-between items-center">
                <div className="text-center">
                  <p className="text-[9px] text-emerald-500 uppercase font-bold mb-1">Commences</p>
                  <p className="font-mono text-xs text-white">{isDatesReset ? "---" : dates.start}</p>
                </div>
                <div className="h-8 w-[1px] bg-white/10 mx-4"></div>
                <div className="text-center">
                  <p className="text-[9px] text-red-500 uppercase font-bold mb-1">Terminates</p>
                  <p className="font-mono text-xs text-white">{isDatesReset ? "---" : dates.end}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md p-8 rounded-[2rem] border border-white/10 shadow-xl overflow-hidden">
              <h3 className="text-[10px] text-gray-500 font-black uppercase mb-6 tracking-widest flex justify-between">
                Registered Ledger Entries
                <span className="text-emerald-400 font-mono">{candidates.length} Units</span>
              </h3>
              <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                {candidates.length > 0 ? (
                  candidates.map((c: any) => (
                    <div key={c.id} className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5 group hover:bg-white/10 transition-all">
                      <div>
                        <p className="font-black text-white text-sm tracking-tight">{c.name}</p>
                        <p className="text-[9px] text-gray-500 uppercase tracking-[0.2em]">{c.party}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-400 font-mono font-black text-xl">{c.voteCount}</p>
                        <p className="text-[8px] text-gray-600 uppercase font-bold">Tallied</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-600 font-mono text-[10px] py-10 uppercase tracking-widest italic">Awaiting registration...</p>
                )}
              </div>
            </div>
          </section>
        </div>

        <p className="text-center text-gray-600 text-[9px] font-mono uppercase tracking-[0.4em] mt-12 opacity-50">
          Administrator Auth Required • End-to-End Encryption Active
        </p>
      </div>
    </div>
  );
};

export default AdminPortal;