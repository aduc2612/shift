export const FEEDBACK_EMAIL = "anhducams@gmail.com";

export type FeedbackTemplate = {
  icon: string;
  label: string;
  subject: string;
  body: string;
};

export const feedbackTemplates: Record<string, FeedbackTemplate> = {
  errorReport: {
    icon: "bug-outline",
    label: "Error report",
    subject: "Shift AI - Bug Report",
    body: [
      "Hi, I'd like to report a bug.",
      "",
      "Steps to reproduce:",
      "1. ",
      "2. ",
      "3. ",
      "",
      "Expected behavior:",
      "",
      "",
      "Actual behavior:",
      "",
      "",
      "Device info (Android 16, iOS 26, etc...):",
      "",
      "",
    ].join("\n"),
  },
  featureRequest: {
    icon: "bulb-outline",
    label: "Feature request",
    subject: "Shift AI - Feature Request",
    body: [
      "Hi, I'd like to suggest a feature.",
      "",
      "What problem does this solve?",
      "",
      "",
      "Describe the feature:",
      "",
      "",
    ].join("\n"),
  },
  other: {
    icon: "chatbubble-outline",
    label: "Other",
    subject: "Shift AI - Feedback",
    body: ["Hi, I'd like to share some feedback.", "", "", ""].join("\n"),
  },
};

export function buildMailtoUrl(template: FeedbackTemplate): string {
  const subject = encodeURIComponent(template.subject);
  const body = encodeURIComponent(template.body);
  return `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`;
}
