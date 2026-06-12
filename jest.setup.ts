import React from 'react';
import { render } from '@testing-library/react-native';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
  useSegments: () => [],
  Link: 'Link',
  Stack: ({ children }: { children: React.ReactNode }) => children,
  Tabs: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock @expo/vector-icons — render icon name as text for testability
jest.mock('@expo/vector-icons', () => {
  const RealReact = require('react');
  const RN = require('react-native');
  const Ionicons = (props: Record<string, unknown>) => {
    return RealReact.createElement(RN.Text, {
      children: (props.name as string) || 'icon',
      style: { fontSize: (props.size as number) || 22, color: (props.color as string) || '#000' },
      ...props,
    });
  };
  return { Ionicons };
});

// Mock expo-web-browser
jest.mock('expo-web-browser', () => ({
  warmUpAsync: jest.fn(),
  coolDownAsync: jest.fn(),
  maybeCompleteAuthSession: jest.fn(),
  openAuthSessionAsync: jest.fn(),
}));

// Mock expo-auth-session
jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn(() => 'shift://(tabs)'),
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
    SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
    useSafeAreaInsets: () => inset,
  };
});

// Helper: wrap a component with ThemeProvider
import { ThemeProvider } from '@/providers/theme-provider';

export async function renderWithTheme(ui: React.ReactElement) {
  return render(React.createElement(ThemeProvider, null, ui));
}

// Helper: update Platform.OS for tests
import { Platform } from 'react-native';

export function setPlatform(os: 'ios' | 'android') {
  Object.defineProperty(Platform, 'OS', { get: () => os, configurable: true });
}
