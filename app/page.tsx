'use client';

import { useWeb3 } from '@/context/Web3Context';
import LoginCard from '@/components/LoginCard';

export default function Page() {
  const { loading } = useWeb3();

  // NOTE: We deliberately do NOT redirect here.
  // LoginCard.tsx handles router.push() itself after a successful login
  // so the session cookie is guaranteed to exist before navigation.
  // A competing useEffect here would race with that and cause a redirect loop.

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, var(--blue-900) 0%, var(--blue-800) 40%, #0f2d52 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            border: '2.5px solid rgba(29,111,219,0.25)',
            borderTopColor: 'var(--accent)',
            animation: 'spin 0.8s linear infinite',
          }} />
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em' }}>
            LOADING
          </p>
        </div>
      </div>
    );
  }

  return <LoginCard onLogin={() => {}} />;
}