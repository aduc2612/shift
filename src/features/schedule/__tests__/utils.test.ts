import { getTaskState, buildScheduleData } from "@/features/schedule/utils";
import type { Task } from "@/types/task";

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "1",
    userId: "u1",
    name: "Test Task",
    startTime: "2026-06-12T08:00:00",
    endTime: "2026-06-12T09:00:00",
    durationMinutes: 60,
    deadline: null,
    completed: false,
    aiContext: null,
    aiDecidesTime: false,
    aiJustification: null,
    createdAt: "2026-06-12T00:00:00",
    updatedAt: "2026-06-12T00:00:00",
    ...overrides,
  };
}

describe("getTaskState", () => {
  it("returns 'done' when task is completed (even if time hasn't passed)", () => {
    const task = makeTask({
      completed: true,
      startTime: "2026-06-12T10:00:00",
      endTime: "2026-06-12T11:00:00",
    });
    expect(getTaskState(task, new Date("2026-06-12T08:00:00"))).toBe("done");
  });

  it("returns 'active' when now is between start and end", () => {
    const task = makeTask({
      startTime: "2026-06-12T10:00:00",
      endTime: "2026-06-12T11:00:00",
    });
    expect(getTaskState(task, new Date("2026-06-12T10:30:00"))).toBe("active");
  });

  it("returns 'active' at the exact start boundary", () => {
    const task = makeTask({
      startTime: "2026-06-12T10:00:00",
      endTime: "2026-06-12T11:00:00",
    });
    expect(getTaskState(task, new Date("2026-06-12T10:00:00"))).toBe("active");
  });

  it("returns 'upcoming' when now is before start", () => {
    const task = makeTask({
      startTime: "2026-06-12T11:00:00",
      endTime: "2026-06-12T12:00:00",
    });
    expect(getTaskState(task, new Date("2026-06-12T10:00:00"))).toBe(
      "upcoming",
    );
  });

  it("returns 'upcoming' when now is after end (no auto-completion)", () => {
    const task = makeTask({
      startTime: "2026-06-12T08:00:00",
      endTime: "2026-06-12T09:00:00",
    });
    expect(getTaskState(task, new Date("2026-06-12T10:00:00"))).toBe(
      "upcoming",
    );
  });
});

describe("buildScheduleData", () => {
  it("sorts tasks by startTime ascending", () => {
    const taskA = makeTask({
      id: "a",
      startTime: "2026-06-12T12:00:00",
      endTime: "2026-06-12T13:00:00",
    });
    const taskB = makeTask({
      id: "b",
      startTime: "2026-06-12T08:00:00",
      endTime: "2026-06-12T09:00:00",
    });
    const now = new Date("2026-06-12T10:00:00");
    const result = buildScheduleData([taskA, taskB], now);
    // taskB is passed (end 09:00 < 10:00), taskA is upcoming (start 12:00 > 10:00)
    // no active task, so now goes between them
    const ids = result.items.map((i) =>
      i.type === "task" ? i.task.id : "now",
    );
    expect(ids).toEqual(["b", "now", "a"]);
  });

  it("returns the first active task's id", () => {
    const taskA = makeTask({
      id: "a",
      startTime: "2026-06-12T10:00:00",
      endTime: "2026-06-12T11:00:00",
    });
    const taskB = makeTask({
      id: "b",
      startTime: "2026-06-12T10:30:00",
      endTime: "2026-06-12T11:30:00",
    });
    const result = buildScheduleData(
      [taskA, taskB],
      new Date("2026-06-12T10:45:00"),
    );
    expect(result.activeTaskId).toBe("a");
  });

  it("does not insert a standalone now row when an active task exists", () => {
    const taskActive = makeTask({
      id: "active",
      startTime: "2026-06-12T10:00:00",
      endTime: "2026-06-12T11:00:00",
    });
    const result = buildScheduleData(
      [taskActive],
      new Date("2026-06-12T10:30:00"),
    );
    const types = result.items.map((i) => i.type);
    expect(types).toEqual(["task"]);
  });

  it("inserts a now row between passed and upcoming tasks when no active task", () => {
    const taskPast = makeTask({
      id: "past",
      startTime: "2026-06-12T08:00:00",
      endTime: "2026-06-12T09:00:00",
    });
    const taskFuture = makeTask({
      id: "future",
      startTime: "2026-06-12T11:00:00",
      endTime: "2026-06-12T12:00:00",
    });
    const result = buildScheduleData(
      [taskPast, taskFuture],
      new Date("2026-06-12T10:00:00"),
    );
    const ids = result.items.map((i) =>
      i.type === "task" ? i.task.id : "now",
    );
    expect(ids).toEqual(["past", "now", "future"]);
  });

  it("returns a single now item when tasks array is empty", () => {
    const result = buildScheduleData([], new Date("2026-06-12T10:00:00"));
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toEqual({ type: "now" });
    expect(result.activeTaskId).toBeNull();
  });

  it("places now row at the end when all tasks are done", () => {
    const task1 = makeTask({
      id: "1",
      completed: true,
      startTime: "2026-06-12T08:00:00",
      endTime: "2026-06-12T09:00:00",
    });
    const task2 = makeTask({
      id: "2",
      completed: true,
      startTime: "2026-06-12T09:00:00",
      endTime: "2026-06-12T10:00:00",
    });
    const result = buildScheduleData(
      [task1, task2],
      new Date("2026-06-12T10:00:00"),
    );
    const ids = result.items.map((i) =>
      i.type === "task" ? i.task.id : "now",
    );
    expect(ids).toEqual(["1", "2", "now"]);
    expect(result.activeTaskId).toBeNull();
  });
});
