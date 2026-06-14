import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Task } from '@/types/task';

const CHANNEL_ID = 'task-reminders';

// Show notification even when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Task Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
}

export async function syncNotifications(tasks: Task[]): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = new Date();

  for (const task of tasks) {
    if (task.completed) continue;

    const start = new Date(task.startTime);
    const end = new Date(task.endTime);
    const tenBefore = new Date(start.getTime() - 10 * 60 * 1000);
    const fiveAfter = new Date(end.getTime() + 5 * 60 * 1000);

    // 10 min before start
    if (tenBefore > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${task.name} starts soon`,
          body: 'Starting in 10 minutes',
          data: { taskId: task.id },
          ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: tenBefore },
      });
    }

    // Task begins
    if (start > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${task.name} starts now`,
          body: 'Time to begin',
          data: { taskId: task.id },
          ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: start },
      });
    }

    // On task end
    if (end > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Time is up — ${task.name}`,
          body: 'Your scheduled time for this task has ended',
          data: { taskId: task.id },
          ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: end },
      });
    }

    // Nudge 5 min after end
    if (fiveAfter > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Haven't finished ${task.name}?`,
          body: "It's been 5 minutes since your scheduled time ended",
          data: { taskId: task.id },
          ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fiveAfter },
      });
    }
  }
}

export function onNotificationTapped(
  callback: () => void,
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener(() => {
    callback();
  });
}
