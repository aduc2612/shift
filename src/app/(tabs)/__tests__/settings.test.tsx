import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import * as Application from 'expo-application';
import * as Linking from 'expo-linking';

const mockSignOut = jest.fn();
const mockSetEnabled = jest.fn();
const mockSetThemePreference = jest.fn();
const mockShow = jest.fn();
const mockInitials = 'JD';
const mockProfile = { id: 'u-1', email: 'jordan@example.com', name: 'Jordan Doe', avatarUrl: null };
const mockPreferences = {
  userId: 'u-1',
  wakeUpTime: '07:00',
  sleepTime: '23:00',
  userContext: '',
  onboardingCompleted: true,
};

jest.mock('@/features/auth/api', () => ({
  signOut: () => mockSignOut(),
}));

jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'u-1' }, isAuthenticated: true, loading: false }),
}));

jest.mock('@/features/profile/hooks/useUserProfile', () => ({
  useUserProfile: () => ({
    isLoading: false,
    profile: mockProfile,
    preferences: mockPreferences,
    profileError: null,
    preferencesError: null,
    initials: mockInitials,
  }),
}));

jest.mock('@/hooks/useNotificationPreference', () => ({
  useNotificationPreference: () => ({
    enabled: true,
    setEnabled: mockSetEnabled,
  }),
}));

jest.mock('@/providers/theme-provider', () => {
  const R = require('react');
  return {
    useTheme: () => ({
      isDark: false,
      colors: {
        primary: '#000000', onPrimary: '#FFFFFF', surface: '#FFFFFF', onSurface: '#1C1C1C',
        surfaceVariant: '#F5F5F5', onSurfaceVariant: '#666666', outline: '#D0D0D0',
        outlineVariant: '#E0E0E0', background: '#f4f3f8', onBackground: '#1a1a1c',
        scrim: '#00000066', error: '#B3261E', onError: '#FFFFFF',
      },
      typography: {
        titleLarge: { fontSize: 22, fontWeight: '700' as const, lineHeight: 28 },
        titleMedium: { fontSize: 16, fontWeight: '700' as const, lineHeight: 24 },
        titleSmall: { fontSize: 14, fontWeight: '700' as const, lineHeight: 20 },
        bodyLarge: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
        bodyMedium: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
        bodySmall: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
        labelLarge: { fontSize: 14, fontWeight: '700' as const, lineHeight: 20 },
        labelSmall: { fontSize: 11, fontWeight: '700' as const, lineHeight: 16 },
        headlineMedium: { fontSize: 28, fontWeight: '700' as const, lineHeight: 36 },
      },
      spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 40, xxxxl: 48, tabBar: 80 },
      borderRadius: { sm: 4, md: 8, lg: 12, xl: 16, xxl: 24, round: 28 },
      shadows: { none: {}, sm: {}, md: {}, lg: {} },
      interaction: { pressedOpacity: 0.6 },
      componentStyles: {},
    }),
    useThemePreference: () => ({
      preference: 'system',
      setThemePreference: mockSetThemePreference,
    }),
    ThemeProvider: ({ children }: { children: React.ReactNode }) =>
      R.createElement(R.Fragment, null, children),
  };
});

jest.mock('@/providers/toast-provider', () => ({
  useToast: () => ({ show: mockShow, hide: jest.fn() }),
}));

jest.mock('@/hooks/useSubscription', () => ({
  useSubscription: () => ({
    isSubscribed: true,
    isLoading: false,
    customerInfo: null,
    refresh: jest.fn(),
  }),
}));

jest.mock('@/services/revenuecat', () => ({
  presentCustomerCenter: jest.fn(async () => {}),
}));

jest.mock('@/features/profile/components/SchedulingContextSheet', () => {
  const R = require('react');
  const RN = require('react-native');
  return {
    __esModule: true,
    default: (props: { visible: boolean; onClose: () => void }) =>
      props.visible
        ? R.createElement(RN.Text, { testID: 'scheduling-sheet', onPress: props.onClose }, 'close-sheet')
        : null,
  };
});

jest.mock('@/components/primitives/ListSelector', () => {
  const R = require('react');
  const RN = require('react-native');
  return {
    __esModule: true,
    default: (props: { visible: boolean; title: string }) =>
      props.visible
        ? R.createElement(RN.Text, { testID: 'list-selector' }, props.title)
        : null,
  };
});

function wrap(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

import SettingsScreen from '../settings';

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders header and account section', async () => {
    const { getByText } = await wrap(<SettingsScreen />);

    expect(getByText('Settings')).toBeTruthy();
    expect(getByText('Account')).toBeTruthy();
    expect(getByText('Jordan Doe')).toBeTruthy();
    expect(getByText('jordan@example.com')).toBeTruthy();
  });

  it('shows initials in avatar fallback', async () => {
    const { getByText } = await wrap(<SettingsScreen />);
    expect(getByText('JD')).toBeTruthy();
  });

  it('shows AI Preferences section with scheduling context row', async () => {
    const { getByText } = await wrap(<SettingsScreen />);
    expect(getByText('AI Preferences')).toBeTruthy();
    expect(getByText('Scheduling context')).toBeTruthy();
  });

  it('shows Notifications section with toggle reflecting current state', async () => {
    const { getByText } = await wrap(<SettingsScreen />);
    expect(getByText('Notifications')).toBeTruthy();
    expect(getByText('Enable notifications')).toBeTruthy();
  });

  it('shows Preferences section with theme', async () => {
    const { getByText } = await wrap(<SettingsScreen />);
    expect(getByText('Preferences')).toBeTruthy();
    expect(getByText('Theme')).toBeTruthy();
  });

  it('shows About section with version from expo-application', async () => {
    (Application as any).nativeApplicationVersion = '1.2.3';
    (Application as any).nativeBuildVersion = '42';
    const { getByText } = await wrap(<SettingsScreen />);
    expect(getByText('About')).toBeTruthy();
    expect(getByText('Version')).toBeTruthy();
    expect(getByText('1.2.3 (42)')).toBeTruthy();
  });

  it('shows send feedback row', async () => {
    const { getByText } = await wrap(<SettingsScreen />);
    expect(getByText('Send feedback')).toBeTruthy();
  });

  it('shows privacy policy row', async () => {
    const { getByText } = await wrap(<SettingsScreen />);
    expect(getByText('Privacy policy')).toBeTruthy();
  });

  it('opens scheduling context sheet when row is pressed', async () => {
    const { getByText, queryByTestId } = await wrap(<SettingsScreen />);

    expect(queryByTestId('scheduling-sheet')).toBeNull();

    fireEvent.press(getByText('Scheduling context'));

    await waitFor(() => {
      expect(queryByTestId('scheduling-sheet')).toBeTruthy();
    });
  });

  it('opens theme list selector when theme row is pressed', async () => {
    const { getByText, queryByTestId } = await wrap(<SettingsScreen />);

    expect(queryByTestId('list-selector')).toBeNull();

    fireEvent.press(getByText('Theme'));

    await waitFor(() => {
      expect(queryByTestId('list-selector')).toBeTruthy();
    });
  });

  it('opens feedback list selector when send feedback is pressed', async () => {
    const { getByText, queryByTestId } = await wrap(<SettingsScreen />);

    fireEvent.press(getByText('Send feedback'));

    await waitFor(() => {
      expect(queryByTestId('list-selector')).toBeTruthy();
    });
  });

  it('signs out when sign out button is pressed and confirmed', async () => {
    const { getByText, getAllByText } = await wrap(<SettingsScreen />);

    // Press the sign out row to open confirm alert
    fireEvent.press(getByText('Sign Out'));

    // Wait for the custom alert to appear, then press the confirm button
    await waitFor(() => {
      expect(getByText('Are you sure you want to sign out?')).toBeTruthy();
    });
    // After alert opens, there are 2 "Sign Out" texts: the row and the confirm button
    const signOutButtons = getAllByText('Sign Out');
    fireEvent.press(signOutButtons[signOutButtons.length - 1]!);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
    });
  });

  it('shows toast when sign out fails', async () => {
    mockSignOut.mockRejectedValueOnce(new Error('fail'));

    const { getByText, getAllByText } = await wrap(<SettingsScreen />);

    fireEvent.press(getByText('Sign Out'));

    await waitFor(() => {
      expect(getByText('Are you sure you want to sign out?')).toBeTruthy();
    });
    const signOutButtons = getAllByText('Sign Out');
    fireEvent.press(signOutButtons[signOutButtons.length - 1]!);

    await waitFor(() => {
      expect(mockShow).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringMatching(/sign out failed/i) }),
      );
    });
  });

  it('does not call Linking when send feedback row is pressed (only opens selector)', async () => {
    const mockOpenURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as any);
    const { getByText, queryByTestId } = await wrap(<SettingsScreen />);

    fireEvent.press(getByText('Send feedback'));

    // Wait for selector to appear
    await waitFor(() => {
      expect(queryByTestId('list-selector')).toBeTruthy();
    });

    // Should not have called Linking when just opening the selector
    expect(mockOpenURL).not.toHaveBeenCalled();
    mockOpenURL.mockRestore();
  });
});
