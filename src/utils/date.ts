/**
 * Format a Date or ISO string to 24h time "HH:MM"
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
}

/**
 * Format a start and end time range "8:00 – 9:30" (24h)
 */
export function formatTimeRange(start: string, end: string): string {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

/**
 * Format duration in minutes to concise string like "90m"
 */
export function formatDuration(minutes: number): string {
  return `${minutes}m`;
}

/**
 * Return "Today" if date is today, "Past" if before today, empty string if future
 */
export function formatRelativeDay(date: Date): string {
  if (isToday(date)) return 'Today';
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  if (date < startOfToday) return 'Past';
  return 'Future';
}

/**
 * Format full date like "Friday, Jun 12"
 */
export function formatFullDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Check if two dates are the same calendar day
 */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}
