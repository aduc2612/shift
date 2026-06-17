# Phase 9 — User Context Migration

## Objective

Consolidate 5 onboarding columns (`persona`, `pain_points`, `hard_constraints`, `productivity_peak`, `scheduling_context`) into a single `user_context` text column. Onboarding stays structured in-memory; the formatted text is built client-side before writing. Edge Functions read the new field directly.

## Context

- See `../BRIEF.md`, `../ROADMAP.md`
- Current `user_preferences` schema: `productivity_peak`, `wake_up_time`, `scheduling_context`, `onboarding_completed`, `persona`, `sleep_time`, `pain_points`, `hard_constraints`
- Phase 8 onboarding complete — structured screens work, Edge Functions read individual columns
- `getUserContext()` in `supabase/functions/_shared/ai-prompt.ts` assembles prompt from individual columns
- `saveOnboardingData()` in `src/features/onboarding/api.ts` writes individual columns
- `src/constants/onboarding-questions.ts` defines PERSONA_OPTIONS, PAIN_POINT_OPTIONS, HARD_CONSTRAINT_OPTIONS, PRODUCTIVITY_PEAK_OPTIONS

## Tasks

### 1. Create `buildUserContextText()` util

**File:** `src/features/onboarding/utils.ts`

Converts `OnboardingData` → formatted text string.

Format:
```
Role: Student
Pain points:
 + One delay collapses my whole schedule
 + I start strong but lose steam in the afternoon
Priorities:
 + Morning routine / gym
 + Work hours
Productivity peak: Morning
Scheduling context: I'm a student with a part-time job...
```

- Skip sections with no data (empty arrays, null persona, etc.)
- Use label text from `onboarding-questions.ts` option arrays (not raw enum values)
- `schedulingContext` goes under "Additional context:" if non-empty

### 2. Update `saveOnboardingData()`

**File:** `src/features/onboarding/api.ts`

- Call `buildUserContextText(data)` to produce the text
- Write `user_context` column instead of individual columns
- Keep writing `wake_up_time`, `sleep_time`, `onboarding_completed`

### 3. Add migration SQL

**File:** `supabase/migrations/009_consolidate_user_context.sql`

- Add `user_context text NOT NULL DEFAULT ''`
- Backfill existing rows: build formatted text from existing column values using SQL
- Drop columns: `persona`, `pain_points`, `hard_constraints`, `productivity_peak`, `scheduling_context`

### 4. Update Edge Function prompt helper

**File:** `supabase/functions/_shared/ai-prompt.ts`

- `getUserContext()` reads `user_context` directly from `user_preferences`
- Remove column assembly logic

### 5. Update types

**Files:**
- `src/types/userPreferences.ts` — drop old columns, add `userContext: string`
- `src/types/onboarding.ts` — `OnboardingData` stays unchanged (structured in-memory)

### 6. Update tests

**Files:**
- `src/features/onboarding/__tests__/utils.test.ts` — add tests for `buildUserContextText()`
- `src/features/onboarding/__tests__/api.test.ts` — update mock data shape
- `supabase/functions/_shared/__tests__/ai-prompt.test.ts` (if exists) — update for new column
- `src/lib/__tests__/ai-prompt.test.ts` — update for new column

### 7. Clean up unused imports/code

- Remove references to old columns in any remaining files
- Verify no file still reads/writes `persona`, `pain_points`, etc. directly

## Verification

1. `npx tsc --noEmit` — clean
2. `npm test` — all pass
3. Manual: run onboarding → check `user_preferences` table has `user_context` with formatted text
4. Manual: trigger reschedule → check Edge Function reads `user_context` in prompt

## Done When

- `user_context` column exists with backfilled data
- Old columns dropped
- Onboarding writes formatted text to `user_context`
- Edge Functions read `user_context`
- All tests pass, TSC clean
- No references to dropped columns remain in code

## Notes

- Migration 009 backfill uses SQL to format text from existing values. If row has no data, `user_context` stays `''`.
- `OnboardingData` type stays structured — the text format is an output concern, not a data model concern.
- Settings screen editing `user_context` as a text area is a follow-up (not this plan).
