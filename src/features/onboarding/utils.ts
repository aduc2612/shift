import type { ProductivityPeak } from '@/types/onboarding';
import { PERSONA_REVIEWS } from '@/constants/onboarding-reviews';
import type { PersonaReview } from '@/constants/onboarding-reviews';

export function getPersonaReviews(persona: string | null): PersonaReview[] {
  const key = (persona ?? 'other') as keyof typeof PERSONA_REVIEWS;
  return PERSONA_REVIEWS[key] ?? PERSONA_REVIEWS.other;
}

export function buildSchedulePreview(
  wakeUpTime: string,
  productivityPeak: ProductivityPeak,
): { deepWorkBlock: string; bullets: string[] } {
  const deepWorkBlock =
    productivityPeak === 'morning' ? '8:00 – 10:00 AM' :
    productivityPeak === 'afternoon' ? '1:00 – 3:00 PM' :
    productivityPeak === 'evening' ? '6:00 – 8:00 PM' :
    '90-minute blocks throughout the day';

  const peakLabel =
    productivityPeak === 'morning' ? 'morning' :
    productivityPeak === 'afternoon' ? 'afternoon' :
    productivityPeak === 'evening' ? 'evening' :
    'your peak';

  const bullets = [
    `Deep work in the ${peakLabel} hours`,
    "Tasks under 90 min to match your focus style",
    "Buffer time built in so one delay doesn't collapse the day",
  ];

  return { deepWorkBlock, bullets };
}
