'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWeb3 } from '@/context/Web3Context';
import { supabase } from '@/lib/supabaseClient';

export default function AccountPage() {
  const {
    userInfo, account, hasVoted, dates,
    loading, electionStatus, networkName,
  } = useWeb3();

  const router       = useRouter();
  const searchParams = useSearchParams();

  const [voterStatus, setVoterStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  // Fetch the voter's status from Supabase profiles
  useEffect(() => {
    if (!userInfo?.id) return;
    supabase
      .from('profiles')
      .select('status')
      .eq('id', userInfo.id)
      .maybeSingle()
      .then(({ data }) => {
        setVoterStatus((data?.status as any) ?? 'pending');
        setStatusLoading(false);
      });
  }, [userInfo?.id]);

  if (loading || statusLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '14px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2.5px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>Loading…</p>
      </div>
    );
  }

  const getCTA = () => {
    if (electionStatus === 'CLOSED')
      return { label: 'View results →', path: '/results', disabled: false, style: { background: 'var(--accent)', color: '#fff', boxShadow: '0 2px 8px rgba(29,111,219,0.25)' } };
    if (hasVoted)
      return { label: 'Vote recorded ✓', path: '#', disabled: true, style: { background: 'rgba(5,150,105,0.1)', color: 'var(--success)', border: '1px solid rgba(5,150,105,0.25)', cursor: 'not-allowed' } };
    if (voterStatus === 'rejected')
      return { label: 'Registration rejected', path: '#', disabled: true, style: { background: 'rgba(220,38,38,0.08)', color: 'var(--danger)', border: '1px solid rgba(220,38,38,0.2)', cursor: 'not-allowed' } };
    if (voterStatus === 'pending')
      return { label: 'Awaiting approval', path: '#', disabled: true, style: { background: 'rgba(217,119,6,0.08)', color: 'var(--warning)', border: '1px solid rgba(217,119,6,0.2)', cursor: 'not-allowed' } };
    if (electionStatus === 'UPCOMING')
      return { label: 'Polls not open yet', path: '#', disabled: true, style: { background: 'var(--surface2)', color: 'var(--text-muted)', border: '1px solid var(--border2)', cursor: 'not-allowed' } };
    return { label: 'Go to voting booth →', path: '/voting', disabled: false, style: { background: 'var(--accent)', color: '#fff', boxShadow: '0 2px 8px rgba(29,111,219,0.25)' } };
  };
  const cta = getCTA();

  const nameInitial = userInfo?.name ? userInfo.name[0].toUpperCase() : 'V';

  const sc: Record<string, { bg: string; color: string; dot: string; border: string }> = {
    OPEN:     { bg: '#ecfdf5', color: '#065f46', dot: '#10b981', border: '#a7f3d0' },
    CLOSED:   { bg: '#fef2f2', color: '#991b1b', dot: '#ef4444', border: '#fecaca' },
    UPCOMING: { bg: '#fffbeb', color: '#92400e', dot: '#f59e0b', border: '#fde68a' },
  };
  const s = sc[electionStatus] ?? sc.UPCOMING;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 24px 60px' }}>

      {/* Status banners */}
      {voterStatus === 'pending' && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '14px 18px', display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '20px', fontSize: '13px', color: '#78350f', lineHeight: 1.5 }}>
          <span style={{ fontSize: '18px', flexShrink: 0 }}>⏳</span>
          <div>
            <strong>Registration pending admin approval.</strong>
            {' '}Your account is under review. You will be able to vote once an admin approves your registration.
          </div>
        </div>
      )}

      {voterStatus === 'rejected' && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '14px 18px', display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '20px', fontSize: '13px', color: '#991b1b', lineHeight: 1.5 }}>
          <span style={{ fontSize: '18px', flexShrink: 0 }}>❌</span>
          <div>
            <strong>Registration rejected.</strong>
            {' '}Your registration was not approved. Please contact the election administrator for more information.
          </div>
        </div>
      )}

      {voterStatus === 'approved' && !hasVoted && electionStatus === 'OPEN' && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '14px 18px', display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '20px', fontSize: '13px', color: '#065f46', lineHeight: 1.5 }}>
          <span style={{ fontSize: '18px', flexShrink: 0 }}>✅</span>
          <div>
            <strong>You are approved to vote!</strong>
            {' '}The polls are open. Click the button to cast your vote now.
          </div>
        </div>
      )}

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, var(--blue-800) 0%, var(--blue-700) 100%)', borderRadius: '20px', padding: '28px 32px', display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: '-40px', top: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

        <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', fontWeight: 600, color: '#fff', flexShrink: 0, position: 'relative', zIndex: 1 }}>
          {nameInitial}
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '22px', fontWeight: 600, color: '#fff', letterSpacing: '-0.4px' }}>
            {userInfo?.name || userInfo?.email?.split('@')[0] || 'Voter'}
          </div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '3px' }}>
            {userInfo?.email}
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', padding: '3px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, color: 'rgba(255,255,255,0.8)', marginTop: '8px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
              background: voterStatus === 'approved' ? '#22c55e' : voterStatus === 'rejected' ? '#ef4444' : '#f59e0b',
            }} />
            {voterStatus === 'approved' ? 'Approved Voter' : voterStatus === 'rejected' ? 'Rejected' : 'Pending Approval'}
          </div>
        </div>

        <div style={{ marginLeft: 'auto', position: 'relative', zIndex: 1 }}>
          <button
            onClick={() => !cta.disabled && router.push(cta.path)}
            disabled={cta.disabled}
            style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '14px', padding: '12px 24px', borderRadius: '10px', border: 'none', cursor: cta.disabled ? 'not-allowed' : 'pointer', transition: 'all 0.18s', whiteSpace: 'nowrap', ...cta.style }}
          >
            {cta.label}
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>

        <StatCard icon="🗓️" iconBg="var(--gold-dim)" label="Election status">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: s.bg, color: s.color, border: `1px solid ${s.border}`, padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 500 }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
            {electionStatus}
          </span>
        </StatCard>

        <StatCard icon="🗳️" iconBg="var(--accent-dim)" label="Your vote">
          <div style={{ fontSize: '15px', fontWeight: 600, color: hasVoted ? 'var(--success)' : 'var(--text-primary)', marginTop: '4px' }}>
            {hasVoted ? 'Cast ✓' : 'Not yet cast'}
          </div>
        </StatCard>

        <StatCard icon="✅" iconBg="rgba(5,150,105,0.1)" label="Approval">
          <div style={{ marginTop: '4px' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 500,
              background: voterStatus === 'approved' ? '#ecfdf5' : voterStatus === 'rejected' ? '#fef2f2' : '#fffbeb',
              color:      voterStatus === 'approved' ? '#065f46' : voterStatus === 'rejected' ? '#991b1b' : '#92400e',
              border:     `1px solid ${voterStatus === 'approved' ? '#a7f3d0' : voterStatus === 'rejected' ? '#fecaca' : '#fde68a'}`,
            }}>
              {voterStatus === 'approved' ? '✓ Approved' : voterStatus === 'rejected' ? '✕ Rejected' : '⏳ Pending'}
            </span>
          </div>
        </StatCard>

        <StatCard icon="🔗" iconBg="var(--accent-dim)" label="Network">
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginTop: '4px' }}>
            {networkName || 'Ganache'}
          </div>
        </StatCard>

      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Timeline */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(10,25,41,.07)' }}>
          <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border2)' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Election timeline</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Voting window schedule</div>
          </div>
          <div style={{ padding: '18px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: '10px', padding: '14px 18px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px', fontWeight: 500 }}>Opens</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12.5px', color: 'var(--text-primary)', fontWeight: 500 }}>{dates.start || '—'}</div>
              </div>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px', fontWeight: 500 }}>Closes</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12.5px', color: 'var(--text-primary)', fontWeight: 500 }}>{dates.end || '—'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Identity */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(10,25,41,.07)' }}>
          <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border2)' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Account details</div>
          </div>
          <div style={{ padding: '4px 0' }}>
            <InfoRow label="User ID"  value={userInfo?.id ? `${userInfo.id.slice(0, 14)}…` : '—'} />
            <InfoRow label="Email"    value={userInfo?.email || '—'} />
            <InfoRow label="Wallet"   value={account ? `${account.slice(0, 10)}…${account.slice(-8)}` : 'Not connected'} />
            <InfoRow label="Role"     value={userInfo?.role || 'voter'} />
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ icon, iconBg, label, children }: { icon: string; iconBg: string; label: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: '14px', padding: '18px 20px', boxShadow: '0 1px 3px rgba(10,25,41,.06)' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', marginBottom: '10px' }}>{icon}</div>
      <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>{label}</div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 22px', borderBottom: '1px solid var(--border2)', fontSize: '13px' }}>
      <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}