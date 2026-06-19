import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { DateTimePicker } from "@expo/ui/community/datetime-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/providers/theme-provider";
import { useToast } from "@/providers/toast-provider";
import type { Theme } from "@/constants/theme";
import type { Task } from "@/types/task";
import {
  buildScheduleData,
  getTaskState,
  type ListItem,
} from "@/features/schedule/utils";
import {
  useTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useToggleComplete,
} from "@/features/schedule/hooks/useTasks";
import ScheduleHeader from "@/features/schedule/components/ScheduleHeader";
import ScheduleProgress from "@/features/schedule/components/ScheduleProgress";
import TimelineRow from "@/features/schedule/components/TimelineRow";
import TaskCard from "@/features/schedule/components/TaskCard";
import NowIndicator from "@/features/schedule/components/NowIndicator";
import RescheduleSheet from "@/features/schedule/components/RescheduleSheet";
import TaskFormSheet from "@/features/schedule/components/TaskFormSheet";
import FAB from "@/components/primitives/FAB";
import { formatTime } from "@/utils/date";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useCurrentTime } from "@/hooks/useCurrentTime";
import { useReschedule } from "@/features/schedule/hooks/useReschedule";
import { useSyncNotifications } from "@/features/schedule/hooks/useSyncNotifications";

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
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
  });
}

export default function ScheduleScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme);
  const now = useCurrentTime(30_000);
  const toast = useToast();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showRescheduleSheet, setShowRescheduleSheet] = useState(false);
  const [taskSheetMode, setTaskSheetMode] = useState<"view" | "edit" | "add">("view");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskSheet, setShowTaskSheet] = useState(false);

  const { loading: authLoading } = useAuth();

  useSyncNotifications();

  const reschedule = useReschedule();

  const {
    data: tasks = [],
    status,
    isError,
  } = useTasks(selectedDate, authLoading);

  useEffect(() => {
    if (isError) {
      toast.show({ message: "Failed to load tasks." });
    }
  }, [isError, toast]);

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const toggleComplete = useToggleComplete();

  const { items: listData, activeTaskId } = useMemo(
    () => buildScheduleData(tasks, now, selectedDate.toDateString() === now.toDateString()),
    [tasks, now, selectedDate],
  );

  const completedCount = useMemo(
    () => tasks.filter((t) => t.completed).length,
    [tasks],
  );

  const handleToggleComplete = useCallback(
    (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;
      toggleComplete.mutate({ id: taskId, completed: !task.completed });
    },
    [tasks, toggleComplete],
  );

  const handleTaskPress = useCallback(
    (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        setSelectedTask(task);
        setTaskSheetMode("view");
        setShowTaskSheet(true);
      }
    },
    [tasks],
  );

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

  const handleTaskSave = useCallback(
    async (taskData: Partial<Task>) => {
      if (taskSheetMode === "add") {
        await createTask.mutateAsync(taskData);
      } else if (taskSheetMode === "edit" && selectedTask?.id) {
        await updateTask.mutateAsync({ id: selectedTask.id, updates: taskData });
      }
    },
    [taskSheetMode, selectedTask, createTask, updateTask],
  );

  const handleDelete = useCallback(
    (taskId: string) => {
      deleteTask.mutate(taskId, {
        onSuccess: () => {
          setShowTaskSheet(false);
          setSelectedTask(null);
        },
      });
    },
    [deleteTask],
  );

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

  if (status === 'pending') {
    return (
      <View style={[styles.container, styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

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
          tasks.length === 0 ? (
            <Text style={styles.emptyText}>No tasks for this day</Text>
          ) : null
        }
      />

      <View style={styles.fabWrapper}>
        <FAB onPress={handleFabPress} />
      </View>

      <RescheduleSheet
        visible={showRescheduleSheet}
        onClose={() => setShowRescheduleSheet(false)}
        onReschedule={async (whatChanged) => {
          try {
            await reschedule.mutateAsync({ whatChanged });
          } catch (e) {
            // Sheet stays open on error
            throw e;
          }
        }}
        isRescheduling={reschedule.isPending}
      />

      {showTaskSheet && (
        <TaskFormSheet
          key={selectedTask?.id ?? "add"}
          visible={showTaskSheet}
          onClose={handleTaskSheetClose}
          task={selectedTask}
          mode={taskSheetMode}
          onEdit={handleEdit}
          onCancel={handleCancel}
          onSave={handleTaskSave}
          onDelete={handleDelete}
          isSaving={createTask.isPending || updateTask.isPending}
          isDeleting={deleteTask.isPending}
        />
      )}
    </View>
  );
}
