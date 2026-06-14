import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSyncNotifications } from '../hooks/useSyncNotifications';
import * as notifications from '@/services/notifications';
import type { Task } from '@/types/task';

jest.mock('@/services/notifications', () => ({
  syncNotifications: jest.fn().mockResolvedValue(undefined),
}));

const mockTasks: Task[] = [
  {
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
  },
];

function createWrapper(queryClient: QueryClient) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
  return Wrapper;
}

describe('useSyncNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('syncs notifications from existing cache data on mount', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    // Pre-populate cache BEFORE hook mounts
    queryClient.setQueryData(['tasks', '2099-06-10'], mockTasks);

    renderHook(() => useSyncNotifications(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(notifications.syncNotifications).toHaveBeenCalledWith(mockTasks);
    });
  });

  it('calls syncNotifications when tasks data is set in cache after mount', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    renderHook(() => useSyncNotifications(), {
      wrapper: createWrapper(queryClient),
    });

    // Set data AFTER hook mounts
    queryClient.setQueryData(['tasks', '2099-06-10'], mockTasks);

    await waitFor(() => {
      expect(notifications.syncNotifications).toHaveBeenCalledWith(mockTasks);
    });
  });

  it('does not call syncNotifications when cache data is undefined', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    renderHook(() => useSyncNotifications(), {
      wrapper: createWrapper(queryClient),
    });

    await new Promise((r) => setTimeout(r, 100));
    expect(notifications.syncNotifications).not.toHaveBeenCalled();
  });

  it('calls syncNotifications for any query key starting with "tasks"', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    renderHook(() => useSyncNotifications(), {
      wrapper: createWrapper(queryClient),
    });

    queryClient.setQueryData(['tasks', '2099-12-25'], mockTasks);

    await waitFor(() => {
      expect(notifications.syncNotifications).toHaveBeenCalledWith(mockTasks);
    });
  });

  it('unsubscribes from cache on unmount', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const { unmount } = await renderHook(() => useSyncNotifications(), {
      wrapper: createWrapper(queryClient),
    });

    await unmount();
    jest.clearAllMocks();

    // After unmount, new cache updates should not trigger sync
    queryClient.setQueryData(['tasks', '2099-06-10'], mockTasks);
    await new Promise((r) => setTimeout(r, 100));
    expect(notifications.syncNotifications).not.toHaveBeenCalled();
  });

  it('swallows syncNotifications errors (no crash)', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    (notifications.syncNotifications as jest.Mock).mockRejectedValueOnce(
      new Error('Permission denied'),
    );

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    renderHook(() => useSyncNotifications(), {
      wrapper: createWrapper(queryClient),
    });

    queryClient.setQueryData(['tasks', '2099-06-10'], mockTasks);

    await waitFor(() => {
      expect(notifications.syncNotifications).toHaveBeenCalled();
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to sync notifications:',
      expect.any(Error),
    );
    consoleSpy.mockRestore();
  });
});
