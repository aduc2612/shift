import type { OnboardingData, ProductivityPeak } from "@/types/onboarding";
import {
  PERSONA_OPTIONS,
  PAIN_POINT_OPTIONS,
  HARD_CONSTRAINT_OPTIONS,
  PRODUCTIVITY_PEAK_OPTIONS,
} from "@/types/onboarding";
import { PERSONA_REVIEWS } from "@/constants/onboarding-reviews";
import type { PersonaReview } from "@/constants/onboarding-reviews";

function labelFor(
  options: { value: string; label: string }[],
  value: string,
): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

function peakAdjective(peak: ProductivityPeak): string {
  return PRODUCTIVITY_PEAK_OPTIONS.find((o) => o.value === peak)
    ? peak.charAt(0).toUpperCase() + peak.slice(1)
    : peak;
}

/**
 * Convert structured onboarding data into a single human-readable text
 * blob that can be stored in `user_preferences.user_context` and later
 * edited directly in the settings screen.
 */
export function buildUserContextText(data: OnboardingData): string {
  const sections: string[] = [];

  if (data.persona && data.persona !== "other") {
    sections.push(`Role: ${labelFor(PERSONA_OPTIONS, data.persona)}`);
  }

  if (data.painPoints.length > 0) {
    const items = data.painPoints
      .map((p) => ` + ${labelFor(PAIN_POINT_OPTIONS, p)}`)
      .join("\n");
    sections.push(`Pain points:\n${items}`);
  }

  const realConstraints = data.hardConstraints.filter((c) => c !== "none");
  if (realConstraints.length === 0 && data.hardConstraints.includes("none")) {
    sections.push("Priorities: None — full flexibility");
  } else if (realConstraints.length > 0) {
    const items = realConstraints
      .map((c) => ` + ${labelFor(HARD_CONSTRAINT_OPTIONS, c)}`)
      .join("\n");
    sections.push(`Priorities:\n${items}`);
  }

  if (data.productivityPeak) {
    sections.push(`Productivity peak: ${peakAdjective(data.productivityPeak)}`);
  }

  if (data.schedulingContext.trim()) {
    sections.push(`Additional context: ${data.schedulingContext.trim()}`);
  }

  return sections.join("\n\n");
}

export function getPersonaReviews(persona: string | null): PersonaReview[] {
  const key = (persona ?? "other") as keyof typeof PERSONA_REVIEWS;
  return PERSONA_REVIEWS[key] ?? PERSONA_REVIEWS.other;
}

export function buildSchedulePreview(productivityPeak: ProductivityPeak): {
  deepWorkBlock: string;
  bullets: string[];
} {
  const deepWorkBlock =
    productivityPeak === "morning"
      ? "8:00 – 10:00 AM"
      : productivityPeak === "afternoon"
        ? "1:00 – 3:00 PM"
        : productivityPeak === "evening"
          ? "6:00 – 8:00 PM"
          : "90-minute blocks throughout the day";

  const peakLabel =
    productivityPeak === "morning"
      ? "morning"
      : productivityPeak === "afternoon"
        ? "afternoon"
        : productivityPeak === "evening"
          ? "evening"
          : "your peak";

  const bullets = [
    `Deep work in the ${peakLabel} hours`,
    "Tasks under 90 min to match your focus style",
    "Buffer time built in so one delay doesn't collapse the day",
  ];

  return { deepWorkBlock, bullets };
}
