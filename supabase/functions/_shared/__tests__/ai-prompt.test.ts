/**
 * Tests for the Edge Function's copy of buildSystemPrompt.
 *
 * The client-side copy (src/lib/ai-prompt.ts) has its own tests.
 * This ensures the Deno-compatible copy at _shared/ai-prompt.ts
 * produces identical output.
 */
import { buildSystemPrompt } from "../ai-prompt";

describe("buildSystemPrompt (Edge Function copy)", () => {
  it("returns empty string when onboarding is not completed", () => {
    const result = buildSystemPrompt({
      userId: "user-1",
      wakeUpTime: "07:00",
      sleepTime: "23:00",
      userContext: "I'm a student",
      onboardingCompleted: false,
    });
    expect(result).toBe("");
  });

  it("includes wake-up and sleep window when onboarding completed", () => {
    const result = buildSystemPrompt({
      userId: "user-1",
      wakeUpTime: "07:00",
      sleepTime: "23:00",
      userContext: "",
      onboardingCompleted: true,
    });
    expect(result).toContain("Alertness window");
    expect(result).toContain("07:00");
    expect(result).toContain("23:00");
  });

  it("defaults sleep to 23:00 when sleepTime is empty", () => {
    const result = buildSystemPrompt({
      userId: "user-1",
      wakeUpTime: "06:00",
      sleepTime: "",
      userContext: "",
      onboardingCompleted: true,
    });
    // Empty string is truthy for ??, so it stays empty
    expect(result).toContain("Alertness window");
    expect(result).toContain("06:00");
  });

  it("includes userContext when provided", () => {
    const result = buildSystemPrompt({
      userId: "user-1",
      wakeUpTime: "08:00",
      sleepTime: "22:00",
      userContext: "I work night shifts and have ADHD",
      onboardingCompleted: true,
    });
    expect(result).toContain("night shifts");
    expect(result).toContain("ADHD");
  });

  it("trims userContext whitespace", () => {
    const result = buildSystemPrompt({
      userId: "user-1",
      wakeUpTime: "08:00",
      sleepTime: "22:00",
      userContext: "  software engineer  ",
      onboardingCompleted: true,
    });
    expect(result).toContain("software engineer");
    expect(result).not.toMatch(/  software/);
  });

  it("omits userContext when empty or whitespace only", () => {
    const result = buildSystemPrompt({
      userId: "user-1",
      wakeUpTime: "08:00",
      sleepTime: "22:00",
      userContext: "   ",
      onboardingCompleted: true,
    });
    // Should only contain the alertness window line
    expect(result).toContain("Alertness window");
    expect(result).not.toContain("   ");
  });

  it("returns just alertness window when userContext is empty", () => {
    const result = buildSystemPrompt({
      userId: "user-1",
      wakeUpTime: "09:00",
      sleepTime: "01:00",
      userContext: "",
      onboardingCompleted: true,
    });
    expect(result).toContain("Alertness window");
    expect(result).toContain("09:00");
    expect(result).toContain("01:00");
    // Only one line (no userContext line)
    expect(result.split("\n")).toHaveLength(1);
  });

  it("includes both lines when all fields populated", () => {
    const result = buildSystemPrompt({
      userId: "user-1",
      wakeUpTime: "06:00",
      sleepTime: "22:00",
      userContext: "I'm a student with classes on MWF",
      onboardingCompleted: true,
    });
    expect(result).toContain("Alertness window");
    expect(result).toContain("06:00");
    expect(result).toContain("22:00");
    expect(result).toContain("student");
    expect(result).toContain("MWF");
    expect(result.split("\n")).toHaveLength(2);
  });

  it("handles late sleep time", () => {
    const result = buildSystemPrompt({
      userId: "user-1",
      wakeUpTime: "10:00",
      sleepTime: "02:00",
      userContext: "",
      onboardingCompleted: true,
    });
    expect(result).toContain("10:00");
    expect(result).toContain("02:00");
  });

  it("handles early wake-up time", () => {
    const result = buildSystemPrompt({
      userId: "user-1",
      wakeUpTime: "04:30",
      sleepTime: "21:00",
      userContext: "",
      onboardingCompleted: true,
    });
    expect(result).toContain("04:30");
    expect(result).toContain("21:00");
  });
});
