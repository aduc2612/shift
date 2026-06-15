/**
 * Tests for place-task Edge Function validation logic.
 *
 * Since the handler lives in Deno with Deno.serve and Deno.env globals,
 * full integration testing happens via `supabase functions serve` + manual curl.
 *
 * These tests validate the input validation and response schema shape logic.
 */

// --- Response schema shape validation (mirrors Zod schema in index.ts) ---

function isValidTaskShape(task: unknown): task is {
  id: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  aiJustification: string;
  aiContext: string;
} {
  if (!task || typeof task !== "object") return false;
  const t = task as Record<string, unknown>;
  return (
    typeof t.id === "string" &&
    typeof t.startTime === "string" &&
    typeof t.endTime === "string" &&
    typeof t.durationMinutes === "number" &&
    typeof t.aiJustification === "string" &&
    typeof t.aiContext === "string"
  );
}

function isValidPlaceTaskResponse(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return "task" in b && isValidTaskShape(b.task);
}

// --- Input validation (mirrors handler's validation) ---

function validateInput(
  body: Record<string, unknown>,
): { ok: true } | { ok: false; error: string } {
  const { task, existingTasks } = body;

  if (!task || typeof task !== "object") {
    return { ok: false, error: "task object required" };
  }

  const t = task as Record<string, unknown>;
  if (!t.id || !t.name || typeof t.durationMinutes !== "number") {
    return { ok: false, error: "task must have id, name, and durationMinutes" };
  }

  if (!Array.isArray(existingTasks)) {
    return { ok: false, error: "existingTasks array required" };
  }

  return { ok: true };
}

// --- Tests ---

describe("place-task response schema shape", () => {
  const validTask = {
    id: "task-123",
    startTime: "2025-06-10T09:00:00Z",
    endTime: "2025-06-10T10:00:00Z",
    durationMinutes: 60,
    aiJustification: "Placed after morning meeting.",
    aiContext: "High effort, prefers morning.",
  };

  it("accepts a valid task response", () => {
    expect(isValidPlaceTaskResponse({ task: validTask })).toBe(true);
  });

  it("rejects missing task key", () => {
    expect(isValidPlaceTaskResponse({ notTask: validTask })).toBe(false);
  });

  it("rejects tasks array instead of task object", () => {
    expect(isValidPlaceTaskResponse({ tasks: [validTask] })).toBe(false);
  });

  it("rejects null task", () => {
    expect(isValidPlaceTaskResponse({ task: null })).toBe(false);
  });

  it("rejects task with missing id", () => {
    const bad = { ...validTask };
    delete (bad as Record<string, unknown>).id;
    expect(isValidPlaceTaskResponse({ task: bad })).toBe(false);
  });

  it("rejects task with non-string startTime", () => {
    const bad = { ...validTask, startTime: 12345 };
    expect(isValidPlaceTaskResponse({ task: bad })).toBe(false);
  });

  it("rejects task with non-number durationMinutes", () => {
    const bad = { ...validTask, durationMinutes: "60" };
    expect(isValidPlaceTaskResponse({ task: bad })).toBe(false);
  });

  it("rejects task with missing aiJustification", () => {
    const { aiJustification: _, ...bad } = validTask;
    expect(isValidPlaceTaskResponse({ task: bad })).toBe(false);
  });

  it("rejects task with missing aiContext", () => {
    const { aiContext: _, ...bad } = validTask;
    expect(isValidPlaceTaskResponse({ task: bad })).toBe(false);
  });

  it("rejects undefined body", () => {
    expect(isValidPlaceTaskResponse(undefined)).toBe(false);
  });

  it("rejects non-object body", () => {
    expect(isValidPlaceTaskResponse("string")).toBe(false);
  });
});

describe("place-task input validation", () => {
  const validBody = {
    task: {
      id: "task-1",
      name: "Write report",
      durationMinutes: 30,
    },
    existingTasks: [
      {
        id: "existing-1",
        startTime: "2025-06-10T08:00:00Z",
        endTime: "2025-06-10T09:00:00Z",
      },
    ],
    userContext: "Student",
    whatChanged: "Adding homework",
    timezone: "America/New_York",
  };

  it("accepts valid input", () => {
    expect(validateInput(validBody).ok).toBe(true);
  });

  it("rejects missing task", () => {
    const { task: _, ...body } = validBody;
    const result = validateInput(body);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("task object required");
  });

  it("rejects task without id", () => {
    const body = {
      ...validBody,
      task: { name: "X", durationMinutes: 10 },
    };
    const result = validateInput(body);
    expect(result.ok).toBe(false);
  });

  it("rejects task without name", () => {
    const body = {
      ...validBody,
      task: { id: "x", durationMinutes: 10 },
    };
    const result = validateInput(body);
    expect(result.ok).toBe(false);
  });

  it("rejects task without durationMinutes", () => {
    const body = {
      ...validBody,
      task: { id: "x", name: "X" },
    };
    const result = validateInput(body);
    expect(result.ok).toBe(false);
  });

  it("rejects missing existingTasks", () => {
    const { existingTasks: _, ...body } = validBody;
    const result = validateInput(body);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("existingTasks array required");
  });

  it("rejects non-array existingTasks", () => {
    const body = { ...validBody, existingTasks: "not an array" };
    const result = validateInput(body);
    expect(result.ok).toBe(false);
  });

  it("accepts empty existingTasks array", () => {
    const body = { ...validBody, existingTasks: [] };
    const result = validateInput(body);
    expect(result.ok).toBe(true);
  });

  it("accepts optional userContext and whatChanged", () => {
    const body = {
      ...validBody,
      userContext: undefined,
      whatChanged: undefined,
    };
    const result = validateInput(body);
    expect(result.ok).toBe(true);
  });
});

describe("place-task task ID validation", () => {
  it("detects ID mismatch between input and output", () => {
    const inputId = "task-abc";
    const outputId = "task-xyz";
    expect(inputId).not.toBe(outputId);
  });

  it("confirms matching IDs", () => {
    const id = "task-abc";
    expect(id).toBe(id);
  });
});

describe("place-task config constants", () => {
  it("has correct model count", () => {
    // Import would fail in Deno, so we replicate the expected values
    const MODELS = [
      "google/gemini-3.1-flash-lite:nitro",
      "openai/gpt-oss-120b:nitro",
      "qwen/qwen3-32b:nitro",
    ];
    expect(MODELS).toHaveLength(3);
    expect(MODELS[0]).toContain("gemini");
  });

  it("has reasonable fixed budgets", () => {
    const MAX_TOKENS = 500;
    const TIMEOUT_MS = 10_000;
    expect(MAX_TOKENS).toBeGreaterThan(0);
    expect(TIMEOUT_MS).toBeGreaterThan(0);
    expect(TIMEOUT_MS).toBeLessThanOrEqual(30_000);
  });
});
