import { useAuth } from '@/features/auth/hooks/useAuth';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';
import { useSubscription } from '@/hooks/useSubscription';

export function useOnboardingRouting() {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const { data: onboardingCompleted, isLoading: statusLoading, isError: onbError } = useOnboardingStatus(
    user?.id ?? null,
  );
  const { isSubscribed, isLoading: subLoading, error: subError } = useSubscription();

  const loading = authLoading || statusLoading || subLoading || !!subError || onbError;

  return {
    loading,
    shouldShowAuth: !loading && !isAuthenticated,
    shouldShowOnboarding: !loading && isAuthenticated && !onboardingCompleted,
    shouldShowPaywall: !loading && isAuthenticated && !!onboardingCompleted && !isSubscribed,
    shouldShowTabs: !loading && isAuthenticated && !!onboardingCompleted && !!isSubscribed,
  };
}
