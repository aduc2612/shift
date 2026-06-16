import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';

async function fetchOnboardingStatus(userId: string | null): Promise<boolean> {
  if (!userId) return false;
  const { data, error } = await supabase
    .from('user_preferences')
    .select('onboarding_completed')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data?.onboarding_completed ?? false;
}

export function useOnboardingStatus(userId: string | null) {
  return useQuery({
    queryKey: ['onboardingStatus', userId],
    queryFn: () => fetchOnboardingStatus(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}
