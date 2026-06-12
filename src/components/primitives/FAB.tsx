import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/providers/theme-provider';
import type { Theme } from '@/constants/theme';

type FABProps = {
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
};

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.shadows.lg,
    },
  });
}

export default function FAB({ onPress, icon = 'add' }: FABProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.container,
        pressed && { opacity: theme.interaction.pressedOpacity },
      ]}
    >
      <Ionicons
        name={icon}
        size={22}
        color={theme.colors.onPrimary}
      />
    </Pressable>
  );
}
