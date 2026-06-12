import { useEffect, useState } from 'react';

/**
 * Returns a Date that updates every `intervalMs` milliseconds.
 * Used to keep "now" indicators and active task detection live.
 */
export function useCurrentTime(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date());
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
