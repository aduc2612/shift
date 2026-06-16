import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/providers/theme-provider";
import { useOnboardingStore } from "@/features/onboarding/state";
import { saveOnboardingData } from "@/features/onboarding/api";
import ProgressBar from "@/features/onboarding/components/ProgressBar";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { Theme } from "@/constants/theme";

const TOTAL = 14;
const CHECKPOINT_INTERVAL_MS = 3_000;
const CHECKPOINTS: { label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: "Learning your peak hours", icon: "checkmark-circle" },
  { label: "Mapping your fixed commitments", icon: "checkmark-circle" },
  { label: "Calibrating your AI assistant", icon: "checkmark-circle" },
  { label: "Personalizing your experience", icon: "checkmark-circle" },
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
    content: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    logo: {
      ...theme.typography.displaySmall,
      color: theme.colors.primary,
      marginBottom: theme.spacing.xl,
    },
    title: {
      ...theme.typography.titleLarge,
      color: theme.colors.onBackground,
      marginBottom: theme.spacing.xxl,
      textAlign: "center",
    },
    checklist: {
      width: "100%",
      paddingHorizontal: theme.spacing.xl,
    },
    item: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: theme.spacing.md,
      opacity: 0,
    },
    itemVisible: {
      opacity: 1,
    },
    itemIcon: {
      marginRight: theme.spacing.md,
    },
    itemText: {
      ...theme.typography.bodyLarge,
      color: theme.colors.onSurface,
    },
    errorBox: {
      backgroundColor: theme.colors.errorContainer,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      alignItems: "center",
      marginTop: theme.spacing.lg,
    },
    errorText: {
      ...theme.typography.bodyMedium,
      color: theme.colors.onErrorContainer,
      marginBottom: theme.spacing.md,
      textAlign: "center",
    },
    retryButton: {
      ...theme.componentStyles.button,
      backgroundColor: theme.colors.error,
      minHeight: 48,
    },
    retryText: {
      ...theme.typography.labelLarge,
      color: theme.colors.onError,
    },
    bottom: {
      paddingBottom: insets.bottom + theme.spacing.xl,
    },
  });
}

export default function ProcessingTheatreScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);
  const data = useOnboardingStore((s) => s.data);
  const setField = useOnboardingStore((s) => s.setField);
  const { user } = useAuth();
  const userId = user?.id;

  const [visibleItems, setVisibleItems] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const saveStarted = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const doSave = useCallback(async () => {
    if (!userId) return;
    setSaving(true);
    setError(null);
    try {
      await saveOnboardingData(userId, data);
      if (mountedRef.current) {
        setSaving(false);
        setDone(true);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to save. Please try again.",
        );
        setSaving(false);
      }
    }
  }, [userId, data]);

  // Start the real save — re-attempts when userId becomes available
  useEffect(() => {
    if (!userId) return;
    if (saveStarted.current) return;
    saveStarted.current = true;
    doSave();
  }, [doSave, userId]);

  // Reveal one checkpoint every 3s. Independent effect so auth re-renders
  // can't kill the timers by triggering a cleanup.
  useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i < CHECKPOINTS.length; i++) {
      timeouts.push(
        setTimeout(() => {
          if (mountedRef.current) setVisibleItems(i);
        }, i * CHECKPOINT_INTERVAL_MS),
      );
    }
    return () => timeouts.forEach(clearTimeout);
  }, []);

  // Ritual completes when the last item is visible (T+9s); button enables once save also done
  const ritualComplete = visibleItems >= CHECKPOINTS.length - 1;
  const canAdvance = ritualComplete && done;

  const handleContinue = useCallback(() => {
    if (!canAdvance) return;
    // ritual complete + save done — advance
    router.replace("/(onboarding)/schedule-preview");
  }, [canAdvance, setField]);

  return (
    <View style={styles.container}>
      <View style={styles.progressRow}>
        <ProgressBar current={10} total={TOTAL} />
      </View>

      <View style={styles.content}>
        <Text style={styles.logo}>Shift</Text>
        <Text style={styles.title}>
          Crafting your{"\n"}personal schedule...
        </Text>

        <View style={styles.checklist}>
          {CHECKPOINTS.map((cp, i) => {
            const visible = i <= visibleItems;
            return (
              <View
                key={cp.label}
                style={[styles.item, visible && { opacity: 1 }]}
              >
                <Ionicons
                  name={cp.icon}
                  size={18}
                  color={visible ? theme.colors.primary : theme.colors.outline}
                  style={styles.itemIcon}
                />
                <Text style={styles.itemText}>{cp.label}</Text>
              </View>
            );
          })}
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable
              style={({ pressed }) => [
                styles.retryButton,
                pressed && { opacity: theme.interaction.pressedOpacity },
              ]}
              onPress={doSave}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="Try again"
            >
              <Text style={styles.retryText}>
                {saving ? "Saving..." : "Try again"}
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      <View style={styles.bottom}>
        <Pressable
          style={({ pressed }) => [
            {
              ...theme.componentStyles.button,
              backgroundColor: theme.colors.primary,
              alignItems: "center",
              minHeight: 48,
            },
            !canAdvance && { opacity: 0.4 },
            pressed && { opacity: theme.interaction.pressedOpacity },
          ]}
          onPress={handleContinue}
          disabled={!canAdvance}
          accessibilityRole="button"
          accessibilityLabel="Continue"
        >
          <Text
            style={{
              ...theme.typography.labelLarge,
              color: theme.colors.onPrimary,
            }}
          >
            Continue
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
