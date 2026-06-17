// Tests for the reschedule Edge Function dynamic budget clamping logic.
// These test the pure math — no network or Deno runtime needed.

import {
  TOKENS_PER_TASK,
  TOKENS_BASE,
  TIMEOUT_PER_TASK,
  TIMEOUT_BASE,
  MAX_TOKENS,
  MAX_TIMEOUT_MS,
} from "../../../supabase/functions/reschedule/config";

function computeMaxTokens(taskCount: number): number {
  return Math.min(taskCount * TOKENS_PER_TASK + TOKENS_BASE, MAX_TOKENS);
}

function computeTimeout(taskCount: number): number {
  return Math.min(taskCount * TIMEOUT_PER_TASK + TIMEOUT_BASE, MAX_TIMEOUT_MS);
}

describe("reschedule Edge Function — dynamic budget clamping", () => {
  describe("maxTokens", () => {
    it("uses dynamic value when below ceiling", () => {
      const result = computeMaxTokens(1);
      expect(result).toBe(1 * TOKENS_PER_TASK + TOKENS_BASE);
      expect(result).toBeLessThan(MAX_TOKENS);
    });

    it("clamps to MAX_TOKENS when dynamic value exceeds ceiling", () => {
      const dynamic = 100 * TOKENS_PER_TASK + TOKENS_BASE;
      expect(dynamic).toBeGreaterThan(MAX_TOKENS);
      expect(computeMaxTokens(100)).toBe(MAX_TOKENS);
    });

    it("clamps at exactly MAX_TOKENS when dynamic equals ceiling", () => {
      const taskCount = Math.ceil((MAX_TOKENS - TOKENS_BASE) / TOKENS_PER_TASK);
      const dynamic = taskCount * TOKENS_PER_TASK + TOKENS_BASE;
      expect(computeMaxTokens(taskCount)).toBe(MAX_TOKENS);
      expect(dynamic).toBeGreaterThanOrEqual(MAX_TOKENS);
    });
  });

  describe("timeout", () => {
    it("uses dynamic value when below ceiling", () => {
      const result = computeTimeout(1);
      expect(result).toBe(1 * TIMEOUT_PER_TASK + TIMEOUT_BASE);
      expect(result).toBeLessThan(MAX_TIMEOUT_MS);
    });

    it("clamps to MAX_TIMEOUT_MS when dynamic value exceeds ceiling", () => {
      const dynamic = 100 * TIMEOUT_PER_TASK + TIMEOUT_BASE;
      expect(dynamic).toBeGreaterThan(MAX_TIMEOUT_MS);
      expect(computeTimeout(100)).toBe(MAX_TIMEOUT_MS);
    });

    it("clamps at exactly MAX_TIMEOUT_MS when dynamic equals ceiling", () => {
      const taskCount = Math.ceil(
        (MAX_TIMEOUT_MS - TIMEOUT_BASE) / TIMEOUT_PER_TASK,
      );
      const dynamic = taskCount * TIMEOUT_PER_TASK + TIMEOUT_BASE;
      expect(computeTimeout(taskCount)).toBe(MAX_TIMEOUT_MS);
      expect(dynamic).toBeGreaterThanOrEqual(MAX_TIMEOUT_MS);
    });
  });

  describe("ceiling constants", () => {
    it("MAX_TOKENS is 8192", () => {
      expect(MAX_TOKENS).toBe(8_192);
    });

    it("MAX_TIMEOUT_MS is 90s", () => {
      expect(MAX_TIMEOUT_MS).toBe(90_000);
    });

    it("dynamic values for 5 tasks stay below ceilings", () => {
      expect(computeMaxTokens(5)).toBeLessThan(MAX_TOKENS);
      expect(computeTimeout(5)).toBeLessThan(MAX_TIMEOUT_MS);
    });
  });
});
