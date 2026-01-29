"use client";
import React from 'react';
import { useWeb3 } from '@/context/Web3Context';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const ResultsPage = () => {
  const { candidates, loading } = useWeb3();

  // Prepare data for the Pie Chart
  const chartData = {
    labels: candidates.map(c => c.name),
    datasets: [
      {
        label: 'Votes',
        data: candidates.map(c => Number(c.voteCount)),
        backgroundColor: [
          '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'
        ],
        borderWidth: 1,
      },
    ],
  };

  if (loading) return <div className="text-white text-center mt-20">Loading Blockchain Data...</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-emerald-500 mb-10">
          Live Election Results
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Visual Chart Card */}
          <div className="bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-700">
            <h2 className="text-xl font-semibold mb-6 text-center">Vote Distribution</h2>
            <div className="max-w-[300px] mx-auto">
              {candidates.length > 0 ? (
                <Pie data={chartData} />
              ) : (
                <p className="text-gray-500 text-center">No data available</p>
              )}
            </div>
          </div>

          {/* Detailed Leaderboard Card */}
          <div className="bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-700">
            <h2 className="text-xl font-semibold mb-6">Leaderboard</h2>
            <div className="space-y-4">
              {candidates.sort((a, b) => b.voteCount - a.voteCount).map((candidate, index) => (
                <div key={candidate.id} className="flex justify-between items-center p-4 bg-slate-700 rounded-lg">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-emerald-500">#{index + 1}</span>
                    <div>
                      <p className="font-bold">{candidate.name}</p>
                      <p className="text-xs text-gray-400">{candidate.party}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-mono font-bold text-emerald-400">{candidate.voteCount}</p>
                    <p className="text-[10px] uppercase text-gray-500">Total Votes</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <footer className="mt-12 text-center text-gray-500 text-sm">
          Node: 127.0.0.1:7545 | Network ID: 1337 | Verified on Ledger
        </footer>
      </div>
    </div>
  );
};

export default ResultsPage;