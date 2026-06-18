import type { UserPreferences } from '@/types/userPreferences';

export function buildSystemPrompt(prefs: UserPreferences): string {
  if (!prefs.onboardingCompleted) return '';

  const lines: string[] = [];

  if (prefs.wakeUpTime) {
    const sleep = prefs.sleepTime ?? '23:00';
    lines.push(`Alertness window: User is awake from ${prefs.wakeUpTime} to ${sleep}.`);
  }

  if (prefs.userContext?.trim()) {
    lines.push(prefs.userContext.trim());
  }

  return lines.join('\n');
}
