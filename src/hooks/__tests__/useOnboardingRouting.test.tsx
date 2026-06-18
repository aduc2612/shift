import { renderHook, waitFor } from '@testing-library/react-native';
import { useOnboardingRouting } from '@/features/onboarding/hooks/useOnboardingRouting';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/hooks/useOnboardingStatus', () => ({
  useOnboardingStatus: jest.fn(),
}));

jest.mock('@/hooks/useSubscription', () => ({
  useSubscription: jest.fn(),
}));

import { useAuth } from '@/features/auth/hooks/useAuth';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';
import { useSubscription } from '@/hooks/useSubscription';

const mockedUseAuth = jest.mocked(useAuth);
const mockedStatus = jest.mocked(useOnboardingStatus);
const mockedSub = jest.mocked(useSubscription);

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return React.createElement(QueryClientProvider, { client: qc }, children);
}

describe('useOnboardingRouting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedSub.mockReturnValue({
      isSubscribed: true,
      isLoading: false,
      customerInfo: null,
      refresh: jest.fn(),
    });
  });

  it('shows auth when not authenticated', async () => {
    mockedUseAuth.mockReturnValue({
      session: null,
      user: null,
      isAuthenticated: false,
      loading: false,
    });
    mockedStatus.mockReturnValue({
      data: false,
      isLoading: false,
    } as ReturnType<typeof useOnboardingStatus>);

    const { result } = await renderHook(() => useOnboardingRouting(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.shouldShowAuth).toBe(true);
    expect(result.current.shouldShowOnboarding).toBe(false);
    expect(result.current.shouldShowTabs).toBe(false);
  });

  it('shows onboarding when authenticated and not completed', async () => {
    mockedUseAuth.mockReturnValue({
      session: null,
      user: { id: 'u1', app_metadata: {}, user_metadata: {}, aud: '', created_at: '' },
      isAuthenticated: true,
      loading: false,
    });
    mockedStatus.mockReturnValue({
      data: false,
      isLoading: false,
    } as ReturnType<typeof useOnboardingStatus>);

    const { result } = await renderHook(() => useOnboardingRouting(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.shouldShowAuth).toBe(false);
    expect(result.current.shouldShowOnboarding).toBe(true);
    expect(result.current.shouldShowTabs).toBe(false);
  });
});
