import { useMemo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/providers/theme-provider';
import { useOnboardingStore } from '@/features/onboarding/state';
import { getPersonaReview } from '@/features/onboarding/utils';
import ProgressBar from '@/features/onboarding/components/ProgressBar';
import type { Theme } from '@/constants/theme';

const TOTAL = 13;

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
    subtitle: {
      ...theme.typography.bodyLarge,
      color: theme.colors.onSurfaceVariant,
      marginBottom: theme.spacing.xxl,
      textAlign: 'center',
    },
    card: {
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.spacing.md,
      padding: theme.spacing.lg,
      marginBottom: 'auto',
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.primaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.md,
    },
    avatarText: { ...theme.typography.titleMedium, color: theme.colors.onPrimaryContainer },
    name: { ...theme.typography.titleSmall, color: theme.colors.onSurface, marginBottom: theme.spacing.xs },
    rating: { ...theme.typography.bodyMedium, color: theme.colors.onSurfaceVariant, marginBottom: theme.spacing.md },
    quote: {
      ...theme.typography.bodyLarge,
      color: theme.colors.onSurface,
      fontStyle: 'italic',
      lineHeight: 24,
    },
    continueButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.spacing.sm,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    continueText: { ...theme.typography.labelLarge, color: theme.colors.onPrimary },
  });
}

export default function PersonaReviewScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);
  const data = useOnboardingStore((s) => s.data);
  const review = getPersonaReview(data.persona);

  const handleContinue = useCallback(() => {
    router.push('/(onboarding)/progress-graph' as any);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        <ProgressBar current={8} total={TOTAL} />
      </View>

      <Text style={styles.subtitle}>People just like you are using Shift AI.</Text>

      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{review.avatarInitials}</Text>
        </View>
        <Text style={styles.name}>{review.name}</Text>
        <Text style={styles.rating}>{'★'.repeat(review.rating)} {review.rating}.0</Text>
        <Text style={styles.quote}>"{review.quote}"</Text>
      </View>

      <Pressable
        style={({ pressed }) => [styles.continueButton, pressed && { opacity: theme.interaction.pressedOpacity }]}
        onPress={handleContinue}
        accessibilityRole="button"
        accessibilityLabel="Continue"
      >
        <Text style={styles.continueText}>Continue →</Text>
      </Pressable>
    </View>
  );
}
