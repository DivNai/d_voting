'use client';

import React, { useState, useEffect } from 'react';
import { useWeb3 } from '@/context/Web3Context';
import { toast } from 'react-hot-toast';

type AdminTab = 'election' | 'voters';

interface VoterProfile {
  id: string;
  full_name: string | null;
  voter_id: string | null;
  aadhaar_id: string | null;
  gender: string | null;
  dob: string | null;
  status: 'pending' | 'approved' | 'rejected';
}

export default function AdminPortal() {
  const {
    contract, loading, isTransacting,
    pushElectionData, setElectionDates, resetBlockchainData,
    candidates, dates, electionStatus,
  } = useWeb3();

  const [activeTab,      setActiveTab]      = useState<AdminTab>('election');
  const [candidateName,  setCandidateName]  = useState('');
  const [candidateParty, setCandidateParty] = useState('');
  const [startDate,      setStartDate]      = useState('');
  const [endDate,        setEndDate]        = useState('');

  const [voters,         setVoters]         = useState<VoterProfile[]>([]);
  const [votersLoading,  setVotersLoading]  = useState(false);
  const [actionLoading,  setActionLoading]  = useState<string | null>(null);

  // ── Fetch voters via API route (uses service role key server-side) ──────────
  const fetchVoters = async () => {
    setVotersLoading(true);
    try {
      const res = await fetch('/api/admin/voters');
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to fetch voters');
      }
      const { voters: data } = await res.json();
      setVoters(data ?? []);
    } catch (err: any) {
      toast.error('Failed to load voters: ' + err.message);
    } finally {
      setVotersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'voters') fetchVoters();
  }, [activeTab]);

  // ── Approve voter ─────────────────────────────────────────────────────────
  const approveVoter = async (voterId: string) => {
    setActionLoading(voterId);
    try {
      const res = await fetch('/api/admin/voters', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voterId, status: 'approved' }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Approval failed');
      }
      toast.success('Voter approved!');
      setVoters(prev => prev.map(v => v.id === voterId ? { ...v, status: 'approved' } : v));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // ── Reject voter ──────────────────────────────────────────────────────────
  const rejectVoter = async (voterId: string) => {
    setActionLoading(voterId);
    try {
      const res = await fetch('/api/admin/voters', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voterId, status: 'rejected' }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Rejection failed');
      }
      toast.success('Voter rejected.');
      setVoters(prev => prev.map(v => v.id === voterId ? { ...v, status: 'rejected' } : v));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateName.trim() || !candidateParty.trim())
      return toast.error('Name and party are required.');
    await pushElectionData(candidateName, candidateParty, startDate, endDate);
    setCandidateName('');
    setCandidateParty('');
  };

  const handleSetDates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return toast.error('Both dates are required.');
    await setElectionDates(startDate, endDate);
  };

  const pendingCount  = voters.filter(v => v.status === 'pending').length;
  const approvedCount = voters.filter(v => v.status === 'approved').length;
  const rejectedCount = voters.filter(v => v.status === 'rejected').length;

  const sc: Record<string, { bg: string; color: string; dot: string; border: string }> = {
    OPEN:     { bg: '#ecfdf5', color: '#065f46', dot: '#10b981', border: '#a7f3d0' },
    CLOSED:   { bg: '#fef2f2', color: '#991b1b', dot: '#ef4444', border: '#fecaca' },
    UPCOMING: { bg: '#fffbeb', color: '#92400e', dot: '#f59e0b', border: '#fde68a' },
  };
  const s = sc[electionStatus] ?? sc.UPCOMING;

  const inputStyle: React.CSSProperties = {
    width: '100%', fontFamily: 'var(--font-sans)', fontSize: '13.5px',
    color: 'var(--text-primary)', background: 'var(--surface)',
    border: '1.5px solid var(--border)', borderRadius: '9px',
    padding: '9px 13px', outline: 'none',
    transition: 'border-color 0.16s, box-shadow 0.16s',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '12.5px', fontWeight: 500,
    color: 'var(--text-secondary)', marginBottom: '5px',
  };
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'var(--accent)';
    e.target.style.boxShadow   = '0 0 0 3px rgba(29,111,219,0.1)';
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'var(--border)';
    e.target.style.boxShadow   = 'none';
  };

  if (loading || !contract) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '14px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2.5px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>Connecting to blockchain…</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px 60px' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.4px', marginBottom: '4px' }}>Election management</h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>Manage candidates, dates and voter approvals</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: s.bg, color: s.color, border: `1px solid ${s.border}`, padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500 }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: s.dot }} />
            {electionStatus}
          </span>
          <button
            onClick={() => { if (confirm('Wipe all candidates, dates and votes? Voter accounts are preserved.')) resetBlockchainData(); }}
            disabled={isTransacting}
            style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, padding: '7px 16px', borderRadius: '8px', cursor: isTransacting ? 'not-allowed' : 'pointer', background: 'rgba(220,38,38,0.07)', color: 'var(--danger)', border: '1px solid rgba(220,38,38,0.2)', opacity: isTransacting ? 0.5 : 1 }}
          >
            Reset ledger
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '2px', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: '10px', padding: '4px', width: 'fit-content', marginBottom: '24px' }}>
        {([
          { key: 'election', label: 'Election' },
          { key: 'voters',   label: `Voters${pendingCount > 0 ? ` (${pendingCount} pending)` : ''}` },
        ] as { key: AdminTab; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, padding: '7px 20px', borderRadius: '7px', border: 'none', cursor: 'pointer', transition: 'all 0.16s', background: activeTab === key ? 'var(--surface)' : 'transparent', color: activeTab === key ? 'var(--accent)' : 'var(--text-muted)', boxShadow: activeTab === key ? '0 1px 3px rgba(10,25,41,.07)' : 'none' }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ══ ELECTION TAB ══ */}
      {activeTab === 'election' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
          <div>
            <Card title="Add candidate" sub="Sends a transaction to the blockchain" style={{ marginBottom: '16px' }}>
              <form onSubmit={handleAddCandidate} style={{ padding: '18px 22px' }}>
                <div style={{ marginBottom: '13px' }}>
                  <label style={labelStyle}>Candidate name</label>
                  <input style={inputStyle} type="text" placeholder="e.g. Priya Nair" value={candidateName} onChange={e => setCandidateName(e.target.value)} onFocus={onFocus} onBlur={onBlur} />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Party / group</label>
                  <input style={inputStyle} type="text" placeholder="e.g. Progressive Students Alliance" value={candidateParty} onChange={e => setCandidateParty(e.target.value)} onFocus={onFocus} onBlur={onBlur} />
                </div>
                <SubmitBtn disabled={isTransacting} loading={isTransacting} label="Add candidate" />
              </form>
            </Card>

            <Card title="Election dates" sub="Set voting window">
              <form onSubmit={handleSetDates} style={{ padding: '16px 22px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                  <div>
                    <label style={labelStyle}>Start</label>
                    <input style={inputStyle} type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>End</label>
                    <input style={inputStyle} type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} />
                  </div>
                </div>
                <SubmitBtn disabled={isTransacting} loading={isTransacting} label="Update dates" variant="secondary" />
              </form>
            </Card>
          </div>

          <div>
            <Card title="Active timeline" style={{ marginBottom: '16px' }}>
              <div style={{ padding: '14px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: '9px', padding: '12px 16px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, marginBottom: '3px' }}>Opens</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500 }}>{dates.start || '—'}</div>
                  </div>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, marginBottom: '3px' }}>Closes</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500 }}>{dates.end || '—'}</div>
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Registered candidates" badge={`${candidates.length} total`}>
              {candidates.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '13px' }}>No candidates added yet.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--surface2)' }}>
                      <th style={thStyle}>#</th>
                      <th style={thStyle}>Name</th>
                      <th style={thStyle}>Party</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Votes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.map(c => (
                      <tr key={c.id} style={{ borderBottom: '1px solid var(--border2)' }}>
                        <td style={tdStyle}><span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>{c.id}</span></td>
                        <td style={tdStyle}><span style={{ fontWeight: 500 }}>{c.name}</span></td>
                        <td style={tdStyle}><span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{c.party}</span></td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent)' }}>{c.voteCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* ══ VOTERS TAB ══ */}
      {activeTab === 'voters' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '20px' }}>
            <MiniStat icon="⏳" bg="var(--gold-dim)"        label="Pending"  value={pendingCount} />
            <MiniStat icon="✅" bg="rgba(5,150,105,0.1)"    label="Approved" value={approvedCount} />
            <MiniStat icon="❌" bg="rgba(220,38,38,0.08)"   label="Rejected" value={rejectedCount} />
          </div>

          <Card
            title="Voter registrations"
            badge={`${voters.length} total`}
            action={
              <button onClick={fetchVoters} disabled={votersLoading} style={{ fontFamily: 'var(--font-sans)', fontSize: '12.5px', fontWeight: 500, padding: '6px 14px', borderRadius: '7px', cursor: 'pointer', background: 'var(--surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)', opacity: votersLoading ? 0.5 : 1 }}>
                ↻ Refresh
              </button>
            }
          >
            {votersLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '10px', color: 'var(--text-muted)', fontSize: '13px' }}>
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
                Loading voters…
              </div>
            ) : voters.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '13.5px' }}>
                <div style={{ fontSize: '28px', marginBottom: '10px' }}>👥</div>
                No voters registered yet.
              </div>
            ) : (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 130px 90px 110px 160px', gap: '10px', padding: '10px 20px', background: 'var(--surface2)', borderBottom: '1px solid var(--border2)', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  <span>Voter / DOB</span>
                  <span>Aadhaar / ID</span>
                  <span>Gender</span>
                  <span>Status</span>
                  <span>Actions</span>
                </div>

                {voters.map(voter => {
                  const isBusy = actionLoading === voter.id;
                  const statusStyle = {
                    approved: { bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0', label: '✓ Approved' },
                    pending:  { bg: '#fffbeb', color: '#92400e', border: '#fde68a', label: '⏳ Pending'  },
                    rejected: { bg: '#fef2f2', color: '#991b1b', border: '#fecaca', label: '✕ Rejected'  },
                  }[voter.status];
                  const genderLabel: Record<string, string> = {
                    male: 'Male', female: 'Female', other: 'Other', prefer_not_to_say: 'N/A',
                  };

                  return (
                    <div key={voter.id} style={{ display: 'grid', gridTemplateColumns: '1.4fr 130px 90px 110px 160px', gap: '10px', alignItems: 'center', padding: '13px 20px', borderBottom: '1px solid var(--border2)' }}>
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: 500, color: 'var(--text-primary)' }}>
                          {voter.full_name || 'Name not provided'}
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          DOB: {voter.dob || '—'}
                        </div>
                      </div>

                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                        {voter.aadhaar_id
                          ? `${voter.aadhaar_id.slice(0, 4)} •••• ${voter.aadhaar_id.slice(-4)}`
                          : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </div>

                      <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                        {voter.gender ? (genderLabel[voter.gender] ?? voter.gender) : '—'}
                      </div>

                      <span style={{ background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}`, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, width: 'fit-content' }}>
                        {statusStyle.label}
                      </span>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        {voter.status !== 'approved' && (
                          <button
                            onClick={() => approveVoter(voter.id)}
                            disabled={isBusy}
                            style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 500, padding: '6px 12px', borderRadius: '7px', cursor: isBusy ? 'not-allowed' : 'pointer', background: 'rgba(5,150,105,0.08)', color: '#059669', border: '1px solid rgba(5,150,105,0.2)', opacity: isBusy ? 0.5 : 1 }}
                          >
                            {isBusy ? '…' : '✓ Approve'}
                          </button>
                        )}
                        {voter.status !== 'rejected' && (
                          <button
                            onClick={() => rejectVoter(voter.id)}
                            disabled={isBusy}
                            style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 500, padding: '6px 12px', borderRadius: '7px', cursor: isBusy ? 'not-allowed' : 'pointer', background: 'rgba(220,38,38,0.07)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.18)', opacity: isBusy ? 0.5 : 1 }}
                          >
                            {isBusy ? '…' : '✕ Reject'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

/* ── helpers ── */
const thStyle: React.CSSProperties = { fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'left', padding: '10px 16px', borderBottom: '1px solid var(--border2)' };
const tdStyle: React.CSSProperties = { fontSize: '13.5px', padding: '12px 16px', verticalAlign: 'middle' };

function Card({ title, sub, badge, action, children, style }: { title: string; sub?: string; badge?: string; action?: React.ReactNode; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(10,25,41,.06)', ...style }}>
      <div style={{ padding: '17px 22px', borderBottom: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</div>
          {sub && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{sub}</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {badge && <span style={{ background: 'var(--accent-dim)', color: 'var(--accent)', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 500 }}>{badge}</span>}
          {action}
        </div>
      </div>
      {children}
    </div>
  );
}

function SubmitBtn({ disabled, loading, label, variant = 'primary' }: { disabled: boolean; loading: boolean; label: string; variant?: 'primary' | 'secondary' }) {
  return (
    <button type="submit" disabled={disabled} style={{ width: '100%', padding: '10px', borderRadius: '9px', border: variant === 'secondary' ? '1px solid var(--border)' : 'none', fontFamily: 'var(--font-sans)', fontSize: '13.5px', fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.18s', background: disabled ? 'var(--border)' : variant === 'secondary' ? 'var(--surface)' : 'var(--accent)', color: disabled ? 'var(--text-muted)' : variant === 'secondary' ? 'var(--text-secondary)' : '#fff', boxShadow: (!disabled && variant === 'primary') ? '0 2px 6px rgba(29,111,219,0.2)' : 'none' }}>
      {loading ? 'Processing…' : label}
    </button>
  );
}

function MiniStat({ icon, bg, label, value }: { icon: string; bg: string; label: string; value: number }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: '13px', padding: '16px 18px', boxShadow: '0 1px 3px rgba(10,25,41,.05)' }}>
      <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontSize: '10px', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '26px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-1px' }}>{value}</div>
    </div>
  );
}