import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/providers/theme-provider';
import type { Theme } from '@/constants/theme';
import { withOpacity } from '@/utils/color';

type BadgeProps = {
  label: string;
  variant?: 'default' | 'accent';
};

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      paddingVertical: 2,
      paddingHorizontal: 8,
      borderRadius: theme.borderRadius.md,
      alignSelf: 'flex-start',
    },
    default: {
      backgroundColor: theme.colors.surfaceVariant,
    },
    accent: {
      backgroundColor: withOpacity(theme.colors.primary, 0.1),
    },
    text: {
      ...theme.typography.labelSmall,
      fontWeight: '500',
    },
    defaultText: {
      color: theme.colors.onSurfaceVariant,
    },
    accentText: {
      color: theme.colors.primary,
    },
  });
}

export default function Badge({ label, variant = 'default' }: BadgeProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View
      style={[
        styles.container,
        variant === 'accent' ? styles.accent : styles.default,
      ]}
    >
      <Text
        style={[
          styles.text,
          variant === 'accent' ? styles.accentText : styles.defaultText,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}
