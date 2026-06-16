import { useCallback, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/providers/theme-provider";
import { useOnboardingStore } from "@/features/onboarding/state";
import ProgressBar from "@/features/onboarding/components/ProgressBar";
import { PAIN_POINT_OPTIONS } from "@/types/onboarding";
import type { Theme } from "@/constants/theme";
import type { PainPoint } from "@/types/onboarding";

const TOTAL = 14;

function createStyles(theme: Theme, insets: { top: number; bottom: number }) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingTop: insets.top + theme.spacing.lg,
      paddingHorizontal: theme.spacing.xl,
    },
    progressRow: { marginBottom: theme.spacing.xxl },
    question: {
      ...theme.typography.headlineSmall,
      color: theme.colors.onBackground,
      marginBottom: theme.spacing.sm,
    },
    prompt: {
      ...theme.typography.bodyMedium,
      color: theme.colors.onSurfaceVariant,
      marginBottom: theme.spacing.xl,
    },
    option: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.sm,
      minHeight: 48,
      justifyContent: "center",
      ...theme.shadows.sm,
    },
    optionSelected: {
      backgroundColor: theme.colors.primaryContainer,
    },
    optionText: {
      ...theme.typography.bodyLarge,
      color: theme.colors.onSurface,
    },
    optionTextSelected: {
      color: theme.colors.onPrimaryContainer,
      fontWeight: "700",
    },
    bottom: {
      flex: 1,
      justifyContent: "flex-end",
      paddingBottom: insets.bottom + theme.spacing.xl,
    },
    continueButton: {
      ...theme.componentStyles.button,
      backgroundColor: theme.colors.primary,
      alignItems: "center",
      minHeight: 48,
    },
    continueText: {
      ...theme.typography.labelLarge,
      color: theme.colors.onPrimary,
    },
  });
}

export default function PainPointsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);
  const painPoints = useOnboardingStore((s) => s.data.painPoints);
  const setField = useOnboardingStore((s) => s.setField);

  const toggle = useCallback(
    (value: PainPoint) => {
      const next = painPoints.includes(value)
        ? painPoints.filter((p) => p !== value)
        : [...painPoints, value];
      setField("painPoints", next);
    },
    [painPoints, setField],
  );

  const handleContinue = useCallback(
    () => router.push("/(onboarding)/animation"),
    [],
  );

  return (
    <View style={styles.container}>
      <View style={styles.progressRow}>
        <ProgressBar current={3} total={TOTAL} />
      </View>

      <Text style={styles.question}>
        What does a bad day{"\n"}look like for you?
      </Text>
      <Text style={styles.prompt}>(Select all that apply)</Text>

      {PAIN_POINT_OPTIONS.map((opt) => {
        const selected = painPoints.includes(opt.value);
        return (
          <Pressable
            key={opt.value}
            style={({ pressed }) => [
              styles.option,
              selected && styles.optionSelected,
              pressed && { opacity: theme.interaction.pressedOpacity },
            ]}
            onPress={() => toggle(opt.value)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={opt.label}
          >
            <Text
              style={[
                styles.optionText,
                selected && styles.optionTextSelected,
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}

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
