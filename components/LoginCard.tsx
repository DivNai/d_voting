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
  const [regFullName,   setRegFullName]   = useState('');
  const [regEmail,      setRegEmail]      = useState('');
  const [regPassword,   setRegPassword]   = useState('');
  const [regConfirm,    setRegConfirm]    = useState('');
  const [regAadhaar,    setRegAadhaar]    = useState('');
  const [regGender,     setRegGender]     = useState('');
  const [regDob,        setRegDob]        = useState('');
  const [regLoading,    setRegLoading]    = useState(false);

  /* ── LOGIN ──────────────────────────────────────────────────────────────── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email:    loginEmail.trim().toLowerCase(),
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

    // ── Validation ────────────────────────────────────────────────────────
    if (!regFullName.trim())        return toast.error('Full name is required.');
    if (!regAadhaar.trim())         return toast.error('Aadhaar / Unique ID is required.');
    // Aadhaar: exactly 12 digits (allow generic unique IDs of 8–20 alphanumeric chars)
    const aadhaarClean = regAadhaar.replace(/\s/g, '');
    if (!/^\d{12}$/.test(aadhaarClean) && !/^[A-Za-z0-9]{8,20}$/.test(aadhaarClean))
      return toast.error('Enter a valid 12-digit Aadhaar or 8–20 character Unique ID.');
    if (!regGender)                 return toast.error('Please select your gender.');
    if (!regDob)                    return toast.error('Date of birth is required.');
    // Voter must be at least 18 years old
    const dob = new Date(regDob);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear() -
      (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);
    if (isNaN(dob.getTime()))       return toast.error('Please enter a valid date of birth.');
    if (age < 18)                   return toast.error('You must be at least 18 years old to register.');
    if (regPassword !== regConfirm) return toast.error('Passwords do not match.');
    if (regPassword.length < 6)     return toast.error('Password must be at least 6 characters.');

    setRegLoading(true);
    try {
      // Step 1 — Check Aadhaar uniqueness before creating auth user
      const { data: existingAadhaar } = await supabase
        .from('profiles')
        .select('id')
        .eq('aadhaar_id', aadhaarClean)
        .maybeSingle();

      if (existingAadhaar) {
        throw new Error('This Aadhaar / Unique ID is already registered.');
      }

      // Step 2 — create auth account
      const { data, error } = await supabase.auth.signUp({
        email:    regEmail.trim().toLowerCase(),
        password: regPassword,
      });

      if (error) throw error;

      if (!data.user) {
        throw new Error(
          'Account could not be created. Make sure "Confirm email" is disabled in ' +
          'Supabase → Authentication → Providers → Email, and that signups are enabled.'
        );
      }

      // Step 3 — insert profile row
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id:         data.user.id,
          role:       'voter',
          full_name:  regFullName.trim(),
          status:     'pending',
          aadhaar_id: aadhaarClean,
          gender:     regGender,
          dob:        regDob,
        });

      if (profileError) {
        // If duplicate aadhaar_id hits the DB unique constraint
        if (profileError.code === '23505') {
          throw new Error('This Aadhaar / Unique ID is already registered.');
        }
        console.error('Profile insert failed:', profileError.message);
        throw new Error('Account setup failed. Please try again.');
      }

      toast.success('Account created! Please wait for admin approval before voting.');
      setTab('login');
      setLoginEmail(regEmail.trim().toLowerCase());
      // Reset register fields
      setRegFullName('');
      setRegEmail('');
      setRegPassword('');
      setRegConfirm('');
      setRegAadhaar('');
      setRegGender('');
      setRegDob('');
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
    boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '13px', fontWeight: 500,
    color: 'var(--text-secondary)', marginBottom: '6px',
  };
  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.target.style.borderColor = 'var(--accent)';
    e.target.style.boxShadow   = '0 0 0 3px rgba(29,111,219,0.1)';
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
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

  // Max DOB = today minus 18 years
  const maxDob = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().split('T')[0];
  })();

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, var(--blue-900) 0%, var(--blue-800) 40%, #0f2d52 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.018) 40px, rgba(255,255,255,0.018) 41px)' }} />
      <div style={{ position: 'absolute', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(29,111,219,0.18) 0%, transparent 70%)', top: '-200px', right: '-100px', pointerEvents: 'none' }} />

      <div style={{ background: 'var(--surface)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '22px', width: '100%', maxWidth: '460px', boxShadow: '0 24px 64px rgba(0,0,0,0.35)', position: 'relative', zIndex: 1, overflow: 'hidden' }}>

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
                  style={inputStyle} type="email" required
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

              {/* Full Name */}
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Full name <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input
                  style={inputStyle} type="text" required
                  placeholder="As on your Voter ID"
                  value={regFullName}
                  onChange={e => setRegFullName(e.target.value)}
                  onFocus={onFocus} onBlur={onBlur}
                />
              </div>

              {/* Aadhaar / Unique ID */}
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>
                  Aadhaar / Unique ID <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  style={inputStyle} type="text" required
                  placeholder="12-digit Aadhaar number"
                  value={regAadhaar}
                  maxLength={20}
                  onChange={e => setRegAadhaar(e.target.value)}
                  onFocus={onFocus} onBlur={onBlur}
                />
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Must be unique — each ID can only register once.
                </div>
              </div>

              {/* Gender + DOB row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={labelStyle}>Gender <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <select
                    required
                    value={regGender}
                    onChange={e => setRegGender(e.target.value)}
                    onFocus={onFocus as any} onBlur={onBlur as any}
                    style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
                  >
                    <option value="" disabled>Select…</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Date of birth <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input
                    style={inputStyle} type="date" required
                    max={maxDob}
                    value={regDob}
                    onChange={e => setRegDob(e.target.value)}
                    onFocus={onFocus} onBlur={onBlur}
                  />
                </div>
              </div>

              {/* Email */}
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Email address <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input
                  style={inputStyle} type="email" required
                  placeholder="you@gmail.com"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  onFocus={onFocus} onBlur={onBlur}
                />
              </div>

              {/* Password + Confirm */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={labelStyle}>Password <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input
                    style={inputStyle} type="password" required
                    placeholder="Min. 6 chars"
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    onFocus={onFocus} onBlur={onBlur}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Confirm <span style={{ color: 'var(--danger)' }}>*</span></label>
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