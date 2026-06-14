import { create } from 'zustand';
import type { Task } from '@/types/task';

const DEFAULT_TIMEOUT_MS = 5000;

type UndoState = {
  snapshot: Task[] | null;
  timeoutId: ReturnType<typeof setTimeout> | null;
  setSnapshot: (tasks: Task[]) => void;
  clearSnapshot: () => void;
  startTimeout: (onExpire: () => void, ms?: number) => void;
  cancelTimeout: () => void;
};

export const useUndoStore = create<UndoState>((set, get) => ({
  snapshot: null,
  timeoutId: null,

  setSnapshot: (tasks) => set({ snapshot: tasks }),

  clearSnapshot: () => set({ snapshot: null }),

  startTimeout: (onExpire, ms = DEFAULT_TIMEOUT_MS) => {
    const { timeoutId: existingTimeoutId } = get();

    // Clear any previously running timeout
    if (existingTimeoutId !== null) {
      clearTimeout(existingTimeoutId);
    }

    const newTimeoutId = setTimeout(() => {
      onExpire();
      set({ snapshot: null, timeoutId: null });
    }, ms);

    set({ timeoutId: newTimeoutId });
  },

  cancelTimeout: () => {
    const { timeoutId } = get();
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    set({ timeoutId: null });
  },
}));
