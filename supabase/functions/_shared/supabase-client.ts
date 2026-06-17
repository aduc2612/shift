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
    .select('user_id, productivity_peak, wake_up_time, scheduling_context, onboarding_completed, persona, sleep_time, pain_points, hard_constraints')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('fetchUserPreferences error:', error.message);
    return null;
  }
  if (!data) return null;

  // Map snake_case DB columns to camelCase TypeScript type
  return {
    userId: data.user_id,
    productivityPeak: data.productivity_peak,
    wakeUpTime: data.wake_up_time,
    schedulingContext: data.scheduling_context,
    onboardingCompleted: data.onboarding_completed,
    persona: data.persona,
    sleepTime: data.sleep_time,
    painPoints: data.pain_points,
    hardConstraints: data.hard_constraints,
  } as import('./ai-prompt.ts').UserPreferences;
}
