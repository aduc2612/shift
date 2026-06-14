import { useEffect } from 'react';
import { onNotificationTapped } from '@/services/notifications';

/**
 * Listens for notification taps. Since schedule screen is the default tab,
 * just opening the app is sufficient — no deep linking needed.
 */
export function useNotificationTapListener() {
  useEffect(() => {
    const subscription = onNotificationTapped(() => {
      // Schedule screen is the default tab — opening the app is sufficient
    });
    return () => subscription.remove();
  }, []);
}
