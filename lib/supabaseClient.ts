import { createBrowserClient } from '@supabase/ssr';

// IMPORTANT: Must use createBrowserClient from @supabase/ssr
// NOT createClient from @supabase/supabase-js.
//
// createClient stores the session in localStorage.
// createBrowserClient stores the session in cookies.
// The middleware reads cookies — so if we use createClient here,
// the middleware never sees the session and redirects back to / every time.

const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local'
  );
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);