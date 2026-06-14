import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// BUG FIX: Use anon key for authentication (not service-role).
// Service-role key should only be used for admin operations that bypass RLS.
// Using it for signInWithPassword still works but is unnecessary exposure.
const anonClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Service-role client for profile lookup (bypasses RLS reliably)
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  // BUG FIX: wrap JSON parse in try/catch
  let email: string, password: string;
  try {
    ({ email, password } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  // BUG FIX: normalise email to lowercase before sign-in
  const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 401 });
  }

  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('role, full_name, status')
    .eq('id', authData.user.id)
    .single();

  if (profileError) {
    return NextResponse.json({ error: 'Could not load user profile' }, { status: 500 });
  }

  return NextResponse.json({
    user: authData.user,
    role:   profile?.role   ?? 'voter',
    name:   profile?.full_name ?? '',
    status: profile?.status ?? 'pending',
  });
}