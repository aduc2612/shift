// String-literal union types for onboarding
export type Persona =
  | 'student'
  | 'professional'
  | 'parent'
  | 'freelancer'
  | 'shift_worker'
  | 'other';

export type PainPoint =
  | 'delay_collapse'
  | 'no_priorities'
  | 'afternoon_slump'
  | 'replan_too_much'
  | 'unfinished_guilt'
  | 'anxiety';

export type HardConstraint =
  | 'morning_routine'
  | 'school'
  | 'work_hours'
  | 'childcare'
  | 'medical'
  | 'none';

export type ProductivityPeak =
  | 'morning'
  | 'afternoon'
  | 'evening'
  | 'varies';

// Enum value arrays (used by UI components for rendering options)
export const PERSONA_OPTIONS: { value: Persona; label: string }[] = [
  { value: 'student', label: 'Student' },
  { value: 'professional', label: 'Professional / office worker' },
  { value: 'parent', label: 'Parent managing a household' },
  { value: 'freelancer', label: 'Freelancer / self-employed' },
  { value: 'shift_worker', label: 'Shift worker or irregular hours' },
  { value: 'other', label: 'Other' },
];

export const PAIN_POINT_OPTIONS: { value: PainPoint; label: string }[] = [
  { value: 'delay_collapse', label: 'One delay collapses my whole schedule' },
  { value: 'no_priorities', label: "I don't know what to tackle next" },
  { value: 'afternoon_slump', label: 'I start strong but lose steam in the afternoon' },
  { value: 'replan_too_much', label: 'I spend more time replanning than actually doing things' },
  { value: 'unfinished_guilt', label: 'I feel guilty about tasks I did not finish' },
  { value: 'anxiety', label: 'My to-do list gives me more anxiety than clarity' },
];

export const HARD_CONSTRAINT_OPTIONS: { value: HardConstraint; label: string }[] = [
  { value: 'morning_routine', label: 'Morning routine / gym' },
  { value: 'school', label: 'School or class schedule' },
  { value: 'work_hours', label: 'Work hours' },
  { value: 'childcare', label: 'Childcare or pickups' },
  { value: 'medical', label: 'Medication or appointments' },
  { value: 'none', label: 'Nothing fixed — full flexibility' },
];

export const PRODUCTIVITY_PEAK_OPTIONS: { value: ProductivityPeak; label: string }[] = [
  { value: 'morning', label: "Morning — I'm sharpest before noon" },
  { value: 'afternoon', label: 'Afternoon — I hit my stride midday' },
  { value: 'evening', label: 'Evening — I come alive after 5 PM' },
  { value: 'varies', label: 'It shifts day to day' },
];

// In-memory state shape used during the onboarding flow
export interface OnboardingData {
  persona: Persona | null;
  painPoints: PainPoint[];
  sleepTime: string; // 'HH:MM'
  wakeUpTime: string; // 'HH:MM'
  productivityPeak: ProductivityPeak | null;
  hardConstraints: HardConstraint[];
  schedulingContext: string;
}

