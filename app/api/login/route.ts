import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Use the service-role key server-side so role lookups bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  // Sign in via the standard client (not service-role) to get an actual session
  const { createClient: createBrowserClient } = await import('@supabase/supabase-js');
  const authClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 401 });
  }

  // Use service-role client for the profile lookup — bypasses RLS reliably
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', authData.user.id)
    .single();

  if (profileError) {
    return NextResponse.json({ error: 'Could not load user profile' }, { status: 500 });
  }

  return NextResponse.json({
    user: authData.user,
    role: profile?.role ?? 'voter',
    name: profile?.full_name ?? '',
  });
}