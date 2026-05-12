'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useWeb3 } from '@/context/Web3Context';
import { supabase } from '@/lib/supabaseClient';

export default function NavBar() {
  const { userInfo, dateTimestamps } = useWeb3();
  const pathname = usePathname();
  const router   = useRouter();

  // Hide navbar on login page
  if (pathname === '/') return null;

  const isAdmin = userInfo?.role === 'admin';

  // Results only visible to voters after election closes
  const nowSec      = Math.floor(Date.now() / 1000);
  const datesLoaded = dateTimestamps.end > 0;
  const isClosed    = datesLoaded && nowSec > dateTimestamps.end;
  const showResults = isAdmin || isClosed;

  const isActive = (path: string) =>
    pathname === path
      ? 'text-white bg-white/10'
      : 'text-white/50 hover:text-white hover:bg-white/7';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const linkStyle = (path: string): React.CSSProperties => ({
    fontSize: '13px', fontWeight: 500, textDecoration: 'none',
    padding: '6px 14px', borderRadius: '6px', transition: 'all 0.16s',
    color: pathname === path ? '#fff' : 'rgba(255,255,255,0.5)',
    background: pathname === path ? 'rgba(255,255,255,0.1)' : 'transparent',
  });

  return (
    <nav style={{ background: 'var(--blue-900)', borderBottom: '1px solid rgba(255,255,255,0.07)', height: '60px', display: 'flex', alignItems: 'center', padding: '0 28px', position: 'sticky', top: 0, zIndex: 100 }}>

      {/* Brand */}
      <Link
        href={isAdmin ? '/admin' : '/account'}
        style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}
      >
        {/* <div style={{ width: '32px', height: '32px', background: 'var(--accent)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: '#fff', fontSize: '14px', fontFamily: 'var(--font-sans)' }}>
          dV
        </div> */}
        <span style={{ fontSize: '16px', fontWeight: 600, color: '#fff', letterSpacing: '-0.3px' }}>Blockchain Voting System</span>
      </Link>

      {/* Links */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
        {userInfo && (
          <>
            {/* Voter links */}
            {!isAdmin && (
              <>
                <Link href="/account" style={linkStyle('/account')}>Dashboard</Link>
                <Link href="/voting"  style={linkStyle('/voting')}>Vote</Link>
                {/* Results only shown when election is closed */}
                {showResults && (
                  <Link href="/results" style={linkStyle('/results')}>Results</Link>
                )}
              </>
            )}

            {/* Admin links */}
            {isAdmin && (
              <>
                <Link href="/admin"   style={linkStyle('/admin')}>Admin</Link>
                <Link href="/results" style={linkStyle('/results')}>Results</Link>
              </>
            )}

            {/* User chip */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '5px 14px 5px 10px', marginLeft: '8px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 0 2px rgba(34,197,94,0.2)', flexShrink: 0 }} />
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>
                {userInfo.name || userInfo.email?.split('@')[0] || 'User'}
              </span>
            </div>

            <button
              onClick={handleLogout}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: 'rgba(248,113,113,0.7)', padding: '6px 10px', borderRadius: '6px', fontFamily: 'var(--font-sans)', transition: 'color 0.16s', marginLeft: '2px' }}
              onMouseOver={e => (e.currentTarget.style.color = '#f87171')}
              onMouseOut={e => (e.currentTarget.style.color = 'rgba(248,113,113,0.7)')}
            >
              Sign out
            </button>
          </>
        )}
      </div>
    </nav>
  );
}