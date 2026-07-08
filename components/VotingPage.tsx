'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useWeb3 } from '@/context/Web3Context';
//all imports
export default function VotingPage() {
  const {
    candidates, userInfo, vote, hasVoted,
    contract, refreshData, loading,
    isTransacting, electionStatus, dates, account,
  } = useWeb3();

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (contract) refreshData(contract, userInfo?.id);
  }, [contract, userInfo?.id, refreshData]);

  const handleVote = async () => {
    if (selectedId === null)           return toast.error('Please select a candidate.');
    if (hasVoted)                      return toast.error('You have already voted.');
    if (!userInfo?.id)                 return toast.error('Please sign in first.');
    if (electionStatus !== 'OPEN')     return toast.error('The polls are not currently open.');
    await vote(selectedId);
  };

  const selectedCandidate = candidates.find(c => c.id === selectedId);

  const sc: Record<string, { bg: string; color: string; dot: string; border: string }> = {
    OPEN:     { bg: '#ecfdf5', color: '#065f46', dot: '#10b981', border: '#a7f3d0' },
    CLOSED:   { bg: '#fef2f2', color: '#991b1b', dot: '#ef4444', border: '#fecaca' },
    UPCOMING: { bg: '#fffbeb', color: '#92400e', dot: '#f59e0b', border: '#fde68a' },
  };
  const s = sc[electionStatus] ?? sc.UPCOMING;

  const avatarColors = [
    { bg: 'var(--accent-dim)',   color: 'var(--accent)'  },
    { bg: 'rgba(5,150,105,0.1)', color: '#059669'        },
    { bg: 'var(--gold-dim)',     color: 'var(--gold)'    },
    { bg: 'rgba(139,92,246,0.1)',color: '#7c3aed'        },
  ];

  /* ── POLLS CLOSED ── */
  if (electionStatus === 'CLOSED') {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '48px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Polls are closed</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px' }}>
          The election concluded at <strong>{dates.end}</strong>.
        </p>
        <button onClick={() => router.push('/results')} style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', boxShadow: '0 2px 8px rgba(29,111,219,0.25)' }}>
          View results →
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '32px 24px 60px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.4px', marginBottom: '4px' }}>Cast your vote</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Select one candidate below</p>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: s.bg, color: s.color, border: `1px solid ${s.border}`, padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, marginTop: '4px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: s.dot, animation: electionStatus === 'OPEN' ? 'pulse-dot 1.6s ease-in-out infinite' : 'none' }} />
          {electionStatus === 'OPEN' ? 'Polls open' : 'Upcoming'}
        </span>
      </div>

      {/* Timeline bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: '10px', padding: '12px 18px', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '3px' }}>Closes at</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12.5px', color: 'var(--text-primary)', fontWeight: 500 }}>{dates.end || 'TBD'}</div>
        </div>
        <div style={{ flex: 1, height: '1px', background: 'var(--border2)' }} />
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '3px' }}>Voter ID</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12.5px', color: 'var(--text-primary)', fontWeight: 500 }}>{userInfo?.id ? `${userInfo.id.slice(0, 12)}…` : '—'}</div>
        </div>
        <div style={{ flex: 1, height: '1px', background: 'var(--border2)' }} />
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '3px' }}>Wallet</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12.5px', color: 'var(--text-primary)', fontWeight: 500 }}>{account ? `${account.slice(0, 8)}…${account.slice(-6)}` : 'Not connected'}</div>
        </div>
      </div>

      {/* Candidates label */}
      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px' }}>
        Candidates · {candidates.length} registered
      </div>

      {/* Candidate list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '13.5px' }}>
          Loading candidates from blockchain…
        </div>
      ) : candidates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '13.5px' }}>
          No candidates registered yet.
        </div>
      ) : (
        <div>
          {candidates.map(c => {
            const isSelected = selectedId === c.id;
            const canSelect  = !hasVoted && electionStatus === 'OPEN';
            const av         = avatarColors[(c.id - 1) % avatarColors.length];

            return (
              <div
                key={c.id}
                onClick={() => { if (canSelect) setSelectedId(c.id); }}
                style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '15px 18px', border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border2)'}`, borderRadius: '10px', background: isSelected ? '#eff6ff' : 'var(--surface)', cursor: canSelect ? 'pointer' : 'default', marginBottom: '10px', transition: 'all 0.16s', boxShadow: isSelected ? '0 0 0 3px rgba(29,111,219,0.08)' : 'none' }}
              >
                {/* Radio */}
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0, border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`, background: isSelected ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.16s' }}>
                  {isSelected && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff' }} />}
                </div>

                {/* Avatar */}
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: av.bg, color: av.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', fontWeight: 600, flexShrink: 0 }}>
                  {c.name[0]}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)' }}>{c.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{c.party}</div>
                </div>

                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>#{c.id}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submit */}
      <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border2)' }}>
        {hasVoted ? (
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '16px', textAlign: 'center', fontSize: '14px', fontWeight: 500, color: '#065f46' }}>
            ✓ Your vote has been recorded on the blockchain.
          </div>
        ) : (
          <>
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '12px 14px', fontSize: '13px', color: '#1e40af', marginBottom: '14px', lineHeight: 1.5 }}>
              ℹ️ Clicking &ldquo;Submit vote&rdquo; will open a MetaMask transaction. Your vote is permanent and cannot be changed.
            </div>
            <button
              onClick={handleVote}
              disabled={isTransacting || selectedId === null || electionStatus !== 'OPEN'}
              style={{ width: '100%', padding: '13px', borderRadius: '10px', border: 'none', fontFamily: 'var(--font-sans)', fontSize: '15px', fontWeight: 600, transition: 'all 0.18s', cursor: (isTransacting || selectedId === null || electionStatus !== 'OPEN') ? 'not-allowed' : 'pointer', background: (isTransacting || selectedId === null || electionStatus !== 'OPEN') ? 'var(--border)' : 'var(--accent)', color: (isTransacting || selectedId === null || electionStatus !== 'OPEN') ? 'var(--text-muted)' : '#fff', boxShadow: (selectedId !== null && electionStatus === 'OPEN') ? '0 2px 8px rgba(29,111,219,0.25)' : 'none' }}
            >
              {isTransacting ? 'Broadcasting to blockchain…'
                : electionStatus === 'UPCOMING' ? 'Polls not open yet'
                : selectedCandidate ? `Submit vote for ${selectedCandidate.name}`
                : 'Select a candidate to vote'}
            </button>
          </>
        )}
      </div> 
      

      <p style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginTop: '20px' }}>
        Node: {account || 'Awaiting wallet connection'}
      </p>
    </div>
  );
}