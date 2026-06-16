import { useMemo, useState, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/providers/theme-provider';
import { useOnboardingStore } from '@/features/onboarding/state';
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
    question: { ...theme.typography.headlineSmall, color: theme.colors.onBackground, marginBottom: theme.spacing.xxl },
    timeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.xxl,
    },
    timeLabel: { ...theme.typography.bodyLarge, color: theme.colors.onSurface, flex: 1 },
    stepperContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.spacing.sm,
      paddingHorizontal: theme.spacing.sm,
      minHeight: 48,
    },
    stepperValue: {
      ...theme.typography.titleMedium,
      color: theme.colors.onSurface,
      paddingHorizontal: theme.spacing.md,
      minWidth: 100,
      textAlign: 'center',
    },
    stepButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepButtonText: { ...theme.typography.titleMedium, color: theme.colors.onSurface },
    caption: { ...theme.typography.bodyMedium, color: theme.colors.onSurfaceVariant, fontStyle: 'italic' },
    continueButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.spacing.sm,
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 'auto',
    },
    continueDisabled: { opacity: 0.4 },
    continueText: { ...theme.typography.labelLarge, color: theme.colors.onPrimary },
  });
}

function cycleHour(h: number, forward: boolean): number {
  return forward ? (h % 23) + 1 : h <= 1 ? 23 : h - 1;
}

function cycleMinute(m: number, forward: boolean): number {
  const opts = [0, 15, 30, 45];
  const idx = opts.indexOf(m);
  const next = forward ? (idx + 1) % 4 : (idx - 1 + 4) % 4;
  return opts[next];
}

function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${minute.toString().padStart(2, '0')} ${period}`;
}

function toHHMM(hour: number, minute: number): string {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

function TimeStepper({
  label,
  hour,
  minute,
  onChange,
}: {
  label: string;
  hour: number;
  minute: number;
  onChange: (h: number, m: number) => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);

  return (
    <View style={styles.timeRow}>
      <Text style={styles.timeLabel}>{label}</Text>
      <View style={styles.stepperContainer}>
        <Pressable
          style={styles.stepButton}
          onPress={() => onChange(cycleHour(hour, false), minute)}
          accessibilityLabel={`Decrease ${label} hour`}
        >
          <Text style={styles.stepButtonText}>↑</Text>
        </Pressable>
        <Text style={styles.stepperValue}>{formatTime(hour, minute)}</Text>
        <Pressable
          style={styles.stepButton}
          onPress={() => onChange(cycleHour(hour, true), minute)}
          accessibilityLabel={`Increase ${label} hour`}
        >
          <Text style={styles.stepButtonText}>↓</Text>
        </Pressable>
      </View>
    </View>
  );
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

  const valid = true; // always valid with defaults

  const handleContinue = useCallback(() => {
    setField('wakeUpTime', toHHMM(wakeH, wakeM));
    setField('sleepTime', toHHMM(sleepH, sleepM));
    router.push('/(onboarding)/energy-peak' as any);
  }, [wakeH, wakeM, sleepH, sleepM, setField]);

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        <ProgressBar current={4} total={TOTAL} />
      </View>
      <Text style={styles.question}>When do you sleep and wake?</Text>

      <TimeStepper label="Wake up:" hour={wakeH} minute={wakeM} onChange={(h, m) => { setWakeH(h); setWakeM(m); }} />
      <TimeStepper label="Go to bed:" hour={sleepH} minute={sleepM} onChange={(h, m) => { setSleepH(h); setSleepM(m); }} />

      <Text style={styles.caption}>We use this to build your daily structure.</Text>

      <Pressable
        style={({ pressed }) => [styles.continueButton, !valid && styles.continueDisabled, pressed && { opacity: theme.interaction.pressedOpacity }]}
        onPress={handleContinue}
        accessibilityRole="button"
        accessibilityLabel="Continue"
      >
        <Text style={styles.continueText}>Continue →</Text>
      </Pressable>
    </View>
  );
}
