import { useCallback, useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { useTheme } from '@/providers/theme-provider';
import ProgressBar from '@/features/onboarding/components/ProgressBar';
import { ONBOARDING_STATS } from '@/constants/onboarding-stats';
import type { Theme } from '@/constants/theme';

const TOTAL = 13;

const RATE_MAX = 100;
const REPLAN_MAX = 80;
const [withoutRate, withRate] = [ONBOARDING_STATS.completionRate.without, ONBOARDING_STATS.completionRate.with];
const [withoutMin, withMin] = [ONBOARDING_STATS.replanningMinutes.without, ONBOARDING_STATS.replanningMinutes.with];

function AnimatedBar({ value, max, backgroundColor }: { value: number; max: number; backgroundColor: string }) {
  const targetHeight = (value / max) * 160;
  const height = useSharedValue(0);

  useEffect(() => {
    height.value = withTiming(targetHeight, { duration: 1200, easing: Easing.out(Easing.ease) });
  }, [targetHeight, height]);

  const style = useAnimatedStyle(() => ({ height: height.value }));

  return (
    <Animated.View
      style={[{ width: 56, borderRadius: 6, backgroundColor }, style]}
    />
  );
}

type BarGroupProps = {
  withoutLabel: string;
  withLabel: string;
  withoutValue: number;
  withValue: number;
  max: number;
  suffix: string;
  withoutColor: string;
  withColor: string;
};

function BarGroup({
  withoutLabel,
  withLabel,
  withoutValue,
  withValue,
  max,
  suffix,
  withoutColor,
  withColor,
}: BarGroupProps) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 32, height: 200 }}>
      <View style={{ alignItems: 'center', flex: 1, maxWidth: 100 }}>
        <Text style={{ fontSize: 14, color: '#999', marginBottom: 8 }}>{withoutLabel}</Text>
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#000', marginBottom: 4 }}>{withoutValue}{suffix}</Text>
        <AnimatedBar value={withoutValue} max={max} backgroundColor={withoutColor} />
      </View>
      <View style={{ alignItems: 'center', flex: 1, maxWidth: 100 }}>
        <Text style={{ fontSize: 14, color: '#999', marginBottom: 8 }}>{withLabel}</Text>
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#000', marginBottom: 4 }}>{withValue}{suffix}</Text>
        <AnimatedBar value={withValue} max={max} backgroundColor={withColor} />
      </View>
    </View>
  );
}

function createStyles(theme: Theme, insets: { top: number; bottom: number }) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingTop: insets.top + theme.spacing.lg,
      paddingBottom: insets.bottom + theme.spacing.xl,
      paddingHorizontal: theme.spacing.xl,
    },
    progressRow: { marginBottom: theme.spacing.xxl },
    title: { ...theme.typography.headlineSmall, color: theme.colors.onBackground, marginBottom: theme.spacing.xxl },
    chartCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.spacing.md,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
    },
    chartLabel: {
      ...theme.typography.titleSmall,
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.lg,
      fontWeight: '600',
    },
    bottom: { flex: 1, justifyContent: 'flex-end' },
    continueButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.spacing.sm,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    continueText: { ...theme.typography.labelLarge, color: theme.colors.onPrimary },
  });
}

export default function ProgressGraphScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);

  const handleContinue = useCallback(() => {
    router.push('/(onboarding)/processing-theatre' as any);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.progressRow}>
        <ProgressBar current={9} total={TOTAL} />
      </View>

      <Text style={styles.title}>Here's what users see in their first week.</Text>

      <View style={styles.chartCard}>
        <Text style={styles.chartLabel}>Completion rate</Text>
        <BarGroup
          withoutLabel="Without Shift AI"
          withLabel="With Shift AI"
          withoutValue={withoutRate}
          withValue={withRate}
          max={RATE_MAX}
          suffix="%"
          withoutColor={theme.colors.outline}
          withColor={theme.colors.primary}
        />
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartLabel}>Time replanning</Text>
        <BarGroup
          withoutLabel="Without"
          withLabel="With"
          withoutValue={withoutMin}
          withValue={withMin}
          max={REPLAN_MAX}
          suffix=" min"
          withoutColor={theme.colors.outline}
          withColor={theme.colors.primary}
        />
      </View>

      <View style={styles.bottom}>
        <Pressable
          style={({ pressed }) => [styles.continueButton, pressed && { opacity: theme.interaction.pressedOpacity }]}
          onPress={handleContinue}
          accessibilityRole="button"
          accessibilityLabel="Continue"
        >
          <Text style={styles.continueText}>Continue →</Text>
        </Pressable>
      </View>
    </View>
  );
}
