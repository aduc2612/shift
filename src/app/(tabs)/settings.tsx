import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  Pressable,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { signOut } from "@/features/auth/api";
import { useTheme } from "@/providers/theme-provider";
import type { Theme } from "@/constants/theme";

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: theme.spacing.lg,
    },
    headerTitle: {
      ...theme.typography.headlineMedium,
      color: theme.colors.onBackground,
    },
    content: {
      flex: 1,
    },
    signOutWrapper: {
      paddingHorizontal: theme.spacing.lg,
    },
    signOutButton: {
      backgroundColor: theme.colors.error,
      borderRadius: theme.borderRadius.xl,
      paddingVertical: theme.spacing.md,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 48,
    },
    signOutButtonDisabled: {
      opacity: theme.interaction.pressedOpacity,
    },
    signOutButtonText: {
      ...theme.typography.labelLarge,
      color: theme.colors.onError,
    },
    errorText: {
      ...theme.typography.bodySmall,
      color: theme.colors.error,
      textAlign: "center",
      marginTop: theme.spacing.sm,
    },
  });
}

export default function SettingsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignOut() {
    setLoading(true);
    setError(null);
    try {
      await signOut();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to sign out");
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <View style={styles.content} />

      <View
        style={[
          styles.signOutWrapper,
          { paddingBottom: insets.bottom + theme.spacing.lg },
        ]}
      >
        <Pressable
          onPress={handleSignOut}
          disabled={loading}
          style={({ pressed }) => [
            styles.signOutButton,
            loading && styles.signOutButtonDisabled,
            pressed &&
              !loading && { opacity: theme.interaction.pressedOpacity },
          ]}
          hitSlop={8}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.onError} />
          ) : (
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          )}
        </Pressable>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    </View>
  );
}
