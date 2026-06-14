import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { syncNotifications } from '@/services/notifications';
import type { Task } from '@/types/task';

/**
 * Observes the TanStack Query cache for task data changes
 * and calls syncNotifications whenever tasks are refetched.
 * Aggregates ALL cached task entries (multiple dates) into
 * one sync call. Serializes syncs to prevent race conditions.
 */
export function useSyncNotifications() {
  const queryClient = useQueryClient();
  const currentSync = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    // Aggregate all cached task data across all date keys
    function getAllCachedTasks(): Task[] {
      const allQueries = queryClient.getQueryCache().getAll();
      const tasks: Task[] = [];
      for (const query of allQueries) {
        if (query.queryKey[0] === 'tasks') {
          const data = query.state.data as Task[] | undefined;
          if (Array.isArray(data)) {
            tasks.push(...data);
          }
        }
      }
      return tasks;
    }

    // Chain sync after the previous one to prevent concurrency
    function chainSync(tasks: Task[]) {
      currentSync.current = currentSync.current
        .catch(() => {})
        .then(() => syncNotifications(tasks))
        .catch((err: unknown) => {
          console.error('Failed to sync notifications:', err);
        });
    }

    // Sync from existing cache on mount
    const existing = getAllCachedTasks();
    if (existing.length > 0) {
      chainSync(existing);
    }

    // Subscribe to future cache changes
    const unsubscribe = queryClient.getQueryCache().subscribe(() => {
      const tasks = getAllCachedTasks();
      if (tasks.length > 0) {
        chainSync(tasks);
      }
    });

    return unsubscribe;
  }, [queryClient]);
}
