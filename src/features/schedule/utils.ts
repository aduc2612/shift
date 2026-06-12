import type { Task } from '@/types/task';

export type ListItem = { type: 'task'; task: Task } | { type: 'now' };

export type ScheduleData = {
  items: ListItem[];
  activeTaskId: string | null;
};

/**
 * Determine the visual state of a task.
 * `done` only when explicitly completed — time passing does NOT auto-complete.
 */
export function getTaskState(
  task: Task,
  now: Date,
): 'done' | 'active' | 'upcoming' {
  if (task.completed) return 'done';
  const start = new Date(task.startTime);
  const end = new Date(task.endTime);
  if (now >= start && now < end) return 'active';
  return 'upcoming';
}

/**
 * Build the FlatList data for the schedule screen.
 * Returns the list items and the ID of the first active task (if any).
 *
 * Now indicator placement:
 * - If an active task exists: embedded on its spine (showNow on TimelineRow)
 * - If no active task: standalone row between time-passed and upcoming tasks
 */
export function buildScheduleData(
  tasks: Task[],
  now: Date,
): ScheduleData {
  const sorted = [...tasks].sort(
    (a, b) =>
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );

  const items: ListItem[] = [];
  let activeTaskId: string | null = null;

  for (const task of sorted) {
    const state = getTaskState(task, now);

    if (state === 'active' && activeTaskId === null) {
      activeTaskId = task.id;
    }

    items.push({ type: 'task', task });
  }

  // If no active task, insert standalone now indicator
  // between tasks whose time has passed and upcoming tasks
  if (activeTaskId === null) {
    let insertIndex = 0;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type === 'task' && new Date(item.task.endTime) <= now) {
        insertIndex = i + 1;
      }
    }
    items.splice(insertIndex, 0, { type: 'now' });
  }

  return { items, activeTaskId };
}
