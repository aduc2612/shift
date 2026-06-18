import { supabase } from '@/services/supabase';
import type { OnboardingData } from '@/types/onboarding';
import { buildUserContextText } from './utils';

export async function saveOnboardingData(
  userId: string,
  data: OnboardingData,
): Promise<void> {
  const payload = {
    user_id: userId,
    onboarding_completed: true,
    sleep_time: data.sleepTime,
    wake_up_time: data.wakeUpTime,
    user_context: buildUserContextText(data),
  };

  const { error } = await supabase
    .from('user_preferences')
    .upsert(payload, { onConflict: 'user_id' });

  if (error) {
    throw new Error(`saveOnboardingData failed: ${error.message}`);
  }
}
