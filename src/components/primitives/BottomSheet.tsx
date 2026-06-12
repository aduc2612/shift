import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/providers/theme-provider";
import type { Theme } from "@/constants/theme";

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

function createStyles(theme: Theme) {
  return StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor: theme.colors.scrim,
    },
    sheetContainer: {
      flex: 1,
      justifyContent: "flex-end",
    },
    sheetContent: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: theme.borderRadius.xxl,
      borderTopRightRadius: theme.borderRadius.xxl,
      paddingHorizontal: theme.spacing.xl,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.xl,
    },
    handle: {
      width: theme.spacing.xxxl,
      height: 5,
      backgroundColor: theme.colors.outlineVariant,
      borderRadius: theme.borderRadius.sm,
      alignSelf: "center",
      marginBottom: theme.spacing.lg,
    },
  });
}

export default function BottomSheet({
  visible,
  onClose,
  children,
}: BottomSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable testID="bottom-sheet-backdrop" style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheetContainer, { paddingBottom: insets.bottom }]}>
        <View style={styles.sheetContent}>
          <View style={styles.handle} />
          {children}
        </View>
      </View>
    </Modal>
  );
}
