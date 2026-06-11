import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/providers/theme-provider';
import type { Theme } from '@/constants/theme';

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.background,
    },
    text: {
      fontSize: 24,
      fontWeight: '600',
      color: theme.colors.onBackground,
    },
  });
}

export default function SettingsScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Settings</Text>
    </View>
  );
}
