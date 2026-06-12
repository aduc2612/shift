import { useEffect, useMemo, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/providers/theme-provider';
import type { Theme } from '@/constants/theme';
import { formatTime } from '@/utils/date';

type TimelineRowProps = {
  time: string;
  state: 'done' | 'active' | 'upcoming';
  showNow?: boolean;
  isLast?: boolean;
  children: React.ReactNode;
};

function createStyles(theme: Theme) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 6,
    },
    timeCol: {
      width: 46,
      flexShrink: 0,
      paddingTop: 14,
      paddingRight: 10,
      alignItems: 'flex-end',
    },
    timeText: {
      ...theme.typography.labelSmall,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 12,
    },
    nowLabel: {
      ...theme.typography.labelSmall,
      color: theme.colors.primary,
      fontWeight: '500',
      lineHeight: 12,
    },
    nowTimeText: {
      ...theme.typography.labelSmall,
      fontSize: 10,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 14,
    },
    spineCol: {
      width: 18,
      flexShrink: 0,
      alignItems: 'center',
      paddingTop: 14,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      zIndex: 2,
    },
    dotHighlighted: {
      backgroundColor: theme.colors.primary,
    },
    dotActiveRing: {
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.18,
      shadowRadius: 3,
      elevation: 3,
    },
    dotUpcoming: {
      backgroundColor: theme.colors.outlineVariant,
    },
    nowDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.colors.primary,
      zIndex: 3,
      marginTop: 8,
    },
    line: {
      width: 1,
      flex: 1,
      minHeight: 6,
    },
    lineDone: {
      backgroundColor: theme.colors.primary,
      opacity: 0.35,
    },
    lineUpcoming: {
      backgroundColor: theme.colors.outlineVariant,
    },
    lineHidden: {
      minHeight: 0,
      flex: 0,
    },
    contentCol: {
      flex: 1,
      paddingBottom: 8,
    },
  });
}

export default function TimelineRow({
  time,
  state,
  showNow = false,
  isLast = false,
  children,
}: TimelineRowProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  // Only create animation value when showing the now indicator
  const nowOpacity = useMemo(
    () => (showNow ? new Animated.Value(1) : null),
    [showNow],
  );

  useEffect(() => {
    if (!nowOpacity) return;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(nowOpacity, {
          toValue: 0.4,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(nowOpacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [nowOpacity]);

  const [currentTime, setCurrentTime] = useState(() => formatTime(new Date()));

  useEffect(() => {
    if (!showNow) return;
    const id = setInterval(() => {
      setCurrentTime(formatTime(new Date()));
    }, 30_000);
    return () => clearInterval(id);
  }, [showNow]);

  const isHighlighted = state === 'done' || state === 'active';
  const dotStyle = [
    styles.dot,
    isHighlighted ? styles.dotHighlighted : styles.dotUpcoming,
    state === 'active' && styles.dotActiveRing,
  ];

  const lineStyle = state === 'done' ? styles.lineDone : styles.lineUpcoming;

  return (
    <View style={styles.row}>
      <View style={styles.timeCol}>
        {showNow ? (
          <>
            <Text style={styles.nowLabel}>Now</Text>
            <Text style={styles.nowTimeText}>{currentTime}</Text>
          </>
        ) : (
          <Text style={styles.timeText}>{time}</Text>
        )}
      </View>
      <View style={styles.spineCol}>
        <View style={dotStyle} />
        {showNow && nowOpacity ? (
          <Animated.View style={[styles.nowDot, { opacity: nowOpacity }]} />
        ) : null}
        <View
          style={[
            styles.line,
            showNow ? styles.lineDone : lineStyle,
            isLast && !showNow && styles.lineHidden,
          ]}
        />
      </View>
      <View style={styles.contentCol}>{children}</View>
    </View>
  );
}
