import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/providers/theme-provider";
import { getNextScreen } from "@/constants/onboarding-screens";
import type { Theme } from "@/constants/theme";

const DURATION = 4000;

type TaskRow = { name: string; status: "done" | "missed" | "pending" };

const BEFORE_TASKS: TaskRow[] = [
  { name: "Study", status: "missed" },
  { name: "Gym", status: "missed" },
  { name: "Assignment", status: "pending" },
  { name: "Lunch", status: "pending" },
  { name: "Project", status: "pending" },
];

const AFTER_TASKS: TaskRow[] = [
  { name: "Study", status: "done" },
  { name: "Gym", status: "pending" },
  { name: "Assignment", status: "pending" },
  { name: "Lunch", status: "pending" },
  { name: "Project", status: "pending" },
];

function createStyles(theme: Theme, insets: { top: number; bottom: number }) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingTop: insets.top + theme.spacing.lg,
      paddingBottom: insets.bottom + theme.spacing.xl,
      paddingHorizontal: theme.spacing.xl,
    },
    panelContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    panel: {
      width: "100%",
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.spacing.md,
      padding: theme.spacing.lg,
    },
    panelTitle: {
      ...theme.typography.titleMedium,
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.md,
    },
    taskRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: theme.spacing.sm,
    },
    taskTime: {
      ...theme.typography.bodySmall,
      color: theme.colors.onSurfaceVariant,
      width: 60,
    },
    taskName: {
      ...theme.typography.bodyMedium,
      color: theme.colors.onSurface,
      flex: 1,
    },
    taskStatus: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    taskStatusMissed: {
      backgroundColor: theme.colors.error,
    },
    taskStatusDone: {
      backgroundColor: theme.colors.primary,
    },
    taskStatusPending: {
      borderWidth: 2,
      borderColor: theme.colors.outline,
      backgroundColor: "transparent",
    },
    statusText: {
      color: theme.colors.onPrimary,
      fontSize: 12,
      fontWeight: "bold",
    },
    statusIcon: {
      color: theme.colors.onPrimary,
    },
    rescheduleButton: {
      alignSelf: "center",
      marginTop: theme.spacing.lg,
      backgroundColor: theme.colors.primary,
      borderRadius: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
      minHeight: 48,
      justifyContent: "center",
      alignItems: "center",
    },
    rescheduleButtonText: {
      ...theme.typography.labelLarge,
      color: theme.colors.onPrimary,
    },
    caption: {
      ...theme.typography.bodySmall,
      color: theme.colors.onSurfaceVariant,
      textAlign: "center",
      marginTop: theme.spacing.xxl,
      marginBottom: theme.spacing.lg,
    },
    continueButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.spacing.sm,
      minHeight: 48,
      alignItems: "center",
      justifyContent: "center",
    },
    continueDisabled: { opacity: 0.4 },
    continueText: {
      ...theme.typography.labelLarge,
      color: theme.colors.onPrimary,
    },
  });
}

export default function AnimationScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);
  const [canContinue, setCanContinue] = useState(false);
  const [panelHeight, setPanelHeight] = useState(0);
  const beforeOpacity = useRef(new Animated.Value(1)).current;
  const afterOpacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Phase 1: show BEFORE
    // T=1.5s: button press animation
    const t1 = setTimeout(() => {
      Animated.sequence([
        Animated.timing(buttonScale, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(buttonScale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }, 1500);

    // T=2.5s: BEFORE fade out, AFTER fade in
    const t2 = setTimeout(() => {
      Animated.timing(beforeOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
      Animated.timing(afterOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, 2500);

    // T=4.0s: enable continue
    const t3 = setTimeout(() => setCanContinue(true), DURATION);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [beforeOpacity, afterOpacity, buttonScale]);

  const handleContinue = useCallback(() => {
    const next = getNextScreen("animation");
    if (next) router.push(`/(onboarding)/${next}`);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.panelContainer}>
        <Animated.View
          style={{
            opacity: beforeOpacity,
            position: "absolute",
            width: "100%",
          }}
        >
          <View>
            <Text
              style={[
                styles.panelTitle,
                {
                  color: theme.colors.onSurface,
                  marginBottom: theme.spacing.md,
                },
              ]}
            >
              BEFORE
            </Text>
            {BEFORE_TASKS.map((task, i) => (
              <View key={i} style={styles.taskRow}>
                <Text style={styles.taskTime}>
                  {["8:00", "9:00", "11:00", "?", "?"][i]}
                </Text>
                <Text style={styles.taskName}>{task.name}</Text>
                <View
                  style={[
                    styles.taskStatus,
                    task.status === "missed" && styles.taskStatusMissed,
                    task.status === "pending" && styles.taskStatusPending,
                  ]}
                >
                  {task.status === "missed" ? (
                    <Ionicons
                      name="close"
                      size={14}
                      color={theme.colors.onError}
                    />
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View
          style={{
            opacity: afterOpacity,
            position: "absolute",
            width: "100%",
          }}
          onLayout={(e) => setPanelHeight(e.nativeEvent.layout.height)}
        >
          <View>
            <Text
              style={[
                styles.panelTitle,
                {
                  color: theme.colors.onSurface,
                  marginBottom: theme.spacing.md,
                },
              ]}
            >
              AFTER
            </Text>
            {AFTER_TASKS.map((task, i) => (
              <View key={i} style={styles.taskRow}>
                <Text style={styles.taskTime}>
                  {["8:00", "9:30", "11:00", "13:00", "14:00"][i]}
                </Text>
                <Text style={styles.taskName}>{task.name}</Text>
                <View
                  style={[
                    styles.taskStatus,
                    task.status === "done" && styles.taskStatusDone,
                    task.status === "pending" && styles.taskStatusPending,
                  ]}
                >
                  {task.status === "done" ? (
                    <Ionicons
                      name="checkmark"
                      size={14}
                      color={theme.colors.onPrimary}
                    />
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Dynamic spacer matching panel height */}
        <View
          style={{ height: panelHeight, marginBottom: theme.spacing.xxxl }}
        />

        <Animated.View
          style={{
            transform: [{ scale: buttonScale }],
            alignSelf: "center",
            marginTop: theme.spacing.lg,
          }}
        >
          <View style={styles.rescheduleButton}>
            <Text style={styles.rescheduleButtonText}>Reschedule</Text>
          </View>
        </Animated.View>
      </View>

      <Text style={styles.caption}>
        When life happens, Shift AI rebuilds your entire day in seconds.
      </Text>

      <Pressable
        style={({ pressed }) => [
          styles.continueButton,
          !canContinue && styles.continueDisabled,
          pressed && { opacity: theme.interaction.pressedOpacity },
        ]}
        onPress={handleContinue}
        disabled={!canContinue}
        accessibilityRole="button"
        accessibilityLabel="Continue"
      >
        <Text style={styles.continueText}>Continue</Text>
      </Pressable>
    </View>
  );
}
