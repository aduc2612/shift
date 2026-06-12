import { StyleSheet, type DimensionValue, View } from 'react-native';
import { useTheme } from '@/providers/theme-provider';
import type { Theme } from '@/constants/theme';

type ProgressBarProps = {
  value: number; // 0 to 1
};

function createStyles(theme: Theme) {
  return StyleSheet.create({
    outer: {
      width: '100%',
      height: 4,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.borderRadius.sm,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.sm,
    },
  });
}

export default function ProgressBar({ value }: ProgressBarProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const clampedValue = Math.min(1, Math.max(0, value));
  const width = `${clampedValue * 100}%`;

  return (
    <View style={styles.outer}>
      <View style={[styles.fill, { width: width as DimensionValue }]} />
    </View>
  );
}
