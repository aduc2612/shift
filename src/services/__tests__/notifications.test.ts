import * as Notifications from 'expo-notifications';
import {
  syncNotifications,
  setupNotificationChannel,
  onNotificationTapped,
} from '../notifications';
import type { Task } from '@/types/task';

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  cancelAllScheduledNotificationsAsync: jest.fn().mockResolvedValue(undefined),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('notif-id'),
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
  addNotificationResponseReceivedListener: jest.fn().mockReturnValue({
    remove: jest.fn(),
  }),
  AndroidImportance: { HIGH: 4 },
  SchedulableTriggerInputTypes: { DATE: 'date' },
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
}));

const baseTask: Task = {
  id: '1',
  userId: 'u1',
  name: 'Work',
  startTime: '2099-06-10T09:00:00',
  endTime: '2099-06-10T10:00:00',
  durationMinutes: 60,
  deadline: null,
  completed: false,
  aiContext: null,
  aiDecidesTime: false,
  aiJustification: null,
  createdAt: '',
  updatedAt: '',
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('setupNotificationChannel', () => {
  it('creates Android channel with correct id and name', async () => {
    await setupNotificationChannel();
    expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith(
      'task-reminders',
      expect.objectContaining({ name: 'Task Reminders' }),
    );
  });
});

describe('syncNotifications', () => {
  it('cancels all scheduled notifications first', async () => {
    await syncNotifications([]);
    expect(
      Notifications.cancelAllScheduledNotificationsAsync,
    ).toHaveBeenCalled();
  });

  it('schedules 4 notifications per incomplete task', async () => {
    await syncNotifications([baseTask]);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(4);
  });

  it('skips completed tasks entirely', async () => {
    await syncNotifications([{ ...baseTask, completed: true }]);
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('schedules "starts soon" 10 min before startTime', async () => {
    await syncNotifications([baseTask]);
    const calls = (
      Notifications.scheduleNotificationAsync as jest.Mock
    ).mock.calls;
    const call = calls.find((c) =>
      c[0].content.title?.includes('starts soon'),
    );
    expect(call).toBeDefined();
    expect(call[0].trigger.date).toEqual(new Date('2099-06-10T08:50:00'));
  });

  it('schedules "starts now" at startTime', async () => {
    await syncNotifications([baseTask]);
    const calls = (
      Notifications.scheduleNotificationAsync as jest.Mock
    ).mock.calls;
    const call = calls.find((c) =>
      c[0].content.title?.includes('starts now'),
    );
    expect(call).toBeDefined();
    expect(call[0].trigger.date).toEqual(new Date('2099-06-10T09:00:00'));
  });

  it('schedules "time is up" at endTime', async () => {
    await syncNotifications([baseTask]);
    const calls = (
      Notifications.scheduleNotificationAsync as jest.Mock
    ).mock.calls;
    const call = calls.find((c) =>
      c[0].content.title?.includes('Time is up'),
    );
    expect(call).toBeDefined();
    expect(call[0].trigger.date).toEqual(new Date('2099-06-10T10:00:00'));
  });

  it('schedules nudge 5 min after endTime', async () => {
    await syncNotifications([baseTask]);
    const calls = (
      Notifications.scheduleNotificationAsync as jest.Mock
    ).mock.calls;
    const call = calls.find((c) =>
      c[0].content.title?.includes("Haven't finished"),
    );
    expect(call).toBeDefined();
    expect(call[0].trigger.date).toEqual(new Date('2099-06-10T10:05:00'));
  });

  it('includes taskId in notification data', async () => {
    await syncNotifications([baseTask]);
    const calls = (
      Notifications.scheduleNotificationAsync as jest.Mock
    ).mock.calls;
    for (const call of calls) {
      expect(call[0].content.data).toEqual({ taskId: '1' });
    }
  });

  it('includes channelId on Android', async () => {
    await syncNotifications([baseTask]);
    const calls = (
      Notifications.scheduleNotificationAsync as jest.Mock
    ).mock.calls;
    for (const call of calls) {
      expect(call[0].content.channelId).toBe('task-reminders');
    }
  });

  it('handles empty task list', async () => {
    await syncNotifications([]);
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('handles multiple tasks', async () => {
    const task2: Task = {
      ...baseTask,
      id: '2',
      name: 'Lunch',
      startTime: '2099-06-10T12:00:00',
      endTime: '2099-06-10T13:00:00',
    };
    await syncNotifications([baseTask, task2]);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(8);
  });

  it('skips notifications for past trigger times', async () => {
    const pastTask: Task = {
      ...baseTask,
      startTime: '2020-01-01T09:00:00',
      endTime: '2020-01-01T10:00:00',
    };
    await syncNotifications([pastTask]);
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('mix of completed and incomplete tasks', async () => {
    const completed: Task = { ...baseTask, id: 'c1', completed: true };
    const incomplete: Task = { ...baseTask, id: 'i1' };
    await syncNotifications([completed, incomplete]);
    // Only the incomplete task should get 4 notifications
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(4);
  });
});

describe('onNotificationTapped', () => {
  it('registers a notification response listener', () => {
    const callback = jest.fn();
    onNotificationTapped(callback);
    expect(
      Notifications.addNotificationResponseReceivedListener,
    ).toHaveBeenCalledWith(expect.any(Function));
  });

  it('returns an EventSubscription with remove', () => {
    const result = onNotificationTapped(jest.fn());
    expect(result).toBeDefined();
    expect(result.remove).toBeDefined();
  });
});
