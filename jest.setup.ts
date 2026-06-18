import React from 'react';
import { render } from '@testing-library/react-native';

// Mock AsyncStorage globally so all tests get the in-memory store
jest.mock('@react-native-async-storage/async-storage', () => {
  let store: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (key: string) => store[key] ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: jest.fn(async (key: string) => {
        delete store[key];
      }),
      clear: jest.fn(async () => {
        store = {};
      }),
      getAllKeys: jest.fn(async () => Object.keys(store)),
      multiGet: jest.fn(async (keys: string[]) =>
        keys.map((k) => [k, store[k] ?? null] as [string, string | null]),
      ),
      multiSet: jest.fn(async (pairs: [string, string][]) => {
        for (const [k, v] of pairs) store[k] = v;
      }),
    },
  };
});

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

// Mock react-native-keyboard-controller
jest.mock('react-native-keyboard-controller', () => {
  const RealReact = require('react');
  const RN = require('react-native');
  return {
    KeyboardProvider: ({ children }: { children: React.ReactNode }) =>
      RealReact.createElement(RN.View, null, children),
    KeyboardAwareScrollView: RealReact.forwardRef((
      props: Record<string, unknown>,
      ref: unknown,
    ) => RealReact.createElement(RN.ScrollView, { ...props, ref })),
    KeyboardAvoidingView: RealReact.forwardRef((
      props: Record<string, unknown>,
      ref: unknown,
    ) => RealReact.createElement(RN.View, { ...props, ref })),
    useKeyboardState: (selector?: (state: { isVisible: boolean }) => unknown) => {
      const state = { isVisible: false };
      return selector ? selector(state) : state;
    },
  };
});

// Mock react-native-purchases
jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    configure: jest.fn(),
    getCustomerInfo: jest.fn(async () => ({
      entitlements: { active: {} },
    })),
  },
}));

// Mock react-native-purchases-ui
jest.mock('react-native-purchases-ui', () => ({
  __esModule: true,
  default: {
    Paywall: 'Paywall',
    presentPaywall: jest.fn(async () => 'CANCELLED'),
    presentPaywallIfNeeded: jest.fn(async () => 'NOT_PRESENTED'),
    presentCustomerCenter: jest.fn(async () => {}),
    CustomerCenterView: 'CustomerCenterView',
  },
  PAYWALL_RESULT: {
    NOT_PRESENTED: 'NOT_PRESENTED',
    ERROR: 'ERROR',
    CANCELLED: 'CANCELLED',
    PURCHASED: 'PURCHASED',
    RESTORED: 'RESTORED',
  },
}));

// Helper: wrap a component with ThemeProvider
import { ThemeProvider } from '@/providers/theme-provider';

export function renderWithTheme(ui: React.ReactElement) {
  return render(React.createElement(ThemeProvider, null, ui));
}

// Helper: update Platform.OS for tests
import { Platform } from 'react-native';

export function setPlatform(os: 'ios' | 'android') {
  Object.defineProperty(Platform, 'OS', { get: () => os, configurable: true });
}
