"use client";
import React from 'react';
import { useWeb3 } from '@/context/Web3Context';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const ResultsPage = () => {
  const { candidates } = useWeb3();

  // Prepare data for the chart
  const data = {
    labels: candidates.map((c: any) => c.name),
    datasets: [
      {
        label: '# of Votes',
        data: candidates.map((c: any) => Number(c.voteCount)),
        backgroundColor: [
          'rgba(16, 185, 129, 0.6)', // Emerald
          'rgba(59, 130, 246, 0.6)', // Blue
          'rgba(249, 115, 22, 0.6)', // Orange
          'rgba(139, 92, 246, 0.6)', // Purple
          'rgba(236, 72, 153, 0.6)', // Pink
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(249, 115, 22, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(236, 72, 153, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { color: 'white', font: { size: 14 } }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => ` ${context.label}: ${context.raw} Votes`
        }
      }
    },
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-emerald-500 mb-2">Election Results</h1>
          <p className="text-gray-400">Real-time data fetched from Ethereum Node 1337</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          {/* Chart Section */}
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10 shadow-2xl">
             <Pie data={data} options={options} />
          </div>

          {/* List Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold mb-4 border-b border-emerald-500/50 pb-2">Vote Distribution</h2>
            {candidates.map((candidate: any) => (
              <div key={candidate.id} className="flex justify-between items-center bg-white/10 p-4 rounded-lg">
                <div>
                  <p className="font-bold text-lg">{candidate.name}</p>
                  <p className="text-sm text-gray-400">{candidate.party}</p>
                </div>
                <div className="text-3xl font-mono text-emerald-400">
                  {candidate.voteCount}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;