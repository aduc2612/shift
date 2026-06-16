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

const MAX_BAR = 100;
const [withoutRate, withRate] = [ONBOARDING_STATS.completionRate.without, ONBOARDING_STATS.completionRate.with];
const [withoutMin, withMin] = [ONBOARDING_STATS.replanningMinutes.without, ONBOARDING_STATS.replanningMinutes.with];

function AnimatedBar({ value, backgroundColor }: { value: number; backgroundColor: string }) {
  const targetPercent = (value / MAX_BAR) * 160;
  const height = useSharedValue(0);

  useEffect(() => {
    height.value = withTiming(targetPercent, { duration: 1200, easing: Easing.out(Easing.ease) });
  }, [targetPercent, height]);

  const style = useAnimatedStyle(() => ({ height: height.value }));

  return (
    <Animated.View
      style={[{ width: 56, borderRadius: 6, backgroundColor }, style]}
    />
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
    title: { ...theme.typography.headlineSmall, color: theme.colors.onBackground, marginBottom: theme.spacing.xs },
    subtitle: { ...theme.typography.bodyMedium, color: theme.colors.onSurfaceVariant, marginBottom: theme.spacing.xxl },
    chartCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.spacing.md,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
    },
    chartRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: theme.spacing.xxl, height: 160 },
    barGroup: { alignItems: 'center', flex: 1, maxWidth: 100 },
    barLabel: { ...theme.typography.bodySmall, color: theme.colors.onSurfaceVariant, marginBottom: theme.spacing.sm },
    barValue: { ...theme.typography.titleMedium, color: theme.colors.onSurface, marginBottom: theme.spacing.xs },
    bar: { width: 56, borderRadius: theme.spacing.sm },
    barWithout: { backgroundColor: theme.colors.outline },
    barWith: { backgroundColor: theme.colors.primary },
    statsRow: {
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.spacing.md,
      padding: theme.spacing.lg,
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    stat: { alignItems: 'center' },
    statValue: { ...theme.typography.titleMedium, color: theme.colors.onSurface },
    statLabel: { ...theme.typography.bodySmall, color: theme.colors.onSurfaceVariant },
    statArrow: { ...theme.typography.bodyMedium, color: theme.colors.primary, marginTop: 2 },
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
      <Text style={styles.subtitle}>Completion rate</Text>

      <View style={styles.chartCard}>
        <View style={styles.chartRow}>
          <View style={styles.barGroup}>
            <Text style={styles.barLabel}>Without Shift AI</Text>
            <Text style={styles.barValue}>{withoutRate}%</Text>
            <AnimatedBar value={withoutRate} backgroundColor={theme.colors.outline} />
          </View>
          <View style={styles.barGroup}>
            <Text style={styles.barLabel}>With Shift AI</Text>
            <Text style={styles.barValue}>{withRate}%</Text>
            <AnimatedBar value={withRate} backgroundColor={theme.colors.primary} />
          </View>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{withoutMin} min</Text>
          <Text style={styles.statLabel}>Time replanning (before)</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{withMin} min</Text>
          <Text style={styles.statLabel}>Time replanning (after)</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statArrow}>↓ 89%</Text>
          <Text style={styles.statLabel}>reduction</Text>
        </View>
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
