# Add Task — AI Slot-Finding — Summary

## Status: Complete

## What Changed

### New Files
- `supabase/functions/place-task/index.ts` — Edge Function for single-task slot-finding
- `supabase/functions/place-task/config.ts` — model chain, system prompt, fixed budgets
- `supabase/functions/place-task/__tests__/index.test.ts` — 24 tests for Edge Function validation/schema
- `src/features/schedule/hooks/usePlaceTask.ts` — mutation hook (AI call → create/update → undo toast)
- `src/features/schedule/hooks/__tests__/usePlaceTask.test.tsx` — 7 tests for hook

### Modified Files
- `src/services/ai.ts` — added `PlaceTaskResult` type + `placeTask()` function
- `src/services/__tests__/ai.test.ts` — added 7 tests for `placeTask()`
- `src/features/schedule/components/TaskFormSheet.tsx` — replaced `useReschedule` with `usePlaceTask`, split AI flow from manual flow in `handleDone`
- `src/features/schedule/components/__tests__/TaskFormSheet.ai.test.tsx` — updated mocks from `useReschedule` to `usePlaceTask`, updated assertions for new AI flow
- `src/features/schedule/components/__tests__/TaskFormSheet.test.tsx` — updated mocks from `useReschedule` to `usePlaceTask`

### Unchanged Files
- `src/features/schedule/hooks/useReschedule.ts` — still used by RescheduleSheet (full reschedule)
- `src/app/(tabs)/index.tsx` — no changes needed (TaskFormSheet handles everything internally)

## Flow

**Add mode (aiDecidesTime=true):**
1. `handleDone` calls `placeTask.mutateAsync({ taskData, mode: 'add', whatChanged })`
2. Hook fetches existing tasks for context, calls `placeTask()` Edge Function
3. On success: creates task in Supabase with AI-assigned times (no intermediate null state)
4. On failure: nothing in DB, sheet stays open, user can retry

**Edit mode (aiDecidesTime toggled on / AI context changed):**
1. `handleDone` calls `placeTask.mutateAsync({ taskData, mode: 'edit', previousTask, existingTaskId })`
2. Hook calls `placeTask()` Edge Function, updates task in Supabase
3. Undo restores previous task fields

**Manual mode (aiDecidesTime=false):**
- Unchanged — calls `onSave` directly (existing behavior)

## Test Results
- 31 test suites passed
- 258 tests passed
- 0 failures

## Manual Step Required
- Deploy Edge Function: `supabase functions deploy place-task`
