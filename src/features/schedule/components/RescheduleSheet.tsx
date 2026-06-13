import { useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTheme } from "@/providers/theme-provider";
import type { Theme } from "@/constants/theme";
import BottomSheet from "@/components/primitives/BottomSheet";
import { useKeyboardHeight } from "@/hooks/useKeyboardHeight";

type RescheduleSheetProps = {
  visible: boolean;
  onClose: () => void;
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
    cta: {
      marginTop: 16,
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.xl,
      paddingVertical: 14,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
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
}: RescheduleSheetProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const keyboardHeight = useKeyboardHeight();
  const [text, setText] = useState("");

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={styles.title}>What changed?</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Gym took longer than expected…"
        placeholderTextColor={theme.colors.outline}
        multiline
        numberOfLines={4}
        value={text}
        onChangeText={setText}
      />
      <View style={styles.examples}>
        {EXAMPLES.map((example) => (
          <View key={example} style={styles.exampleChip}>
            <Text style={styles.exampleChipText}>• {example}</Text>
          </View>
        ))}
      </View>
      <Pressable
        style={({ pressed }) => [
          styles.cta,
          pressed && { opacity: theme.interaction.pressedOpacity },
        ]}
        onPress={() => {
          // Placeholder — will be wired to AI service in Phase 6
        }}
      >
        <Text style={styles.ctaText}>Reschedule</Text>
      </Pressable>
      {keyboardHeight > 0 && <View style={{ height: keyboardHeight }} />}
    </BottomSheet>
  );
}
