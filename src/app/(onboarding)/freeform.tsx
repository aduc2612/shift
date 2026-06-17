import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useTheme } from "@/providers/theme-provider";
import { useOnboardingStore } from "@/features/onboarding/state";
import ProgressBar from "@/features/onboarding/components/ProgressBar";
import type { Theme } from "@/constants/theme";
import { getNextScreen, getScreenStep, ONBOARDING_TOTAL } from "@/constants/onboarding-screens";

const EXAMPLES = [
  "I have ADHD and lose focus fast",
  "I work night shifts 3x a week",
  "I can't focus after 4 PM",
  "I have school pickup at 3 PM",
];

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
    input: {
      ...theme.componentStyles.input,
      backgroundColor: theme.colors.surfaceVariant,
      color: theme.colors.onSurface,
      minHeight: 120,
      textAlignVertical: "top",
    },
    chipsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.sm,
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.xxl,
    },
    chip: {
      ...theme.componentStyles.chip,
      backgroundColor: theme.colors.surfaceVariant,
    },
    chipText: {
      ...theme.typography.bodySmall,
      color: theme.colors.onSurfaceVariant,
    },
    bottom: {
      paddingBottom: insets.bottom + theme.spacing.xl,
    },
    buttonRow: {
      flexDirection: "row",
      gap: theme.spacing.md,
      marginTop: theme.spacing.lg,
    },
    scrollContent: {
      flexGrow: 1,
    },
    continueButton: {
      ...theme.componentStyles.button,
      backgroundColor: theme.colors.primary,
      flex: 1,
      alignItems: "center",
      minHeight: 48,
    },
    skipButton: {
      ...theme.componentStyles.button,
      backgroundColor: theme.colors.surfaceVariant,
      flex: 1,
      alignItems: "center",
      minHeight: 48,
    },
    continueText: {
      ...theme.typography.labelLarge,
      color: theme.colors.onPrimary,
    },
    skipText: {
      ...theme.typography.labelLarge,
      color: theme.colors.onSurfaceVariant,
    },
  });
}

export default function FreeformScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);
  const context = useOnboardingStore((s) => s.data.schedulingContext);
  const setField = useOnboardingStore((s) => s.setField);
  const [input, setInput] = useState(context);

  const advance = useCallback(() => {
    setField("schedulingContext", input);
    const next = getNextScreen("freeform");
    if (next) router.push(`/(onboarding)/${next}`);
  }, [input, setField]);

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.progressRow}>
          <ProgressBar current={getScreenStep("freeform")} total={ONBOARDING_TOTAL} />
        </View>

        <Text style={styles.question}>One last thing...</Text>
        <Text style={styles.prompt}>Anything we should know about you?</Text>

        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Tell us about your daily life..."
          placeholderTextColor={theme.colors.onSurfaceVariant}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <View style={styles.chipsRow}>
          {EXAMPLES.map((ex) => (
            <Pressable
              key={ex}
              style={styles.chip}
              onPress={() => setInput(ex)}
              accessibilityLabel={`Example: ${ex}`}
            >
              <Text style={styles.chipText}>{ex}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.buttonRow}>
          <Pressable
            style={({ pressed }) => [
              styles.skipButton,
              pressed && { opacity: theme.interaction.pressedOpacity },
            ]}
            onPress={advance}
            accessibilityRole="button"
            accessibilityLabel="Skip for now"
          >
            <Text style={styles.skipText}>
              Skip for now{" "}
              <Ionicons
                name="arrow-forward"
                size={16}
                color={theme.colors.onSurfaceVariant}
              />
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.continueButton,
              pressed && { opacity: theme.interaction.pressedOpacity },
            ]}
            onPress={advance}
            accessibilityRole="button"
            accessibilityLabel="Continue"
          >
            <Text style={styles.continueText}>Continue</Text>
          </Pressable>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}
