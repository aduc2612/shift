import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { DateTimePicker } from "@expo/ui/community/datetime-picker";
import BottomSheet from "@/components/primitives/BottomSheet";
import { useTheme } from "@/providers/theme-provider";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { fetchUserPreferences } from "@/features/profile/api";
import { useUpdateUserPreferences } from "@/features/profile/hooks/useUpdateUserPreferences";
import { parseHHMM, formatTime12h, toHHMM, pickerDate } from "@/utils/date";
import type { Theme } from "@/constants/theme";

type Props = {
  visible: boolean;
  onClose: () => void;
};

function createStyles(theme: Theme) {
  return StyleSheet.create({
    title: {
      ...theme.typography.titleLarge,
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.xl,
    },
    label: {
      ...theme.typography.bodyLarge,
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.sm,
      marginTop: theme.spacing.lg,
    },
    timeDisplayBtn: {
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      minHeight: 48,
      justifyContent: "center",
    },
    timeDisplayText: {
      ...theme.typography.titleMedium,
      color: theme.colors.onSurface,
    },
    input: {
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.borderRadius.lg,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      minHeight: 120,
      ...theme.typography.bodyMedium,
      color: theme.colors.onSurface,
      textAlignVertical: "top",
    },
    actions: {
      flexDirection: "row",
      gap: theme.spacing.md,
      marginTop: theme.spacing.xl,
    },
    btn: {
      flex: 1,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 48,
    },
    pendingBtn: {
      opacity: theme.interaction.pressedOpacity,
    },
    btnSecondary: {
      backgroundColor: theme.colors.surfaceVariant,
    },
    btnPrimary: {
      backgroundColor: theme.colors.primary,
    },
    btnTextSecondary: {
      ...theme.typography.labelLarge,
      color: theme.colors.onSurface,
    },
    btnTextPrimary: {
      ...theme.typography.labelLarge,
      color: theme.colors.onPrimary,
    },
  });
}

export default function SchedulingContextSheet({ visible, onClose }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme);
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const { data: prefs } = useQuery({
    queryKey: ["userPreferences", userId],
    queryFn: () => fetchUserPreferences(userId!),
    enabled: !!userId,
  });

  const [wakeH, setWakeH] = useState(7);
  const [wakeM, setWakeM] = useState(0);
  const [sleepH, setSleepH] = useState(23);
  const [sleepM, setSleepM] = useState(0);
  const [userContext, setUserContext] = useState("");
  const [showWakePicker, setShowWakePicker] = useState(false);
  const [showSleepPicker, setShowSleepPicker] = useState(false);

  useEffect(() => {
    if (prefs) {
      const w = parseHHMM(prefs.wakeUpTime);
      const s = parseHHMM(prefs.sleepTime);
      setWakeH(w.h);
      setWakeM(w.m);
      setSleepH(s.h);
      setSleepM(s.m);
      setUserContext(prefs.userContext);
    }
  }, [prefs]);

  const updateMutation = useUpdateUserPreferences();

  const handleSave = useCallback(() => {
    if (!userId) return;
    updateMutation.mutate(
      {
        userId,
        update: {
          wakeUpTime: toHHMM(wakeH, wakeM),
          sleepTime: toHHMM(sleepH, sleepM),
          userContext,
        },
      },
      { onSuccess: () => onClose() },
    );
  }, [
    userId,
    updateMutation,
    wakeH,
    wakeM,
    sleepH,
    sleepM,
    userContext,
    onClose,
  ]);

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Scheduling context</Text>

        <Text style={styles.label}>Wake up time</Text>
        {showWakePicker ? (
          <DateTimePicker
            value={pickerDate(wakeH, wakeM)}
            mode="time"
            onValueChange={(_event: unknown, date?: Date) => {
              if (date) {
                setWakeH(date.getHours());
                setWakeM(date.getMinutes());
              }
              setShowWakePicker(false);
            }}
            onDismiss={() => setShowWakePicker(false)}
          />
        ) : (
          <Pressable
            style={styles.timeDisplayBtn}
            onPress={() => setShowWakePicker(true)}
            accessibilityLabel={`Wake up time, currently ${formatTime12h(wakeH, wakeM)}`}
          >
            <Text style={styles.timeDisplayText}>
              {formatTime12h(wakeH, wakeM)}
            </Text>
          </Pressable>
        )}

        <Text style={styles.label}>Go to bed</Text>
        {showSleepPicker ? (
          <DateTimePicker
            value={pickerDate(sleepH, sleepM)}
            mode="time"
            onValueChange={(_event: unknown, date?: Date) => {
              if (date) {
                setSleepH(date.getHours());
                setSleepM(date.getMinutes());
              }
              setShowSleepPicker(false);
            }}
            onDismiss={() => setShowSleepPicker(false)}
          />
        ) : (
          <Pressable
            style={styles.timeDisplayBtn}
            onPress={() => setShowSleepPicker(true)}
            accessibilityLabel={`Bed time, currently ${formatTime12h(sleepH, sleepM)}`}
          >
            <Text style={styles.timeDisplayText}>
              {formatTime12h(sleepH, sleepM)}
            </Text>
          </Pressable>
        )}

        <Text style={styles.label}>Anything else we should know?</Text>
        <TextInput
          style={styles.input}
          value={userContext}
          onChangeText={setUserContext}
          placeholder="e.g. I have ADHD, I work night shifts 3x a week"
          placeholderTextColor={theme.colors.onSurfaceVariant}
          multiline
          accessibilityLabel="Additional scheduling context"
        />

        <View style={[styles.actions, { marginBottom: insets.bottom }]}>
          <Pressable
            style={[styles.btn, styles.btnSecondary]}
            onPress={onClose}
            accessibilityLabel="Cancel"
          >
            <Text style={styles.btnTextSecondary}>Cancel</Text>
          </Pressable>
          <Pressable
            style={[
              styles.btn,
              styles.btnPrimary,
              updateMutation.isPending && styles.pendingBtn,
            ]}
            onPress={handleSave}
            disabled={updateMutation.isPending}
            accessibilityLabel="Save changes"
          >
            {updateMutation.isPending ? (
              <ActivityIndicator color={theme.colors.onPrimary} />
            ) : (
              <Text style={styles.btnTextPrimary}>Save changes</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </BottomSheet>
  );
}
