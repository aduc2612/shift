import type { Task } from "@/types/task";

// Mock expo-secure-store — not available in test environment
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock supabase module — getSession defined inside factory to avoid hoisting issues
jest.mock("@/services/supabase", () => ({
  __esModule: true,
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
  },
}));

// Grab reference to the mock for test setup
const { supabase } = jest.requireMock("@/services/supabase") as {
  supabase: { auth: { getSession: jest.Mock } };
};
const mockGetSession = supabase.auth.getSession;

// Mock global fetch
const originalFetch = globalThis.fetch;
const mockFetch = jest.fn();
globalThis.fetch = mockFetch as unknown as typeof fetch;

afterAll(() => {
  globalThis.fetch = originalFetch;
});

// Sample task for tests
const sampleTask: Task = {
  id: "task-1",
  userId: "user-1",
  name: "Deep work",
  startTime: "2025-06-10T09:00:00",
  endTime: "2025-06-10T10:00:00",
  durationMinutes: 60,
  deadline: null,
  completed: false,
  aiContext: "morning person",
  aiDecidesTime: true,
  aiJustification: null,
  createdAt: "2025-06-10T00:00:00",
  updatedAt: "2025-06-10T00:00:00",
};

import { rescheduleTasks, placeTask } from "@/services/ai";

beforeEach(() => {
  jest.clearAllMocks();
  process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
  mockGetSession.mockResolvedValue({
    data: { session: { access_token: "test-token" } },
  });
});

afterEach(() => {
  // Restore env var if it was deleted in a test
  process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
});

describe("rescheduleTasks", () => {
  describe("successful requests", () => {
    it("sends POST to correct URL with Authorization header", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ tasks: [] }),
      });

      await rescheduleTasks([sampleTask], "", "");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://test.supabase.co/functions/v1/reschedule",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Authorization: "Bearer test-token",
          }),
        }),
      );
    });

    it("maps tasks to camelCase in request body", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ tasks: [] }),
      });

      await rescheduleTasks([sampleTask], "context", "added gym");

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.tasks).toHaveLength(1);
      expect(callBody.tasks[0]).toEqual({
        id: "task-1",
        name: "Deep work",
        startTime: "2025-06-10T09:00:00",
        endTime: "2025-06-10T10:00:00",
        deadline: null,
        aiDecidesTime: true,
      });
      expect(callBody.userContext).toBe("context");
      expect(callBody.whatChanged).toBe("added gym");
      expect(typeof callBody.timezone).toBe("string");
    });

    it("returns result.tasks on 200 response", async () => {
      const expected = [
        {
          id: "task-1",
          startTime: "2025-06-10T10:00:00",
          endTime: "2025-06-10T11:00:00",
          durationMinutes: 60,
          aiJustification: "Moved to accommodate gym",
          aiContext: "morning person",
        },
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ tasks: expected }),
      });

      const result = await rescheduleTasks([sampleTask], "", "");
      expect(result).toEqual(expected);
    });
  });

  describe("authentication errors", () => {
    it('throws "Not authenticated" when session is null', async () => {
      mockGetSession.mockResolvedValueOnce({
        data: { session: null },
      });

      await expect(rescheduleTasks([sampleTask], "", "")).rejects.toThrow(
        "Not authenticated",
      );
    });
  });

  describe("configuration errors", () => {
    it('throws "Missing EXPO_PUBLIC_SUPABASE_URL" when env is not set', async () => {
      delete process.env.EXPO_PUBLIC_SUPABASE_URL;

      await expect(rescheduleTasks([sampleTask], "", "")).rejects.toThrow(
        "Missing EXPO_PUBLIC_SUPABASE_URL",
      );
    });
  });

  describe("response errors", () => {
    it('throws "Reschedule failed" on non-200 response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: async () => "Internal Server Error",
      });

      await expect(rescheduleTasks([sampleTask], "", "")).rejects.toThrow(
        "Reschedule failed: Internal Server Error",
      );
    });

    it('throws "Invalid response" when tasks is not an array', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ error: "something went wrong" }),
      });

      await expect(rescheduleTasks([sampleTask], "", "")).rejects.toThrow(
        "Invalid response: tasks is not an array",
      );
    });
  });
});

describe("placeTask", () => {
  const placeTaskInput = {
    id: "new-task",
    name: "Gym session",
    durationMinutes: 45,
    deadline: null,
    aiContext: "prefer mornings",
  };

  const existingTasks = [
    {
      id: "task-1",
      name: "Deep work",
      startTime: "2025-06-10T09:00:00",
      endTime: "2025-06-10T10:00:00",
    },
  ];

  describe("successful requests", () => {
    it("sends POST to /functions/v1/place-task with correct headers", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          task: {
            id: "new-task",
            startTime: "2025-06-10T08:00:00",
            endTime: "2025-06-10T08:45:00",
            durationMinutes: 45,
            aiJustification: "Early morning slot",
            aiContext: "prefer mornings",
          },
        }),
      });

      await placeTask(placeTaskInput, existingTasks, "context", "added gym");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://test.supabase.co/functions/v1/place-task",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Authorization: "Bearer test-token",
          }),
        }),
      );
    });

    it("sends correct payload shape", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          task: {
            id: "new-task",
            startTime: "2025-06-10T08:00:00",
            endTime: "2025-06-10T08:45:00",
            durationMinutes: 45,
            aiJustification: "Early morning slot",
            aiContext: "prefer mornings",
          },
        }),
      });

      await placeTask(
        placeTaskInput,
        existingTasks,
        "work context",
        "moved gym",
      );

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.task).toEqual(placeTaskInput);
      expect(callBody.existingTasks).toEqual(existingTasks);
      expect(callBody.userContext).toBe("work context");
      expect(callBody.whatChanged).toBe("moved gym");
      expect(typeof callBody.timezone).toBe("string");
    });

    it("returns result.task on success", async () => {
      const expectedTask = {
        id: "new-task",
        startTime: "2025-06-10T08:00:00",
        endTime: "2025-06-10T08:45:00",
        durationMinutes: 45,
        aiJustification: "Early morning slot available",
        aiContext: "prefer mornings",
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ task: expectedTask }),
      });

      const result = await placeTask(placeTaskInput, existingTasks, "", "");
      expect(result).toEqual(expectedTask);
    });
  });

  describe("authentication errors", () => {
    it('throws "Not authenticated" when session is null', async () => {
      mockGetSession.mockResolvedValueOnce({
        data: { session: null },
      });

      await expect(
        placeTask(placeTaskInput, existingTasks, "", ""),
      ).rejects.toThrow("Not authenticated");
    });
  });

  describe("configuration errors", () => {
    it('throws "Missing EXPO_PUBLIC_SUPABASE_URL" when env is not set', async () => {
      delete process.env.EXPO_PUBLIC_SUPABASE_URL;

      await expect(
        placeTask(placeTaskInput, existingTasks, "", ""),
      ).rejects.toThrow("Missing EXPO_PUBLIC_SUPABASE_URL");
    });
  });

  describe("response errors", () => {
    it('throws "Place task failed" on non-200 response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: async () => "Internal Server Error",
      });

      await expect(
        placeTask(placeTaskInput, existingTasks, "", ""),
      ).rejects.toThrow("Place task failed: Internal Server Error");
    });

    it('throws "Invalid response: missing task" when task field is missing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ error: "something went wrong" }),
      });

      await expect(
        placeTask(placeTaskInput, existingTasks, "", ""),
      ).rejects.toThrow("Invalid response: missing task");
    });
  });
});
