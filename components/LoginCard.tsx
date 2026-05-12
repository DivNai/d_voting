'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'react-hot-toast';

type Tab = 'login' | 'register';

export default function LoginCard({ onLogin }: { onLogin: (role: string) => void }) {
  const [tab, setTab] = useState<Tab>('login');

  // Login
  const [loginEmail,    setLoginEmail]    = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading,  setLoginLoading]  = useState(false);

  // Register
  const [regFullName, setRegFullName] = useState('');
  const [regEmail,    setRegEmail]    = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm,  setRegConfirm]  = useState('');
  const [regLoading,  setRegLoading]  = useState(false);

  /* ── LOGIN ──────────────────────────────────────────────────────────────── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email:    loginEmail.trim(),
        password: loginPassword,
      });
      if (error) throw error;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', authData.user.id)
        .maybeSingle();

      const role = profile?.role ?? 'voter';
      onLogin(role);
      toast.success('Signed in successfully');
      await new Promise(res => setTimeout(res, 200));
      window.location.href = role === 'admin' ? '/admin' : '/account';
    } catch (err: any) {
      toast.error(err.message || 'Invalid email or password.');
    } finally {
      setLoginLoading(false);
    }
  };

  /* ── REGISTER ───────────────────────────────────────────────────────────── */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!regFullName.trim())        return toast.error('Full name is required.');
    if (regPassword !== regConfirm) return toast.error('Passwords do not match.');
    if (regPassword.length < 6)     return toast.error('Password must be at least 6 characters.');

    setRegLoading(true);
    try {
      // Step 1 — create auth account
      const { data, error } = await supabase.auth.signUp({
        email:    regEmail.trim(),
        password: regPassword,
      });

      if (error) throw error;

      // Step 2 — CRITICAL CHECK: make sure the user was actually created
      // signUp returns data.user = null when email confirmation is required
      // or when the domain is blocked by Supabase
      if (!data.user) {
        throw new Error(
          'Account could not be created. Make sure "Confirm email" is disabled in ' +
          'Supabase → Authentication → Providers → Email, and that signups are enabled.'
        );
      }

      // Step 3 — insert profile row only if auth user was created
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id:        data.user.id,
          role:      'voter',
          full_name: regFullName.trim(),
          status:    'pending',
        });

      if (profileError) {
        // Profile insert failed — clean up the auth user to avoid orphaned records
        console.error('Profile insert failed:', profileError.message);
        throw new Error('Account setup failed. Please try again.');
      }

      toast.success('Account created! Please wait for admin approval before voting.');
      setTab('login');
      setLoginEmail(regEmail.trim());
      setRegFullName('');
      setRegEmail('');
      setRegPassword('');
      setRegConfirm('');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed.');
    } finally {
      setRegLoading(false);
    }
  };

  /* ── STYLES ─────────────────────────────────────────────────────────────── */
  const inputStyle: React.CSSProperties = {
    width: '100%', fontFamily: 'var(--font-sans)', fontSize: '14px',
    color: 'var(--text-primary)', background: 'var(--surface)',
    border: '1.5px solid var(--border)', borderRadius: '10px',
    padding: '10px 14px', outline: 'none',
    transition: 'border-color 0.16s, box-shadow 0.16s',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '13px', fontWeight: 500,
    color: 'var(--text-secondary)', marginBottom: '6px',
  };
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'var(--accent)';
    e.target.style.boxShadow   = '0 0 0 3px rgba(29,111,219,0.1)';
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'var(--border)';
    e.target.style.boxShadow   = 'none';
  };
  const btnStyle = (loading: boolean): React.CSSProperties => ({
    width: '100%', padding: '12px', borderRadius: '10px',
    background: loading ? 'var(--border)' : 'var(--accent)',
    color:      loading ? 'var(--text-muted)' : '#fff',
    border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
    fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-sans)',
    transition: 'all 0.18s',
    boxShadow: loading ? 'none' : '0 2px 8px rgba(29,111,219,0.25)',
  });

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, var(--blue-900) 0%, var(--blue-800) 40%, #0f2d52 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.018) 40px, rgba(255,255,255,0.018) 41px)' }} />
      <div style={{ position: 'absolute', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(29,111,219,0.18) 0%, transparent 70%)', top: '-200px', right: '-100px', pointerEvents: 'none' }} />

      <div style={{ background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '22px', width: '100%', maxWidth: '440px', boxShadow: '0 24px 64px rgba(0,0,0,0.35)', position: 'relative', zIndex: 1, overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ background: 'var(--blue-900)', padding: '28px 32px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ width: '44px', height: '44px', background: 'var(--accent)', borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '14px' }}>dV</div>
          <div style={{ fontSize: '20px', fontWeight: 600, color: '#fff', letterSpacing: '-0.4px' }}>
            {tab === 'login' ? 'Sign in to dVote' : 'Create your account'}
          </div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '3px' }}>
            Decentralized Electronic Voting System
          </div>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: '2px', padding: '16px 32px 0', background: 'var(--surface)' }}>
          {(['login', 'register'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, padding: '8px 0', borderRadius: '8px', border: 'none', cursor: 'pointer', transition: 'all 0.16s', background: tab === t ? 'var(--accent-dim)' : 'transparent', color: tab === t ? 'var(--accent)' : 'var(--text-muted)' }}>
              {t === 'login' ? 'Sign in' : 'Register'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ padding: '24px 32px 28px' }}>

          {/* ══ LOGIN ══ */}
          {tab === 'login' && (
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Email address</label>
                <input
                  style={inputStyle} type="text" required
                  placeholder="you@gmail.com"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  onFocus={onFocus} onBlur={onBlur}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Password</label>
                <input
                  style={inputStyle} type="password" required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  onFocus={onFocus} onBlur={onBlur}
                />
              </div>
              <button type="submit" disabled={loginLoading} style={btnStyle(loginLoading)}>
                {loginLoading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          )}

          {/* ══ REGISTER ══ */}
          {tab === 'register' && (
            <form onSubmit={handleRegister}>
              {/* Info notice */}
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '11px 14px', fontSize: '13px', color: '#78350f', marginBottom: '18px', lineHeight: 1.5 }}>
                ⏳ After registration, an admin must approve your account before you can vote.
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Full name</label>
                <input
                  style={inputStyle} type="text" required
                  placeholder="As on your Voter ID"
                  value={regFullName}
                  onChange={e => setRegFullName(e.target.value)}
                  onFocus={onFocus} onBlur={onBlur}
                />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Email address</label>
                <input
                  style={inputStyle} type="text" required
                  placeholder="you@gmail.com"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  onFocus={onFocus} onBlur={onBlur}
                />
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Use a valid email — gmail.com, yahoo.com, outlook.com etc.
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={labelStyle}>Password</label>
                  <input
                    style={inputStyle} type="password" required
                    placeholder="Min. 6 chars"
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    onFocus={onFocus} onBlur={onBlur}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Confirm</label>
                  <input
                    style={inputStyle} type="password" required
                    placeholder="Repeat"
                    value={regConfirm}
                    onChange={e => setRegConfirm(e.target.value)}
                    onFocus={onFocus} onBlur={onBlur}
                  />
                </div>
              </div>
              <button type="submit" disabled={regLoading} style={btnStyle(regLoading)}>
                {regLoading ? 'Creating account…' : 'Create account'}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 32px', background: 'var(--surface2)', borderTop: '1px solid var(--border2)', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
          All votes are recorded on the Ethereum blockchain and cannot be altered.
        </div>
      </div>
    </div>
  );
}