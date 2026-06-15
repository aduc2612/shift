import React from "react";
import { renderHook, act } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePlaceTask } from "../usePlaceTask";
import { useUndoStore } from "@/store/undo-store";
import type { Task } from "@/types/task";
import { RESCHEDULE_CONSTANTS } from "@/constants/reschedule";

// Mock API module
jest.mock("@/features/schedule/api", () => ({
  fetchIncompleteTasks: jest.fn(),
  createTask: jest.fn(),
  updateTask: jest.fn(),
  deleteTask: jest.fn(),
}));

// Mock AI service
jest.mock("@/services/ai", () => ({
  placeTask: jest.fn(),
}));

// Mock toast provider
const mockShow = jest.fn();
const mockHide = jest.fn();
jest.mock("@/providers/toast-provider", () => ({
  useToast: () => ({ show: mockShow, hide: mockHide }),
}));

// Import mocked modules for assertions
const api = jest.requireMock("@/features/schedule/api") as {
  fetchIncompleteTasks: jest.Mock;
  createTask: jest.Mock;
  updateTask: jest.Mock;
  deleteTask: jest.Mock;
};
const ai = jest.requireMock("@/services/ai") as {
  placeTask: jest.Mock;
};

const existingTasks: Task[] = [
  {
    id: "existing-1",
    userId: "user-1",
    name: "Deep work",
    startTime: "2025-06-10T09:00:00",
    endTime: "2025-06-10T10:00:00",
    durationMinutes: 60,
    deadline: null,
    completed: false,
    aiContext: "high focus",
    aiDecidesTime: false,
    aiJustification: null,
    createdAt: "2025-06-10T00:00:00",
    updatedAt: "2025-06-10T00:00:00",
  },
  {
    id: "existing-2",
    userId: "user-1",
    name: "Lunch",
    startTime: "2025-06-10T12:00:00",
    endTime: "2025-06-10T12:30:00",
    durationMinutes: 30,
    deadline: null,
    completed: false,
    aiContext: null,
    aiDecidesTime: false,
    aiJustification: null,
    createdAt: "2025-06-10T00:00:00",
    updatedAt: "2025-06-10T00:00:00",
  },
];

const previousTask: Task = {
  id: "task-to-edit",
  userId: "user-1",
  name: "Meeting",
  startTime: "2025-06-10T14:00:00",
  endTime: "2025-06-10T15:00:00",
  durationMinutes: 60,
  deadline: null,
  completed: false,
  aiContext: null,
  aiDecidesTime: false,
  aiJustification: null,
  createdAt: "2025-06-10T00:00:00",
  updatedAt: "2025-06-10T00:00:00",
};

const createdTask: Task = {
  id: "new-task-id",
  userId: "user-1",
  name: "Yoga",
  startTime: "2025-06-10T07:00:00",
  endTime: "2025-06-10T07:30:00",
  durationMinutes: 30,
  deadline: null,
  completed: false,
  aiContext: "relaxation",
  aiDecidesTime: true,
  aiJustification: "Early morning wellness",
  createdAt: "2025-06-10T00:00:00",
  updatedAt: "2025-06-10T00:00:00",
};

const placeTaskResult = {
  id: "new-task-id",
  startTime: "2025-06-10T07:00:00",
  endTime: "2025-06-10T07:30:00",
  durationMinutes: 30,
  aiJustification: "Early morning wellness",
  aiContext: "relaxation",
};

const addParams = {
  taskData: {
    name: "Yoga",
    durationMinutes: 30,
    deadline: null,
    aiContext: null,
  },
  whatChanged: "New task added: Yoga",
  mode: "add" as const,
};

const editParams = {
  taskData: {
    name: "Meeting",
    durationMinutes: 60,
    deadline: null,
    aiContext: null,
  },
  whatChanged: "Rescheduled task",
  mode: "edit" as const,
  previousTask,
  existingTaskId: "task-to-edit",
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  function TestWrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
  return TestWrapper;
}

describe("usePlaceTask", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { timeoutId } = useUndoStore.getState();
    if (timeoutId !== null) clearTimeout(timeoutId);
    useUndoStore.setState({ snapshot: null, timeoutId: null });

    api.fetchIncompleteTasks.mockResolvedValue(existingTasks);
    ai.placeTask.mockResolvedValue(placeTaskResult);
    api.createTask.mockResolvedValue(createdTask);
    api.updateTask.mockResolvedValue({ ...previousTask, ...placeTaskResult });
  });

  afterEach(() => {
    const { timeoutId } = useUndoStore.getState();
    if (timeoutId !== null) clearTimeout(timeoutId);
    useUndoStore.setState({ snapshot: null, timeoutId: null });
  });

  describe("add flow", () => {
    it("calls placeTask with task data + existing tasks, then createTask with AI-assigned times", async () => {
      const { result } = await renderHook(() => usePlaceTask(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync(addParams);
      });

      expect(api.fetchIncompleteTasks).toHaveBeenCalledTimes(1);
      expect(ai.placeTask).toHaveBeenCalledWith(
        {
          id: "new-task",
          name: "Yoga",
          durationMinutes: 30,
          deadline: null,
          aiContext: null,
        },
        existingTasks.map((t) => ({
          id: t.id,
          name: t.name,
          startTime: t.startTime,
          endTime: t.endTime,
          durationMinutes: t.durationMinutes,
        })),
        "",
        "New task added: Yoga",
      );
      expect(api.createTask).toHaveBeenCalledTimes(1);
      expect(api.createTask).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Yoga",
          durationMinutes: 30,
          deadline: null,
          startTime: placeTaskResult.startTime,
          endTime: placeTaskResult.endTime,
          aiJustification: placeTaskResult.aiJustification,
          aiContext: placeTaskResult.aiContext,
          aiDecidesTime: true,
        }),
      );
    });
  });

  describe("edit flow", () => {
    it("calls placeTask with task data + existing tasks, then updateTask with AI-assigned times", async () => {
      const { result } = await renderHook(() => usePlaceTask(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync(editParams);
      });

      expect(api.fetchIncompleteTasks).toHaveBeenCalledTimes(1);
      expect(ai.placeTask).toHaveBeenCalledWith(
        {
          id: "task-to-edit",
          name: "Meeting",
          durationMinutes: 60,
          deadline: null,
          aiContext: null,
        },
        existingTasks.map((t) => ({
          id: t.id,
          name: t.name,
          startTime: t.startTime,
          endTime: t.endTime,
          durationMinutes: t.durationMinutes,
        })),
        "",
        "Rescheduled task",
      );
      expect(api.updateTask).toHaveBeenCalledWith(
        "task-to-edit",
        expect.objectContaining({
          startTime: placeTaskResult.startTime,
          endTime: placeTaskResult.endTime,
          durationMinutes: placeTaskResult.durationMinutes,
          aiJustification: placeTaskResult.aiJustification,
          aiContext: placeTaskResult.aiContext,
          aiDecidesTime: true,
        }),
      );
      expect(api.createTask).not.toHaveBeenCalled();
    });
  });

  describe("toast", () => {
    it("shows undo toast on success with correct message, action label, and duration", async () => {
      const { result } = await renderHook(() => usePlaceTask(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync(addParams);
      });

      expect(mockShow).toHaveBeenCalledTimes(1);
      expect(mockShow).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Task placed",
          actionLabel: "Undo",
          duration: RESCHEDULE_CONSTANTS.TOAST_DURATION_MS,
        }),
      );
    });
  });

  describe("undo", () => {
    it("add mode: deletes the created task and hides toast", async () => {
      let capturedOnAction: (() => void) | undefined;
      mockShow.mockImplementation((opts: { onAction?: () => void }) => {
        capturedOnAction = opts.onAction;
      });

      const { result } = await renderHook(() => usePlaceTask(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync(addParams);
      });

      expect(capturedOnAction).toBeDefined();
      api.deleteTask.mockResolvedValue(undefined);

      await act(async () => {
        await capturedOnAction!();
      });

      expect(api.deleteTask).toHaveBeenCalledWith("new-task-id");
      expect(useUndoStore.getState().snapshot).toBeNull();
      expect(mockHide).toHaveBeenCalled();
    });

    it("edit mode: restores previous task fields via updateTask and hides toast", async () => {
      let capturedOnAction: (() => void) | undefined;
      mockShow.mockImplementation((opts: { onAction?: () => void }) => {
        capturedOnAction = opts.onAction;
      });

      const { result } = await renderHook(() => usePlaceTask(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync(editParams);
      });

      expect(capturedOnAction).toBeDefined();
      api.updateTask.mockClear();
      api.updateTask.mockResolvedValue(previousTask);

      await act(async () => {
        await capturedOnAction!();
      });

      expect(api.updateTask).toHaveBeenCalledWith(
        "task-to-edit",
        expect.objectContaining({
          startTime: previousTask.startTime,
          endTime: previousTask.endTime,
          durationMinutes: previousTask.durationMinutes,
          aiJustification: previousTask.aiJustification,
          aiContext: previousTask.aiContext,
        }),
      );
      expect(useUndoStore.getState().snapshot).toBeNull();
      expect(mockHide).toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("re-throws error from placeTask so the caller can catch it", async () => {
      ai.placeTask.mockRejectedValue(new Error("AI unavailable"));

      const { result } = await renderHook(() => usePlaceTask(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(addParams);
          fail("Expected error to be thrown");
        } catch (e) {
          expect((e as Error).message).toBe("AI unavailable");
        }
      });
    });

    it("clears undo snapshot on error", async () => {
      ai.placeTask.mockRejectedValue(new Error("AI unavailable"));

      const { result } = await renderHook(() => usePlaceTask(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(addParams);
        } catch {
          // Expected
        }
      });

      expect(useUndoStore.getState().snapshot).toBeNull();
    });
  });
});
