import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomSheet from "@/components/primitives/BottomSheet";
import { useTheme } from "@/providers/theme-provider";
import type { Theme } from "@/constants/theme";

export type ListSelectorOption<T extends string> = {
  value: T;
  label: string;
};

type ListSelectorProps<T extends string> = {
  visible: boolean;
  onClose: () => void;
  onSelect: (value: T) => void;
  title: string;
  options: ListSelectorOption<T>[];
  selectedValue?: T;
};

function createStyles(theme: Theme) {
  return StyleSheet.create({
    optionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: theme.spacing.sm,
      minHeight: 44,
      borderRadius: theme.borderRadius.lg,
    },
    optionRowPressed: {
      opacity: 0.6,
    },
    optionLabel: {
      ...theme.typography.bodyMedium,
      color: theme.colors.onSurface,
      flex: 1,
    },
    checkmark: {
      marginLeft: theme.spacing.md,
    },
  });
}

export default function ListSelector<T extends string>({
  visible,
  onClose,
  onSelect,
  title,
  options,
  selectedValue,
}: ListSelectorProps<T>) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View>
        {options.map((option) => {
          const isSelected = option.value === selectedValue;
          return (
            <Pressable
              key={option.value}
              onPress={() => onSelect(option.value)}
              hitSlop={8}
              style={({ pressed }) => [
                styles.optionRow,
                pressed && styles.optionRowPressed,
              ]}
            >
              <Text style={styles.optionLabel}>{option.label}</Text>
              {isSelected && (
                <Ionicons
                  name="checkmark"
                  size={20}
                  color={theme.colors.primary}
                  style={styles.checkmark}
                />
              )}
            </Pressable>
          );
        })}
      </View>
    </BottomSheet>
  );
}
