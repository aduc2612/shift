/**
 * Apply opacity to a 6-digit hex color string.
 * Example: withOpacity('#FFFFFF', 0.1) → '#FFFFFF1A'
 */
export function withOpacity(hex: string, opacity: number): string {
  const clamped = Math.min(1, Math.max(0, opacity));
  const alpha = Math.round(clamped * 255)
    .toString(16)
    .padStart(2, '0');
  return hex + alpha;
}
