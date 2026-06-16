import { useCallback, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/providers/theme-provider";
import { useOnboardingStore } from "@/features/onboarding/state";
import { buildSchedulePreview } from "@/features/onboarding/utils";
import ProgressBar from "@/features/onboarding/components/ProgressBar";
import type { Theme } from "@/constants/theme";

const TOTAL = 14;
const BULLET_ICONS: (keyof typeof Ionicons.glyphMap)[] = [
  "bulb-outline",
  "timer-outline",
  "sync-outline",
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
    title: {
      ...theme.typography.headlineSmall,
      color: theme.colors.onBackground,
      marginBottom: theme.spacing.xs,
      textAlign: "center",
    },
    subtitle: {
      ...theme.typography.bodyMedium,
      color: theme.colors.onSurfaceVariant,
      marginBottom: theme.spacing.xxl,
      textAlign: "center",
    },
    previewCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.xl,
      ...theme.shadows.md,
    },
    blockRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: theme.spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.outlineVariant,
    },
    blockLine: {
      ...theme.typography.bodyLarge,
      color: theme.colors.onSurface,
    },
    blockTimeAccent: {
      color: theme.colors.onSurfaceVariant,
      fontWeight: "500",
    },
    bullets: {
      marginTop: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    bullet: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: theme.spacing.sm,
    },
    bulletIcon: {
      marginTop: 2,
    },
    bulletText: {
      ...theme.typography.bodyMedium,
      color: theme.colors.onSurfaceVariant,
      flex: 1,
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

export default function SchedulePreviewScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);
  const productivityPeak = useOnboardingStore((s) => s.data.productivityPeak);

  const preview = useMemo(
    () => buildSchedulePreview(productivityPeak ?? "varies"),
    [productivityPeak],
  );

  return (
    <View style={styles.container}>
      <View style={styles.progressRow}>
        <ProgressBar current={11} total={TOTAL} />
      </View>

      <Text style={styles.title}>Your personal schedule{"\n"}is ready.</Text>
      <Text style={styles.subtitle}>Based on your profile, we recommend:</Text>

      <View style={styles.previewCard}>
        <View style={styles.blockRow}>
          <Text style={styles.blockLine}>
            <Text style={styles.blockTimeAccent}>{preview.deepWorkBlock}</Text>
            {"  ·  Deep work"}
          </Text>
        </View>

        <View style={styles.bullets}>
          {preview.bullets.map((b, i) => (
            <View key={i} style={styles.bullet}>
              <Ionicons
                name={BULLET_ICONS[i] ?? "ellipse-outline"}
                size={18}
                color={theme.colors.primary}
                style={styles.bulletIcon}
              />
              <Text style={styles.bulletText}>{b}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.bottom}>
        <Pressable
          style={({ pressed }) => [
            styles.continueButton,
            pressed && { opacity: theme.interaction.pressedOpacity },
          ]}
          onPress={() => router.push("/(onboarding)/notif-warmup")}
          accessibilityRole="button"
          accessibilityLabel="Continue"
        >
          <Text style={styles.continueText}>Continue</Text>
        </Pressable>
      </View>
    </View>
  );
}
