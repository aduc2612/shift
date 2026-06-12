import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/providers/theme-provider';
import type { Theme } from '@/constants/theme';
import type { Task } from '@/types/task';
import Checkbox from '@/components/primitives/Checkbox';
import Badge from '@/components/primitives/Badge';
import { formatDuration, formatTimeRange, isSameDay, parseLocalDate } from '@/utils/date';
import { withOpacity } from '@/utils/color';

type TaskCardProps = {
  task: Task;
  state: 'done' | 'active' | 'upcoming';
  onToggleComplete: () => void;
  onPress: () => void;
};

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      borderRadius: 14,
      padding: 12,
    },
    done: {
      backgroundColor: theme.colors.surface,
      opacity: 0.55,
    },
    active: {
      backgroundColor: theme.colors.surfaceVariant,
      borderWidth: 1,
      borderColor: withOpacity(theme.colors.primary, 0.2),
    },
    upcoming: {
      backgroundColor: theme.colors.surface,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    name: {
      ...theme.typography.bodyMedium,
      fontWeight: '500',
      fontSize: 15,
      color: theme.colors.onSurface,
      flex: 1,
      lineHeight: 20,
    },
    nameDone: {
      textDecorationLine: 'line-through',
      color: theme.colors.onSurfaceVariant,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 6,
    },
    duration: {
      ...theme.typography.labelSmall,
      color: theme.colors.onSurfaceVariant,
    },
    timeRange: {
      ...theme.typography.labelSmall,
      color: theme.colors.outline,
    },
  });
}

export default function TaskCard({
  task,
  state,
  onToggleComplete,
  onPress,
}: TaskCardProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  const containerStyle =
    state === 'done'
      ? styles.done
      : state === 'active'
        ? styles.active
        : styles.upcoming;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        containerStyle,
        pressed && { backgroundColor: theme.colors.surfaceVariant },
      ]}
    >
      <View style={styles.topRow}>
        <Text
          style={[styles.name, state === 'done' && styles.nameDone]}
          numberOfLines={2}
        >
          {task.name}
        </Text>
        <Checkbox checked={task.completed} onToggle={onToggleComplete} />
      </View>
      <View style={styles.metaRow}>
        {task.durationMinutes ? (
          <Text style={styles.duration}>
            {formatDuration(task.durationMinutes)}
          </Text>
        ) : null}
        {task.startTime && task.endTime ? (
          <Text style={styles.timeRange}>
            {formatTimeRange(task.startTime, task.endTime)}
          </Text>
        ) : null}
        {task.deadline && !task.completed && isSameDay(parseLocalDate(task.deadline), new Date()) && (
          <Badge label="Due today" variant="accent" />
        )}
      </View>
    </Pressable>
  );
}
