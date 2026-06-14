import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function adminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

async function getRequestingUser(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET(request: NextRequest) {
  const user = await getRequestingUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = adminClient();

  // Check role
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const isAdmin   = profile?.role === 'admin';
  const isClosed  = request.nextUrl.searchParams.get('closed') === '1';

  if (!isAdmin && !isClosed) {
    return NextResponse.json({ error: 'Results not yet available' }, { status: 403 });
  }

  // ── Fetch all voter profiles ───────────────────────────────────────────────
  const { data: voters, error } = await admin
    .from('profiles')
    .select('id, gender, status')
    .eq('role', 'voter');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // ── Aggregate ─────────────────────────────────────────────────────────────
  const approved = (voters ?? []).filter(v => v.status === 'approved');

  const genderCounts: Record<string, number> = {
    male: 0, female: 0, other: 0, prefer_not_to_say: 0, unknown: 0,
  };

  approved.forEach(v => {
    const g = v.gender ?? 'unknown';
    if (genderCounts[g] !== undefined) {
      genderCounts[g]++;
    } else {
      genderCounts.unknown++;
    }
  });

  return NextResponse.json({
    total_registered: (voters ?? []).length,
    total_approved:   approved.length,
    gender: genderCounts,
  });
}