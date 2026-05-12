'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWeb3 } from '@/context/Web3Context';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const COLORS = ['#1d6fdb', '#059669', '#d97706', '#7c3aed', '#dc2626'];

export default function ResultsPage() {
  const {
    candidates, loading, networkName,
    electionStatus, userInfo, dateTimestamps,
  } = useWeb3();

  const router = useRouter();

  const isAdmin  = userInfo?.role === 'admin';
  // Election is truly closed only when:
  // 1. dateTimestamps are loaded from chain (not 0)
  // 2. current time is past the end timestamp
  const nowSec       = Math.floor(Date.now() / 1000);
  const datesLoaded  = dateTimestamps.end > 0;
  const trulyClosed  = datesLoaded && nowSec > dateTimestamps.end;
  const canSeeResults = isAdmin || trulyClosed;

  // Redirect voters away if they somehow reach this page before close
  useEffect(() => {
    // Wait until we have loaded user info AND blockchain dates
    if (loading) return;
    if (!userInfo) return;
    if (isAdmin) return;

    // If dates not set yet or election not closed → send to account
    if (!datesLoaded || !trulyClosed) {
      router.replace('/account');
    }
  }, [loading, userInfo, isAdmin, datesLoaded, trulyClosed, router]);

  // ── Show spinner while loading ─────────────────────────────────────────────
  if (loading || !userInfo) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '14px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2.5px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>Loading…</p>
      </div>
    );
  }

  // ── Block voters — show nothing while redirect fires ──────────────────────
  if (!canSeeResults) {
    return (
      <div style={{ maxWidth: '500px', margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '56px', marginBottom: '20px' }}>
          {electionStatus === 'OPEN' ? '🗳️' : '🔒'}
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px', letterSpacing: '-0.4px' }}>
          {electionStatus === 'OPEN'
            ? 'Election is in progress'
            : 'Election has not started yet'}
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '28px' }}>
          {electionStatus === 'OPEN'
            ? "Results will be available once the polls close. Please cast your vote if you haven't already."
            : 'Results will be available once the election concludes.'}
        </p>
        <button
          onClick={() => router.push(electionStatus === 'OPEN' ? '/voting' : '/account')}
          style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', boxShadow: '0 2px 8px rgba(29,111,219,0.25)' }}
        >
          {electionStatus === 'OPEN' ? 'Go to voting booth →' : 'Back to dashboard →'}
        </button>
      </div>
    );
  }

  // ── Full results page ──────────────────────────────────────────────────────
  const sorted = [...candidates].sort((a, b) => b.voteCount - a.voteCount);
  const total  = candidates.reduce((sum, c) => sum + Number(c.voteCount), 0);

  const chartData = {
    labels: candidates.map(c => c.name),
    datasets: [{
      data: candidates.map(c => Number(c.voteCount)),
      backgroundColor: COLORS.slice(0, candidates.length),
      borderColor: '#ffffff',
      borderWidth: 3,
      hoverOffset: 8,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0a1929',
        titleFont: { size: 13, weight: 'bold' as const, family: "'IBM Plex Sans', sans-serif" },
        bodyFont:  { size: 12, family: "'IBM Plex Sans', sans-serif" },
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (ctx: any) => {
            const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : '0.0';
            return `  ${ctx.parsed} votes  (${pct}%)`;
          },
        },
      },
    },
  };

  const rankEmoji = (i: number) => ['🥇', '🥈', '🥉'][i] ?? null;
  const rankBg    = (i: number) => [
    { bg: '#fef3c7', color: '#92400e' },
    { bg: '#f1f5f9', color: '#475569' },
    { bg: '#fff7ed', color: '#9a3412' },
  ][i] ?? { bg: 'var(--surface2)', color: 'var(--text-muted)' };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 24px 60px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.4px', marginBottom: '4px' }}>
            Election results
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            Final tally from the Ethereum blockchain
          </p>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, marginTop: '4px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ef4444' }} />
          Polls closed
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '20px', alignItems: 'start' }}>

        {/* Left — chart + metadata */}
        <div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(10,25,41,.06)', marginBottom: '16px' }}>
            <div style={{ padding: '17px 22px', borderBottom: '1px solid var(--border2)' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Vote distribution</div>
            </div>
            <div style={{ padding: '24px 22px' }}>
              {candidates.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '13.5px' }}>No candidates registered.</div>
              ) : (
                <>
                  <div style={{ position: 'relative', height: '200px', marginBottom: '20px' }}>
                    <Doughnut data={chartData} options={chartOptions} />
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                      <div style={{ fontSize: '30px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-1px', lineHeight: 1 }}>{total}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>total votes</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {candidates.map((c, i) => (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                        <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                        <span style={{ flex: 1, color: 'var(--text-secondary)' }}>{c.name}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '12px' }}>
                          {total > 0 ? ((Number(c.voteCount) / total) * 100).toFixed(1) : '0.0'}%
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(10,25,41,.05)' }}>
            {[
              { label: 'Network',     value: networkName || 'Ganache · Chain 1337' },
              { label: 'Total votes', value: String(total) },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 20px', borderBottom: '1px solid var(--border2)', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-primary)' }}>{value}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 20px', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Ledger</span>
              <span style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 500 }}>
                ✓ Verified immutable
              </span>
            </div>
          </div>
        </div>

        {/* Right — leaderboard */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(10,25,41,.06)' }}>
          <div style={{ padding: '17px 22px', borderBottom: '1px solid var(--border2)' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Leaderboard</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Ranked by votes received</div>
          </div>

          {sorted.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '13.5px' }}>No votes recorded.</div>
          ) : (
            sorted.map((c, i) => {
              const pct = total > 0 ? ((Number(c.voteCount) / total) * 100).toFixed(1) : '0.0';
              const rk  = rankBg(i);
              const em  = rankEmoji(i);
              const col = COLORS[candidates.findIndex(x => x.id === c.id) % COLORS.length];
              return (
                <div key={c.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 22px', borderBottom: '1px solid var(--border2)' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: rk.bg, color: rk.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: em ? '14px' : '13px', fontWeight: em ? 400 : 600, flexShrink: 0 }}>
                      {em ?? i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{c.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{c.party}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1 }}>{c.voteCount}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>{pct}%</div>
                    </div>
                  </div>
                  <div style={{ padding: '0 22px 14px' }}>
                    <div style={{ height: '5px', background: 'var(--border2)', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: col, borderRadius: '99px', width: `${pct}%`, transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}