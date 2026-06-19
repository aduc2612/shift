import { fetchIncompleteTasks, batchUpdateTasks } from "../api";

// Mock expo-secure-store — not available in test environment
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// ── Supabase mock ──────────────────────────────────────────────
// fetchIncompleteTasks chain: from().select().eq().order()
const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
const mockEqCompleted = jest.fn(() => ({ order: mockOrder }));
const mockFetchSelect = jest.fn(() => ({ eq: mockEqCompleted }));

// batchUpdateTasks chain: from().update().eq().select().single()
const mockSingle = jest.fn();
const mockBatchSelect = jest.fn(() => ({ single: mockSingle }));
const mockEqId = jest.fn(() => ({ select: mockBatchSelect }));
const mockUpdate = jest.fn(() => ({ eq: mockEqId }));

const mockFrom = jest.fn(() => ({
  select: mockFetchSelect,
  update: mockUpdate,
}));

jest.mock("@/services/supabase", () => ({
  __esModule: true,
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({ eq: jest.fn(() => ({ order: jest.fn() })) })),
      update: jest.fn(() => ({ eq: jest.fn(() => ({ select: jest.fn(() => ({ single: jest.fn() })) })) })),
    })),
  },
}));

// Grab reference to mock for test assertions
const { supabase } = jest.requireMock("@/services/supabase") as {
  supabase: { from: jest.Mock };
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ── Fixture ────────────────────────────────────────────────────
const dbRow = {
  id: "abc-123",
  user_id: "user-1",
  name: "Test Task",
  start_time: "2025-01-15T09:00:00Z",
  end_time: "2025-01-15T10:00:00Z",
  duration_minutes: 60,
  deadline: "2025-01-16",
  completed: false,
  ai_context: "some context",
  ai_decides_time: false,
  ai_justification: "morning focus",
  created_at: "2025-01-14T00:00:00Z",
  updated_at: "2025-01-14T00:00:00Z",
};

// Helper to build a fresh mock chain for fetchIncompleteTasks
function mockFetchChain(data: unknown[] | null, error: unknown = null) {
  const order = jest.fn().mockResolvedValue({ data, error });
  const eq = jest.fn(() => ({ order }));
  const select = jest.fn(() => ({ eq }));
  supabase.from.mockReturnValue({ select });
  return { select, eq, order };
}

// Helper to build a fresh mock chain for batchUpdateTasks
function mockBatchChain() {
  const results: { data: unknown; error: unknown }[] = [];
  const calls: { args: unknown[] }[] = [];
  let callIndex = 0;

  const single = jest.fn(() => {
    const r = results[callIndex] ?? { data: dbRow, error: null };
    callIndex++;
    return Promise.resolve(r);
  });
  const select = jest.fn(() => ({ single }));
  const eqId = jest.fn(() => ({ select }));
  const update = jest.fn(() => ({ eq: eqId }));
  supabase.from.mockReturnValue({ update });

  return {
    setResult(index: number, data: unknown, error: unknown = null) {
      results[index] = { data, error };
    },
    single,
    select,
    eqId,
    update,
  };
}

// ── fetchIncompleteTasks ───────────────────────────────────────
describe("fetchIncompleteTasks", () => {
  it("queries tasks where completed=false ordered by start_time asc", async () => {
    const { select, eq, order } = mockFetchChain([]);

    await fetchIncompleteTasks();

    expect(supabase.from).toHaveBeenCalledWith("tasks");
    expect(select).toHaveBeenCalledWith("*");
    expect(eq).toHaveBeenCalledWith("completed", false);
    expect(order).toHaveBeenCalledWith("start_time", { ascending: true });
  });

  it("returns mapped camelCase Task[]", async () => {
    mockFetchChain([dbRow]);
    const result = await fetchIncompleteTasks();

    expect(result).toEqual([
      {
        id: "abc-123",
        userId: "user-1",
        name: "Test Task",
        startTime: "2025-01-15T09:00:00Z",
        endTime: "2025-01-15T10:00:00Z",
        durationMinutes: 60,
        deadline: "2025-01-16",
        completed: false,
        aiContext: "some context",
        aiDecidesTime: false,
        aiJustification: "morning focus",
        createdAt: "2025-01-14T00:00:00Z",
        updatedAt: "2025-01-14T00:00:00Z",
      },
    ]);
  });

  it("returns empty array when data is null", async () => {
    mockFetchChain(null);
    expect(await fetchIncompleteTasks()).toEqual([]);
  });

  it("throws on supabase error", async () => {
    mockFetchChain(null, { message: "DB failure" });
    await expect(fetchIncompleteTasks()).rejects.toThrow("DB failure");
  });
});

// ── batchUpdateTasks ───────────────────────────────────────────
describe("batchUpdateTasks", () => {
  const singleUpdate = [
    {
      id: "abc-123",
      startTime: "2025-01-15T11:00:00Z",
      endTime: "2025-01-15T12:00:00Z",
      durationMinutes: 60,
      deadline: "2025-01-20",
      aiJustification: "moved to afternoon",
      aiContext: "better energy",
    },
  ];

  it("updates each task with snake_case fields", async () => {
    const { update, eqId, select, single } = mockBatchChain();

    await batchUpdateTasks(singleUpdate);

    expect(supabase.from).toHaveBeenCalledWith("tasks");
    expect(update).toHaveBeenCalledWith({
      start_time: "2025-01-15T11:00:00Z",
      end_time: "2025-01-15T12:00:00Z",
      duration_minutes: 60,
      deadline: "2025-01-20",
      ai_justification: "moved to afternoon",
      ai_context: "better energy",
    });
    expect(eqId).toHaveBeenCalledWith("id", "abc-123");
    expect(select).toHaveBeenCalled();
    expect(single).toHaveBeenCalled();
  });

  it("returns mapped Task[]", async () => {
    mockBatchChain();
    const result = await batchUpdateTasks(singleUpdate);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: "abc-123", userId: "user-1", name: "Test Task" });
  });

  it("handles empty array without calling supabase", async () => {
    const result = await batchUpdateTasks([]);
    expect(result).toEqual([]);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("throws on error and stops", async () => {
    const chain = mockBatchChain();
    chain.setResult(0, dbRow, null);
    chain.setResult(1, null, { message: "Update failed" });

    const twoUpdates = [
      ...singleUpdate,
      {
        id: "def-456",
        startTime: "2025-01-15T14:00:00Z",
        endTime: "2025-01-15T15:00:00Z",
        durationMinutes: 60,
        deadline: null,
        aiJustification: "j2",
        aiContext: "c2",
      },
    ];

    await expect(batchUpdateTasks(twoUpdates)).rejects.toThrow("Update failed");
  });

  it("processes multiple updates sequentially", async () => {
    const chain = mockBatchChain();
    const row1 = { ...dbRow, id: "id-1" };
    const row2 = { ...dbRow, id: "id-2" };
    chain.setResult(0, row1);
    chain.setResult(1, row2);

    const result = await batchUpdateTasks([
      {
        id: "id-1",
        startTime: "2025-01-15T11:00:00Z",
        endTime: "2025-01-15T12:00:00Z",
        durationMinutes: 60,
        deadline: null,
        aiJustification: "j1",
        aiContext: "c1",
      },
      {
        id: "id-2",
        startTime: "2025-01-15T13:00:00Z",
        endTime: "2025-01-15T14:00:00Z",
        durationMinutes: 60,
        deadline: "2025-01-25",
        aiJustification: "j2",
        aiContext: "c2",
      },
    ]);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("id-1");
    expect(result[1].id).toBe("id-2");
    expect(chain.update).toHaveBeenCalledTimes(2);
  });
});
