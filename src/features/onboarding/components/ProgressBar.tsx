import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/providers/theme-provider';
import type { Theme } from '@/constants/theme';

export type ProgressBarProps = {
  current: number;
  total: number;
};

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      height: 4,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 2,
      overflow: 'hidden',
      marginHorizontal: theme.spacing.xl,
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.xl,
    },
    fill: {
      height: '100%',
      backgroundColor: theme.colors.primary,
      borderRadius: 2,
    },
  });
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (total <= 0) return null;

  const fraction = Math.min(current / total, 1);

  return (
    <View style={styles.container}>
      <View style={[styles.fill, { width: `${fraction * 100}%` }]} />
    </View>
  );
}
