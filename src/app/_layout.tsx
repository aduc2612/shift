import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Sentry from '@sentry/react-native';
import { ThemeProvider, useTheme } from '@/providers/theme-provider';
import { QueryProvider } from '@/providers/query-provider';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { initSentry } from '@/services/sentry';

initSentry();

function RootNavigator() {
  const theme = useTheme();
  const { isAuthenticated, loading } = useAuth();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        contentBackground: {
          backgroundColor: theme.colors.background,
        },
      }),
    [theme.colors.background]
  );

  if (loading) return null;

  return (
    <>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          animation: 'fade',
          animationDuration: 200,
          headerShown: false,
          contentStyle: styles.contentBackground,
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
      <QueryProvider>
        <ThemeProvider>
          <RootNavigator />
        </ThemeProvider>
      </QueryProvider>
    </SafeAreaProvider>
  );
}

export default Sentry.wrap(RootLayout);
