import { supabase } from '@/services/supabase';
import type { OnboardingData } from '@/types/onboarding';

export async function saveOnboardingData(
  userId: string,
  data: OnboardingData,
): Promise<void> {
  const payload = {
    user_id: userId,
    onboarding_completed: true,
    persona: data.persona,
    sleep_time: data.sleepTime,
    wake_up_time: data.wakeUpTime,
    productivity_peak: data.productivityPeak,
    pain_points: data.painPoints,
    hard_constraints: data.hardConstraints,
    scheduling_context: data.schedulingContext,
  };

  const { error } = await supabase
    .from('user_preferences')
    .upsert(payload, { onConflict: 'user_id' });

  if (error) {
    throw new Error(`saveOnboardingData failed: ${error.message}`);
  }
}
