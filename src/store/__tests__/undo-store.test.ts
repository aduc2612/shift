import { useUndoStore } from '../undo-store';
import type { Task } from '@/types/task';

const mockTasks: Task[] = [
  {
    id: 'task-1',
    userId: 'user-1',
    name: 'Test Task',
    startTime: '2025-06-10T08:00:00',
    endTime: '2025-06-10T09:00:00',
    durationMinutes: 60,
    deadline: null,
    completed: false,
    aiContext: null,
    aiDecidesTime: false,
    aiJustification: null,
    createdAt: '2025-06-10T07:00:00',
    updatedAt: '2025-06-10T07:00:00',
  },
  {
    id: 'task-2',
    userId: 'user-1',
    name: 'Another Task',
    startTime: '2025-06-10T10:00:00',
    endTime: '2025-06-10T11:30:00',
    durationMinutes: 90,
    deadline: '2025-06-11',
    completed: false,
    aiContext: 'Focus work',
    aiDecidesTime: true,
    aiJustification: 'Scheduled for morning focus',
    createdAt: '2025-06-10T07:00:00',
    updatedAt: '2025-06-10T07:00:00',
  },
];

describe('useUndoStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useUndoStore.setState({ snapshot: null, timeoutId: null });
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('initializes with null snapshot', () => {
    const state = useUndoStore.getState();
    expect(state.snapshot).toBeNull();
    expect(state.timeoutId).toBeNull();
  });

  it('setSnapshot stores a tasks array', () => {
    useUndoStore.getState().setSnapshot(mockTasks);
    expect(useUndoStore.getState().snapshot).toEqual(mockTasks);
  });

  it('clearSnapshot resets snapshot to null', () => {
    useUndoStore.getState().setSnapshot(mockTasks);
    useUndoStore.getState().clearSnapshot();
    expect(useUndoStore.getState().snapshot).toBeNull();
  });

  it('startTimeout calls onExpire after the given duration', () => {
    const onExpire = jest.fn();
    useUndoStore.getState().startTimeout(onExpire, 5000);

    expect(onExpire).not.toHaveBeenCalled();

    jest.advanceTimersByTime(5000);

    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('startTimeout clears snapshot and timeoutId after expiry', () => {
    const onExpire = jest.fn();
    useUndoStore.getState().setSnapshot(mockTasks);
    useUndoStore.getState().startTimeout(onExpire, 5000);

    jest.advanceTimersByTime(5000);

    expect(useUndoStore.getState().snapshot).toBeNull();
    expect(useUndoStore.getState().timeoutId).toBeNull();
  });

  it('cancelTimeout prevents onExpire from being called', () => {
    const onExpire = jest.fn();
    useUndoStore.getState().startTimeout(onExpire, 5000);

    useUndoStore.getState().cancelTimeout();

    jest.advanceTimersByTime(10000);

    expect(onExpire).not.toHaveBeenCalled();
  });

  it('cancelTimeout clears timeoutId but keeps snapshot', () => {
    const onExpire = jest.fn();
    useUndoStore.getState().setSnapshot(mockTasks);
    useUndoStore.getState().startTimeout(onExpire, 5000);

    useUndoStore.getState().cancelTimeout();

    expect(useUndoStore.getState().timeoutId).toBeNull();
    expect(useUndoStore.getState().snapshot).toEqual(mockTasks);
  });

  it('startTimeout clears previous timeout before setting a new one', () => {
    const firstOnExpire = jest.fn();
    const secondOnExpire = jest.fn();

    useUndoStore.getState().startTimeout(firstOnExpire, 5000);
    useUndoStore.getState().startTimeout(secondOnExpire, 3000);

    // Advance past the second timeout but not the first
    jest.advanceTimersByTime(3000);

    expect(secondOnExpire).toHaveBeenCalledTimes(1);
    expect(firstOnExpire).not.toHaveBeenCalled();
  });

  it('startTimeout defaults to 5000ms when no duration given', () => {
    const onExpire = jest.fn();
    useUndoStore.getState().startTimeout(onExpire);

    jest.advanceTimersByTime(4999);
    expect(onExpire).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(onExpire).toHaveBeenCalledTimes(1);
  });
});
