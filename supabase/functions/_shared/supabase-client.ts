// Per-request Supabase client. Created from the caller's Authorization header
// so RLS is respected (the client queries as the authenticated user).

import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

export function createUserClient(authHeader: string): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY env vars');
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
}

/** Read the user_preferences row for the authenticated user. Returns null if not found. */
export async function fetchUserPreferences(
  client: SupabaseClient,
  userId: string,
): Promise<import('./ai-prompt.ts').UserPreferences | null> {
  const { data, error } = await client
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('fetchUserPreferences error:', error.message);
    return null;
  }
  return data as import('./ai-prompt.ts').UserPreferences | null;
}
