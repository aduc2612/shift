import { useCallback, useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import RevenueCatUI from "react-native-purchases-ui";
import { useTheme } from "@/providers/theme-provider";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast } from "@/providers/toast-provider";
import type { Theme } from "@/constants/theme";

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    loading: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
  });
}

export default function PaywallScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const toast = useToast();
  const { isSubscribed: subscribed, isLoading, refresh } = useSubscription();

  // When the shared store confirms subscription, navigate to tabs.
  // The root layout guards also update from the same store, so the
  // Stack.Protected guard for (tabs) is true by the time this fires.
  useEffect(() => {
    if (subscribed === true) {
      router.replace("/(tabs)");
    }
  }, [subscribed]);

  const handleRefresh = useCallback(async () => {
    await refresh();
  }, [refresh]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loading]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <RevenueCatUI.Paywall
        onDismiss={handleRefresh}
        onPurchaseCompleted={() => {
          // Refresh immediately on purchase — don't wait for onDismiss.
          // The shared store update triggers both this screen's navigation
          // effect and the root layout guard flip in one render cycle.
          refresh();
        }}
        onPurchaseError={(error) => {
          console.log("[Paywall] Purchase error:", error);
          toast.show({
            message: "Purchase failed. Please try again.",
            duration: 3000,
          });
        }}
        onRestoreCompleted={() => {
          refresh();
        }}
        onRestoreError={(error) => {
          console.log("[Paywall] Restore error:", error);
          toast.show({
            message: "Restore failed. Please try again.",
            duration: 3000,
          });
        }}
      />
    </View>
  );
}
