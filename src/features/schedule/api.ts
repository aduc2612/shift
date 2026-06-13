import { supabase } from "@/services/supabase";
import type { Task } from "@/types/task";

function getStartOfDay(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function getEndOfDay(date: Date): string {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

export async function fetchTasks(date: Date): Promise<Task[]> {
  const startOfDay = getStartOfDay(date);
  const endOfDay = getEndOfDay(date);

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .gte("start_time", startOfDay)
    .lte("start_time", endOfDay)
    .order("start_time", { ascending: true });

  if (error) throw new Error(error.message);

  return mapTasks(data ?? []);
}

export async function createTask(
  task: Partial<Task>,
): Promise<Task> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: user.id,
      name: task.name,
      start_time: task.startTime ?? null,
      end_time: task.endTime ?? null,
      duration_minutes: task.durationMinutes ?? 0,
      deadline: task.deadline ?? null,
      completed: task.completed ?? false,
      ai_context: task.aiContext ?? null,
      ai_decides_time: task.aiDecidesTime ?? false,
      ai_justification: task.aiJustification ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapTask(data);
}

export async function updateTask(
  id: string,
  updates: Partial<Task>,
): Promise<Task> {
  const dbUpdates: Record<string, unknown> = {};

  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.startTime !== undefined) dbUpdates.start_time = updates.startTime;
  if (updates.endTime !== undefined) dbUpdates.end_time = updates.endTime;
  if (updates.durationMinutes !== undefined)
    dbUpdates.duration_minutes = updates.durationMinutes;
  if (updates.deadline !== undefined) dbUpdates.deadline = updates.deadline;
  if (updates.completed !== undefined) dbUpdates.completed = updates.completed;
  if (updates.aiContext !== undefined) dbUpdates.ai_context = updates.aiContext;
  if (updates.aiDecidesTime !== undefined)
    dbUpdates.ai_decides_time = updates.aiDecidesTime;
  if (updates.aiJustification !== undefined)
    dbUpdates.ai_justification = updates.aiJustification;

  const { data, error } = await supabase
    .from("tasks")
    .update(dbUpdates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapTask(data);
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function toggleTaskComplete(
  id: string,
  completed: boolean,
): Promise<Task> {
  const { data, error } = await supabase
    .from("tasks")
    .update({ completed })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapTask(data);
}

function mapTask(data: Record<string, unknown>): Task {
  return {
    id: data.id as string,
    userId: data.user_id as string,
    name: data.name as string,
    startTime: data.start_time as string,
    endTime: data.end_time as string,
    durationMinutes: data.duration_minutes as number,
    deadline: data.deadline as string | null,
    completed: data.completed as boolean,
    aiContext: data.ai_context as string | null,
    aiDecidesTime: data.ai_decides_time as boolean,
    aiJustification: data.ai_justification as string | null,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

function mapTasks(data: Record<string, unknown>[]): Task[] {
  return data.map(mapTask);
}
