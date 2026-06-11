import type { Task } from '@/types';

/**
 * AI reschedule - calls Supabase Edge Function proxy.
 * Placeholder for Phase 6 implementation.
 */
export async function rescheduleTasks(
  _tasks: Task[],
  _userContext: string,
  _whatChanged: string,
): Promise<Partial<Task>[]> {
  // TODO: Implement in Phase 6
  return [];
}
