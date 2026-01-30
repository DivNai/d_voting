"use client";
import React, { useState } from 'react';
import { useWeb3 } from '@/context/Web3Context';

const AdminPortal = () => {
  const { addCandidate, dates, contract,account,loading ,setLoading,txLoading,setTxLoading,updateElectionDates} = useWeb3(); // Ensure contract is exposed in useWeb3
  const [name, setName] = useState("");
  const [party, setParty] = useState("");
  
  // Date states
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Function to handle date setting
  const handleSetDates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return alert("Please select both dates");
    
    // Call the function from Context
    await updateElectionDates(startDate, endDate);
  };

  // If the context is still connecting to Ganache
  if (loading || !contract) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-emerald-500">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-emerald-500 mb-4"></div>
        <p className="font-mono text-sm uppercase tracking-widest">
          Establishing Blockchain Connection...
        </p>
      </div>
    );
  }

  // const handleSetDates = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (!contract) {
  //   return (
  //     <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
  //       <div className="text-center">
  //         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-emerald-500 mb-4 mx-auto"></div>
  //         <p className="text-emerald-400 font-mono">Connecting to Ganache Node 1337...</p>
  //         <p className="text-xs text-gray-500 mt-2">Make sure MetaMask is logged in</p>
  //       </div>
  //     </div>
  //   );
  // }

  //   try {
  //     // Convert to Unix Timestamp (seconds)
  //     const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
  //     const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000);

  //     // This call triggers the MetaMask popup
  //     const tx = await contract.setDates(startTimestamp, endTimestamp);
  //     alert("Please confirm the transaction in MetaMask...");
      
  //     await tx.wait(); // Wait for blockchain confirmation
  //     alert("Election timeline updated successfully!");
  //   } catch (err: any) {
  //     console.error(err);
  //     alert(err.reason || "Transaction failed");
  //   }
  // };

//   const handleSetDates = async () => {
//   try {
//     setTxLoading(true);
    
//     // Ensure dates are converted to Unix Timestamps (Seconds)
//     const startUnix = Math.floor(new Date(startDate).getTime() / 1000);
//     const endUnix = Math.floor(new Date(endDate).getTime() / 1000);

//     // This is the line triggering your MetaMask popup
//     const tx = await contract.setElectionDates(startUnix, endUnix);
    
//     console.log("Transaction sent! Waiting for confirmation...");
//     await tx.wait(); 
    
//     alert("Timeline updated on Blockchain!");
//   } catch (error: any) {
//     if (error.code === "ACTION_REJECTED") {
//       alert("Transaction was cancelled in MetaMask.");
//     } else {
//       console.error("Blockchain Error:", error);
//     }
//   } finally {
//     setTxLoading(false);
//   }
// };

  const handleAddCandidate = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    // This will now find the function in the Context
    await addCandidate(name, party); 
    setName(""); 
    setParty("");
    alert("Candidate added successfully!");
  } catch (err: any) {
    alert("Error: " + (err.reason || "Transaction failed"));
  }
};

  return (
    <div className="p-8 bg-slate-900 min-h-screen text-white">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-emerald-500 mb-2">Admin Control Center</h1>
        <p className="text-gray-400 font-mono">Network ID: 1337 | Dehradun Node</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Date Setter Section */}
        <div className="bg-white/5 backdrop-blur-md p-6 rounded-xl border border-white/10 shadow-xl">
          <h2 className="text-xl font-semibold mb-6 border-b border-emerald-500 pb-2">Set Election Timeline</h2>
          <form onSubmit={handleSetDates} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Start Date & Time</label>
              <input 
                type="datetime-local" 
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-3 bg-slate-800 rounded border border-white/20 focus:outline-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">End Date & Time</label>
              <input 
                type="datetime-local" 
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-3 bg-slate-800 rounded border border-white/20 focus:outline-emerald-500"
              />
            </div>
            <button 
      onClick={handleSetDates}
      disabled={txLoading}
      className="bg-emerald-600 p-2 rounded disabled:bg-gray-600"
    >
      {txLoading ? "Updating Blockchain..." : "Update Timeline"}
    </button>
          </form>
        </div>

        {/* Add Candidate Section */}
        <div className="bg-white/5 backdrop-blur-md p-6 rounded-xl border border-white/10 shadow-xl">
          <h2 className="text-xl font-semibold mb-6 border-b border-emerald-500 pb-2">Add New Candidate</h2>
          <form onSubmit={handleAddCandidate} className="space-y-4">
            <input
              type="text" placeholder="Candidate Name" value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 bg-slate-800 rounded border border-white/20 focus:outline-emerald-500"
            />
            <input
              type="text" placeholder="Party Name" value={party}
              onChange={(e) => setParty(e.target.value)}
              className="w-full p-3 bg-slate-800 rounded border border-white/20 focus:outline-emerald-500"
            />
            <button className="w-full bg-emerald-600 hover:bg-emerald-500 py-3 rounded font-bold transition">
              Push to Blockchain
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminPortal;