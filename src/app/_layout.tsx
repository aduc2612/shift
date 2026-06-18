import { useEffect, useMemo } from "react";
import { StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { KeyboardProvider } from "react-native-keyboard-controller";
import * as Sentry from "@sentry/react-native";
import { ThemeProvider, useTheme } from "@/providers/theme-provider";
import { QueryProvider } from "@/providers/query-provider";
import { ToastProvider } from "@/providers/toast-provider";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useOnboardingRouting } from "@/features/onboarding/hooks/useOnboardingRouting";
import { initSentry } from "@/services/sentry";
import { setupNotificationChannel } from "@/services/notifications";
import { useNotificationTapListener } from "@/hooks/useNotificationTapListener";
import { configureRevenueCat } from "@/services/revenuecat";

initSentry();

function RootNavigator() {
  const theme = useTheme();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { loading: routingLoading, shouldShowAuth, shouldShowOnboarding, shouldShowPaywall, shouldShowTabs = false } = useOnboardingRouting();

  useNotificationTapListener();

  useEffect(() => {
    setupNotificationChannel().catch((err) => {
      console.error('Failed to setup notification channel:', err);
    });
    configureRevenueCat().catch((err) => {
      console.error('Failed to configure RevenueCat:', err);
    });
  }, []);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        contentBackground: {
          backgroundColor: theme.colors.background,
        },
      }),
    [theme.colors.background],
  );

  const loading = authLoading || routingLoading;
  if (loading) return null;

  return (
    <>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          animation: "fade",
          animationDuration: 200,
          headerShown: false,
          contentStyle: styles.contentBackground,
        }}
      >
        <Stack.Protected guard={shouldShowAuth}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={shouldShowOnboarding}>
          <Stack.Screen name="(onboarding)" />
        </Stack.Protected>
        <Stack.Protected guard={shouldShowPaywall}>
          <Stack.Screen name="(paywall)" />
        </Stack.Protected>
        <Stack.Protected guard={shouldShowTabs}>
          <Stack.Screen name="(tabs)" />
        </Stack.Protected>
      </Stack>
    </>
  );
}

function RootLayout() {
  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        <QueryProvider>
          <ThemeProvider>
            <ToastProvider>
              <RootNavigator />
            </ToastProvider>
          </ThemeProvider>
        </QueryProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}

export default Sentry.wrap(RootLayout);
