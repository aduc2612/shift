import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { isRunningInExpoGo } from 'expo';
import * as Sentry from '@sentry/react-native';
import { ThemeProvider, useTheme } from '@/providers/theme-provider';
import { useAuth } from '@/features/auth/hooks/useAuth';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  sendDefaultPii: true,

  // Tracing — 100% in dev, 20% in production
  tracesSampleRate: __DEV__ ? 1.0 : 0.2,

  // Profiling — lower in production
  profilesSampleRate: __DEV__ ? 1.0 : 0.1,

  // Session Replay — always on error, 10% sessions in prod
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: __DEV__ ? 1.0 : 0.1,

  // Logging
  enableLogs: true,

  // Mobile Replay integration
  integrations: [
    Sentry.mobileReplayIntegration({
      maskAllText: true,
      maskAllImages: true,
    }),
  ],

  // Disable native frames tracking in Expo Go (not supported)
  enableNativeFramesTracking: !isRunningInExpoGo(),

  environment: __DEV__ ? 'development' : 'production',
  debug: __DEV__,
});

function RootNavigator() {
  const theme = useTheme();
  const { isAuthenticated } = useAuth();

  return (
    <>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          animation: 'fade',
          animationDuration: 200,
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Protected guard={isAuthenticated}>
          <Stack.Screen name="(tabs)" />
        </Stack.Protected>
        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
    </>
  );
}

function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <RootNavigator />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default Sentry.wrap(RootLayout);
