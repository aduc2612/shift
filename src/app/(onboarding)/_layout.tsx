import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { useTheme } from '@/providers/theme-provider';
import { useOnboardingStore } from '@/features/onboarding/state';

export default function OnboardingLayout() {
  const theme = useTheme();

  // Reset state on mount in case of navigation back
  useOnboardingStore.getState().reset();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        contentBackground: {
          backgroundColor: theme.colors.background,
        },
      }),
    [theme.colors.background],
  );

  return (
    <Stack
      screenOptions={{
        animation: 'fade',
        animationDuration: 200,
        headerShown: false,
        contentStyle: styles.contentBackground,
      }}
    >
      <Stack.Screen name="identity" />
      <Stack.Screen name="pain-points" />
      <Stack.Screen name="animation" />
      <Stack.Screen name="sleep-wake" />
      <Stack.Screen name="energy-peak" />
      <Stack.Screen name="hard-constraints" />
      <Stack.Screen name="freeform" />
      <Stack.Screen name="persona-review" />
      <Stack.Screen name="progress-graph" />
      <Stack.Screen name="processing-theatre" />
      <Stack.Screen name="schedule-preview" />
      <Stack.Screen name="notif-warmup" />
      <Stack.Screen name="notif-permission" />
    </Stack>
  );
}
