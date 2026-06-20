/**
 * Tests for reschedule Edge Function validation logic.
 *
 * Since the handler lives in Deno with Deno.serve and Deno.env globals,
 * full integration testing happens via `supabase functions serve` + manual curl.
 *
 * These tests validate the response schema shape logic, including deadline format.
 */

import { MODELS, TOKENS_PER_TASK, TOKENS_BASE, MAX_TOKENS } from "../config";

// --- Response schema shape validation (mirrors Zod schema in index.ts) ---

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isValidTaskShape(task: unknown): task is {
  id: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  deadline: string | null;
  aiJustification: string;
  aiContext: string;
} {
  if (!task || typeof task !== "object") return false;
  const t = task as Record<string, unknown>;
  if (
    typeof t.id !== "string" ||
    typeof t.startTime !== "string" ||
    typeof t.endTime !== "string" ||
    typeof t.durationMinutes !== "number" ||
    typeof t.aiJustification !== "string" ||
    typeof t.aiContext !== "string"
  ) {
    return false;
  }
  // deadline must be null or a YYYY-MM-DD string
  if (t.deadline !== null && (typeof t.deadline !== "string" || !DATE_REGEX.test(t.deadline))) {
    return false;
  }
  return true;
}

function isValidRescheduleResponse(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  if (!("tasks" in b) || !Array.isArray(b.tasks)) return false;
  return b.tasks.every(isValidTaskShape);
}

// --- Input validation (mirrors handler's validation) ---

function validateInput(
  body: Record<string, unknown>,
): { ok: true } | { ok: false; error: string } {
  const { tasks } = body;

  if (!Array.isArray(tasks) || tasks.length === 0) {
    return { ok: false, error: "tasks array required" };
  }

  for (const task of tasks) {
    if (!task || typeof task !== "object") {
      return { ok: false, error: "each task must be an object" };
    }
    const t = task as Record<string, unknown>;
    if (!t.id || !t.name) {
      return { ok: false, error: "each task must have id and name" };
    }
  }

  return { ok: true };
}

// --- Tests ---

describe("reschedule response schema shape", () => {
  const validTask = {
    id: "task-123",
    startTime: "2025-06-10T09:00:00Z",
    endTime: "2025-06-10T10:00:00Z",
    durationMinutes: 60,
    deadline: null,
    aiJustification: "Moved to morning for better focus.",
    aiContext: "Deep work, high effort, flexible timing.",
  };

  it("accepts a valid response with tasks array", () => {
    expect(isValidRescheduleResponse({ tasks: [validTask] })).toBe(true);
  });

  it("accepts multiple tasks", () => {
    const task2 = { ...validTask, id: "task-456" };
    expect(isValidRescheduleResponse({ tasks: [validTask, task2] })).toBe(true);
  });

  it("accepts empty tasks array", () => {
    expect(isValidRescheduleResponse({ tasks: [] })).toBe(true);
  });

  it("rejects missing tasks key", () => {
    expect(isValidRescheduleResponse({ data: [validTask] })).toBe(false);
  });

  it("rejects tasks as object instead of array", () => {
    expect(isValidRescheduleResponse({ tasks: validTask })).toBe(false);
  });

  it("rejects null body", () => {
    expect(isValidRescheduleResponse(null)).toBe(false);
  });

  it("rejects undefined body", () => {
    expect(isValidRescheduleResponse(undefined)).toBe(false);
  });

  it("rejects task with missing id", () => {
    const { id: _, ...bad } = validTask;
    expect(isValidRescheduleResponse({ tasks: [bad] })).toBe(false);
  });

  it("rejects task with non-string startTime", () => {
    const bad = { ...validTask, startTime: 12345 };
    expect(isValidRescheduleResponse({ tasks: [bad] })).toBe(false);
  });

  it("rejects task with non-number durationMinutes", () => {
    const bad = { ...validTask, durationMinutes: "60" };
    expect(isValidRescheduleResponse({ tasks: [bad] })).toBe(false);
  });

  it("rejects task with missing aiJustification", () => {
    const { aiJustification: _, ...bad } = validTask;
    expect(isValidRescheduleResponse({ tasks: [bad] })).toBe(false);
  });

  it("rejects task with missing aiContext", () => {
    const { aiContext: _, ...bad } = validTask;
    expect(isValidRescheduleResponse({ tasks: [bad] })).toBe(false);
  });

  it("accepts task with valid YYYY-MM-DD deadline", () => {
    const task = { ...validTask, deadline: "2025-06-20" };
    expect(isValidRescheduleResponse({ tasks: [task] })).toBe(true);
  });

  it("accepts task with null deadline", () => {
    const task = { ...validTask, deadline: null };
    expect(isValidRescheduleResponse({ tasks: [task] })).toBe(true);
  });

  it("rejects task with invalid deadline format", () => {
    const task = { ...validTask, deadline: "tomorrow" };
    expect(isValidRescheduleResponse({ tasks: [task] })).toBe(false);
  });

  it("rejects task with ISO datetime as deadline", () => {
    const task = { ...validTask, deadline: "2025-06-20T00:00:00Z" };
    expect(isValidRescheduleResponse({ tasks: [task] })).toBe(false);
  });

  it("rejects task with missing deadline field", () => {
    const { deadline: _, ...bad } = validTask;
    expect(isValidRescheduleResponse({ tasks: [bad] })).toBe(false);
  });

  it("rejects if one task is invalid among valid tasks", () => {
    const bad = { ...validTask, id: "bad-task", deadline: "not-a-date" };
    expect(isValidRescheduleResponse({ tasks: [validTask, bad] })).toBe(false);
  });
});

describe("reschedule input validation", () => {
  const validBody = {
    tasks: [
      {
        id: "task-1",
        name: "Write report",
        startTime: "2025-06-10T09:00:00Z",
        endTime: "2025-06-10T10:00:00Z",
        durationMinutes: 60,
      },
    ],
    userContext: "Student",
    whatChanged: "Move report to afternoon",
    timezone: "America/New_York",
  };

  it("accepts valid input", () => {
    expect(validateInput(validBody).ok).toBe(true);
  });

  it("rejects missing tasks", () => {
    const { tasks: _, ...body } = validBody;
    const result = validateInput(body);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("tasks array required");
  });

  it("rejects empty tasks array", () => {
    const body = { ...validBody, tasks: [] };
    const result = validateInput(body);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("tasks array required");
  });

  it("rejects non-array tasks", () => {
    const body = { ...validBody, tasks: "not an array" };
    const result = validateInput(body);
    expect(result.ok).toBe(false);
  });

  it("rejects task without id", () => {
    const body = {
      ...validBody,
      tasks: [{ name: "X" }],
    };
    const result = validateInput(body);
    expect(result.ok).toBe(false);
  });

  it("rejects task without name", () => {
    const body = {
      ...validBody,
      tasks: [{ id: "x" }],
    };
    const result = validateInput(body);
    expect(result.ok).toBe(false);
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

describe("reschedule config constants", () => {
  it("has correct model count", () => {
    expect(MODELS).toHaveLength(3);
    expect(MODELS[0]).toContain("openai");
  });

  it("has reasonable token budgets", () => {
    expect(TOKENS_PER_TASK).toBeGreaterThan(0);
    expect(TOKENS_BASE).toBeGreaterThan(0);
    expect(MAX_TOKENS).toBeGreaterThan(0);
  });
});
