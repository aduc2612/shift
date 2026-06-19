import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const mockMutate = jest.fn();
const mockReset = jest.fn();
const mockUseUpdateUserPreferences = jest.fn();

jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'u-1' } }),
}));

jest.mock('@/features/profile/api', () => ({
  fetchUserProfile: jest.fn(),
  fetchUserPreferences: jest.fn().mockResolvedValue({
    userId: 'u-1',
    wakeUpTime: '07:00',
    sleepTime: '23:00',
    userContext: 'saved context',
    onboardingCompleted: true,
  }),
  updateUserPreferences: jest.fn(),
}));

jest.mock('@/features/profile/hooks/useUpdateUserPreferences', () => ({
  useUpdateUserPreferences: () => mockUseUpdateUserPreferences(),
}));

const mockTheme = {
  isDark: false,
  colors: {
    primary: '#000000', onPrimary: '#FFFFFF', surface: '#FFFFFF', onSurface: '#1C1C1C',
    surfaceVariant: '#F5F5F5', onSurfaceVariant: '#666666', outline: '#D0D0D0',
    outlineVariant: '#E0E0E0', background: '#f4f3f8', onBackground: '#1a1a1c',
    scrim: '#00000066', error: '#B3261E', onError: '#FFFFFF',
    primaryContainer: '#E8DEF8', onPrimaryContainer: '#1D192B',
    secondaryContainer: '#E8DEF8', tertiaryContainer: '#E8DEF8',
  },
  typography: {
    titleLarge: { fontSize: 22, fontWeight: '700' as const, lineHeight: 28 },
    titleMedium: { fontSize: 16, fontWeight: '700' as const, lineHeight: 24 },
    bodyLarge: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
    bodyMedium: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
    bodySmall: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
    labelLarge: { fontSize: 14, fontWeight: '700' as const, lineHeight: 20 },
  },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 40 },
  borderRadius: { sm: 4, md: 8, lg: 12, xl: 16, xxl: 24 },
  shadows: {},
  interaction: { pressedOpacity: 0.6 },
  componentStyles: {},
};

jest.mock('@/providers/theme-provider', () => {
  const R = require('react');
  return {
    useTheme: () => mockTheme,
    ThemeProvider: ({ children }: { children: React.ReactNode }) =>
      R.createElement(R.Fragment, null, children),
  };
});

jest.mock('@expo/ui/community/datetime-picker', () => {
  const R = require('react');
  const RN = require('react-native');
  return {
    DateTimePicker: (props: any) =>
      R.createElement(
        RN.View,
        { testID: 'date-time-picker' },
        R.createElement(RN.Text, {}, 'picker'),
        R.createElement(RN.Button, {
          title: 'Confirm',
          onPress: () => {
            const date = new Date();
            date.setHours(8, 30, 0, 0);
            props.onValueChange?.({}, date);
          },
        }),
      ),
  };
});

import SchedulingContextSheet from '../components/SchedulingContextSheet';

function setUpMutation() {
  mockUseUpdateUserPreferences.mockReturnValue({
    mutate: mockMutate,
    isPending: false,
    reset: mockReset,
  });
}

function wrap(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const { ToastProvider } = require('@/providers/toast-provider');
  return render(
    <QueryClientProvider client={queryClient}><ToastProvider>{ui}</ToastProvider></QueryClientProvider>,
  );
}

describe('SchedulingContextSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setUpMutation();
  });

  it('renders wake, sleep, and text area with loaded values', async () => {
    const { getByText, getByDisplayValue } = await wrap(
      <SchedulingContextSheet visible={true} onClose={jest.fn()} />,
    );

    expect(getByText('Wake up time')).toBeTruthy();
    expect(getByText('Go to bed')).toBeTruthy();
    expect(getByText('Anything else we should know?')).toBeTruthy();
    // Shows 12h formatted time from loaded prefs (07:00 = 7:00 AM)
    expect(getByText('7:00 AM')).toBeTruthy();
    // Sleep time from prefs (23:00 = 11:00 PM)
    expect(getByText('11:00 PM')).toBeTruthy();
  });

  it('loads current values from preferences', async () => {
    require('@/features/profile/api').fetchUserPreferences.mockResolvedValueOnce({
      userId: 'u-1',
      wakeUpTime: '09:30',
      sleepTime: '00:30',
      userContext: 'I have ADHD',
      onboardingCompleted: true,
    });

    const { getByText, getByDisplayValue } = await wrap(
      <SchedulingContextSheet visible={true} onClose={jest.fn()} />,
    );

    await waitFor(() => {
      expect(getByText('9:30 AM')).toBeTruthy();
      expect(getByText('12:30 AM')).toBeTruthy();
    });
  });

  it('calls updateUserPreferences on save with HH:MM format', async () => {
    mockMutate.mockImplementation((_payload: any, opts: any) => {
      opts?.onSuccess?.();
    });

    const { getByText } = await wrap(
      <SchedulingContextSheet visible={true} onClose={jest.fn()} />,
    );

    await waitFor(() => {
      expect(getByText('Save changes')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByText('Save changes'));
    });

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalled();
    });

    const callArgs = mockMutate.mock.calls[0][0];
    expect(callArgs.userId).toBe('u-1');
    expect(callArgs.update.wakeUpTime).toMatch(/^\d{2}:\d{2}$/);
    expect(callArgs.update.sleepTime).toMatch(/^\d{2}:\d{2}$/);
    // Default loaded values: 07:00 and 23:00
    expect(callArgs.update.wakeUpTime).toBe('07:00');
    expect(callArgs.update.sleepTime).toBe('23:00');
  });

  it('closes sheet on save success', async () => {
    const onClose = jest.fn();
    mockMutate.mockImplementation((_payload: any, opts: any) => {
      opts?.onSuccess?.();
    });

    const { getByText } = await wrap(
      <SchedulingContextSheet visible={true} onClose={onClose} />,
    );

    await waitFor(() => {
      expect(getByText('Save changes')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByText('Save changes'));
    });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });
});
