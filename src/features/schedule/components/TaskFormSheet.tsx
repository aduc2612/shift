import { useCallback, useEffect, useMemo, useState } from "react";
import {
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
import { useKeyboardHeight } from "@/hooks/useKeyboardHeight";
import { formatDuration, formatTime, formatDate } from "@/utils/date";
import { withOpacity } from "@/utils/color";

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
      backgroundColor: theme.colors.background,
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
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
    },
    timeDisplayText: {
      ...theme.typography.bodyMedium,
      color: theme.colors.onSurface,
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
      backgroundColor: theme.colors.background,
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
      color: theme.colors.outline,
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
      backgroundColor: theme.colors.surfaceVariant,
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
}: TaskFormSheetProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const keyboardHeight = useKeyboardHeight();

  const [name, setName] = useState(task?.name ?? "");
  const [startHour, setStartHour] = useState(task?.startTime ?? "");
  const [endHour, setEndHour] = useState(task?.endTime ?? "");
  const [deadline, setDeadline] = useState(task?.deadline ?? "");
  const [aiDecidesTime, setAiDecidesTime] = useState(
    task?.aiDecidesTime ?? true,
  );
  const [aiContext, setAiContext] = useState(task?.aiContext ?? "");

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);

  const [errors, setErrors] = useState<FieldErrors>({});

  // Sync state when task or mode changes
  useEffect(() => {
    if (visible) {
      setName(task?.name ?? "");
      setStartHour(task?.startTime ?? "");
      setEndHour(task?.endTime ?? "");
      setDeadline(task?.deadline ?? "");
      setAiDecidesTime(task?.aiDecidesTime ?? true);
      setAiContext(task?.aiContext ?? "");
      setShowStartPicker(false);
      setShowEndPicker(false);
      setShowDeadlinePicker(false);
      setErrors({});
    }
  }, [visible, task]);

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

  const handleDone = useCallback(() => {
    const newErrors: FieldErrors = {};

    if (!name.trim()) {
      newErrors.name = "Task name is required";
    }

    if (!aiDecidesTime) {
      if (!startHour || !endHour) {
        newErrors.time = "Start and end times are required";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onSave?.({
      name: name.trim(),
      startTime: startHour,
      endTime: endHour,
      durationMinutes,
      deadline: deadline || null,
      aiDecidesTime,
      aiContext: aiContext || null,
    });
    onClose();
  }, [
    name,
    startHour,
    endHour,
    durationMinutes,
    deadline,
    aiDecidesTime,
    aiContext,
    onSave,
    onClose,
  ]);

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: keyboardHeight }}
      >
        {/* Header */}
        <View style={styles.header}>
          {mode === "view" ? (
            <View style={{ width: 36 }} />
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
                color={theme.colors.onSurface}
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
                  if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
                }}
                placeholder="Task name"
                placeholderTextColor={theme.colors.outline}
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </>
          )}
        </View>

        {/* Time section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Time</Text>
          <View
            style={[
              styles.timeRow,
              aiDecidesTime && mode !== "view" && styles.disabledTimeCol,
            ]}
          >
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
                    if (date && !aiDecidesTime)
                      setStartHour(date.toISOString());
                    setShowStartPicker(false);
                    if (errors.time) setErrors((e) => ({ ...e, time: undefined }));
                  }}
                  onDismiss={() => setShowStartPicker(false)}
                  disabled={aiDecidesTime}
                />
              ) : (
                <Pressable
                  style={[
                    styles.timeDisplayBtn,
                    aiDecidesTime && { opacity: 0.4 },
                  ]}
                  onPress={() => {
                    if (!aiDecidesTime) setShowStartPicker(true);
                  }}
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
                    if (date && !aiDecidesTime) setEndHour(date.toISOString());
                    setShowEndPicker(false);
                    if (errors.time) setErrors((e) => ({ ...e, time: undefined }));
                  }}
                  onDismiss={() => setShowEndPicker(false)}
                  disabled={aiDecidesTime}
                />
              ) : (
                <Pressable
                  style={[
                    styles.timeDisplayBtn,
                    aiDecidesTime && { opacity: 0.4 },
                  ]}
                  onPress={() => {
                    if (!aiDecidesTime) setShowEndPicker(true);
                  }}
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
          {errors.time && <Text style={styles.errorText}>{errors.time}</Text>}

          {/* Let AI decide toggle — edit/add only */}
          {mode !== "view" && (
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Let AI decide</Text>
              <Switch
                testID="ai-decides-switch"
                value={aiDecidesTime}
                onValueChange={setAiDecidesTime}
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
            />
            <Text style={styles.contextHint}>
              Help the AI schedule this task better.
            </Text>
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
            >
              <Text style={styles.doneBtnText}>
                {mode === "add" ? "Add" : "Done"}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </BottomSheet>
  );
}
