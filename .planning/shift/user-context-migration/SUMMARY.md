# User Context Migration — Summary

## Outcome

✓ All 7 tasks complete. 298/298 tests pass, TSC clean.

## Changes

| File | Change |
|------|--------|
| `src/features/onboarding/utils.ts` | Added `buildUserContextText()` — formats `OnboardingData` → text block |
| `src/features/onboarding/api.ts` | `saveOnboardingData` writes `user_context` instead of 5 individual columns |
| `supabase/migrations/009_consolidate_user_context.sql` | New migration: add `user_context`, backfill from old columns, drop old columns |
| `supabase/functions/_shared/ai-prompt.ts` | `buildSystemPrompt` reads `userContext` field directly |
| `supabase/functions/_shared/supabase-client.ts` | `fetchUserPreferences` selects/returns only `user_context` + sleep/wake |
| `src/lib/ai-prompt.ts` | Mirror of Edge Function prompt helper, updated |
| `src/types/userPreferences.ts` | Dropped 5 fields, added `userContext: string` |
| `src/features/onboarding/__tests__/utils.test.ts` | 9 new tests for `buildUserContextText` |
| `src/features/onboarding/__tests__/api.test.ts` | Unchanged (in-memory `OnboardingData` shape preserved) |
| `src/lib/__tests__/ai-prompt.test.ts` | Updated to new `UserPreferences` shape |

## Output format

```
Role: Student
Pain points:
 + One delay collapses my whole schedule
 + I start strong but lose steam in the afternoon
Priorities:
 + Morning routine / gym
 + Work hours
Productivity peak: Morning
Additional context: I'm a student with a part-time job...
```

## Onboarding flow

Unchanged structurally. Same 14 screens, same in-memory `OnboardingData` shape. The formatting into text happens in `saveOnboardingData` (client-side) before writing to Supabase.

## Edge Function prompt

Simplified. `buildSystemPrompt` now emits:
- `Alertness window: User is awake from 07:00 to 23:00.`
- The `user_context` text block verbatim

## Manual steps for user

1. Run migration `009_consolidate_user_context.sql` in Supabase SQL Editor
2. Redeploy `reschedule` and `place-task` Edge Functions
3. Verify onboarding writes `user_context` to `user_preferences`

## Follow-up (out of scope)

- Settings screen with single text area to edit `user_context` directly
