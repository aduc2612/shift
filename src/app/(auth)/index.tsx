import { useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import { useGoogleSignIn } from "@/features/auth/hooks/useGoogleSignIn";
import { useTheme } from "@/providers/theme-provider";
import type { Theme } from "@/constants/theme";

WebBrowser.maybeCompleteAuthSession();

function createStyles(theme: Theme, insets: { top: number; bottom: number }) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingTop: insets.top,
      paddingBottom: insets.bottom + theme.spacing.xl,
      paddingHorizontal: theme.spacing.xl,
      justifyContent: "center",
      alignItems: "center",
    },
    branding: {
      alignItems: "center",
      marginBottom: theme.spacing.xxxxl,
    },
    title: {
      ...theme.typography.displaySmall,
      color: theme.colors.onBackground,
      marginBottom: theme.spacing.sm,
    },
    tagline: {
      ...theme.typography.headlineSmall,
      color: theme.colors.onBackground,
      textAlign: "center",
      marginBottom: theme.spacing.xs,
    },
    subtitle: {
      ...theme.typography.bodyLarge,
      color: theme.colors.onSurfaceVariant,
      textAlign: "center",
      marginBottom: theme.spacing.xl,
    },
    credibilityCard: {
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      marginBottom: theme.spacing.xxxxl,
      alignItems: "center",
    },
    credibilityRating: {
      ...theme.typography.titleLarge,
      color: theme.colors.onSurface,
    },
    credibilityText: {
      ...theme.typography.bodyMedium,
      color: theme.colors.onSurfaceVariant,
      textAlign: "center",
      marginTop: theme.spacing.xs,
    },
    buttonContainer: {
      width: "100%",
      alignItems: "center",
    },
    button: {
      ...theme.componentStyles.button,
      width: "100%",
      minHeight: 48,
      backgroundColor: theme.colors.primary,
    },
    buttonPressed: {
      opacity: theme.interaction.pressedOpacity,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      ...theme.typography.labelLarge,
      color: theme.colors.onPrimary,
    },
    errorText: {
      ...theme.typography.bodySmall,
      color: theme.colors.error,
      textAlign: "center",
      marginTop: theme.spacing.md,
    },
  });
}

export default function AuthScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);
  const { signIn, loading, error } = useGoogleSignIn();

  useEffect(() => {
    WebBrowser.warmUpAsync();
    return () => {
      WebBrowser.coolDownAsync();
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.branding}>
        <Text style={styles.tagline}>Your day keeps falling apart.</Text>
        <Text style={styles.tagline}>We fix it.</Text>
      </View>

      <View style={styles.credibilityCard}>
        <Text style={styles.credibilityRating}>4.8 ★★★★★</Text>
        <Text style={styles.credibilityText}>14K reviews · 180K downloads</Text>
      </View>

      <View style={styles.buttonContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
            loading && styles.buttonDisabled,
          ]}
          onPress={signIn}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Get Started"
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.onPrimary} />
          ) : (
            <Text style={styles.buttonText}>Get Started</Text>
          )}
        </Pressable>

        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    </View>
  );
}
