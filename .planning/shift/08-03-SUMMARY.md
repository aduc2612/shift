# Phase 8 — Onboarding Fixes & AI Prompt Improvements

## Summary

Post-phase-8 fixes addressing 4 UI bugs, AI prompt quality issues, and error handling gaps.

---

## Onboarding UI Fixes

1. **Text emojis → Ionicons** — Replaced all text emojis (`✓`, `✗`, `🧠`, `⏱`, `🔔`, etc.) with proper `Ionicons` icons across 4 screens (processing-theatre, animation, schedule-preview, notif-warmup).

2. **Native time picker** — Replaced custom `TimeStepper` with `DateTimePicker` from `@expo/ui/community/datetime-picker` in sleep-wake screen.

3. **Bar chart for replanning** — Added second `AnimatedBar` set in progress-graph for replanning minutes (was plain text stats).

4. **Processing theatre timing** — Replaced broken `setTimeout` cascade with 3s interval. All 4 checkpoints reveal sequentially. `ritualComplete` fires at T+9s. Save retries once if auth resolves late.

5. **Persona reviews** — Each persona now has 3 reviews (was 1). `getPersonaReviews` returns array.

6. **Schedule preview** — Inline deep work display instead of multi-column.

7. **Notif warmup** — Added 4th bullet, fixed spacing.

## AI Prompt Improvements

8. **Priority hierarchy** — System prompts restructured: user request (highest) → user preferences → existing task data → general rules. "User instruction is law" language.

9. **Field stripping** — Removed `durationMinutes`, `aiJustification`, `aiContext`, `completed`, `createdAt`, `updatedAt` from AI payloads. AI decides duration based on task complexity.

10. **"Fixed constraints" → "Prioritized tasks"** — Language change to prevent AI stubbornness on constraint tasks.

11. **aiContext vs aiJustification** — Clear definitions: aiJustification = WHY placed there, aiContext = WHAT the task is. Added examples and anti-patterns to both prompts.

12. **whatChanged includes aiContext** — User's direct instructions now surface prominently in the AI's user message, not buried in JSON.

13. **Token budget increase** — Reschedule: TOKENS_PER_TASK 150→500, TOKENS_BASE 300→1000, MAX_TOKENS 4096→8192. Place-task: MAX_TOKENS 500→2000, TIMEOUT_MS 10s→30s.

## Error Handling

14. **TaskFormSheet error display** — Added `submitError` state with red error banner above footer. Clears on retry or new input.

## Files Changed (27 files)

- `src/app/(onboarding)/` — 7 screens updated
- `src/constants/` — onboarding-reviews, reschedule
- `src/features/onboarding/` — utils, tests
- `src/features/schedule/` — TaskFormSheet, usePlaceTask, tests
- `src/lib/` — ai-prompt, tests
- `src/providers/` — query-provider
- `src/services/` — ai, tests
- `supabase/functions/` — reschedule, place-task, _shared, tests
