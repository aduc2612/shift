import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/providers/theme-provider";
import type { Theme } from "@/constants/theme";
import { formatFullDate, formatRelativeDay } from "@/utils/date";

type ScheduleHeaderProps = {
  date: Date;
  onPressDate: () => void;
  onPressReschedule: () => void;
};

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 12,
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
    },
    dateContainer: {
      flex: 1,
    },
    relativeDay: {
      ...theme.typography.labelMedium,
      color: theme.colors.primary,
      textTransform: "uppercase",
      letterSpacing: 0.08,
      marginBottom: 2,
    },
    dateMain: {
      ...theme.typography.titleLarge,
      color: theme.colors.onBackground,
      lineHeight: 28,
    },
    rescheduleButton: {
      backgroundColor: theme.colors.surfaceVariant,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: 20,
      paddingVertical: 8,
      paddingHorizontal: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    rescheduleButtonText: {
      ...theme.typography.labelMedium,
      color: theme.colors.primary,
      fontSize: 13,
    },
  });
}

export default function ScheduleHeader({
  date,
  onPressDate,
  onPressReschedule,
}: ScheduleHeaderProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const relativeDay = formatRelativeDay(date);

  return (
    <View style={styles.container}>
      <Pressable style={styles.dateContainer} onPress={onPressDate} hitSlop={8}>
        {relativeDay ? (
          <Text style={styles.relativeDay}>{relativeDay}</Text>
        ) : null}
        <View>
          <Text style={styles.dateMain}>{formatFullDate(date)}</Text>
        </View>
      </Pressable>
      <Pressable
        onPress={onPressReschedule}
        style={({ pressed }) => [
          styles.rescheduleButton,
          pressed && { opacity: theme.interaction.pressedOpacity },
        ]}
        hitSlop={8}
      >
        <Ionicons name="sparkles" size={15} color={theme.colors.primary} />
        <Text style={styles.rescheduleButtonText}>Reschedule</Text>
      </Pressable>
    </View>
  );
}
