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
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 24,
    },
    handle: {
      width: 40,
      height: 5,
      backgroundColor: theme.colors.outlineVariant,
      borderRadius: theme.borderRadius.sm,
      alignSelf: "center",
      marginBottom: 15,
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
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheetContainer, { paddingBottom: insets.bottom }]}>
        <View style={styles.sheetContent}>
          <View style={styles.handle} />
          {children}
        </View>
      </View>
    </Modal>
  );
}
