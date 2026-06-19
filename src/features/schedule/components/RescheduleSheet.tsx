import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTheme } from "@/providers/theme-provider";
import { useToast } from "@/providers/toast-provider";
import type { Theme } from "@/constants/theme";
import BottomSheet from "@/components/primitives/BottomSheet";

type RescheduleSheetProps = {
  visible: boolean;
  onClose: () => void;
  onReschedule?: (whatChanged: string) => Promise<void>;
  isRescheduling?: boolean;
};

const EXAMPLES = [
  "I woke up late",
  "I need to leave at 5 PM",
  "Gym is closed today",
  "Assignment is more important",
];

function createStyles(theme: Theme) {
  return StyleSheet.create({
    title: {
      ...theme.typography.titleMedium,
      color: theme.colors.onBackground,
      marginBottom: 14,
    },
    input: {
      backgroundColor: theme.colors.surfaceVariant,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.borderRadius.lg,
      padding: 12,
      fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
      fontSize: 15,
      color: theme.colors.onSurface,
      minHeight: 52,
      textAlignVertical: "top",
    },
    examples: {
      marginTop: 10,
    },
    exampleChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 4,
    },
    exampleChipText: {
      ...theme.typography.bodySmall,
      color: theme.colors.onSurfaceVariant,
    },
    buttonRow: {
      flexDirection: "row",
      gap: 12,
      marginTop: 16,
    },
    cancelBtn: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.borderRadius.xl,
      paddingVertical: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    cancelText: {
      ...theme.typography.titleSmall,
      color: theme.colors.onSurface,
    },
    cta: {
      flex: 1,
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.xl,
      paddingVertical: 14,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
    },
    ctaDisabled: {
      opacity: 0.5,
    },
    ctaText: {
      ...theme.typography.titleSmall,
      color: theme.colors.onPrimary,
    },
  });
}

export default function RescheduleSheet({
  visible,
  onClose,
  onReschedule,
  isRescheduling = false,
}: RescheduleSheetProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [text, setText] = useState("");
  const toast = useToast();

  useEffect(() => {
    if (visible) {
      setText("");
    }
  }, [visible]);

  const handleReschedule = async () => {
    if (!onReschedule || isRescheduling) return;
    try {
      await onReschedule(text);
      setText("");
      onClose();
    } catch (e) {
      toast.show({ message: "Reschedule failed. Please try again." });
    }
  };

  const handleChangeText = (value: string) => {
    setText(value);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>What changed?</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. I woke up late, gym is closed today, need to leave at 5 PM…"
          placeholderTextColor={theme.colors.outline}
          multiline
          numberOfLines={4}
          value={text}
          onChangeText={handleChangeText}
          editable={!isRescheduling}
        />
        <View style={styles.examples}>
          {EXAMPLES.map((example) => (
            <View key={example} style={styles.exampleChip}>
              <Text style={styles.exampleChipText}>• {example}</Text>
            </View>
          ))}
        </View>
        <View style={styles.buttonRow}>
          <Pressable
            testID="cancel-btn"
            style={({ pressed }) => [
              styles.cancelBtn,
              pressed && { opacity: theme.interaction.pressedOpacity },
            ]}
            onPress={onClose}
            disabled={isRescheduling}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Pressable
            testID="reschedule-cta"
            style={({ pressed }) => [
              styles.cta,
              isRescheduling && styles.ctaDisabled,
              pressed &&
                !isRescheduling && {
                  opacity: theme.interaction.pressedOpacity,
                },
            ]}
            onPress={handleReschedule}
            disabled={isRescheduling}
            accessibilityState={{ disabled: isRescheduling }}
          >
            {isRescheduling ? (
              <ActivityIndicator
                testID="reschedule-spinner"
                size="small"
                color={theme.colors.onPrimary}
              />
            ) : (
              <Text style={styles.ctaText}>Reschedule</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </BottomSheet>
  );
}
