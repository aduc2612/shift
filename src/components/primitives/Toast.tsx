import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/providers/theme-provider';
import type { Theme } from '@/constants/theme';

type ToastProps = {
  visible: boolean;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss: () => void;
  duration?: number;
};

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      position: 'absolute',
      left: theme.spacing.lg,
      right: theme.spacing.lg,
      zIndex: 999,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.xl,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      ...theme.shadows.md,
    },
    message: {
      flex: 1,
      ...theme.typography.bodyMedium,
      color: theme.colors.onSurface,
    },
    action: {
      marginLeft: theme.spacing.md,
      ...theme.typography.labelLarge,
      color: theme.colors.primary,
    },
  });
}

export default function Toast({
  visible,
  message,
  actionLabel,
  onAction,
  onDismiss,
  duration = 5000,
}: ToastProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme);
  // eslint-disable-next-line react-hooks/refs
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (visible) {
      animRef.current = Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      });
      animRef.current.start();

      if (duration > 0) {
        timeoutRef.current = setTimeout(() => {
          animRef.current = Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          });
          animRef.current.start();
          onDismiss();
        }, duration);
      }
    } else {
      opacity.setValue(0);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (animRef.current) animRef.current.stop();
    };
  }, [visible, duration, onDismiss, opacity]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.container, { top: insets.top, opacity }]}
      pointerEvents="auto"
    >
      <View style={styles.content}>
        <Text style={styles.message}>{message}</Text>
        {actionLabel && (
          <Pressable
            onPress={onAction}
            hitSlop={24}
            style={({ pressed }) => ({
              opacity: pressed ? theme.interaction.pressedOpacity : 1,
            })}
          >
            <Text style={styles.action}>{actionLabel}</Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}
