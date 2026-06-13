import { useMemo } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/providers/theme-provider";
import type { Theme } from "@/constants/theme";

type AlertProps = {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

function createStyles(theme: Theme) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: theme.colors.scrim,
      justifyContent: "center",
      alignItems: "center",
      padding: theme.spacing.xl,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.xxl,
      padding: theme.spacing.xl,
      width: "100%",
      maxWidth: 320,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
    title: {
      ...theme.typography.titleMedium,
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.sm,
    },
    message: {
      ...theme.typography.bodyMedium,
      color: theme.colors.onSurfaceVariant,
      marginBottom: theme.spacing.xl,
      lineHeight: 20,
    },
    buttonRow: {
      flexDirection: "row",
      gap: theme.spacing.md,
    },
    cancelBtn: {
      flex: 1,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.xl,
      backgroundColor: theme.colors.surfaceVariant,
      alignItems: "center",
      justifyContent: "center",
    },
    cancelBtnText: {
      ...theme.typography.titleSmall,
      color: theme.colors.onSurface,
    },
    confirmBtn: {
      flex: 1,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.xl,
      backgroundColor: theme.colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    confirmBtnDestructive: {
      backgroundColor: theme.colors.error,
    },
    confirmBtnText: {
      ...theme.typography.titleSmall,
      color: theme.colors.onPrimary,
    },
  });
}

export default function Alert({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}: AlertProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable
        style={styles.backdrop}
        onPress={onCancel}
        testID="alert-backdrop"
        accessibilityLabel="Close alert"
      >
        <Pressable
          style={styles.card}
          onPress={() => {
            /* prevent close when tapping card */
          }}
        >
          <Text style={styles.title}>{title}</Text>
          {message && <Text style={styles.message}>{message}</Text>}
          <View style={styles.buttonRow}>
            <Pressable
              style={({ pressed }) => [
                styles.cancelBtn,
                pressed && { opacity: theme.interaction.pressedOpacity },
              ]}
              onPress={onCancel}
              hitSlop={8}
            >
              <Text style={styles.cancelBtnText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.confirmBtn,
                destructive && styles.confirmBtnDestructive,
                pressed && { opacity: theme.interaction.pressedOpacity },
              ]}
              onPress={onConfirm}
              hitSlop={8}
            >
              <Text style={styles.confirmBtnText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
