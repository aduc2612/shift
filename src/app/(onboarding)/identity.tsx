import { useCallback, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useTheme } from "@/providers/theme-provider";
import { useOnboardingStore } from "@/features/onboarding/state";
import ProgressBar from "@/features/onboarding/components/ProgressBar";
import { PERSONA_OPTIONS } from "@/types/onboarding";
import type { Theme } from "@/constants/theme";
import type { Persona } from "@/types/onboarding";
import { getNextScreen, getScreenStep, ONBOARDING_TOTAL } from "@/constants/onboarding-screens";

function createStyles(theme: Theme, insets: { top: number; bottom: number }) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingTop: insets.top + theme.spacing.lg,
      paddingHorizontal: theme.spacing.xl,
    },
    progressRow: {
      marginBottom: theme.spacing.xxl,
    },
    question: {
      ...theme.typography.headlineSmall,
      color: theme.colors.onBackground,
      marginBottom: theme.spacing.sm,
    },
    prompt: {
      ...theme.typography.bodyLarge,
      color: theme.colors.onSurfaceVariant,
      marginBottom: theme.spacing.xl,
    },
    option: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      paddingVertical: theme.spacing.lg,
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
    continueDisabled: {
      opacity: 0.4,
    },
    continueText: {
      ...theme.typography.labelLarge,
      color: theme.colors.onPrimary,
    },
  });
}

export default function IdentityScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);
  const persona = useOnboardingStore((s) => s.data.persona);
  const setField = useOnboardingStore((s) => s.setField);

  const handleSelect = useCallback(
    (value: Persona) => setField("persona", value),
    [setField],
  );

  const handleContinue = useCallback(() => {
    if (!persona) return;
    const next = getNextScreen("identity");
    if (next) router.push(`/(onboarding)/${next}`);
  }, [persona]);

  return (
    <View style={styles.container}>
      <View style={styles.progressRow}>
        <ProgressBar current={getScreenStep("identity")} total={ONBOARDING_TOTAL} />
      </View>

      <Text style={styles.question}>Tell us about yourself.</Text>
      <Text style={styles.prompt}>What best describes you?</Text>

      {PERSONA_OPTIONS.map((opt) => (
        <Pressable
          key={opt.value}
          style={({ pressed }) => [
            styles.option,
            persona === opt.value && styles.optionSelected,
            pressed && { opacity: theme.interaction.pressedOpacity },
          ]}
          onPress={() => handleSelect(opt.value)}
          accessibilityRole="radio"
          accessibilityState={{ selected: persona === opt.value }}
          accessibilityLabel={opt.label}
        >
          <Text
            style={[
              styles.optionText,
              persona === opt.value && styles.optionTextSelected,
            ]}
          >
            {opt.label}
          </Text>
        </Pressable>
      ))}

      <View style={styles.bottom}>
        <Pressable
          style={({ pressed }) => [
            styles.continueButton,
            !persona && styles.continueDisabled,
            pressed && { opacity: theme.interaction.pressedOpacity },
          ]}
          onPress={handleContinue}
          disabled={!persona}
          accessibilityRole="button"
          accessibilityLabel="Continue"
        >
          <Text style={styles.continueText}>Continue</Text>
        </Pressable>
      </View>
    </View>
  );
}
