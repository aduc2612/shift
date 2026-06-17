import { useMemo, useState, useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { DateTimePicker } from "@expo/ui/community/datetime-picker";
import { useTheme } from "@/providers/theme-provider";
import { useOnboardingStore } from "@/features/onboarding/state";
import ProgressBar from "@/features/onboarding/components/ProgressBar";
import {
  getNextScreen,
  getScreenStep,
  ONBOARDING_TOTAL,
} from "@/constants/onboarding-screens";
import type { Theme } from "@/constants/theme";

function createStyles(theme: Theme, insets: { top: number; bottom: number }) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingTop: insets.top + theme.spacing.lg,
      paddingBottom: insets.bottom + theme.spacing.xl,
      paddingHorizontal: theme.spacing.xl,
    },
    progressContainer: { paddingBottom: theme.spacing.xxl },
    question: {
      ...theme.typography.headlineSmall,
      color: theme.colors.onBackground,
      marginBottom: theme.spacing.xxl,
    },
    timeRow: {
      marginBottom: theme.spacing.xxl,
    },
    timeLabel: {
      ...theme.typography.bodyLarge,
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.sm,
    },
    timeDisplayBtn: {
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      minHeight: 48,
      justifyContent: "center",
    },
    timeDisplayText: {
      ...theme.typography.titleMedium,
      color: theme.colors.onSurface,
    },
    caption: {
      ...theme.typography.bodyMedium,
      color: theme.colors.onSurfaceVariant,
      fontStyle: "italic",
    },
    continueButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.spacing.sm,
      minHeight: 48,
      alignItems: "center",
      justifyContent: "center",
      marginTop: "auto",
    },
    continueText: {
      ...theme.typography.labelLarge,
      color: theme.colors.onPrimary,
    },
  });
}

function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${minute.toString().padStart(2, "0")} ${period}`;
}

function toHHMM(hour: number, minute: number): string {
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}

function pickerDate(hour: number, minute: number): Date {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

export default function SleepWakeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);
  const data = useOnboardingStore((s) => s.data);
  const setField = useOnboardingStore((s) => s.setField);

  const [wakeH, setWakeH] = useState(7);
  const [wakeM, setWakeM] = useState(0);
  const [sleepH, setSleepH] = useState(23);
  const [sleepM, setSleepM] = useState(0);
  const [showWakePicker, setShowWakePicker] = useState(false);
  const [showSleepPicker, setShowSleepPicker] = useState(false);

  const handleContinue = useCallback(() => {
    setField("wakeUpTime", toHHMM(wakeH, wakeM));
    setField("sleepTime", toHHMM(sleepH, sleepM));
    const next = getNextScreen("sleep-wake");
    if (next) router.push(`/(onboarding)/${next}`);
  }, [wakeH, wakeM, sleepH, sleepM, setField]);

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        <ProgressBar
          current={getScreenStep("sleep-wake")}
          total={ONBOARDING_TOTAL}
        />
      </View>
      <Text style={styles.question}>
        When do you usually{"\n"}sleep and wake up?
      </Text>

      <View style={styles.timeRow}>
        <Text style={styles.timeLabel}>Wake up</Text>
        {showWakePicker ? (
          <DateTimePicker
            value={pickerDate(wakeH, wakeM)}
            mode="time"
            onValueChange={(_event: unknown, date?: Date) => {
              if (date) {
                setWakeH(date.getHours());
                setWakeM(date.getMinutes());
              }
              setShowWakePicker(false);
            }}
            onDismiss={() => setShowWakePicker(false)}
          />
        ) : (
          <Pressable
            style={styles.timeDisplayBtn}
            onPress={() => setShowWakePicker(true)}
            accessibilityRole="button"
            accessibilityLabel="Set wake up time"
          >
            <Text style={styles.timeDisplayText}>
              {formatTime(wakeH, wakeM)}
            </Text>
          </Pressable>
        )}
      </View>

      <View style={styles.timeRow}>
        <Text style={styles.timeLabel}>Go to bed</Text>
        {showSleepPicker ? (
          <DateTimePicker
            value={pickerDate(sleepH, sleepM)}
            mode="time"
            onValueChange={(_event: unknown, date?: Date) => {
              if (date) {
                setSleepH(date.getHours());
                setSleepM(date.getMinutes());
              }
              setShowSleepPicker(false);
            }}
            onDismiss={() => setShowSleepPicker(false)}
          />
        ) : (
          <Pressable
            style={styles.timeDisplayBtn}
            onPress={() => setShowSleepPicker(true)}
            accessibilityRole="button"
            accessibilityLabel="Set sleep time"
          >
            <Text style={styles.timeDisplayText}>
              {formatTime(sleepH, sleepM)}
            </Text>
          </Pressable>
        )}
      </View>

      <Text style={styles.caption}>
        We use this to build your daily structure.
      </Text>

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
  );
}
