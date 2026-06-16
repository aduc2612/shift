import { useAuth } from '@/features/auth/hooks/useAuth';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';

export function useOnboardingRouting() {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const { data: onboardingCompleted, isLoading: statusLoading } = useOnboardingStatus(
    user?.id ?? null,
  );

  const loading = authLoading || statusLoading;

  return {
    loading,
    shouldShowAuth: !loading && !isAuthenticated,
    shouldShowOnboarding: !loading && isAuthenticated && !onboardingCompleted,
    shouldShowTabs: !loading && isAuthenticated && !!onboardingCompleted,
  };
}
