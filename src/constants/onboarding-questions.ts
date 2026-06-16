import {
  PERSONA_OPTIONS,
  PAIN_POINT_OPTIONS,
  HARD_CONSTRAINT_OPTIONS,
  PRODUCTIVITY_PEAK_OPTIONS,
} from '@/types/onboarding';

// Types already exports {value, label}[] — re-export directly
export { PERSONA_OPTIONS as personaOptions, PAIN_POINT_OPTIONS as painPointOptions, HARD_CONSTRAINT_OPTIONS as hardConstraintOptions, PRODUCTIVITY_PEAK_OPTIONS as productivityPeakOptions };

export const freeformPlaceholders = [
  'I have ADHD and lose focus fast',
  'I work night shifts 3x a week',
  "I can't focus after 4 PM",
  'I have school pickup at 3 PM',
];
