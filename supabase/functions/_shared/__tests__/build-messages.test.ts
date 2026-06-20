/**
 * Tests for the shared prompt-assembly logic.
 *
 * This covers the full messages[] array construction that was previously
 * inline in both handlers and completely untested.
 */
import {
  buildMessages,
  fillSystemPromptTemplate,
  resolveTimezone,
  type BuildMessagesInputs,
  type UserPreferences,
} from "../build-messages";

// Fixed date for deterministic tests: 2025-06-10 Tuesday 14:30 UTC
const FIXED_NOW = new Date("2025-06-10T14:30:00Z");

const SAMPLE_PREFS: UserPreferences = {
  userId: "user-1",
  wakeUpTime: "07:00",
  sleepTime: "23:00",
  userContext: "I'm a software engineer",
  onboardingCompleted: true,
};

const SYSTEM_PROMPT_TEMPLATE =
  "You are a scheduling AI. Current time: {now}. Local: {nowLocal}. Day: {dayOfWeek}. Weekend: {isWeekend}. TZ: {timezone}.";

// --- resolveTimezone ---

describe("resolveTimezone", () => {
  it("returns UTC info for UTC timezone", () => {
    const result = resolveTimezone("UTC", FIXED_NOW);
    expect(result.nowUTC).toContain("UTC");
    expect(result.dayOfWeek).toBe("Tuesday");
    expect(result.isWeekend).toBe(false);
    // Node.js formats the offset as "GMT+0" for UTC
    expect(result.tzDisplay).toContain("UTC");
    expect(result.tzDisplay).toContain("(");
  });

  it("detects weekend correctly", () => {
    // 2025-06-14 is a Saturday
    const saturday = new Date("2025-06-14T12:00:00Z");
    const result = resolveTimezone("UTC", saturday);
    expect(result.dayOfWeek).toBe("Saturday");
    expect(result.isWeekend).toBe(true);
  });

  it("detects Sunday as weekend", () => {
    const sunday = new Date("2025-06-15T12:00:00Z");
    const result = resolveTimezone("UTC", sunday);
    expect(result.dayOfWeek).toBe("Sunday");
    expect(result.isWeekend).toBe(true);
  });

  it("detects weekday correctly", () => {
    // 2025-06-10 is Tuesday
    const result = resolveTimezone("UTC", FIXED_NOW);
    expect(result.isWeekend).toBe(false);
  });

  it("includes timezone name in display", () => {
    const result = resolveTimezone("America/New_York", FIXED_NOW);
    expect(result.tzDisplay).toContain("America/New_York");
    // Should contain an offset indicator (GMT or UTC)
    expect(result.tzDisplay).toMatch(/\(GMT|UTC/);
  });
});

// --- fillSystemPromptTemplate ---

describe("fillSystemPromptTemplate", () => {
  it("replaces all placeholders", () => {
    const result = fillSystemPromptTemplate(
      SYSTEM_PROMPT_TEMPLATE,
      FIXED_NOW,
      "UTC",
    );
    expect(result).not.toContain("{now}");
    expect(result).not.toContain("{nowLocal}");
    expect(result).not.toContain("{dayOfWeek}");
    expect(result).not.toContain("{isWeekend}");
    expect(result).not.toContain("{timezone}");
  });

  it("inserts correct day of week", () => {
    const result = fillSystemPromptTemplate(
      "Day: {dayOfWeek}",
      FIXED_NOW,
      "UTC",
    );
    expect(result).toBe("Day: Tuesday");
  });

  it("inserts 'No' for weekday", () => {
    const result = fillSystemPromptTemplate(
      "Weekend: {isWeekend}",
      FIXED_NOW,
      "UTC",
    );
    expect(result).toBe("Weekend: No");
  });

  it("inserts 'Yes' for weekend", () => {
    const saturday = new Date("2025-06-14T12:00:00Z");
    const result = fillSystemPromptTemplate(
      "Weekend: {isWeekend}",
      saturday,
      "UTC",
    );
    expect(result).toBe("Weekend: Yes");
  });

  it("inserts timezone display", () => {
    const result = fillSystemPromptTemplate(
      "TZ: {timezone}",
      FIXED_NOW,
      "UTC",
    );
    expect(result).toContain("TZ: UTC");
    expect(result).toContain("(");
  });

  it("handles template with no placeholders", () => {
    const result = fillSystemPromptTemplate(
      "No placeholders here.",
      FIXED_NOW,
      "UTC",
    );
    expect(result).toBe("No placeholders here.");
  });
});

// --- buildMessages: place-task mode ---

describe("buildMessages (place-task)", () => {
  const baseInputs: BuildMessagesInputs = {
    mode: "place-task",
    systemPromptTemplate: SYSTEM_PROMPT_TEMPLATE,
    now: FIXED_NOW,
    timezone: "UTC",
    prefs: null,
    task: {
      id: "task-1",
      name: "Write report",
      deadline: "2025-06-11",
      aiContext: "High focus needed",
    },
    existingTasks: [
      {
        id: "task-0",
        name: "Morning standup",
        startTime: "2025-06-10T09:00:00",
        endTime: "2025-06-10T09:15:00",
      },
    ],
    userContext: "I work best in the morning",
    whatChanged: "Adding a new task",
  };

  it("returns exactly 2 messages (system + user)", () => {
    const messages = buildMessages(baseInputs);
    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe("system");
    expect(messages[1].role).toBe("user");
  });

  it("system message contains filled template", () => {
    const messages = buildMessages(baseInputs);
    expect(messages[0].content).toContain("Tuesday");
    expect(messages[0].content).not.toContain("{now}");
  });

  it("system message includes user preferences when provided", () => {
    const messages = buildMessages({ ...baseInputs, prefs: SAMPLE_PREFS });
    expect(messages[0].content).toContain("User preferences (from onboarding):");
    expect(messages[0].content).toContain("Alertness window");
    expect(messages[0].content).toContain("software engineer");
  });

  it("system message omits preferences section when prefs is null", () => {
    const messages = buildMessages(baseInputs);
    expect(messages[0].content).not.toContain("User preferences (from onboarding):");
  });

  it("system message omits prefs when onboarding not completed", () => {
    const messages = buildMessages({
      ...baseInputs,
      prefs: { ...SAMPLE_PREFS, onboardingCompleted: false },
    });
    expect(messages[0].content).not.toContain("User preferences");
  });

  it("user message contains new task info", () => {
    const messages = buildMessages(baseInputs);
    const userMsg = messages[1].content;
    expect(userMsg).toContain("New task to place:");
    expect(userMsg).toContain("Write report");
    expect(userMsg).toContain("task-1");
    expect(userMsg).toContain("2025-06-11");
  });

  it("user message includes AI instructions section when aiContext present", () => {
    const messages = buildMessages(baseInputs);
    const userMsg = messages[1].content;
    expect(userMsg).toContain("USER'S DIRECT INSTRUCTIONS FOR THIS TASK (HIGHEST PRIORITY):");
    expect(userMsg).toContain("High focus needed");
  });

  it("user message omits AI instructions section when aiContext is null", () => {
    const messages = buildMessages({
      ...baseInputs,
      task: { ...baseInputs.task, aiContext: null },
    });
    const userMsg = messages[1].content;
    expect(userMsg).not.toContain("USER'S DIRECT INSTRUCTIONS");
  });

  it("user message includes existing tasks as read-only", () => {
    const messages = buildMessages(baseInputs);
    const userMsg = messages[1].content;
    expect(userMsg).toContain("READ-ONLY — do not modify");
    expect(userMsg).toContain("Morning standup");
    expect(userMsg).toContain("task-0");
    expect(userMsg).toContain("2025-06-10T09:00:00");
  });

  it("user message includes user context", () => {
    const messages = buildMessages(baseInputs);
    expect(messages[1].content).toContain("I work best in the morning");
  });

  it("user message defaults context to 'None provided'", () => {
    const messages = buildMessages({
      ...baseInputs,
      userContext: undefined,
    });
    expect(messages[1].content).toContain("User context: None provided");
  });

  it("user message defaults whatChanged to 'Adding a new task'", () => {
    const messages = buildMessages({
      ...baseInputs,
      whatChanged: undefined,
    });
    expect(messages[1].content).toContain("What changed: Adding a new task");
  });

  it("user message strips durationMinutes from existing tasks", () => {
    const messages = buildMessages(baseInputs);
    expect(messages[1].content).not.toContain("durationMinutes");
  });

  it("user message handles empty existing tasks", () => {
    const messages = buildMessages({
      ...baseInputs,
      existingTasks: [],
    });
    expect(messages[1].content).toContain("Existing scheduled tasks");
    expect(messages[1].content).toContain("[]");
  });

  it("new task info only contains id, name, deadline, aiContext", () => {
    const messages = buildMessages(baseInputs);
    const userMsg = messages[1].content;
    const taskJsonMatch = userMsg.match(
      /New task to place:\n(\{[\s\S]*?\})\n\n/,
    );
    expect(taskJsonMatch).not.toBeNull();
    const taskObj = JSON.parse(taskJsonMatch![1]);
    expect(Object.keys(taskObj).sort()).toEqual(
      ["aiContext", "deadline", "id", "name"].sort(),
    );
  });
});

// --- buildMessages: reschedule mode ---

describe("buildMessages (reschedule)", () => {
  const baseInputs: BuildMessagesInputs = {
    mode: "reschedule",
    systemPromptTemplate: SYSTEM_PROMPT_TEMPLATE,
    now: FIXED_NOW,
    timezone: "UTC",
    prefs: null,
    tasks: [
      {
        id: "task-1",
        name: "Write report",
        startTime: "2025-06-10T10:00:00",
        endTime: "2025-06-10T11:00:00",
        deadline: "2025-06-11",
        aiContext: "Deep work task",
      },
      {
        id: "task-2",
        name: "Lunch",
        startTime: "2025-06-10T12:00:00",
        endTime: "2025-06-10T13:00:00",
      },
    ],
    userContext: "Flexible schedule",
    whatChanged: "Missed morning meeting",
  };

  it("returns exactly 2 messages", () => {
    const messages = buildMessages(baseInputs);
    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe("system");
    expect(messages[1].role).toBe("user");
  });

  it("user message contains all tasks", () => {
    const messages = buildMessages(baseInputs);
    const userMsg = messages[1].content;
    expect(userMsg).toContain("Write report");
    expect(userMsg).toContain("Lunch");
    expect(userMsg).toContain("task-1");
    expect(userMsg).toContain("task-2");
  });

  it("user message uses mutable schedule framing", () => {
    const messages = buildMessages(baseInputs);
    expect(messages[1].content).toContain("all fields except id and name are mutable");
  });

  it("user message includes aiContext when present", () => {
    const messages = buildMessages(baseInputs);
    expect(messages[1].content).toContain("Deep work task");
  });

  it("user message includes user context", () => {
    const messages = buildMessages(baseInputs);
    expect(messages[1].content).toContain("Flexible schedule");
  });

  it("user message includes whatChanged", () => {
    const messages = buildMessages(baseInputs);
    expect(messages[1].content).toContain("Missed morning meeting");
  });

  it("user message defaults whatChanged to 'Initial scheduling'", () => {
    const messages = buildMessages({
      ...baseInputs,
      whatChanged: undefined,
    });
    expect(messages[1].content).toContain("What changed: Initial scheduling");
  });

  it("user message defaults context to 'None provided'", () => {
    const messages = buildMessages({
      ...baseInputs,
      userContext: undefined,
    });
    expect(messages[1].content).toContain("User context: None provided");
  });

  it("stripped tasks include deadline and aiContext fields", () => {
    const messages = buildMessages(baseInputs);
    const userMsg = messages[1].content;
    const jsonMatch = userMsg.match(
      /current schedule[\s\S]*?(\[[\s\S]*?\])\n\n/,
    );
    expect(jsonMatch).not.toBeNull();
    const tasksArr = JSON.parse(jsonMatch![1]);
    expect(tasksArr[0]).toEqual({
      id: "task-1",
      name: "Write report",
      startTime: "2025-06-10T10:00:00",
      endTime: "2025-06-10T11:00:00",
      deadline: "2025-06-11",
      aiContext: "Deep work task",
    });
  });

  it("stripped tasks default missing deadline/aiContext to null", () => {
    const messages = buildMessages(baseInputs);
    const userMsg = messages[1].content;
    const jsonMatch = userMsg.match(
      /current schedule[\s\S]*?(\[[\s\S]*?\])\n\n/,
    );
    const tasksArr = JSON.parse(jsonMatch![1]);
    // Second task has no deadline or aiContext
    expect(tasksArr[1].deadline).toBeNull();
    expect(tasksArr[1].aiContext).toBeNull();
  });

  it("stripped tasks do not include durationMinutes, completed, createdAt, updatedAt", () => {
    const messages = buildMessages(baseInputs);
    const userMsg = messages[1].content;
    expect(userMsg).not.toContain("durationMinutes");
    expect(userMsg).not.toContain("completed");
    expect(userMsg).not.toContain("createdAt");
    expect(userMsg).not.toContain("updatedAt");
  });

  it("system message includes preferences when provided", () => {
    const messages = buildMessages({ ...baseInputs, prefs: SAMPLE_PREFS });
    expect(messages[0].content).toContain("User preferences (from onboarding):");
    expect(messages[0].content).toContain("Alertness window");
  });

  it("works with single task", () => {
    const messages = buildMessages({
      ...baseInputs,
      tasks: [baseInputs.tasks[0]],
    });
    const userMsg = messages[1].content;
    expect(userMsg).toContain("Write report");
    expect(userMsg).not.toContain("Lunch");
  });
});

// --- Edge cases ---

describe("buildMessages edge cases", () => {
  it("handles empty string userContext in prefs", () => {
    const messages = buildMessages({
      mode: "reschedule",
      systemPromptTemplate: SYSTEM_PROMPT_TEMPLATE,
      now: FIXED_NOW,
      timezone: "UTC",
      prefs: {
        userId: "user-1",
        wakeUpTime: "07:00",
        sleepTime: "23:00",
        userContext: "",
        onboardingCompleted: true,
      },
      tasks: [],
      userContext: "",
      whatChanged: "",
    });
    // Should still produce valid messages
    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe("system");
    expect(messages[1].role).toBe("user");
  });

  it("handles very long task list in reschedule", () => {
    const tasks = Array.from({ length: 50 }, (_, i) => ({
      id: `task-${i}`,
      name: `Task ${i}`,
      startTime: `2025-06-10T${String(8 + (i % 12)).padStart(2, "0")}:00:00`,
      endTime: `2025-06-10T${String(8 + (i % 12)).padStart(2, "0")}:30:00`,
    }));
    const messages = buildMessages({
      mode: "reschedule",
      systemPromptTemplate: SYSTEM_PROMPT_TEMPLATE,
      now: FIXED_NOW,
      timezone: "UTC",
      prefs: null,
      tasks,
    });
    expect(messages[1].content).toContain("Task 0");
    expect(messages[1].content).toContain("Task 49");
  });

  it("handles special characters in task name", () => {
    const messages = buildMessages({
      mode: "place-task",
      systemPromptTemplate: SYSTEM_PROMPT_TEMPLATE,
      now: FIXED_NOW,
      timezone: "UTC",
      prefs: null,
      task: {
        id: "task-1",
        name: 'Review "Q2" report & sign-off (final)',
        deadline: null,
      },
      existingTasks: [],
    });
    // JSON.stringify escapes quotes, so check for the escaped form
    expect(messages[1].content).toContain("Review");
    expect(messages[1].content).toContain("Q2");
    expect(messages[1].content).toContain("sign-off");
  });

  it("preserves aiContext exactly for place-task", () => {
    const longContext = "This is a very detailed instruction ".repeat(10);
    const messages = buildMessages({
      mode: "place-task",
      systemPromptTemplate: SYSTEM_PROMPT_TEMPLATE,
      now: FIXED_NOW,
      timezone: "UTC",
      prefs: null,
      task: {
        id: "task-1",
        name: "Work task",
        aiContext: longContext,
      },
      existingTasks: [],
    });
    expect(messages[1].content).toContain(longContext);
  });
});
