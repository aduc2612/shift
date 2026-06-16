import { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/providers/theme-provider';
import ProgressBar from '@/features/onboarding/components/ProgressBar';
import type { Theme } from '@/constants/theme';

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
    content: {
      flex: 1,
      justifyContent: 'center',
    },
    bell: {
      fontSize: 48,
      textAlign: 'center',
      marginBottom: theme.spacing.xl,
    },
    title: {
      ...theme.typography.headlineSmall,
      color: theme.colors.onBackground,
      textAlign: 'center',
      marginBottom: theme.spacing.xl,
    },
    bullets: {
      marginBottom: theme.spacing.xxl,
      gap: theme.spacing.lg,
    },
    bullet: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.md,
    },
    bulletEmoji: {
      fontSize: 20,
    },
    bulletText: {
      ...theme.typography.bodyLarge,
      color: theme.colors.onSurface,
      flex: 1,
    },
    spamNote: {
      ...theme.typography.bodySmall,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      fontStyle: 'italic',
      marginBottom: theme.spacing.xxl,
    },
    buttonRow: {
      gap: theme.spacing.md,
    },
    primaryButton: {
      ...theme.componentStyles.button,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      minHeight: 48,
    },
    primaryText: { ...theme.typography.labelLarge, color: theme.colors.onPrimary },
    secondaryButton: {
      ...theme.componentStyles.button,
      backgroundColor: theme.colors.surfaceVariant,
      alignItems: 'center',
      minHeight: 48,
    },
    secondaryText: { ...theme.typography.labelLarge, color: theme.colors.onSurfaceVariant },
    bottom: {
      paddingBottom: insets.bottom + theme.spacing.xl,
    },
  });
}

export default function NotifWarmupScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);

  const handleTurnOn = useCallback(() => {
    router.push('/(onboarding)/notif-permission' as any);
  }, []);

  const handleMaybeLater = useCallback(() => {
    router.replace('/(tabs)');
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.progressRow}>
        <ProgressBar current={12} total={TOTAL} />
      </View>

      <View style={styles.content}>
        <Text style={styles.bell}>🔔</Text>
        <Text style={styles.title}>Stay on track{'\n'}without looking</Text>

        <View style={styles.bullets}>
          <View style={styles.bullet}>
            <Text style={styles.bulletEmoji}>🔔</Text>
            <Text style={styles.bulletText}>
              A heads-up 10 min before each task starts
            </Text>
          </View>
          <View style={styles.bullet}>
            <Text style={styles.bulletEmoji}>✅</Text>
            <Text style={styles.bulletText}>
              A check-in when a task ends
            </Text>
          </View>
          <View style={styles.bullet}>
            <Text style={styles.bulletEmoji}>💬</Text>
            <Text style={styles.bulletText}>
              A nudge if you fall behind — so nothing is lost
            </Text>
          </View>
        </View>

        <Text style={styles.spamNote}>We don't spam. One tap to turn off anytime.</Text>
      </View>

      <View style={styles.buttonRow}>
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && { opacity: theme.interaction.pressedOpacity },
          ]}
          onPress={handleTurnOn}
          accessibilityRole="button"
          accessibilityLabel="Turn on reminders"
        >
          <Text style={styles.primaryText}>Turn on reminders  →</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && { opacity: theme.interaction.pressedOpacity },
          ]}
          onPress={handleMaybeLater}
          accessibilityRole="button"
          accessibilityLabel="Maybe later"
        >
          <Text style={styles.secondaryText}>Maybe later</Text>
        </Pressable>
      </View>
    </View>
  );
}
