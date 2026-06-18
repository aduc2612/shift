import { supabase } from '@/services/supabase';
import type { UserPreferences } from '@/types/userPreferences';

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
};

export type UserPreferencesUpdate = {
  wakeUpTime?: string;
  sleepTime?: string;
  userContext?: string;
};

export async function fetchUserProfile(): Promise<UserProfile> {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw new Error(`fetchUserProfile failed: ${error.message}`);
  }
  const user = data?.user;
  if (!user) {
    throw new Error('fetchUserProfile failed: user not signed in');
  }

  const metadata = (user.user_metadata ?? {}) as {
    full_name?: string;
    name?: string;
    avatar_url?: string;
    picture?: string;
  };

  return {
    id: user.id,
    email: user.email ?? '',
    name: metadata.full_name ?? metadata.name ?? '',
    avatarUrl: metadata.avatar_url ?? metadata.picture ?? null,
  };
}

export async function fetchUserPreferences(
  userId: string,
): Promise<UserPreferences> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('user_id, wake_up_time, sleep_time, user_context, onboarding_completed')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(`fetchUserPreferences failed: ${error.message}`);
  }

  if (!data) {
    return {
      userId,
      wakeUpTime: '07:00',
      sleepTime: '23:00',
      userContext: '',
      onboardingCompleted: false,
    };
  }

  // wake_up_time is stored as "HH:MM:SS" — strip seconds for our HH:MM format
  const wakeUpTime = (data.wake_up_time as string | null)?.slice(0, 5) ?? '07:00';
  const sleepTime = (data.sleep_time as string | null)?.slice(0, 5) ?? '23:00';

  return {
    userId: data.user_id as string,
    wakeUpTime,
    sleepTime,
    userContext: (data.user_context as string | null) ?? '',
    onboardingCompleted: Boolean(data.onboarding_completed),
  };
}

export async function updateUserPreferences(
  userId: string,
  update: UserPreferencesUpdate,
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (update.wakeUpTime !== undefined) payload.wake_up_time = update.wakeUpTime;
  if (update.sleepTime !== undefined) payload.sleep_time = update.sleepTime;
  if (update.userContext !== undefined) payload.user_context = update.userContext;

  const { error } = await supabase
    .from('user_preferences')
    .upsert({ user_id: userId, ...payload }, { onConflict: 'user_id' });

  if (error) {
    throw new Error(`updateUserPreferences failed: ${error.message}`);
  }
}
