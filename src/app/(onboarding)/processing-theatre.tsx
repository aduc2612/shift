import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/providers/theme-provider";
import { useToast } from "@/providers/toast-provider";
import { useOnboardingStore } from "@/features/onboarding/state";
import { saveOnboardingData } from "@/features/onboarding/api";
import ProgressBar from "@/features/onboarding/components/ProgressBar";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { Theme } from "@/constants/theme";
import {
  getNextScreen,
  getScreenStep,
  ONBOARDING_TOTAL,
} from "@/constants/onboarding-screens";

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
    progressTrack: {
      width: "100%",
      height: 6,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 3,
      overflow: "hidden",
      marginBottom: theme.spacing.sm,
    },
    progressFill: {
      height: "100%",
      backgroundColor: theme.colors.primary,
      borderRadius: 3,
    },
    progressPct: {
      ...theme.typography.labelMedium,
      color: theme.colors.onSurfaceVariant,
      textAlign: "center",
      marginBottom: theme.spacing.lg,
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
  const toast = useToast();

  const [visibleItems, setVisibleItems] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const saveStarted = useRef(false);
  const mountedRef = useRef(true);
  const retryCount = useRef(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [progressPct, setProgressPct] = useState(0);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const doSave = useCallback(async () => {
    if (!userId) return;
    setSaving(true);
    try {
      await saveOnboardingData(userId, data);
      if (mountedRef.current) {
        setSaving(false);
        setDone(true);
        retryCount.current = 0;
      }
    } catch (err) {
      if (mountedRef.current) {
        setSaving(false);
        if (retryCount.current < 3) {
          retryCount.current += 1;
          toast.show({ message: "Something went wrong. Retrying...", duration: 3000 });
          setTimeout(() => doSave(), 2000);
        } else {
          toast.show({ message: "Save failed. Please try back later." });
        }
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

  // Animate progress bar over the full ritual duration
  useEffect(() => {
    const totalDuration = CHECKPOINT_INTERVAL_MS * (CHECKPOINTS.length - 1);
    const listenerId = progressAnim.addListener(({ value }) => {
      if (mountedRef.current) setProgressPct(Math.round(value * 100));
    });
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: totalDuration,
      useNativeDriver: false,
    }).start();
    return () => progressAnim.removeListener(listenerId);
  }, [progressAnim]);

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
    const next = getNextScreen("processing-theatre");
    if (next) router.replace(`/(onboarding)/${next}`);
  }, [canAdvance, setField]);

  return (
    <View style={styles.container}>
      <View style={styles.progressRow}>
        <ProgressBar
          current={getScreenStep("processing-theatre")}
          total={ONBOARDING_TOTAL}
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>
          Crafting your{"\n"}personal schedule...
        </Text>

        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>
        <Text style={styles.progressPct}>{progressPct}%</Text>

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
