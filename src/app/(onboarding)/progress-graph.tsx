import { useCallback, useEffect, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useTheme } from "@/providers/theme-provider";
import ProgressBar from "@/features/onboarding/components/ProgressBar";
import { ONBOARDING_STATS } from "@/constants/onboarding-stats";
import type { Theme } from "@/constants/theme";
import {
  getNextScreen,
  getScreenStep,
  ONBOARDING_TOTAL,
} from "@/constants/onboarding-screens";

const RATE_MAX = 100;
const REPLAN_MAX = 80;
const [withoutRate, withRate] = [
  ONBOARDING_STATS.completionRate.without,
  ONBOARDING_STATS.completionRate.with,
];
const [withoutMin, withMin] = [
  ONBOARDING_STATS.replanningMinutes.without,
  ONBOARDING_STATS.replanningMinutes.with,
];

const barStyles = StyleSheet.create({
  bar: {
    width: 56,
    borderRadius: 6,
  },
  barGroup: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    height: 160,
    gap: 32,
  },
  barColumn: {
    alignItems: "center",
    flex: 1,
    maxWidth: 100,
  },
});

function AnimatedBar({
  value,
  max,
  backgroundColor,
}: {
  value: number;
  max: number;
  backgroundColor: string;
}) {
  const targetHeight = (value / max) * 160;
  const height = useSharedValue(0);

  useEffect(() => {
    height.value = withTiming(targetHeight, {
      duration: 1200,
      easing: Easing.out(Easing.ease),
    });
  }, [targetHeight, height]);

  const style = useAnimatedStyle(() => ({ height: height.value }));

  return <Animated.View style={[barStyles.bar, { backgroundColor }, style]} />;
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
  theme: import("@/constants/theme").Theme;
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
  theme,
}: BarGroupProps) {
  return (
    <View style={barStyles.barGroup}>
      <View style={barStyles.barColumn}>
        <Text
          style={{
            fontSize: theme.typography.bodyMedium.fontSize,
            color: theme.colors.onSurfaceVariant,
            marginBottom: theme.spacing.xs,
          }}
        >
          {withoutLabel}
        </Text>
        <Text
          style={{
            fontSize: theme.typography.titleMedium.fontSize,
            fontWeight: "600",
            color: theme.colors.onSurface,
            marginBottom: theme.spacing.xs,
          }}
        >
          {withoutValue}
          {suffix}
        </Text>
        <AnimatedBar
          value={withoutValue}
          max={max}
          backgroundColor={withoutColor}
        />
      </View>
      <View style={barStyles.barColumn}>
        <Text
          style={{
            fontSize: theme.typography.bodyMedium.fontSize,
            color: theme.colors.onSurfaceVariant,
            marginBottom: theme.spacing.xs,
          }}
        >
          {withLabel}
        </Text>
        <Text
          style={{
            fontSize: theme.typography.titleMedium.fontSize,
            fontWeight: "600",
            color: theme.colors.onSurface,
            marginBottom: theme.spacing.xs,
          }}
        >
          {withValue}
          {suffix}
        </Text>
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
    title: {
      ...theme.typography.headlineSmall,
      color: theme.colors.onBackground,
      marginBottom: theme.spacing.xl,
    },
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
      fontWeight: "600",
    },
    bottom: {
      flex: 1,
      justifyContent: "flex-end",
      marginTop: theme.spacing.xxl,
    },
    continueButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.spacing.sm,
      minHeight: 48,
      alignItems: "center",
      justifyContent: "center",
    },
    continueText: {
      ...theme.typography.labelLarge,
      color: theme.colors.onPrimary,
    },
  });
}

export default function ProgressGraphScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);

  const handleContinue = useCallback(() => {
    const next = getNextScreen("progress-graph");
    if (next) router.push(`/(onboarding)/${next}`);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.progressRow}>
        <ProgressBar
          current={getScreenStep("progress-graph")}
          total={ONBOARDING_TOTAL}
        />
      </View>

      <Text style={styles.title}>
        Here's what our users see{"\n"}in their first week.
      </Text>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: theme.spacing.lg }}
      >
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
            theme={theme}
          />
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartLabel}>Time replanning</Text>
          <BarGroup
            withoutLabel="Without Shift AI"
            withLabel="With Shift AI"
            withoutValue={withoutMin}
            withValue={withMin}
            max={REPLAN_MAX}
            suffix=" min"
            withoutColor={theme.colors.outline}
            withColor={theme.colors.primary}
            theme={theme}
          />
        </View>
      </ScrollView>

      <View style={styles.bottom}>
        <Pressable
          style={({ pressed }) => [
            styles.continueButton,
            pressed && { opacity: theme.interaction.pressedOpacity },
          ]}
          onPress={handleContinue}
          accessibilityRole="button"
          accessibilityLabel="Continue"
        >
          <Text style={styles.continueText}>Continue</Text>
        </Pressable>
      </View>
    </View>
  );
}
