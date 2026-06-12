import { useEffect, useMemo, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/providers/theme-provider';
import type { Theme } from '@/constants/theme';
import { formatTime } from '@/utils/date';

function createStyles(theme: Theme) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    timeCol: {
      width: 46,
      flexShrink: 0,
      paddingRight: 10,
      alignItems: 'flex-end',
    },
    nowText: {
      ...theme.typography.labelSmall,
      color: theme.colors.primary,
      fontWeight: '500',
      lineHeight: 12,
    },
    currentTimeText: {
      ...theme.typography.labelSmall,
      fontSize: 10,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 14,
    },
    spineCol: {
      width: 18,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.colors.primary,
      zIndex: 3,
    },
    lineCol: {
      flex: 1,
      height: 1,
      backgroundColor: theme.colors.primary,
      opacity: 0.35,
    },
  });
}

export default function NowIndicator() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const opacity = useMemo(() => new Animated.Value(1), []);
  const [currentTime, setCurrentTime] = useState(() => formatTime(new Date()));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  useEffect(() => {
    const id = setInterval(() => {
      setCurrentTime(formatTime(new Date()));
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={styles.row}>
      <View style={styles.timeCol}>
        <Text style={styles.nowText}>Now</Text>
        <Text style={styles.currentTimeText}>{currentTime}</Text>
      </View>
      <View style={styles.spineCol}>
        <Animated.View style={[styles.dot, { opacity }]} />
      </View>
      <View style={styles.lineCol} />
    </View>
  );
}
