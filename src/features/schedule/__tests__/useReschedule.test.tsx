import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useReschedule } from '../hooks/useReschedule';
import { useUndoStore } from '@/store/undo-store';
import type { Task } from '@/types/task';
import type { RescheduleResult } from '@/services/ai';
import type { TaskUpdate } from '@/features/schedule/api';

// Mock API module
jest.mock('@/features/schedule/api', () => ({
  fetchIncompleteTasks: jest.fn(),
  batchUpdateTasks: jest.fn(),
}));

// Mock AI service
jest.mock('@/services/ai', () => ({
  rescheduleTasks: jest.fn(),
}));

// Mock toast provider
const mockShow = jest.fn();
const mockHide = jest.fn();
jest.mock('@/providers/toast-provider', () => ({
  useToast: () => ({ show: mockShow, hide: mockHide }),
}));

// Mock RevenueCat service
const mockIsSubscribed = jest.fn(async () => true);
const mockPresentPaywall = jest.fn(async () => true);
jest.mock('@/services/revenuecat', () => ({
  isSubscribed: () => mockIsSubscribed(),
  presentPaywall: () => mockPresentPaywall(),
}));

// Import mocked modules for assertions
const api = jest.requireMock('@/features/schedule/api') as {
  fetchIncompleteTasks: jest.Mock;
  batchUpdateTasks: jest.Mock;
};
const ai = jest.requireMock('@/services/ai') as {
  rescheduleTasks: jest.Mock;
};

const mockTasks: Task[] = [
  {
    id: 'task-1',
    userId: 'user-1',
    name: 'Deep work',
    startTime: '2025-06-10T09:00:00',
    endTime: '2025-06-10T10:00:00',
    durationMinutes: 60,
    deadline: null,
    completed: false,
    aiContext: 'high focus',
    aiDecidesTime: false,
    aiJustification: null,
    createdAt: '2025-06-10T00:00:00',
    updatedAt: '2025-06-10T00:00:00',
  },
  {
    id: 'task-2',
    userId: 'user-1',
    name: 'Lunch',
    startTime: '2025-06-10T12:00:00',
    endTime: '2025-06-10T12:30:00',
    durationMinutes: 30,
    deadline: null,
    completed: false,
    aiContext: null,
    aiDecidesTime: false,
    aiJustification: null,
    createdAt: '2025-06-10T00:00:00',
    updatedAt: '2025-06-10T00:00:00',
  },
];

const mockRescheduleResult: RescheduleResult[] = [
  {
    id: 'task-1',
    startTime: '2025-06-10T10:00:00',
    endTime: '2025-06-10T11:00:00',
    durationMinutes: 60,
    deadline: null,
    aiJustification: 'Moved to after coffee',
    aiContext: 'high focus',
  },
  {
    id: 'task-2',
    startTime: '2025-06-10T13:00:00',
    endTime: '2025-06-10T13:30:00',
    durationMinutes: 30,
    deadline: null,
    aiJustification: 'Later lunch',
    aiContext: '',
  },
];

const mockUpdatedTasks: Task[] = mockTasks.map((t, i) => ({
  ...t,
  startTime: mockRescheduleResult[i].startTime,
  endTime: mockRescheduleResult[i].endTime,
  aiJustification: mockRescheduleResult[i].aiJustification,
  aiContext: mockRescheduleResult[i].aiContext,
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  function TestWrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return TestWrapper;
}

describe('useReschedule', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useUndoStore.setState({ snapshot: null, timeoutId: null });

    api.fetchIncompleteTasks.mockResolvedValue(mockTasks);
    ai.rescheduleTasks.mockResolvedValue(mockRescheduleResult);
    api.batchUpdateTasks.mockResolvedValue(mockUpdatedTasks);
    mockIsSubscribed.mockResolvedValue(true);
    mockPresentPaywall.mockResolvedValue(true);
  });

  it('fetches incomplete tasks, calls AI, writes results via batchUpdateTasks', async () => {
    const { result } = await renderHook(() => useReschedule(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ whatChanged: 'test change' });
    });

    expect(api.fetchIncompleteTasks).toHaveBeenCalledTimes(1);
    expect(ai.rescheduleTasks).toHaveBeenCalledWith(
      mockTasks,
      '',
      'test change',
    );
    expect(api.batchUpdateTasks).toHaveBeenCalledWith(mockRescheduleResult);
  });

  it('snapshots tasks before calling AI', async () => {
    expect(useUndoStore.getState().snapshot).toBeNull();

    const { result } = await renderHook(() => useReschedule(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ whatChanged: '' });
    });

    expect(useUndoStore.getState().snapshot).toEqual(mockTasks);
  });

  it('shows undo toast on success', async () => {
    const { result } = await renderHook(() => useReschedule(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ whatChanged: '' });
    });

    expect(mockShow).toHaveBeenCalledTimes(1);
    expect(mockShow).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Schedule updated',
        actionLabel: 'Undo',
        duration: 5000,
      }),
    );
  });

  it('clears snapshot on error', async () => {
    useUndoStore.setState({ snapshot: mockTasks });
    api.fetchIncompleteTasks.mockRejectedValue(new Error('network error'));

    const { result } = await renderHook(() => useReschedule(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({ whatChanged: '' });
      } catch {
        // Expected
      }
    });

    expect(useUndoStore.getState().snapshot).toBeNull();
  });

  describe('undo', () => {
    it('restores snapshot tasks to Supabase via batchUpdateTasks', async () => {
      let capturedOnAction: (() => void) | undefined;
      mockShow.mockImplementation((opts: { onAction?: () => void }) => {
        capturedOnAction = opts.onAction;
      });

      const { result } = await renderHook(() => useReschedule(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync({ whatChanged: '' });
      });

      expect(capturedOnAction).toBeDefined();

      api.batchUpdateTasks.mockClear();
      api.batchUpdateTasks.mockResolvedValue(mockTasks);

      await act(async () => {
        await capturedOnAction!();
      });

      expect(api.batchUpdateTasks).toHaveBeenCalledTimes(1);
      const calledWith = api.batchUpdateTasks.mock
        .calls[0][0] as TaskUpdate[];
      expect(calledWith).toHaveLength(2);
      expect(calledWith[0]).toEqual({
        id: 'task-1',
        startTime: mockTasks[0].startTime,
        endTime: mockTasks[0].endTime,
        durationMinutes: mockTasks[0].durationMinutes,
        deadline: mockTasks[0].deadline,
        aiJustification: mockTasks[0].aiJustification,
        aiContext: mockTasks[0].aiContext,
      });
      expect(calledWith[1]).toEqual({
        id: 'task-2',
        startTime: mockTasks[1].startTime,
        endTime: mockTasks[1].endTime,
        durationMinutes: mockTasks[1].durationMinutes,
        deadline: mockTasks[1].deadline,
        aiJustification: mockTasks[1].aiJustification,
        aiContext: mockTasks[1].aiContext,
      });
    });

    it('clears snapshot and hides toast after undo', async () => {
      let capturedOnAction: (() => void) | undefined;
      mockShow.mockImplementation((opts: { onAction?: () => void }) => {
        capturedOnAction = opts.onAction;
      });

      const { result } = await renderHook(() => useReschedule(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync({ whatChanged: '' });
      });

      api.batchUpdateTasks.mockResolvedValue(mockTasks);

      await act(async () => {
        await capturedOnAction!();
      });

      expect(useUndoStore.getState().snapshot).toBeNull();
      expect(mockHide).toHaveBeenCalled();
    });

    it('does nothing if snapshot is already cleared', async () => {
      let capturedOnAction: (() => void) | undefined;
      mockShow.mockImplementation((opts: { onAction?: () => void }) => {
        capturedOnAction = opts.onAction;
      });

      const { result } = await renderHook(() => useReschedule(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync({ whatChanged: '' });
      });

      useUndoStore.setState({ snapshot: null });
      api.batchUpdateTasks.mockClear();

      await act(async () => {
        await capturedOnAction!();
      });

      expect(api.batchUpdateTasks).not.toHaveBeenCalled();
    });
  });

  describe('subscription gating', () => {
    it('throws when not subscribed and paywall not purchased', async () => {
      mockIsSubscribed.mockResolvedValue(false);
      mockPresentPaywall.mockResolvedValue(false);

      const { result } = await renderHook(() => useReschedule(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await expect(
          result.current.mutateAsync({ whatChanged: '' }),
        ).rejects.toThrow('Subscription required');
      });

      expect(mockPresentPaywall).toHaveBeenCalledTimes(1);
      expect(api.fetchIncompleteTasks).not.toHaveBeenCalled();
    });

    it('continues reschedule when paywall purchase succeeds', async () => {
      mockIsSubscribed.mockResolvedValue(false);
      mockPresentPaywall.mockResolvedValue(true);

      const { result } = await renderHook(() => useReschedule(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync({ whatChanged: 'test' });
      });

      expect(mockPresentPaywall).toHaveBeenCalledTimes(1);
      expect(api.fetchIncompleteTasks).toHaveBeenCalledTimes(1);
      expect(ai.rescheduleTasks).toHaveBeenCalled();
    });
  });
});
