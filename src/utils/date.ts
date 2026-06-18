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
 * Parse a "HH:MM" string to hour and minute components.
 * Defaults to 07:00 if invalid or out of range.
 */
export function parseHHMM(value: string): { h: number; m: number } {
  const [h, m] = value.split(":").map((n) => parseInt(n, 10));
  const validH = Number.isFinite(h) && h >= 0 && h <= 23;
  const validM = Number.isFinite(m) && m >= 0 && m <= 59;
  return { h: validH ? h : 7, m: validM ? m : 0 };
}

/**
 * Format hour/minute to 12h display like "8:00 AM"
 */
export function formatTime12h(hour: number, minute: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${minute.toString().padStart(2, "0")} ${period}`;
}

/**
 * Convert hour/minute to "HH:MM" string for DB storage
 */
export function toHHMM(hour: number, minute: number): string {
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}

/**
 * Create a Date object at a specific hour/minute (for pickers)
 */
export function pickerDate(hour: number, minute: number): Date {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
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

/**
 * Parse a YYYY-MM-DD string as a local date (not UTC).
 * ISO date strings without time are parsed as UTC by `new Date()`,
 * causing off-by-one-day errors in negative UTC offsets.
 */
export function parseLocalDate(dateStr: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(dateStr);
}

/**
 * Format a date to readable string like "Jun 12, 2026"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseLocalDate(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
