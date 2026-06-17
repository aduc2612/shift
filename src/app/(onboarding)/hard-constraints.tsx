import { useCallback, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/providers/theme-provider";
import { useOnboardingStore } from "@/features/onboarding/state";
import ProgressBar from "@/features/onboarding/components/ProgressBar";
import { HARD_CONSTRAINT_OPTIONS } from "@/types/onboarding";
import type { Theme } from "@/constants/theme";
import type { HardConstraint } from "@/types/onboarding";
import { getNextScreen, getScreenStep, ONBOARDING_TOTAL } from "@/constants/onboarding-screens";

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
    optionSelected: { backgroundColor: theme.colors.primaryContainer },
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

export default function HardConstraintsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);
  const constraints = useOnboardingStore((s) => s.data.hardConstraints);
  const setField = useOnboardingStore((s) => s.setField);

  const toggle = useCallback(
    (value: HardConstraint) => {
      if (value === "none") {
        // Toggling 'none' deselects all others
        setField(
          "hardConstraints",
          constraints.includes("none") ? [] : ["none"],
        );
        return;
      }

      let next: HardConstraint[];
      if (constraints.includes(value)) {
        next = constraints.filter((c) => c !== value);
      } else {
        // Toggling any other deselects 'none'
        next = constraints.filter((c) => c !== "none");
        next.push(value);
      }
      setField("hardConstraints", next);
    },
    [constraints, setField],
  );

  return (
    <View style={styles.container}>
      <View style={styles.progressRow}>
        <ProgressBar current={getScreenStep("hard-constraints")} total={ONBOARDING_TOTAL} />
      </View>

      <Text style={styles.question}>
        Do you have anything{"\n"}that's fixed in your day?
      </Text>
      <Text style={styles.prompt}>(These won't be moved by the AI)</Text>

      {HARD_CONSTRAINT_OPTIONS.map((opt) => {
        const selected = constraints.includes(opt.value);
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
              style={[styles.optionText, selected && styles.optionTextSelected]}
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
          onPress={() => {
            const next = getNextScreen("hard-constraints");
            if (next) router.push(`/(onboarding)/${next}`);
          }}
          accessibilityRole="button"
          accessibilityLabel="Continue"
        >
          <Text style={styles.continueText}>Continue</Text>
        </Pressable>
      </View>
    </View>
  );
}
