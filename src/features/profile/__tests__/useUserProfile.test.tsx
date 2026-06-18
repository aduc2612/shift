import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const mockFetchUserProfile = jest.fn();
const mockFetchUserPreferences = jest.fn();

jest.mock('../api', () => ({
  fetchUserProfile: () => mockFetchUserProfile(),
  fetchUserPreferences: (id: string) => mockFetchUserPreferences(id),
  updateUserPreferences: jest.fn(),
}));

jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'u-1' } }),
}));

import { useUserProfile } from '../hooks/useUserProfile';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useUserProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns loading state initially', async () => {
    mockFetchUserProfile.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ id: 'u-1', email: 'a@b.com', name: 'A', avatarUrl: null }), 10)),
    );
    mockFetchUserPreferences.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ userId: 'u-1', wakeUpTime: '07:00', sleepTime: '23:00', userContext: '', onboardingCompleted: false }), 10)),
    );

    const { result } = await renderHook(() => useUserProfile(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it('returns user data after fetch', async () => {
    mockFetchUserProfile.mockResolvedValue({
      id: 'u-1',
      email: 'jordan@example.com',
      name: 'Jordan Doe',
      avatarUrl: null,
    });
    mockFetchUserPreferences.mockResolvedValue({
      userId: 'u-1',
      wakeUpTime: '08:00',
      sleepTime: '22:30',
      userContext: 'hello',
      onboardingCompleted: true,
    });

    const { result } = await renderHook(() => useUserProfile(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.profile?.email).toBe('jordan@example.com');
    expect(result.current.profile?.name).toBe('Jordan Doe');
    expect(result.current.preferences?.wakeUpTime).toBe('08:00');
  });

  it('returns error on failure', async () => {
    mockFetchUserProfile.mockRejectedValue(new Error('boom'));
    mockFetchUserPreferences.mockResolvedValue({
      userId: 'u-1',
      wakeUpTime: '07:00',
      sleepTime: '23:00',
      userContext: '',
      onboardingCompleted: false,
    });

    const { result } = await renderHook(() => useUserProfile(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.profileError).toBeTruthy();
    });

    expect(result.current.profileError?.message).toBe('boom');
  });
});

describe('useUserProfile — initials', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('derives initials from name', async () => {
    mockFetchUserProfile.mockResolvedValue({
      id: 'u-1',
      email: 'jordan@example.com',
      name: 'Jordan Doe',
      avatarUrl: null,
    });
    mockFetchUserPreferences.mockResolvedValue({
      userId: 'u-1',
      wakeUpTime: '07:00',
      sleepTime: '23:00',
      userContext: '',
      onboardingCompleted: false,
    });

    const { result } = await renderHook(() => useUserProfile(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.initials).toBe('JD');
    });
  });

  it('falls back to email local part when no name', async () => {
    mockFetchUserProfile.mockResolvedValue({
      id: 'u-1',
      email: 'jordan@example.com',
      name: '',
      avatarUrl: null,
    });
    mockFetchUserPreferences.mockResolvedValue({
      userId: 'u-1',
      wakeUpTime: '07:00',
      sleepTime: '23:00',
      userContext: '',
      onboardingCompleted: false,
    });

    const { result } = await renderHook(() => useUserProfile(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.initials).toBeTruthy();
    });

    expect(result.current.initials).toBe('JO');
  });
});
