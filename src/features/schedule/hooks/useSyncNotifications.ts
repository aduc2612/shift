import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { syncNotifications } from '@/services/notifications';
import type { Task } from '@/types/task';

/**
 * Observes the TanStack Query cache for task data changes
 * and calls syncNotifications whenever tasks are refetched.
 * Also checks existing cache data on mount for tasks already loaded.
 */
export function useSyncNotifications() {
  const queryClient = useQueryClient();
  const hasSyncedInitial = useRef(false);

  useEffect(() => {
    // Check existing cache data on mount (catches tasks loaded before this hook)
    if (!hasSyncedInitial.current) {
      const allQueries = queryClient.getQueryCache().getAll();
      for (const query of allQueries) {
        if (query.queryKey[0] === 'tasks') {
          const data = query.state.data as Task[] | undefined;
          if (data && data.length > 0) {
            hasSyncedInitial.current = true;
            syncNotifications(data).catch((err) => {
              console.error('Failed to sync notifications:', err);
            });
            break;
          }
        }
      }
    }

    // Subscribe to future cache changes
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (
        (event.type === 'added' || event.type === 'updated') &&
        event.query.queryKey[0] === 'tasks'
      ) {
        const data = event.query.state.data as Task[] | undefined;
        if (data) {
          syncNotifications(data).catch((err) => {
            console.error('Failed to sync notifications:', err);
          });
        }
      }
    });

    return unsubscribe;
  }, [queryClient]);
}
