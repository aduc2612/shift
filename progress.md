# Phase 6 — AI Reschedule — Progress

## Task 2: Zustand undo store
**Status:** ✅ Complete
**Files created:**
- `src/store/undo-store.ts` — Zustand store with snapshot, timeout, cancel
- `src/store/__tests__/undo-store.test.ts` — 6 tests

## Task 3: Toast component + provider
**Status:** ✅ Complete
**Files created:**
- `src/components/primitives/Toast.tsx` — Toast component (absolute positioned, fade animation, auto-dismiss, action button)
- `src/providers/toast-provider.tsx` — ToastProvider context + useToast() hook
- `src/components/primitives/__tests__/Toast.test.tsx` — 5 tests
- `src/providers/__tests__/toast-provider.test.tsx` — 3 tests

## Task 4: Task API additions
**Status:** ✅ Complete
**Files changed:**
- `src/features/schedule/api.ts` — Added `TaskUpdate` type, `fetchIncompleteTasks()`, `batchUpdateTasks()`
- `src/features/schedule/__tests__/api.test.ts` — 9 tests

## Task 5: AI service
**Status:** ✅ Complete
**Files changed:**
- `src/services/ai.ts` — Replaced placeholder with real Edge Function caller
- `src/services/__tests__/ai.test.ts` — 6 tests (auth, request shape, error handling, validation)

## Task 6: Client-side reschedule constants
**Status:** ✅ Complete
**Files created:**
- `src/constants/reschedule.ts` — UNDO_TIMEOUT_MS, TOAST_DURATION_MS, WHAT_CHANGED templates

## Task 7: useReschedule hook
**Status:** ✅ Complete
**Files created:**
- `src/features/schedule/hooks/useReschedule.ts` — Mutation hook: fetch tasks → AI → batch update → undo
- `src/features/schedule/__tests__/useReschedule.test.tsx` — 6 tests (snapshot, undo, error handling)

## Task 8: Edge Function config + handler
**Status:** ✅ Complete
**Files created:**
- `supabase/functions/reschedule/config.ts` — Models, prompts, timeouts, schema name
- `supabase/functions/reschedule/index.ts` — OpenAI SDK + Zod structured output, model fallback chain

**Manual action required:**
- `supabase functions deploy reschedule`
- `supabase secrets set OPENROUTER_API_KEY=<key>`

## Task 9: TaskFormSheet AI changes
**Status:** ✅ Complete
**Files changed:**
- `src/features/schedule/components/TaskFormSheet.tsx` — Enabled AI toggle, hide time pickers when AI active, trigger reschedule on save
- `src/features/schedule/components/__tests__/TaskFormSheet.ai.test.tsx` — 6 tests (toggle enabled, AI time placeholder, reschedule trigger, no reschedule on non-AI changes, spinner, add mode)
- `src/features/schedule/components/__tests__/TaskFormSheet.test.tsx` — Updated Phase 6 disabled test, added waitFor for async onClose

## Task 10: RescheduleSheet wiring
**Status:** ✅ Complete
**Files changed:**
- `src/features/schedule/components/RescheduleSheet.tsx` — Added onReschedule/isRescheduling props, spinner, error handling
- `src/features/schedule/components/__tests__/RescheduleSheet.test.tsx` — 9 tests including reschedule interaction

## Task 11: Schedule screen + ToastProvider
**Status:** ✅ Complete
**Files changed:**
- `src/app/_layout.tsx` — Added ToastProvider to provider tree
- `src/app/(tabs)/index.tsx` — Wired useReschedule to RescheduleSheet, toast on error
- `src/app/(tabs)/__tests__/index.test.tsx` — 4 tests (renders, visible prop, onReschedule function, isRescheduling)

## Task 12: Manual integration testing
**Status:** ⏳ Not started — requires user to:
1. Install Supabase CLI & login
2. Deploy Edge Function
3. Set OPENROUTER_API_KEY
4. Run app and test end-to-end

## Verification
- `npx tsc --noEmit` — clean
- `npx jest --no-coverage` — **186 tests, 26 suites, all passing**
