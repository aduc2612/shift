import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DateTimePicker } from "@expo/ui/community/datetime-picker";
import { useTheme } from "@/providers/theme-provider";
import type { Theme } from "@/constants/theme";
import type { Task } from "@/types/task";
import BottomSheet from "@/components/primitives/BottomSheet";
import Alert from "@/components/primitives/Alert";
import { formatDuration, formatTime, formatDate } from "@/utils/date";
import { withOpacity } from "@/utils/color";
import {
  usePlaceTask,
  type PlaceTaskParams,
} from "@/features/schedule/hooks/usePlaceTask";
import { RESCHEDULE_CONSTANTS } from "@/constants/reschedule";

type FieldErrors = {
  name?: string;
  time?: string;
};

type TaskFormSheetProps = {
  visible: boolean;
  onClose: () => void;
  task?: Task | null;
  mode: "view" | "edit" | "add";
  onEdit?: () => void;
  onCancel?: () => void;
  onSave?: (task: Partial<Task>) => Promise<void> | void;
  onDelete?: (id: string) => Promise<void> | void;
  isSaving?: boolean;
  isDeleting?: boolean;
};

function createStyles(theme: Theme) {
  return StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: theme.spacing.lg,
    },
    headerTitle: {
      ...theme.typography.titleMedium,
      color: theme.colors.onSurface,
      flex: 1,
      textAlign: "center",
    },
    headerBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.surfaceVariant,
      alignItems: "center",
      justifyContent: "center",
    },
    section: {
      marginBottom: theme.spacing.lg,
    },
    sectionLabel: {
      ...theme.typography.labelSmall,
      fontWeight: "600",
      color: theme.colors.onSurfaceVariant,
      textTransform: "uppercase" as const,
      letterSpacing: 0.5,
      marginBottom: theme.spacing.sm,
    },
    optionalLabel: {
      fontWeight: "400",
      color: theme.colors.outline,
    },
    taskNameDisplay: {
      ...theme.typography.titleLarge,
      color: theme.colors.onSurface,
      paddingVertical: theme.spacing.md,
    },
    taskNameInput: {
      backgroundColor: theme.colors.surfaceVariant,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      ...theme.typography.titleMedium,
      color: theme.colors.onSurface,
    },
    inputError: {
      borderColor: theme.colors.error,
    },
    errorText: {
      ...theme.typography.labelSmall,
      color: theme.colors.error,
      marginTop: theme.spacing.xs,
    },
    timeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
    },
    timeCol: {
      flex: 1,
    },
    timeLabel: {
      ...theme.typography.labelSmall,
      color: theme.colors.onSurfaceVariant,
      marginBottom: theme.spacing.xs,
    },
    timeSeparator: {
      ...theme.typography.bodyMedium,
      color: theme.colors.outline,
      marginBottom: theme.spacing.lg,
    },
    dateRow: {
      marginTop: theme.spacing.md,
    },
    durationBadge: {
      backgroundColor: withOpacity(theme.colors.success, 0.1),
      borderWidth: 1,
      borderColor: withOpacity(theme.colors.success, 0.2),
      borderRadius: theme.borderRadius.sm,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: theme.spacing.lg,
    },
    durationText: {
      ...theme.typography.labelSmall,
      color: theme.colors.success,
      fontWeight: "500",
    },
    disabledTimeCol: {
      opacity: 0.4,
    },
    timeDisplayBtn: {
      backgroundColor: theme.colors.surfaceVariant,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
    },
    timeDisplayText: {
      ...theme.typography.bodyMedium,
      color: theme.colors.onSurface,
    },
    disabledText: {
      color: theme.colors.outline,
    },
    aiPlaceholder: {
      backgroundColor: theme.colors.surfaceVariant,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
    },
    aiPlaceholderText: {
      ...theme.typography.bodySmall,
      color: theme.colors.onSurfaceVariant,
      fontStyle: "italic",
    },
    toggleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: theme.spacing.sm,
    },
    toggleLabel: {
      ...theme.typography.bodyMedium,
      color: theme.colors.onSurface,
    },
    aiCard: {
      backgroundColor: withOpacity(theme.colors.primary, 0.05),
      borderWidth: 1,
      borderColor: withOpacity(theme.colors.primary, 0.12),
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
    },
    aiCardLabel: {
      ...theme.typography.labelSmall,
      fontWeight: "600",
      color: theme.colors.primary,
      textTransform: "uppercase" as const,
      letterSpacing: 0.5,
      marginBottom: theme.spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
    },
    aiCardText: {
      ...theme.typography.bodySmall,
      color: theme.colors.onSurface,
      lineHeight: 18,
    },
    contextInput: {
      backgroundColor: theme.colors.surfaceVariant,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      ...theme.typography.bodySmall,
      color: theme.colors.onSurface,
      minHeight: 80,
      textAlignVertical: "top" as const,
    },
    contextHint: {
      ...theme.typography.labelSmall,
      color: theme.colors.onSurfaceVariant,
      marginTop: theme.spacing.sm,
      lineHeight: 16,
    },
    footer: {
      flexDirection: "row",
      gap: theme.spacing.md,
      marginTop: theme.spacing.xl,
    },
    cancelBtn: {
      flex: 1,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.xl,
      backgroundColor: theme.colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    cancelBtnText: {
      ...theme.typography.titleSmall,
      color: theme.colors.onSurface,
    },
    doneBtn: {
      flex: 1,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.xl,
      backgroundColor: theme.colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    doneBtnText: {
      ...theme.typography.titleSmall,
      color: theme.colors.onPrimary,
    },
    deleteSection: {
      marginTop: theme.spacing.xl,
      borderRadius: theme.borderRadius.lg,
    },
    deleteBtn: {
      minHeight: 48,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.xl,
      backgroundColor: withOpacity(theme.colors.error, 0.1),
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: theme.spacing.sm,
    },
    deleteBtnText: {
      ...theme.typography.titleSmall,
      color: theme.colors.error,
    },
    spinner: {
      marginLeft: theme.spacing.sm,
    },
  });
}

export default function TaskFormSheet({
  visible,
  onClose,
  task = null,
  mode,
  onEdit,
  onCancel,
  onSave,
  onDelete,
  isSaving = false,
  isDeleting = false,
}: TaskFormSheetProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const placeTask = usePlaceTask();

  const [name, setName] = useState(task?.name ?? "");
  const [startHour, setStartHour] = useState(task?.startTime ?? "");
  const [endHour, setEndHour] = useState(task?.endTime ?? "");
  const [deadline, setDeadline] = useState(task?.deadline ?? "");
  const [aiContext, setAiContext] = useState(task?.aiContext ?? "");
  const [aiDecidesTime, setAiDecidesTime] = useState(
    task?.aiDecidesTime ?? false,
  );

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);

  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const [errors, setErrors] = useState<FieldErrors>({});

  // Date derived from startHour, defaults to today for add mode
  const currentDate = useMemo(() => {
    return startHour ? new Date(startHour) : new Date();
  }, [startHour]);

  // Shift both start and end to the new date, preserving times
  const handleDateChange = useCallback(
    (newDate: Date) => {
      if (startHour) {
        const start = new Date(startHour);
        start.setFullYear(
          newDate.getFullYear(),
          newDate.getMonth(),
          newDate.getDate(),
        );
        setStartHour(start.toISOString());
      }
      if (endHour) {
        const end = new Date(endHour);
        end.setFullYear(
          newDate.getFullYear(),
          newDate.getMonth(),
          newDate.getDate(),
        );
        setEndHour(end.toISOString());
      }
    },
    [startHour, endHour],
  );

  const durationMinutes = useMemo(() => {
    if (!startHour || !endHour) return 0;
    const start = new Date(startHour).getTime();
    const end = new Date(endHour).getTime();
    const diff = Math.round((end - start) / 60_000);
    return diff > 0 ? diff : 0;
  }, [startHour, endHour]);

  const headerTitle = mode === "add" ? "Add Task" : "Edit Task";

  const handleCancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  const handleDone = useCallback(async () => {
    const newErrors: FieldErrors = {};

    if (!name.trim()) {
      newErrors.name = "Task name is required";
    }

    // Skip time validation if AI decides times, unless editing a task
    // that already has times set (to allow clearing AI toggle later)
    if (!aiDecidesTime) {
      if (!startHour || !endHour) {
        newErrors.time = "Start and end times are required";
      } else if (new Date(endHour) <= new Date(startHour)) {
        newErrors.time = "End time must be after start time";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    // Determine if AI placement is needed
    // Place when:
    //   - New task with AI deciding time
    //   - AI turned ON (user hands control to AI)
    //   - AI context changed while AI is already on
    // Do NOT place when user turns AI OFF (manual control)
    const aiTurnedOn =
      mode === "edit" &&
      aiDecidesTime &&
      aiDecidesTime !== (task?.aiDecidesTime ?? false);

    const aiContextChangedWhileOn =
      mode === "edit" && aiDecidesTime && aiContext !== (task?.aiContext ?? "");

    const needsAiPlacement =
      (mode === "add" && aiDecidesTime) ||
      aiTurnedOn ||
      aiContextChangedWhileOn;

    if (needsAiPlacement) {
      // AI flow: place-task handles creation/update internally
      const taskName = name.trim();

      // Use a sensible default duration if times weren't set
      const effectiveDuration =
        durationMinutes > 0 ? durationMinutes : 30;

      let whatChanged: string;
      if (mode === "add") {
        whatChanged = RESCHEDULE_CONSTANTS.WHAT_CHANGED.NEW_AI_TASK(taskName);
      } else if (aiTurnedOn) {
        whatChanged = RESCHEDULE_CONSTANTS.WHAT_CHANGED.AI_ENABLED(taskName);
      } else {
        whatChanged =
          RESCHEDULE_CONSTANTS.WHAT_CHANGED.AI_CONTEXT_CHANGED(taskName);
      }

      try {
        await placeTask.mutateAsync({
          taskData: {
            name: name.trim(),
            durationMinutes: effectiveDuration,
            deadline: deadline || null,
            aiContext: aiContext || null,
          },
          whatChanged,
          mode: mode as "add" | "edit",
          previousTask: mode === "edit" ? (task ?? undefined) : undefined,
          existingTaskId: mode === "edit" ? task?.id : undefined,
        } as PlaceTaskParams);
      } catch {
        // Stay open — error displayed inline
        return;
      }
    } else {
      // Manual flow: save task directly via onSave
      const taskPayload: Partial<Task> = {
        name: name.trim(),
        durationMinutes,
        deadline: deadline || null,
        aiDecidesTime,
        aiContext: aiContext || null,
      };

      if (!aiDecidesTime) {
        taskPayload.startTime = startHour;
        taskPayload.endTime = endHour;
      }

      try {
        await onSave?.(taskPayload);
      } catch {
        // Save failed — stay open
        return;
      }
    }

    onClose();
  }, [
    name,
    startHour,
    endHour,
    durationMinutes,
    deadline,
    aiDecidesTime,
    aiContext,
    mode,
    task,
    onSave,
    onClose,
    placeTask,
  ]);

  const handleDeleteConfirm = useCallback(() => {
    if (task?.id && onDelete) {
      onDelete(task.id);
    }
    setShowDeleteAlert(false);
  }, [task, onDelete]);

  const isRescheduling = placeTask.isPending && mode !== "view";

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          {mode === "view" ? (
            <Pressable style={styles.headerBtn} onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={18} color={theme.colors.onSurface} />
            </Pressable>
          ) : (
            <Pressable
              style={styles.headerBtn}
              onPress={handleCancel}
              hitSlop={8}
            >
              <Ionicons name="close" size={18} color={theme.colors.onSurface} />
            </Pressable>
          )}
          <Text style={styles.headerTitle}>
            {mode === "view" ? "Task Details" : headerTitle}
          </Text>
          {mode === "view" ? (
            <Pressable style={styles.headerBtn} onPress={onEdit} hitSlop={8}>
              <Ionicons
                name="pencil"
                size={16}
                color={theme.colors.onBackground}
              />
            </Pressable>
          ) : (
            <View style={{ width: 36 }} />
          )}
        </View>

        {/* Task name */}
        <View style={styles.section}>
          {mode === "view" ? (
            <Text style={styles.taskNameDisplay}>{task?.name}</Text>
          ) : (
            <>
              <TextInput
                style={[styles.taskNameInput, errors.name && styles.inputError]}
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (errors.name)
                    setErrors((e) => ({ ...e, name: undefined }));
                }}
                placeholder="Task name"
                placeholderTextColor={theme.colors.outline}
                editable={!isSaving && !isDeleting && !isRescheduling}
              />
              {errors.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}
            </>
          )}
        </View>

        {/* Time section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Time</Text>

          {aiDecidesTime && mode !== "view" ? (
            // Show placeholder when AI decides
            <View style={styles.aiPlaceholder}>
              <Text style={styles.aiPlaceholderText}>
                AI will set times automatically
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.timeRow}>
                <View style={styles.timeCol}>
                  <Text style={styles.timeLabel}>Start</Text>
                  {mode === "view" ? (
                    <Text
                      style={[
                        styles.timeDisplayText,
                        { paddingVertical: theme.spacing.sm },
                      ]}
                    >
                      {task?.startTime ? formatTime(task.startTime) : "—"}
                    </Text>
                  ) : showStartPicker ? (
                    <DateTimePicker
                      value={startHour ? new Date(startHour) : new Date()}
                      mode="time"
                      onValueChange={(_event: unknown, date?: Date) => {
                        if (date) setStartHour(date.toISOString());
                        setShowStartPicker(false);
                        if (errors.time)
                          setErrors((e) => ({ ...e, time: undefined }));
                      }}
                      onDismiss={() => setShowStartPicker(false)}
                    />
                  ) : (
                    <Pressable
                      style={styles.timeDisplayBtn}
                      onPress={() => setShowStartPicker(true)}
                    >
                      <Text style={styles.timeDisplayText}>
                        {startHour ? formatTime(startHour) : "Set time"}
                      </Text>
                    </Pressable>
                  )}
                </View>
                <Text style={styles.timeSeparator}>–</Text>
                <View style={styles.timeCol}>
                  <Text style={styles.timeLabel}>End</Text>
                  {mode === "view" ? (
                    <Text
                      style={[
                        styles.timeDisplayText,
                        { paddingVertical: theme.spacing.sm },
                      ]}
                    >
                      {task?.endTime ? formatTime(task.endTime) : "—"}
                    </Text>
                  ) : showEndPicker ? (
                    <DateTimePicker
                      value={endHour ? new Date(endHour) : new Date()}
                      mode="time"
                      onValueChange={(_event: unknown, date?: Date) => {
                        if (date) setEndHour(date.toISOString());
                        setShowEndPicker(false);
                        if (errors.time)
                          setErrors((e) => ({ ...e, time: undefined }));
                      }}
                      onDismiss={() => setShowEndPicker(false)}
                    />
                  ) : (
                    <Pressable
                      style={styles.timeDisplayBtn}
                      onPress={() => setShowEndPicker(true)}
                    >
                      <Text style={styles.timeDisplayText}>
                        {endHour ? formatTime(endHour) : "Set time"}
                      </Text>
                    </Pressable>
                  )}
                </View>
                {durationMinutes > 0 && (
                  <View style={styles.durationBadge}>
                    <Text style={styles.durationText}>
                      {formatDuration(durationMinutes)}
                    </Text>
                  </View>
                )}
              </View>
              {errors.time && (
                <Text style={styles.errorText}>{errors.time}</Text>
              )}

              {/* Date row — below start/end */}
              <View style={styles.dateRow}>
                <Text style={styles.timeLabel}>Date</Text>
                {mode === "view" ? (
                  <Text
                    style={[
                      styles.timeDisplayText,
                      { paddingVertical: theme.spacing.sm },
                    ]}
                  >
                    {startHour ? formatDate(startHour) : "—"}
                  </Text>
                ) : showDatePicker ? (
                  <DateTimePicker
                    value={currentDate}
                    mode="date"
                    onValueChange={(_event: unknown, date?: Date) => {
                      if (date) handleDateChange(date);
                      setShowDatePicker(false);
                    }}
                    onDismiss={() => setShowDatePicker(false)}
                  />
                ) : (
                  <Pressable
                    style={styles.timeDisplayBtn}
                    onPress={() => setShowDatePicker(true)}
                    disabled={!startHour || !endHour}
                  >
                    <Text
                      style={[
                        styles.timeDisplayText,
                        (!startHour || !endHour) && styles.disabledText,
                      ]}
                    >
                      {startHour ? formatDate(startHour) : "Set times first"}
                    </Text>
                  </Pressable>
                )}
              </View>
            </>
          )}

          {/* Let AI decide toggle — edit/add only */}
          {mode !== "view" && (
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Let AI decide</Text>
              <Switch
                testID="ai-decides-switch"
                value={aiDecidesTime}
                onValueChange={setAiDecidesTime}
                disabled={isSaving || isDeleting || isRescheduling}
                trackColor={{
                  true: theme.colors.primary,
                  false: theme.colors.outlineVariant,
                }}
                thumbColor={theme.colors.surface}
              />
            </View>
          )}
        </View>

        {/* Deadline */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            Deadline <Text style={styles.optionalLabel}>(Optional)</Text>
          </Text>
          {mode === "view" ? (
            <Text
              style={[
                styles.timeDisplayText,
                { paddingVertical: theme.spacing.sm },
              ]}
            >
              {task?.deadline ? formatDate(task.deadline) : "None"}
            </Text>
          ) : showDeadlinePicker ? (
            <DateTimePicker
              value={deadline ? new Date(deadline) : new Date()}
              mode="date"
              onValueChange={(_event: unknown, date?: Date) => {
                if (date) setDeadline(date.toISOString());
                setShowDeadlinePicker(false);
              }}
              onDismiss={() => setShowDeadlinePicker(false)}
            />
          ) : (
            <Pressable
              style={styles.timeDisplayBtn}
              onPress={() => setShowDeadlinePicker(true)}
            >
              <Text style={styles.timeDisplayText}>
                {deadline ? formatDate(deadline) : "Set deadline"}
              </Text>
            </Pressable>
          )}
        </View>

        {/* AI justification — view mode only */}
        {mode === "view" && task?.aiJustification && (
          <View style={styles.section}>
            <View style={styles.aiCard}>
              <Text style={styles.aiCardLabel}>
                <Ionicons
                  name="sparkles"
                  size={12}
                  color={theme.colors.primary}
                />{" "}
                AI Justification
              </Text>
              <Text style={styles.aiCardText}>{task.aiJustification}</Text>
            </View>
          </View>
        )}

        {/* AI context — edit/add mode only */}
        {mode !== "view" && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>AI Context</Text>
            <TextInput
              style={styles.contextInput}
              value={aiContext}
              onChangeText={setAiContext}
              placeholder="Notes for the AI — e.g. deep work task, best between 10–2 PM, can't be broken up"
              placeholderTextColor={theme.colors.outline}
              multiline
              numberOfLines={3}
              editable={!isSaving && !isDeleting && !isRescheduling}
            />
            <Text style={styles.contextHint}>
              Help the AI schedule this task better.
            </Text>
          </View>
        )}

        {/* Delete button — edit mode only */}
        {mode === "edit" && (
          <View style={styles.deleteSection}>
            <Pressable
              style={({ pressed }) => [
                styles.deleteBtn,
                pressed && { opacity: theme.interaction.pressedOpacity },
              ]}
              onPress={() => setShowDeleteAlert(true)}
              disabled={isDeleting || isRescheduling}
              hitSlop={8}
            >
              {isDeleting ? (
                <ActivityIndicator
                  size="small"
                  color={theme.colors.error}
                  style={styles.spinner}
                />
              ) : (
                <Ionicons
                  name="trash-outline"
                  size={16}
                  color={theme.colors.error}
                />
              )}
              <Text style={styles.deleteBtnText}>
                {isDeleting ? "Deleting..." : "Delete Task"}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Footer — edit/add mode only */}
        {mode !== "view" && (
          <View style={styles.footer}>
            <Pressable
              style={({ pressed }) => [
                styles.cancelBtn,
                pressed && { opacity: theme.interaction.pressedOpacity },
              ]}
              onPress={handleCancel}
              disabled={isSaving || isDeleting || isRescheduling}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable
              testID="done-btn"
              style={({ pressed }) => [
                styles.doneBtn,
                pressed && { opacity: theme.interaction.pressedOpacity },
              ]}
              onPress={handleDone}
              disabled={isSaving || isDeleting || isRescheduling}
            >
              {isSaving || isRescheduling ? (
                <ActivityIndicator
                  size="small"
                  color={theme.colors.onPrimary}
                />
              ) : (
                <Text style={styles.doneBtnText}>
                  {mode === "add" ? "Add" : "Done"}
                </Text>
              )}
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Delete confirmation alert */}
      <Alert
        visible={showDeleteAlert}
        title="Delete Task"
        message="Are you sure you want to delete this task? This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteAlert(false)}
      />
    </BottomSheet>
  );
}
