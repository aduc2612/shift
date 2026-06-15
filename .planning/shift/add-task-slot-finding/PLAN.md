# Add Task — AI Slot-Finding (No Full Reschedule)

## Objective

When a user adds or edits a task with "AI decides time" enabled, find an optimal slot for **just that task** instead of rescheduling the entire day. The Edge Function returns only the new task's placement — no other tasks are touched.

## Context

- Current behavior: FAB add with `aiDecidesTime=true` triggers `useReschedule` which sends ALL incomplete tasks to the Edge Function and batch-updates ALL of them
- The `RescheduleSheet` full-reschedule flow stays unchanged
- The `handleDone` in `TaskFormSheet` currently calls `reschedule.mutateAsync()` for both add and edit AI triggers

### Key Files
- `supabase/functions/reschedule/index.ts` — existing Edge Function (full reschedule)
- `supabase/functions/reschedule/config.ts` — models, prompt, token/timeout budgets
- `src/services/ai.ts` — `rescheduleTasks()` client function
- `src/features/schedule/hooks/useReschedule.ts` — full reschedule hook with undo
- `src/features/schedule/components/TaskFormSheet.tsx` — form sheet (L348-448: handleDone)
- `src/app/(tabs)/index.tsx` — schedule screen wiring (L173-182: handleTaskSave)
- `src/features/schedule/api.ts` — Supabase CRUD (createTask, updateTask)
- `src/store/undo-store.ts` — Zustand undo snapshot store
- `src/constants/reschedule.ts` — WHAT_CHANGED templates

## Flow

**Add mode (AI decides time):**
1. User fills form, taps Done
2. Call AI Edge Function with task data + existing schedule as context
3. On success: create task in Supabase with AI-assigned times already set
4. On failure: nothing in DB, sheet stays open, user can retry or set times manually

**Edit mode (AI re-placement):**
1. User edits task, taps Done
2. Snapshot previous task state for undo
3. Call AI Edge Function with updated task data + existing schedule as context
4. On success: update task in Supabase with new AI-assigned times
5. On failure: sheet stays open, user can retry

**Undo:**
- Add mode: delete the task from Supabase
- Edit mode: restore previous task fields from snapshot

## Tasks

### Task 1: Write tests for `placeTask()` client function

Write tests in `src/services/__tests__/ai.test.ts` (extend existing file).

**Tests:**
- sends correct payload to `/functions/v1/place-task`
- returns parsed `PlaceTaskResult` on success
- throws on non-200 response
- throws on missing session
- throws when response `task` is missing required fields
- passes timezone from `Intl.DateTimeFormat`

---

### Task 2: Implement `placeTask()` client function

Add to `src/services/ai.ts`:
- `PlaceTaskResult` type (same shape as `RescheduleResult`)
- `placeTask()` function that POSTs to `/functions/v1/place-task`

Follow same pattern as `rescheduleTasks()`: auth check, fetch, error handling.

---

### Task 3: Write tests for `usePlaceTask` hook

Write tests in `src/features/schedule/hooks/__tests__/usePlaceTask.test.tsx`.

**Tests:**
- **Add flow:** calls `placeTask()` API, then `createTask()` with AI times, invalidates queries
- **Edit flow:** calls `placeTask()` API, then `updateTask()` with AI times, invalidates queries
- **Undo (add mode):** deletes the created task, invalidates queries, hides toast
- **Undo (edit mode):** restores previous task fields via `updateTask()`, invalidates queries, hides toast
- **Toast:** shows undo toast on success with 5s timeout
- **Error propagation:** re-throws error so TaskFormSheet can catch and stay open
- **Error cleanup:** clears undo snapshot on error

Mock: `@/services/ai` (`placeTask`), `@/features/schedule/api` (`createTask`, `updateTask`, `deleteTask`, `fetchIncompleteTasks`), `@/store/undo-store`, `@/providers/toast-provider`

---

### Task 4: Implement `usePlaceTask` hook

Create `src/features/schedule/hooks/usePlaceTask.ts`.

**Mutation signature:**
```ts
placeTask.mutateAsync({
  taskData: { name, durationMinutes, deadline, aiContext };  // task fields (no times yet)
  whatChanged: string;
  mode: "add" | "edit";
  previousTask?: Task;  // for edit undo — snapshot of task before edit
  existingTaskId?: string;  // for edit mode — the task to update
})
```

**Mutation function:**
1. Call `placeTask()` Edge Function with `taskData` + existing incomplete tasks as context
2. If `mode === "add"`: create task in Supabase via `createTask()` with AI-assigned times
3. If `mode === "edit"`: update task via `updateTask()` with AI-assigned times
4. Invalidate `["tasks"]` query

**Undo:**
- `mode === "add"`: delete task via `deleteTask()`
- `mode === "edit"`: restore `previousTask` fields via `updateTask()`

**Toast:** show undo toast (5s timeout) on success, same pattern as `useReschedule`.

---

### Task 5: Write tests for Edge Function

Write tests in `supabase/functions/place-task/__tests__/index.test.ts`.

**Tests:**
- returns 401 if no auth header
- returns 400 if task is missing
- returns 400 if existingTasks is not an array
- returns 400 for invalid timezone
- returns placed task with correct fields (id, startTime, endTime, durationMinutes, aiJustification, aiContext)
- returns 400 if returned task.id doesn't match input task.id
- falls back to next model on failure

Note: Edge Function tests use Deno test runner. If Jest can't run these, they'll be tested manually after deployment.

---

### Task 6: Create `place-task` Edge Function

Create `supabase/functions/place-task/index.ts` and `config.ts`.

**Request:**
```ts
{
  task: {
    id: string;
    name: string;
    durationMinutes: number;
    deadline: string | null;
    aiContext: string | null;
  };
  existingTasks: {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
  }[];
  userContext: string;
  whatChanged: string;
  timezone: string;
}
```

**Response:**
```ts
{
  task: {
    id: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    aiJustification: string;
    aiContext: string;
  };
}
```

Key differences from `reschedule`:
- Returns **one** task (not an array of all tasks)
- Receives `existingTasks` as read-only context (AI must not move them)
- System prompt: find a slot for the new task without rearranging existing tasks
- Validates returned `task.id` matches input `task.id`
- Simpler token/timeout budget (fixed, not per-task-count scaling)
- Reuses model chain from `reschedule/config.ts`

---

### Task 7: Wire `usePlaceTask` into `TaskFormSheet`

In `TaskFormSheet.tsx`, replace `useReschedule()` with `usePlaceTask()`.

**Changes to `handleDone` (L348-448):**
- Remove: `await onSave?.(taskPayload)` then `await reschedule.mutateAsync(...)`
- Replace with: `await placeTask.mutateAsync({ taskData, whatChanged, mode, previousTask, existingTaskId })`
- For add mode: pass `taskData: { name, durationMinutes, deadline, aiContext }`
- For edit mode: pass `taskData` + `previousTask: task` (the task prop before edits) + `existingTaskId: task.id`
- The `needsReschedule` logic stays the same — it correctly identifies when AI placement is needed

**Changes to `handleTaskSave` in `index.tsx`:**
- No longer called from `handleDone` for AI flows — `usePlaceTask` handles creation/update internally
- Still used for manual (non-AI) saves where `aiDecidesTime=false`

**Changes to `isRescheduling` (L457):**
- Use `placeTask.isPending` instead of `reschedule.isPending`

**Files:**
- `src/features/schedule/components/TaskFormSheet.tsx`
- `src/app/(tabs)/index.tsx`

---

### Task 8: Run all tests, fix any issues

- `npm test` — all existing + new tests pass
- No TypeScript errors
- Manual verification of the 6 scenarios in Verification section

## Verification

1. Add task with "AI decides time" ON → only the new task gets times assigned, no other tasks move
2. Edit task, turn ON "AI decides time" → only that task gets re-placed
3. Edit task, change AI context while "AI decides time" is ON → only that task gets re-placed
4. Reschedule button (RescheduleSheet) still works as full reschedule (unchanged)
5. Undo after add → task is deleted
6. Undo after edit → task reverts to pre-edit state
7. AI failure → no orphan task in DB, sheet stays open
8. All tests pass

## Done When

- New `place-task` Edge Function created
- `placeTask()` function in `src/services/ai.ts`
- `usePlaceTask` hook replaces `useReschedule` in TaskFormSheet
- `RescheduleSheet` full reschedule flow unchanged
- Undo works correctly for both add (delete) and edit (restore) modes
- All tests pass (existing + new)
- No TypeScript errors

## Manual Steps

- Deploy Edge Function: `supabase functions deploy place-task`

## Notes

- `useReschedule` is NOT deleted — still used by RescheduleSheet
- Notifications sync automatically via `useSyncNotifications` (watches query cache) — no extra wiring needed
- Edge Function config (models, base URL) can be shared or duplicated from `reschedule/config.ts`
- TDD order: tests first (Tasks 1, 3, 5), then implementation (Tasks 2, 4, 6), then wiring (Task 7), then verify (Task 8)
