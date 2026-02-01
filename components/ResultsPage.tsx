"use client";
import React from 'react';
import { useWeb3 } from '@/context/Web3Context';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const ResultsPage = () => {
  const { candidates = [] } = useWeb3();

  const totalVotes = candidates.reduce((sum: number, c: any) => sum + Number(c.voteCount), 0);

  const data = {
    labels: candidates.map((c: any) => c.name),
    datasets: [
      {
        label: 'Votes',
        data: candidates.map((c: any) => Number(c.voteCount)),
        backgroundColor: [
          'rgba(16, 185, 129, 0.7)', 
          'rgba(59, 130, 246, 0.7)', 
          'rgba(168, 85, 247, 0.7)', 
          'rgba(249, 115, 22, 0.7)', 
          'rgba(236, 72, 153, 0.7)', 
        ],
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 2,
        hoverOffset: 20,
        cutout: '75%',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleFont: { size: 14, weight: 'bold' as const },
        bodyFont: { size: 13 },
        padding: 12,
        cornerRadius: 10,
      }
    },
  };

  return (
    /* pt-40 ensures we are well below the fixed NavBar.
       bg-transparent allows DarkVeil to show through. */
    <div className="min-h-screen pt-40 pb-12 px-6 relative bg-transparent">
      <div className="max-w-6xl mx-auto relative z-10">
        
        <header className="mb-12">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
             <span className="text-[10px] text-emerald-500 font-mono tracking-[0.4em] uppercase font-black mb-2">
               Live Consensus Audit
             </span>
             <h1 className="text-5xl font-black text-white tracking-tighter mb-2">
               Election Results
             </h1>
             <p className="text-gray-400 font-mono text-xs flex items-center gap-2">
               <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></span>
               Ethereum Node Instance: 1337 (Verified)
             </p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* LEFT: ANALYTICS CHART */}
          <div className="lg:col-span-5 relative group">
            <div className="bg-white/5 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/10 shadow-2xl h-[450px] flex flex-col items-center justify-center relative">
              <Doughnut data={data} options={options} />
              
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-4">
                 <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Aggregate</p>
                 <h3 className="text-5xl font-black text-white">{totalVotes}</h3>
                 <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest mt-1">Total Votes</p>
              </div>
            </div>
          </div>

          {/* RIGHT: DETAILED BREAKDOWN */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.3em] mb-6 px-2">
              Candidate Performance Metrics
            </h3>
            
            <div className="grid grid-cols-1 gap-3">
              {candidates.length > 0 ? candidates.map((candidate: any, index: number) => {
                const percentage = totalVotes > 0 ? ((Number(candidate.voteCount) / totalVotes) * 100).toFixed(1) : "0.0";
                
                return (
                  <div key={candidate.id} className="group flex justify-between items-center bg-white/5 hover:bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/5 transition-all duration-300">
                    <div className="flex items-center gap-5">
                      <div 
                        className="h-10 w-1 rounded-full shadow-[0_0_10px]" 
                        style={{ 
                          backgroundColor: data.datasets[0].backgroundColor[index],
                          boxShadow: `0 0 15px ${data.datasets[0].backgroundColor[index]}` 
                        }}
                      ></div>
                      <div>
                        <p className="font-black text-lg text-white group-hover:text-emerald-400 transition-colors">
                          {candidate.name}
                        </p>
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">
                          {candidate.party}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-black text-white font-mono">
                        {candidate.voteCount}
                      </p>
                      <p className="text-[10px] text-emerald-500 font-bold">
                        {percentage}% Share
                      </p>
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                  <p className="text-gray-500 italic">Awaiting blockchain synchronization...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <footer className="mt-16 flex justify-center">
            <div className="bg-emerald-500/5 px-6 py-3 rounded-full border border-emerald-500/10 flex items-center gap-4 backdrop-blur-sm">
                <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Immutable Ledger Verified</p>
                <div className="h-1 w-1 bg-gray-700 rounded-full"></div>
                <p className="text-[10px] text-emerald-500 font-mono font-black uppercase tracking-widest">Hash Validated</p>
            </div>
        </footer>
      </div>
    </div>
  );
};

export default ResultsPage;