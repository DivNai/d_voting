import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Helper — creates a Supabase client with SERVICE ROLE key (bypasses RLS)
function adminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: { getAll: () => [], setAll: () => {} },
    }
  );
}

// Helper — creates a normal client to verify the requesting user is an admin
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

// ── GET /api/admin/voters ─────────────────────────────────────────────────────
// Returns all voter profiles (role = 'voter')
export async function GET(request: NextRequest) {
  const user = await getRequestingUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify the requesting user is actually an admin
  const admin = adminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Fetch all voters using service role key — bypasses RLS
  // BUG FIX: also select new fields aadhaar_id, gender, dob
  const { data: voters, error } = await admin
    .from('profiles')
    .select('id, full_name, voter_id, aadhaar_id, gender, dob, status')
    .eq('role', 'voter')
    .order('status');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ voters });
}

// ── PATCH /api/admin/voters ───────────────────────────────────────────────────
// Updates a voter's status to 'approved' or 'rejected'
export async function PATCH(request: NextRequest) {
  const user = await getRequestingUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = adminClient();

  // Verify admin role
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // BUG FIX: wrap JSON parse in try/catch to handle malformed bodies
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { voterId, status } = body;

  if (!voterId || !['approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { error } = await admin
    .from('profiles')
    .update({ status })
    .eq('id', voterId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, voterId, status });
}