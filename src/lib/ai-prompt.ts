import type { UserPreferences } from '@/types/userPreferences';

function formatConstraints(prefs: UserPreferences): string {
  if (!prefs.hardConstraints || prefs.hardConstraints.length === 0) {
    return 'No prioritized tasks.';
  }
  if (prefs.hardConstraints.includes('none')) {
    return 'No prioritized tasks — full flexibility.';
  }
  const labelMap: Record<string, string> = {
    morning_routine: 'morning routine / gym',
    school: 'school or class schedule',
    work_hours: 'work hours',
    childcare: 'childcare or pickups',
    medical: 'medication or appointments',
  };
  return (
    'Prioritize these tasks: ' +
    prefs.hardConstraints.map((c) => labelMap[c] ?? c).join(', ') +
    '. Schedule these around their natural times when possible, but if the user explicitly asks to move them, you must comply.'
  );
}

export function buildSystemPrompt(prefs: UserPreferences): string {
  if (!prefs.onboardingCompleted) return '';

  const lines: string[] = [];

  // Persona
  if (prefs.persona && prefs.persona !== 'other') {
    const personaLabelMap: Record<string, string> = {
      student: 'Student',
      professional: 'Professional / office worker',
      parent: 'Parent managing a household',
      freelancer: 'Freelancer / self-employed',
      shift_worker: 'Shift worker or irregular hours',
    };
    lines.push(`User profile: ${personaLabelMap[prefs.persona] ?? prefs.persona}.`);
  }

  // Sleep/wake window
  if (prefs.wakeUpTime) {
    const sleep = prefs.sleepTime ?? '23:00';
    lines.push(`Alertness window: User is awake from ${prefs.wakeUpTime} to ${sleep}.`);
  }

  // Energy peak
  const peakLabelMap: Record<string, string> = {
    morning: 'morning (sharpest before noon)',
    afternoon: 'afternoon (midday stride)',
    evening: 'evening (comes alive after 5 PM)',
    varies: 'varies day to day',
  };
  lines.push(`Energy peak: ${peakLabelMap[prefs.productivityPeak] ?? prefs.productivityPeak}.`);

  // Hard constraints
  lines.push(formatConstraints(prefs));

  // Freeform context
  if (prefs.schedulingContext?.trim()) {
    lines.push(`Additional context from user: "${prefs.schedulingContext.trim()}"`);
  }

  return lines.join('\n');
}
