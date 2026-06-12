import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/providers/theme-provider';
import type { Theme } from '@/constants/theme';
import ProgressBar from '@/components/primitives/ProgressBar';

type ScheduleProgressProps = {
  completed: number;
  total: number;
};

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      marginHorizontal: 20,
      marginBottom: 16,
    },
    bar: {
      marginBottom: 8,
    },
    meta: {
      ...theme.typography.bodySmall,
      color: theme.colors.onSurfaceVariant,
    },
  });
}

export default function ScheduleProgress({
  completed,
  total,
}: ScheduleProgressProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const value = total > 0 ? completed / total : 0;

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        <ProgressBar value={value} />
      </View>
      <Text style={styles.meta}>
        {completed} of {total} done
      </Text>
    </View>
  );
}
