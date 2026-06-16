import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/providers/theme-provider';
import { requestNotificationPermission } from '@/services/notifications';
import type { Theme } from '@/constants/theme';

function createStyles(theme: Theme, insets: { top: number; bottom: number }) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingTop: insets.top + theme.spacing.lg,
      paddingHorizontal: theme.spacing.xl,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    icon: {
      fontSize: 48,
      marginBottom: theme.spacing.xl,
    },
    title: {
      ...theme.typography.headlineSmall,
      color: theme.colors.onBackground,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    message: {
      ...theme.typography.bodyLarge,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
    },
    bottom: {
      paddingBottom: insets.bottom + theme.spacing.xl,
    },
    continueButton: {
      ...theme.componentStyles.button,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      minHeight: 48,
    },
    continueText: { ...theme.typography.labelLarge, color: theme.colors.onPrimary },
  });
}

export default function NotifPermissionScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);
  const [granted, setGranted] = useState<boolean | null>(null);

  useEffect(() => {
    requestNotificationPermission().then(setGranted).catch(() => setGranted(false));
  }, []);

  const handleContinue = useCallback(() => {
    router.replace('/(tabs)');
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>{granted === null ? '⏳' : granted ? '✅' : '🔕'}</Text>
        <Text style={styles.title}>
          {granted === null
            ? 'Requesting...'
            : granted
              ? 'Notifications enabled'
              : 'Notifications disabled'}
        </Text>
        <Text style={styles.message}>
          {granted === null
            ? 'We need your permission to send reminders'
            : granted
              ? "You'll receive timely reminders for every task"
              : "You won't get reminders. You can enable them later in your device settings."}
        </Text>
      </View>

      <View style={styles.bottom}>
        <Pressable
          style={({ pressed }) => [
            styles.continueButton,
            pressed && { opacity: theme.interaction.pressedOpacity },
          ]}
          onPress={handleContinue}
          disabled={granted === null}
          accessibilityRole="button"
          accessibilityLabel="Finish"
        >
          <Text style={styles.continueText}>
            {granted === null ? 'Please wait...' : 'Open Shift AI  →'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
