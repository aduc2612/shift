import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/providers/theme-provider";
import type { Theme } from "@/constants/theme";

type CheckboxProps = {
  checked: boolean;
  onToggle: () => void;
  size?: number;
};

function createStyles(theme: Theme, size: number) {
  return StyleSheet.create({
    container: {
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: 1.5,
      borderColor: theme.colors.outlineVariant,
      alignItems: "center",
      justifyContent: "center",
    },
    checked: {
      backgroundColor: theme.colors.primary,
      borderColor: "transparent",
    },
  });
}

export default function Checkbox({
  checked,
  onToggle,
  size = 22,
}: CheckboxProps) {
  const theme = useTheme();
  const styles = createStyles(theme, size);

  return (
    <Pressable
      onPress={onToggle}
      hitSlop={12}
      style={({ pressed }) => ({
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View style={[styles.container, checked && styles.checked]}>
        {checked && (
          <Ionicons
            name="checkmark"
            size={Math.round(size * 0.6)}
            color={theme.colors.onPrimary}
          />
        )}
      </View>
    </Pressable>
  );
}
