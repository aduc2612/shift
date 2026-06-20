import { buildSystemPrompt, type UserPreferences } from "./ai-prompt.ts";

export type { UserPreferences };

export interface Message {
  role: "system" | "user";
  content: string;
}

interface PlaceTaskInputs {
  mode: "place-task";
  systemPromptTemplate: string;
  now: Date;
  timezone: string;
  prefs: UserPreferences | null;
  task: {
    id: string;
    name: string;
    deadline?: string | null;
    aiContext?: string | null;
  };
  existingTasks: {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    deadline?: string | null;
  }[];
  userContext?: string;
  whatChanged?: string;
}

interface RescheduleInputs {
  mode: "reschedule";
  systemPromptTemplate: string;
  now: Date;
  timezone: string;
  prefs: UserPreferences | null;
  tasks: {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    deadline?: string | null;
    aiContext?: string | null;
  }[];
  userContext?: string;
  whatChanged?: string;
}

export type BuildMessagesInputs = PlaceTaskInputs | RescheduleInputs;

/**
 * Resolve timezone display string, e.g. "America/New_York (GMT-4)".
 * Pure — no I/O.
 */
export function resolveTimezone(
  tz: string,
  now: Date,
): { nowUTC: string; nowLocal: string; dayOfWeek: string; isWeekend: boolean; tzDisplay: string } {
  const nowUTC = now.toLocaleString("en-US", { timeZone: "UTC" }) + " UTC";
  const nowLocal = now.toLocaleString("en-US", { timeZone: tz });
  const dayOfWeek = now.toLocaleDateString("en-US", {
    timeZone: tz,
    weekday: "long",
  });
  const isWeekend = ["Saturday", "Sunday"].includes(dayOfWeek);
  const offset = now
    .toLocaleString("en-US", { timeZone: tz, timeZoneName: "shortOffset" })
    .split(" ")
    .pop();
  const tzDisplay = `${tz} (${offset})`;
  return { nowUTC, nowLocal, dayOfWeek, isWeekend, tzDisplay };
}

/**
 * Fill placeholders in the system prompt template.
 * Pure — no I/O.
 */
export function fillSystemPromptTemplate(
  template: string,
  now: Date,
  tz: string,
): string {
  const { nowUTC, nowLocal, dayOfWeek, isWeekend, tzDisplay } =
    resolveTimezone(tz, now);
  return template
    .replace("{now}", nowUTC)
    .replace("{nowLocal}", nowLocal)
    .replace("{dayOfWeek}", dayOfWeek)
    .replace("{isWeekend}", isWeekend ? "Yes" : "No")
    .replace("{timezone}", tzDisplay);
}

/**
 * Build the full messages[] array ready for the OpenAI chat completion.
 *
 * This is the single source of truth for how the system prompt, user
 * preferences fragment, task data, and user context are assembled into
 * the prompt sent to the AI.  Extracted from both handlers so it can be
 * tested in Jest (the handlers use Deno globals and can't be imported).
 *
 * Pure — no I/O, no Deno globals.
 */
export function buildMessages(inputs: BuildMessagesInputs): Message[] {
  // 1. Fill template placeholders
  let systemPrompt = fillSystemPromptTemplate(
    inputs.systemPromptTemplate,
    inputs.now,
    inputs.timezone,
  );

  // 2. Append user preferences fragment if available
  if (inputs.prefs) {
    const fragment = buildSystemPrompt(inputs.prefs);
    if (fragment) {
      systemPrompt = `${systemPrompt}\n\nUser preferences (from onboarding):\n${fragment}`;
    }
  }

  // 3. Build user message based on mode
  let userMessage: string;

  if (inputs.mode === "place-task") {
    const { task, existingTasks, userContext, whatChanged } = inputs;

    // Strip new task to fields the AI needs
    const newTaskInfo = {
      id: task.id,
      name: task.name,
      deadline: task.deadline || null,
      aiContext: task.aiContext || null,
    };

    // Strip existing tasks to read-only context
    const strippedExisting = existingTasks.map((t) => ({
      id: t.id,
      name: t.name,
      startTime: t.startTime,
      endTime: t.endTime,
      deadline: t.deadline || null,
    }));

    userMessage =
      `New task to place:\n${JSON.stringify(newTaskInfo, null, 2)}\n\n` +
      (task.aiContext
        ? `USER'S DIRECT INSTRUCTIONS FOR THIS TASK (HIGHEST PRIORITY):\n${task.aiContext}\n\n`
        : "") +
      `Existing scheduled tasks (READ-ONLY — do not modify):\n${JSON.stringify(strippedExisting, null, 2)}\n\n` +
      `User context: ${userContext || "None provided"}\n\n` +
      `What changed: ${whatChanged || "Adding a new task"}`;
  } else {
    // reschedule
    const { tasks, userContext, whatChanged } = inputs;

    const strippedTasks = tasks.map((t) => ({
      id: t.id,
      name: t.name,
      startTime: t.startTime,
      endTime: t.endTime,
      deadline: t.deadline || null,
      aiContext: t.aiContext || null,
    }));

    userMessage =
      `Tasks (current schedule — all fields except id and name are mutable):\n${JSON.stringify(strippedTasks, null, 2)}\n\n` +
      `User context: ${userContext || "None provided"}\n\n` +
      `What changed: ${whatChanged || "Initial scheduling"}`;
  }

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage },
  ];
}
