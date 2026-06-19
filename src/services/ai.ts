import { supabase } from "@/services/supabase";
import type { Task } from "@/types/task";

const RESCHEDULE_TIMEOUT_MS = 90_000;
const PLACE_TASK_TIMEOUT_MS = 30_000;

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (e) {
    if (controller.signal.aborted) {
      throw new Error("Request timed out. Please try again.");
    }
    if (e instanceof TypeError) {
      throw new Error("Network error. Check your connection and try again.");
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export type RescheduleResult = {
  id: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  aiJustification: string;
  aiContext: string;
};

export type PlaceTaskResult = {
  id: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  aiJustification: string;
  aiContext: string;
};

export async function rescheduleTasks(
  tasks: Task[],
  userContext: string,
  whatChanged: string,
): Promise<RescheduleResult[]> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) throw new Error("Missing EXPO_PUBLIC_SUPABASE_URL");

  const response = await fetchWithTimeout(`${supabaseUrl}/functions/v1/reschedule`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      tasks: tasks.map((t) => ({
        id: t.id,
        name: t.name,
        startTime: t.startTime,
        endTime: t.endTime,
        deadline: t.deadline,
        aiDecidesTime: t.aiDecidesTime,
      })),
      userContext,
      whatChanged,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }),
  },
  RESCHEDULE_TIMEOUT_MS,
  );

  if (!response.ok) {
    throw new Error("Reschedule failed. Please try again.");
  }

  const result = await response.json();
  if (!Array.isArray(result.tasks)) {
    throw new Error("Invalid response: tasks is not an array");
  }
  return result.tasks as RescheduleResult[];
}

export async function placeTask(
  task: {
    id: string;
    name: string;
    durationMinutes: number;
    deadline: string | null;
    aiContext: string | null;
  },
  existingTasks: {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
  }[],
  userContext: string,
  whatChanged: string,
): Promise<PlaceTaskResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) throw new Error("Missing EXPO_PUBLIC_SUPABASE_URL");

  const response = await fetchWithTimeout(`${supabaseUrl}/functions/v1/place-task`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      task,
      existingTasks,
      userContext,
      whatChanged,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }),
  },
  PLACE_TASK_TIMEOUT_MS,
  );

  if (!response.ok) {
    throw new Error("Couldn't schedule task. Please try again.");
  }

  const result = await response.json();
  if (!result.task) {
    throw new Error("Invalid response: missing task");
  }
  return result.task as PlaceTaskResult;
}
