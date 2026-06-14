import { supabase } from '@/services/supabase';
import type { Task } from '@/types/task';

export type RescheduleResult = {
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
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL');

  const response = await fetch(`${supabaseUrl}/functions/v1/reschedule`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      tasks: tasks.map(t => ({
        id: t.id,
        name: t.name,
        startTime: t.startTime,
        endTime: t.endTime,
        durationMinutes: t.durationMinutes,
        deadline: t.deadline,
        aiContext: t.aiContext,
        aiDecidesTime: t.aiDecidesTime,
      })),
      userContext,
      whatChanged,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Reschedule failed: ${error}`);
  }

  const result = await response.json();
  if (!Array.isArray(result.tasks)) {
    throw new Error('Invalid response: tasks is not an array');
  }
  return result.tasks as RescheduleResult[];
}
