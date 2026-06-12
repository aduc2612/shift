import { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { DateTimePicker } from "@expo/ui/community/datetime-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/providers/theme-provider";
import type { Theme } from "@/constants/theme";
import type { Task } from "@/types/task";
import { mockTasks } from "@/features/schedule/mockTasks";
import {
  buildScheduleData,
  getTaskState,
  type ListItem,
} from "@/features/schedule/utils";
import ScheduleHeader from "@/features/schedule/components/ScheduleHeader";
import ScheduleProgress from "@/features/schedule/components/ScheduleProgress";
import TimelineRow from "@/features/schedule/components/TimelineRow";
import TaskCard from "@/features/schedule/components/TaskCard";
import NowIndicator from "@/features/schedule/components/NowIndicator";
import RescheduleSheet from "@/features/schedule/components/RescheduleSheet";
import TaskFormSheet from "@/features/schedule/components/TaskFormSheet";
import FAB from "@/components/primitives/FAB";
import { formatTime, isSameDay } from "@/utils/date";
import { useCurrentTime } from "@/hooks/useCurrentTime";

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    flatList: {
      flex: 1,
      paddingHorizontal: 20,
    },
    flatListContent: {
      paddingBottom: 100,
    },
    emptyText: {
      ...theme.typography.bodyMedium,
      color: theme.colors.onSurfaceVariant,
      textAlign: "center",
      marginTop: 40,
    },
    fabWrapper: {
      position: "absolute",
      bottom: 28,
      right: 20,
    },
    datePickerWrapper: {
      marginHorizontal: 20,
      marginBottom: 16,
    },
  });
}

export default function ScheduleScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme);
  const now = useCurrentTime(30_000);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showRescheduleSheet, setShowRescheduleSheet] = useState(false);
  const [taskSheetMode, setTaskSheetMode] = useState<"view" | "edit" | "add">("view");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskSheet, setShowTaskSheet] = useState(false);

  // For now, use mock data. In Phase 5+, this will fetch from Supabase.
  const allTasks = useMemo(() => mockTasks, []);

  const tasks = useMemo(
    () =>
      allTasks
        .filter((t) => isSameDay(new Date(t.startTime), selectedDate))
        .sort(
          (a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
        ),
    [allTasks, selectedDate],
  );

  const { items: listData, activeTaskId } = useMemo(
    () => buildScheduleData(tasks, now),
    [tasks, now],
  );

  const completedCount = useMemo(
    () => tasks.filter((t) => t.completed).length,
    [tasks],
  );

  const handleToggleComplete = useCallback((_taskId: string) => {
    // Placeholder — will be wired to Supabase in Phase 5
  }, []);

  const handleTaskPress = useCallback((taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      setTaskSheetMode("view");
      setShowTaskSheet(true);
    }
  }, [tasks]);

  const handleFabPress = useCallback(() => {
    setSelectedTask(null);
    setTaskSheetMode("add");
    setShowTaskSheet(true);
  }, []);

  const handleTaskSheetClose = useCallback(() => {
    setShowTaskSheet(false);
    setSelectedTask(null);
  }, []);

  const handleEdit = useCallback(() => {
    setTaskSheetMode("edit");
  }, []);

  const handleCancel = useCallback(() => {
    if (taskSheetMode === "add") {
      setShowTaskSheet(false);
      setSelectedTask(null);
    } else {
      setTaskSheetMode("view");
    }
  }, [taskSheetMode]);

  const handleTaskSave = useCallback((_task: Partial<Task>) => {
    // Placeholder — will be wired to Supabase in Phase 5
  }, []);

  const handleDateChange = useCallback((_event: unknown, date?: Date) => {
    if (date) {
      setSelectedDate(date);
      setShowDatePicker(false);
    }
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: ListItem; index: number }) => {
      if (item.type === "now") {
        return <NowIndicator />;
      }

      const task = item.task;
      const state = getTaskState(task, now);
      const showNow = task.id === activeTaskId;
      const time = formatTime(task.startTime);
      const isLast = index === listData.length - 1;

      return (
        <TimelineRow
          time={time}
          state={state}
          showNow={showNow}
          isLast={isLast}
        >
          <TaskCard
            task={task}
            state={state}
            onToggleComplete={() => handleToggleComplete(task.id)}
            onPress={() => handleTaskPress(task.id)}
          />
        </TimelineRow>
      );
    },
    [now, activeTaskId, listData.length, handleToggleComplete, handleTaskPress],
  );

  const keyExtractor = useCallback((item: ListItem) => {
    if (item.type === "now") return "now";
    return `task-${item.task.id}`;
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScheduleHeader
        date={selectedDate}
        onPressDate={() => setShowDatePicker(!showDatePicker)}
        onPressReschedule={() => setShowRescheduleSheet(true)}
      />

      <ScheduleProgress completed={completedCount} total={tasks.length} />

      {showDatePicker && (
        <View style={styles.datePickerWrapper}>
          <DateTimePicker
            value={selectedDate}
            mode="date"
            onValueChange={handleDateChange}
            onDismiss={() => setShowDatePicker(false)}
          />
        </View>
      )}

      <FlatList
        data={listData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        style={styles.flatList}
        contentContainerStyle={styles.flatListContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No tasks for this day</Text>
        }
      />

      <View style={styles.fabWrapper}>
        <FAB onPress={handleFabPress} />
      </View>

      <RescheduleSheet
        visible={showRescheduleSheet}
        onClose={() => setShowRescheduleSheet(false)}
      />

      <TaskFormSheet
        visible={showTaskSheet}
        onClose={handleTaskSheetClose}
        task={selectedTask}
        mode={taskSheetMode}
        onEdit={handleEdit}
        onCancel={handleCancel}
        onSave={handleTaskSave}
      />
    </View>
  );
}
