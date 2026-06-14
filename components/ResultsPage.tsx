'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useWeb3 } from '@/context/Web3Context';
import { supabase } from '@/lib/supabaseClient';

// ─── Types ────────────────────────────────────────────────────────────────────
interface GenderStats {
  male:             number;
  female:           number;
  other:            number;
  prefer_not_to_say: number;
  total_approved:   number;
  total_voted:      number;
}

interface CandidateGenderBreakdown {
  candidateId: number;
  male:        number;
  female:      number;
  other:       number;
}

// ─── Palette ──────────────────────────────────────────────────────────────────
const PALETTE = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#db2777'];
const GENDER_COLORS = {
  male:             { color: '#2563eb', bg: 'rgba(37,99,235,0.1)',  label: 'Male'     },
  female:           { color: '#db2777', bg: 'rgba(219,39,119,0.1)', label: 'Female'   },
  other:            { color: '#d97706', bg: 'rgba(217,119,6,0.1)',  label: 'Other'    },
  prefer_not_to_say:{ color: '#6b7280', bg: 'rgba(107,114,128,0.1)',label: 'N/A'      },
};

// ─── Animated count-up ────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1200) {
  const [val, setVal] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    if (target === 0) { setVal(0); return; }
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(eased * target));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return val;
}

// ─── Animated bar ────────────────────────────────────────────────────────────
function AnimatedBar({ pct, color, delay = 0 }: { pct: number; color: string; delay?: number }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 150 + delay);
    return () => clearTimeout(t);
  }, [pct, delay]);
  return (
    <div style={{ height: '8px', background: 'var(--border2)', borderRadius: '99px', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${width}%`, background: color, borderRadius: '99px', transition: 'width 0.9s cubic-bezier(0.16,1,0.3,1)' }} />
    </div>
  );
}

// ─── Donut SVG (no external lib) ─────────────────────────────────────────────
function DonutChart({ data, size = 180 }: {
  data: { value: number; color: string; label: string }[];
  size?: number;
}) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 100); return () => clearTimeout(t); }, []);

  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No data</span>
    </div>
  );

  const r = 70; const cx = size / 2; const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  const segments = data.map(d => {
    const pct   = d.value / total;
    const dash  = pct * circumference;
    const gap   = circumference - dash;
    const seg   = { ...d, dash, gap, offset };
    offset += dash;
    return seg;
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      {/* background ring */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border2)" strokeWidth={22} />
      {segments.map((seg, i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="none"
          stroke={seg.color} strokeWidth={22}
          strokeDasharray={`${animated ? seg.dash : 0} ${circumference}`}
          strokeDashoffset={-seg.offset}
          strokeLinecap="butt"
          style={{ transition: `stroke-dasharray 0.9s cubic-bezier(0.16,1,0.3,1) ${i * 0.08}s` }}
        />
      ))}
    </svg>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }: { label: string; value: number; sub?: string; accent?: string }) {
  const count = useCountUp(value);
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: '14px', padding: '20px 22px', boxShadow: '0 1px 4px rgba(10,25,41,.05)' }}>
      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '34px', fontWeight: 700, color: accent ?? 'var(--text-primary)', letterSpacing: '-1.5px', lineHeight: 1, fontFamily: 'var(--font-mono)' }}>{count.toLocaleString()}</div>
      {sub && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '5px' }}>{sub}</div>}
    </div>
  );
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────
function Card({ title, sub, badge, children, style }: { title: string; sub?: string; badge?: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(10,25,41,.06)', ...style }}>
      <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</div>
          {sub && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{sub}</div>}
        </div>
        {badge && (
          <span style={{ background: 'var(--accent-dim)', color: 'var(--accent)', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 500 }}>{badge}</span>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ResultsPage() {
  const {
    candidates, loading, networkName,
    electionStatus, userInfo, dateTimestamps, dates,
  } = useWeb3();
  const router = useRouter();

  const [genderStats,         setGenderStats]         = useState<GenderStats | null>(null);
  const [genderBreakdown,     setGenderBreakdown]     = useState<CandidateGenderBreakdown[]>([]);
  const [statsLoading,        setStatsLoading]        = useState(true);
  const [visible,             setVisible]             = useState(false);

  const isAdmin      = userInfo?.role === 'admin';
  const nowSec       = Math.floor(Date.now() / 1000);
  const datesLoaded  = dateTimestamps.end > 0;
  const trulyClosed  = datesLoaded && nowSec > dateTimestamps.end;
  const canSeeResults = isAdmin || trulyClosed;

  // Fetch gender stats from Supabase
  useEffect(() => {
    if (!canSeeResults || loading) return;

    (async () => {
      setStatsLoading(true);
      try {
        // All approved voters with gender
        const { data: voters } = await supabase
          .from('profiles')
          .select('id, gender, status')
          .eq('role', 'voter');

        if (!voters) return;

        const approved = voters.filter(v => v.status === 'approved');
        const gs: GenderStats = {
          male: 0, female: 0, other: 0, prefer_not_to_say: 0,
          total_approved: approved.length,
          total_voted: candidates.reduce((s, c) => s + Number(c.voteCount), 0),
        };
        approved.forEach(v => {
          const g = v.gender as keyof typeof GENDER_COLORS;
          if (g && gs[g as keyof GenderStats] !== undefined) (gs as any)[g]++;
        });
        setGenderStats(gs);

        // Note: we can't map individual votes to gender since blockchain votes are anonymous.
        // We show approved voter gender breakdown as a demographic stat instead.
      } catch (e) {
        console.error('Gender stats error:', e);
      } finally {
        setStatsLoading(false);
        setTimeout(() => setVisible(true), 50);
      }
    })();
  }, [canSeeResults, loading, candidates]);

  // Redirect non-admin if results not available
  useEffect(() => {
    if (loading) return;
    if (!userInfo) return;
    if (isAdmin) return;
    if (!datesLoaded || !trulyClosed) router.replace('/account');
  }, [loading, userInfo, isAdmin, datesLoaded, trulyClosed, router]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading || !userInfo) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '14px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2.5px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>Loading…</p>
      </div>
    );
  }

  // ── Access blocked ───────────────────────────────────────────────────────
  if (!canSeeResults) {
    return (
      <div style={{ maxWidth: '500px', margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '56px', marginBottom: '20px' }}>
          {electionStatus === 'OPEN' ? '🗳️' : '🔒'}
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px', letterSpacing: '-0.4px' }}>
          {electionStatus === 'OPEN' ? 'Election is in progress' : 'Election has not started yet'}
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

  // ── Data ─────────────────────────────────────────────────────────────────
  const sorted = [...candidates].sort((a, b) => b.voteCount - a.voteCount);
  const total  = candidates.reduce((s, c) => s + Number(c.voteCount), 0);
  const winner = sorted[0];
  const turnout = genderStats && genderStats.total_approved > 0
    ? ((genderStats.total_voted / genderStats.total_approved) * 100).toFixed(1)
    : '—';

  const rankEmoji = (i: number) => (['🥇','🥈','🥉'] as const)[i] ?? null;
  const rankBg    = (i: number) => ([
    { bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
    { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' },
    { bg: '#fff7ed', color: '#9a3412', border: '#fed7aa' },
  ] as const)[i] ?? { bg: 'var(--surface2)', color: 'var(--text-muted)', border: 'var(--border2)' };

  const genderDonutData = genderStats
    ? Object.entries(GENDER_COLORS)
        .map(([k, v]) => ({ value: (genderStats as any)[k] as number, color: v.color, label: v.label }))
        .filter(d => d.value > 0)
    : [];

  const fadeIn = (delay = 0): React.CSSProperties => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(12px)',
    transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
  });

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px 80px' }}>

      {/* ── Header ── */}
      <div style={{ ...fadeIn(0), display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.6px', marginBottom: '5px' }}>
            Election Results
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
            Final tally · verified on-chain · {networkName || 'Ganache'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500 }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ef4444' }} />
            Polls closed
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500 }}>
            ✓ Immutable ledger
          </span>
        </div>
      </div>

      {/* ── Top stats row ── */}
      <div style={{ ...fadeIn(60), display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '22px' }}>
        <StatCard label="Total votes cast"   value={total}                                         accent="var(--accent)"   />
        <StatCard label="Registered voters"  value={genderStats?.total_approved ?? 0}                                       />
        <StatCard label="Candidates"         value={candidates.length}                                                       />
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: '14px', padding: '20px 22px', boxShadow: '0 1px 4px rgba(10,25,41,.05)' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Voter turnout</div>
          <div style={{ fontSize: '34px', fontWeight: 700, color: '#059669', letterSpacing: '-1.5px', lineHeight: 1, fontFamily: 'var(--font-mono)' }}>{turnout}%</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '5px' }}>of approved voters</div>
        </div>
      </div>

      {/* ── Winner banner ── */}
      {winner && total > 0 && (
        <div style={{ ...fadeIn(120), background: 'linear-gradient(135deg, #1e3a5f 0%, #1d3461 60%, #162447 100%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '22px 28px', marginBottom: '22px', display: 'flex', alignItems: 'center', gap: '20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '-60px', top: '-60px', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(37,99,235,0.12)', pointerEvents: 'none' }} />
          <div style={{ fontSize: '44px', flexShrink: 0 }}>🥇</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Winner</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>{winner.name}</div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', marginTop: '3px' }}>{winner.party}</div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '40px', fontWeight: 700, color: '#fff', lineHeight: 1, letterSpacing: '-2px' }}>{winner.voteCount}</div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '3px' }}>
              {total > 0 ? ((Number(winner.voteCount) / total) * 100).toFixed(1) : 0}% of votes
            </div>
          </div>
        </div>
      )}

      {/* ── Main 2-col grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: '18px', alignItems: 'start', marginBottom: '18px' }}>

        {/* Left col */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* Vote distribution donut */}
          <div style={fadeIn(180)}>
            <Card title="Vote Distribution" sub="Share of total ballots cast">
              <div style={{ padding: '24px 22px' }}>
                {candidates.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '13.5px' }}>No candidates registered.</div>
                ) : (
                  <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <DonutChart data={candidates.map((c, i) => ({ value: Number(c.voteCount), color: PALETTE[i % PALETTE.length], label: c.name }))} size={160} />
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-1px', lineHeight: 1 }}>{total}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px' }}>votes</div>
                      </div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {candidates.map((c, i) => {
                        const pct = total > 0 ? ((Number(c.voteCount) / total) * 100) : 0;
                        return (
                          <div key={c.id}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: PALETTE[i % PALETTE.length], flexShrink: 0 }} />
                                <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 500 }}>{c.name}</span>
                              </div>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>{pct.toFixed(1)}%</span>
                            </div>
                            <AnimatedBar pct={pct} color={PALETTE[i % PALETTE.length]} delay={i * 80} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Voter demographics gender */}
          <div style={fadeIn(240)}>
            <Card title="Voter Demographics" sub="Gender breakdown of approved voters">
              {statsLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '10px', color: 'var(--text-muted)', fontSize: '13px' }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
                  Loading…
                </div>
              ) : genderStats ? (
                <div style={{ padding: '20px 22px' }}>
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ flexShrink: 0, position: 'relative' }}>
                      <DonutChart data={genderDonutData} size={130} />
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{genderStats.total_approved}</div>
                        <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>voters</div>
                      </div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {(Object.entries(GENDER_COLORS) as [keyof typeof GENDER_COLORS, typeof GENDER_COLORS[keyof typeof GENDER_COLORS]][]).map(([key, cfg]) => {
                        const count = (genderStats as any)[key] as number;
                        if (count === 0) return null;
                        const pct = genderStats.total_approved > 0 ? (count / genderStats.total_approved) * 100 : 0;
                        return (
                          <div key={key}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>{cfg.label}</span>
                              </div>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>{count} · {pct.toFixed(1)}%</span>
                            </div>
                            <AnimatedBar pct={pct} color={cfg.color} />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Gender stat chips */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {(Object.entries(GENDER_COLORS) as [keyof typeof GENDER_COLORS, typeof GENDER_COLORS[keyof typeof GENDER_COLORS]][]).map(([key, cfg]) => {
                      const count = (genderStats as any)[key] as number;
                      if (count === 0) return null;
                      const pct = genderStats.total_approved > 0 ? ((count / genderStats.total_approved) * 100).toFixed(1) : '0';
                      return (
                        <div key={key} style={{ background: cfg.bg, border: `1px solid ${cfg.color}22`, borderRadius: '10px', padding: '11px 14px' }}>
                          <div style={{ fontSize: '10px', fontWeight: 600, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>{cfg.label}</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-1px', lineHeight: 1 }}>{count}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>{pct}% of voters</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>Could not load demographic data.</div>
              )}
            </Card>
          </div>
        </div>

        {/* Right col — leaderboard */}
        <div style={fadeIn(150)}>
          <Card title="Leaderboard" sub="Ranked by votes received" badge={`${candidates.length} candidates`}>
            {sorted.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)', fontSize: '13.5px' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🗳️</div>
                No votes recorded.
              </div>
            ) : (
              <div>
                {sorted.map((c, i) => {
                  const pct = total > 0 ? (Number(c.voteCount) / total) * 100 : 0;
                  const rk  = rankBg(i);
                  const em  = rankEmoji(i);
                  const col = PALETTE[candidates.findIndex(x => x.id === c.id) % PALETTE.length];
                  const isWinner = i === 0 && total > 0;

                  return (
                    <div key={c.id} style={{ borderBottom: '1px solid var(--border2)', background: isWinner ? 'rgba(37,99,235,0.025)' : 'transparent' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 22px 8px' }}>
                        {/* Rank badge */}
                        <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: rk.bg, border: `1px solid ${rk.border}`, color: rk.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: em ? '16px' : '13px', fontWeight: em ? 400 : 700, flexShrink: 0 }}>
                          {em ?? i + 1}
                        </div>

                        {/* Candidate avatar */}
                        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: col + '18', border: `1.5px solid ${col}33`, color: col, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, flexShrink: 0 }}>
                          {c.name[0]}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                            {isWinner && <span style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', padding: '1px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 600, flexShrink: 0 }}>WINNER</span>}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{c.party}</div>
                        </div>

                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.5px' }}>{c.voteCount.toLocaleString()}</div>
                          <div style={{ fontSize: '11px', color: col, fontWeight: 600, marginTop: '3px' }}>{pct.toFixed(1)}%</div>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div style={{ padding: '6px 22px 14px' }}>
                        <AnimatedBar pct={pct} color={col} delay={i * 100} />
                      </div>
                    </div>
                  );
                })}

                {/* Total row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 22px', background: 'var(--surface2)' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Total ballots</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{total.toLocaleString()}</span>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* ── Turnout & timeline row ── */}
      <div style={{ ...fadeIn(300), display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>

        {/* Turnout */}
        <Card title="Voter Turnout Analysis" sub="Participation rate among approved voters">
          {genderStats ? (
            <div style={{ padding: '20px 22px' }}>
              {/* Big turnout number */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', marginBottom: '16px' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '52px', fontWeight: 800, color: '#059669', letterSpacing: '-3px', lineHeight: 1 }}>{turnout}%</div>
                <div style={{ paddingBottom: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>participation rate</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {genderStats.total_voted} of {genderStats.total_approved} voted
                  </div>
                </div>
              </div>

              {/* Turnout bar */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ height: '12px', background: 'var(--border2)', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'linear-gradient(90deg, #059669, #34d399)', borderRadius: '99px', width: `${genderStats.total_approved > 0 ? (genderStats.total_voted / genderStats.total_approved * 100) : 0}%`, transition: 'width 1.2s cubic-bezier(0.16,1,0.3,1) 0.3s' }} />
                </div>
              </div>

              {/* Breakdown table */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {[
                  { label: 'Approved voters', value: genderStats.total_approved, color: 'var(--text-primary)' },
                  { label: 'Votes cast',       value: genderStats.total_voted,    color: '#059669' },
                  { label: 'Did not vote',      value: Math.max(0, genderStats.total_approved - genderStats.total_voted), color: 'var(--text-muted)' },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border2)' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{row.label}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 600, color: row.color }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>No data available.</div>
          )}
        </Card>

        {/* Timeline & chain info */}
        <Card title="Election Timeline & Chain Info" sub="Verified blockchain metadata">
          <div style={{ padding: '4px 0' }}>
            {[
              { label: 'Status',        value: 'Closed',                            mono: false, badge: true },
              { label: 'Opened',        value: dates.start || '—',                  mono: true  },
              { label: 'Closed',        value: dates.end   || '—',                  mono: true  },
              { label: 'Network',       value: networkName || 'Ganache · 1337',      mono: true  },
              { label: 'Total votes',   value: String(total),                        mono: true  },
              { label: 'Candidates',    value: String(candidates.length),            mono: true  },
              { label: 'Ledger',        value: 'Verified immutable',                 mono: false, green: true },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 22px', borderBottom: '1px solid var(--border2)', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{row.label}</span>
                {row.badge ? (
                  <span style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 500 }}>● Closed</span>
                ) : row.green ? (
                  <span style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 500 }}>✓ {row.value}</span>
                ) : (
                  <span style={{ fontFamily: row.mono ? 'var(--font-mono)' : 'var(--font-sans)', fontSize: '12px', color: 'var(--text-primary)' }}>{row.value}</span>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Footer note ── */}
      <div style={{ ...fadeIn(380), marginTop: '28px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
          All vote tallies are sourced directly from the Ethereum smart contract and cannot be modified.<br />
          Voter demographic statistics are derived from registration data and do not reveal individual voting choices.
        </p>
      </div>
    </div>
  );
}