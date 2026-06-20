# Phase 6 — AI Reschedule: Implementation Summary

## Status: COMPLETE (Pending Manual Deployment)

**Date:** 2026-06-13
**Branch:** `feat/phase-6-ai`
**Tests:** 186 passed, 26 suites
**TypeScript:** Clean (`npx tsc --noEmit`)

---

## What Was Built

### Core Flow
1. **Reschedule Button** — User taps "Reschedule" in schedule header → RescheduleSheet opens
2. **User Input** — Optional plain-text description (e.g., "I woke up late", "Meeting pushed to 3pm")
3. **AI Processing** — All incomplete tasks sent to Supabase Edge Function → OpenRouter model fallback chain
4. **Result** — AI returns optimally arranged tasks with justifications → written to Supabase → UI updates
5. **Undo** — Toast at top with "Undo" button, 5-second timeout. Tap → full snapshot restore.

### Task Creation with AI
- "Let AI decide" toggle enabled in TaskFormSheet
- When ON: time pickers hidden, task created with NULL times, AI assigns times via reschedule
- Spinner on Add/Done button until AI responds; sheet stays open on error

### Task Edit with AI Fields
- Only triggers reschedule when:
  - "Let AI decide" toggle turned **ON** (not when turned OFF)
  - `aiContext` changed while AI is already on
- Regular field edits (name, time, deadline) do NOT trigger reschedule

---

## Files Created/Modified

### New Files

| File | Purpose |
|------|---------|
| `src/store/undo-store.ts` | Zustand store for undo snapshot + timeout management |
| `src/store/__tests__/undo-store.test.ts` | 6 tests |
| `src/components/primitives/Toast.tsx` | Toast visual component (top screen, fade animation) |
| `src/components/primitives/__tests__/Toast.test.tsx` | 5 tests |
| `src/providers/toast-provider.tsx` | Toast context + `useToast()` hook |
| `src/providers/__tests__/toast-provider.test.tsx` | 3 tests |
| `src/services/ai.ts` | Real Edge Function caller (replaced placeholder) |
| `src/services/__tests__/ai.test.ts` | 5 tests |
| `src/features/schedule/hooks/useReschedule.ts` | TanStack Query mutation hook with undo logic |
| `src/features/schedule/__tests__/useReschedule.test.tsx` | 5 tests |
| `src/features/schedule/components/__tests__/TaskFormSheet.ai.test.tsx` | 9 tests for AI toggle + reschedule trigger |
| `src/constants/reschedule.ts` | Client-side constants (toast duration, undo timeout, whatChanged templates) |
| `supabase/functions/reschedule/config.ts` | Edge Function config (models, prompts, timeouts) |
| `supabase/functions/reschedule/index.ts` | Edge Function handler (OpenAI SDK + Zod) |

### Modified Files

| File | Changes |
|------|---------|
| `src/features/schedule/api.ts` | Added `fetchIncompleteTasks()`, `batchUpdateTasks()` |
| `src/features/schedule/components/TaskFormSheet.tsx` | Enabled AI toggle, hide time pickers, reschedule trigger logic |
| `src/features/schedule/components/RescheduleSheet.tsx` | Added `onReschedule`, `isRescheduling` props, spinner on CTA |
| `src/app/(tabs)/index.tsx` | Wired `useReschedule` to RescheduleSheet |
| `src/app/_layout.tsx` | Added `ToastProvider` to provider tree |
| `tsconfig.json` | Excluded `supabase/functions` from client TypeScript |

---

## Edge Function Architecture

### Request
```json
POST /functions/v1/reschedule
Authorization: Bearer <supabase-jwt>

{
  "tasks": [
    {
      "id": "uuid",
      "name": "Work",
      "startTime": "2026-06-14T12:00:00Z",
      "endTime": "2026-06-14T13:00:00Z",
      "durationMinutes": 60,
      "deadline": null,
      "aiContext": null,
      "aiDecidesTime": false
    }
  ],
  "userContext": "",
  "whatChanged": "New task added: Work",
  "timezone": "Asia/Ho_Chi_Minh"
}
```

### Response
```json
{
  "tasks": [
    {
      "id": "uuid",
      "startTime": "2026-06-14T12:00:00Z",
      "endTime": "2026-06-14T13:00:00Z",
      "durationMinutes": 60,
      "aiJustification": "Morning focus time.",
      "aiContext": "High effort, morning preference."
    }
  ]
}
```

### Model Fallback Chain
Each model gets **two attempts** per request:

| Attempt | `response_format` | JSON Handling |
|---------|-------------------|---------------|
| 1 | `zodResponseFormat(RescheduleSchema)` → `json_schema` | Server-enforced schema (best quality) |
| 2 | `{ type: "json_object" }` | Prompt-based schema + `cleanJSON()` helper |

**`cleanJSON()` helper** handles common LLM malformations:
- Single-quoted keys (`'key':` → `"key":`)
- Single-quoted values (`: 'value'` → `: "value"`)
- Trailing commas before `}`/`]`
- Markdown code fences
- Non-printable characters

**Current model chain** (verify at [openrouter.ai/models](https://openrouter.ai/models)):
1. `openai/gpt-oss-120b:nitro` — primary
2. `google/gemini-3.1-flash-lite:nitro` — fallback 1
3. `google/gemini-3.1-flash-lite:nitro` — fallback 2

> **Note:** Duplicate fallback 2 intentional — models only used if different. Verify slugs at deploy time.

---

## Key Technical Decisions

### 1. TDD Ordering
Every task: write tests first → implement → verify.

### 2. Dual-Attempt Per Model (json_schema + json_object)
Best quality for models supporting structured output, graceful fallback for others.

### 3. Dynamic `max_tokens`
`tokenBudget = min(tasks.length * 150 + 300, 4096)`
- 5 tasks → 1050 tokens (was 4096)
- Cuts response time from ~8s to ~2s

### 4. UTC In/Out
- All times stored as UTC in Supabase (`date.toISOString()`)
- Edge Function receives UTC, returns UTC
- Timezone passed for **reasoning only** (e.g., "9 AM their time = 2 AM UTC")
- Display handled by client's `formatTime()` which slices ISO string

### 5. `mutateAsync` for Task Creation
Prevents race condition where reschedule runs before task is persisted to DB.

### 6. Reschedule Triggers — Selective

| Scenario | Reschedule? |
|----------|------------|
| New task with `aiDecidesTime: true` | ✅ |
| Edit: AI toggle turned ON | ✅ |
| Edit: `aiContext` changed while AI on | ✅ |
| Edit: AI toggle turned OFF | ❌ |
| Edit: non-AI fields | ❌ |

### 7. Config Files Centralize All Tunable Values
- `supabase/functions/reschedule/config.ts` — models, prompts, timeouts
- `src/constants/reschedule.ts` — client-side timings, whatChanged templates

### 8. Toast: Absolute View, No Modal
- Toast renders as absolute-positioned View in main app tree
- Cannot render above `<Modal>` (Modals create native layer)
- Trade-off: Toast visible on main screen, hidden while sheet open
- Acceptable: reschedule success toast appears after sheet closes

### 9. Errors Inline, Not Toast
- Toast reserved for info messages on main screen
- Errors shown inside sheets via error state (RescheduleSheet)
- Error clears when user types or retries

### 10. Undo: Await Cache Invalidation
- `queryClient.invalidateQueries()` returns a Promise
- Must await to ensure UI updates before next action

---

## Bugs Found & Fixed During Implementation

### Bug 1: `openai.beta.chat.completions.parse` undefined
**Symptom:** Edge Function returned 500 — `Cannot read properties of undefined (reading 'completions')`
**Root Cause:** `openai.beta.chat.completions.parse` not available in Deno's OpenAI SDK version
**Fix:** Use `openai.chat.completions.create()` with `response_format` + manual `JSON.parse()` + `Zod.parse()`

### Bug 2: `global.fetch` TypeScript error
**Symptom:** `Cannot find name 'global'. Do you need to change your target library?`
**Root Cause:** Deno doesn't expose `global` as a TypeScript type
**Fix:** Changed to `globalThis.fetch`

### Bug 3: Edge Function Deno code in client tsconfig
**Symptom:** Client TypeScript tried to compile Deno code — 47 errors
**Fix:** Added `"exclude": ["supabase/functions"]` to `tsconfig.json`

### Bug 4: Empty string `""` for timestamps → Postgres rejects
**Symptom:** `invalid input syntax for type timestamp with time zone`
**Root Cause:** `aiDecidesTime: true` sent `startTime: ""` but Postgres rejects empty strings for `timestamptz`
**Fix:** Omit `startTime`/`endTime` from payload entirely when `aiDecidesTime: true`; API's `?? null` sends `NULL` to Postgres

### Bug 5: Race condition — reschedule before task persisted
**Symptom:** AI didn't include the new task in its output
**Root Cause:** `createTask.mutate()` (fire-and-forget) returned before Supabase write completed
**Fix:** Changed to `await createTask.mutateAsync()` — ensures task exists in DB before reschedule runs

### Bug 6: Turning OFF "Let AI decide" triggered reschedule
**Symptom:** User manually sets time → AI reschedules it anyway
**Root Cause:** `aiFieldsChanged` condition triggered on ANY toggle change, including OFF→ON
**Fix:** Split into `aiTurnedOn` (reschedule) and `aiTurnedOff` (no reschedule)

### Bug 7: Empty responses from models
**Symptom:** All three models returned empty responses
**Root Cause:** `response_format: { type: "json_object" }` without schema confused models
**Fix:** Dual-attempt strategy — `zodResponseFormat` first, `json_object` fallback

### Bug 8: Malformed JSON from models
**Symptom:** `Expected double-quoted property name in JSON at position 511`
**Root Cause:** Model generated single-quoted keys or trailing commas
**Fix:** `cleanJSON()` helper + Zod validation catches remaining issues

### Bug 9: Timezone ignored — times displayed wrong
**Symptom:** AI returned times in wrong timezone
**Root Cause:** Prompt mixed UTC inputs with local `{now}` without specifying output timezone
**Fix:** All times explicitly UTC in/out. `{now}` changed to UTC format. Added `{nowLocal}` for reference only. Added explicit rule: *"All times in the task list are UTC. Return UTC."*

### Bug 10: Toast behind bottom sheet overlay
**Symptom:** Toast rendered behind bottom sheet Modal
**Root Cause:** Modals create native layer above main view; absolute-positioned View can't overlap Modal
**Fix:** Wrapped Toast in `<Modal transparent>` → then reverted: Modal blocks all touches to content underneath. Final: absolute View. Trade-off: Toast not visible while any Modal open.

### Bug 11: Undo did not update screen
**Symptom:** User tapped Undo, tasks only reverted after navigating away and back
**Root Cause:** `queryClient.invalidateQueries()` not awaited — refetch happened async after function returned
**Fix:** Added `await` before both `invalidateQueries` calls (handleUndo + onSuccess)

### Bug 12: Error displayed as toast behind sheet
**Symptom:** Reschedule error toast invisible behind bottom sheet, then visible after close (too late)
**Root Cause:** Sheet open → Toast behind Modal → user can't see error
**Fix:** Removed error toast entirely. Errors shown inline inside RescheduleSheet via state. Toast reserved for info messages only, visible on main screen.

---

## Prompt Design

### System Prompt (Current)
```text
You are an AI scheduling assistant. You rearrange a user's task schedule optimally.

Context:
- Current date and time (UTC): {now}
- Current date and time (user local): {nowLocal}
- Day of week (user local): {dayOfWeek}
- Is weekend: {isWeekend}
- User's timezone: {timezone}

Rules:
- All times in the task list below are in UTC (suffix Z).
- Return all output times in UTC (suffix Z). Do not add timezone offsets to output times.
- Use the timezone offset ({timezone}) only for reasoning — e.g., "9 AM in their timezone = 2 AM UTC if GMT+7".
- Don't overthink or overcomplicate things.
- Keep changes extremely focused (don't change anything unless you really have to).
- Use 24h time format.
- Return ONLY valid JSON. No markdown, no preamble.
- The "tasks" array must contain every input task (same id).
- Preserve task durations unless the user explicitly asks to change them.
- Try to preserve the start time of tasks not mentioned by the user.
- Respect deadlines — schedule before deadline.
- Use the user's context and what-changed description to inform placement.
- When the user says "tomorrow", "next Monday", etc., calculate the actual date using the current date and day of week above.
- aiJustification: one SHORT sentence (max 10 words).
- aiContext: short notes (max 15 words) for future reschedules.
- Do not include any preamble, thinking, or explanation. ONLY the JSON.
- Use ISO 8601 for startTime and endTime.
- Try to schedule tasks sequentially without overlap unless forced.
```

### Token Budget (Dynamic)
```text
tokenBudget = min(tasks.length * 150 + 300, 4096)
```
- 5 tasks → 1050 tokens (was 4096)
- Response time: ~2s (was ~8s)

---

## Undo Flow

```text
1. User taps "Reschedule"
2. Fetch all incomplete tasks from Supabase
3. Snapshot tasks in Zustand (undo-store)
4. Call Edge Function → AI returns new arrangement
5. Write updated tasks to Supabase via batchUpdateTasks
6. Invalidate TanStack Query cache → UI updates
7. Show toast: "Schedule updated" + "Undo" button
8. Start 5-second timeout
9. If user taps Undo:
   a. Cancel timeout
   b. Restore snapshot to Supabase
   c. Invalidate cache → UI reverts
   d. Clear snapshot
   e. Hide toast
10. If timeout expires:
    a. Clear snapshot
    b. Toast auto-dismisses
```

---

## Testing

### Test Coverage (186 tests)

| Module | Tests |
|--------|-------|
| `undo-store.test.ts` | 6 |
| `Toast.test.tsx` | 5 |
| `toast-provider.test.tsx` | 3 |
| `schedule/api.test.ts` | 12 |
| `services/ai.test.ts` | 5 |
| `useReschedule.test.tsx` | 5 |
| `TaskFormSheet.ai.test.tsx` | 9 |
| `RescheduleSheet.test.tsx` | 6 |
| Other existing tests | ~135 |

### Edge Function Testing
No automated tests (Deno runtime). Test via:
```bash
# Local testing
supabase functions serve reschedule --env-file ./supabase/.env.local

# Production testing
curl -X POST https://<project-ref>.supabase.co/functions/v1/reschedule \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{"tasks":[...],"userContext":"","whatChanged":"test","timezone":"Asia/Ho_Chi_Minh"}'
```

---

## Manual Steps Required

### Before First Use

1. **Install Supabase CLI** (if not done):
   ```bash
   npm install -g supabase
   supabase login
   supabase link --project-ref <your-project-id>
   ```

2. **Get OpenRouter API key:**
   - Sign up at [openrouter.ai](https://openrouter.ai)
   - Generate API key
   - Verify model slugs at [openrouter.ai/models](https://openrouter.ai/models)

3. **Set Edge Function secret:**
   ```bash
   supabase secrets set OPENROUTER_API_KEY=<your-key>
   ```

4. **Deploy Edge Function:**
   ```bash
   supabase functions deploy reschedule
   ```

5. **Verify model slugs:**
   - Open [openrouter.ai/models](https://openrouter.ai/models)
   - Search for each model slug in `config.ts`
   - Update if slugs changed

### After Every Code Change

```bash
# Redeploy Edge Function
supabase functions deploy reschedule

# Run tests
npm test

# Type check
npx tsc --noEmit
```

---

## Configuration

### Edge Function Config (`supabase/functions/reschedule/config.ts`)

```typescript
// Model fallback chain (tried in order)
MODELS = [
  "openai/gpt-oss-120b:nitro",
  "google/gemini-3.1-flash-lite:nitro",
  "google/gemini-3.1-flash-lite:nitro",
]

// OpenRouter settings
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
TIMEOUT_MS = 30_000  // per-model timeout
MAX_TOKENS = 4096    // upper bound

// Dynamic token budget
TOKENS_PER_TASK = 150
TOKENS_BASE = 300
```

### Client Config (`src/constants/reschedule.ts`)

```typescript
RESCHEDULE_CONSTANTS = {
  UNDO_TIMEOUT_MS: 5000,      // undo window duration
  TOAST_DURATION_MS: 5000,    // toast auto-dismiss
  TOAST_FADE_MS: 200,         // fade animation

  WHAT_CHANGED: {
    AI_ENABLED: (name) => `User enabled AI scheduling for task: ${name}`,
    AI_DISABLED: (name) => `User disabled AI scheduling for task: ${name}`,
    AI_CONTEXT_CHANGED: (name) => `User updated AI context for task: ${name}`,
    NEW_AI_TASK: (name) => `New task added: ${name}`,
  },
}
```

---

## Known Limitations

1. **No user preferences yet** — `userContext` always passed as `""`. Will be wired in Phase 8.
2. **No notifications yet** — `syncNotifications()` not called after reschedule. Will be added in Phase 7.
3. **No paywall yet** — Free users get unlimited reschedules. RevenueCat integration in Phase 9.
4. **Edge Function not deployed** — Requires manual CLI setup and API key.
5. **Model slugs may change** — Verify at [openrouter.ai/models](https://openrouter.ai/models) before deploying.
6. **Sequential batch updates** — `batchUpdateTasks` loops sequentially. Fine for <50 tasks, may need optimization for larger schedules.

---

## Performance Characteristics

### Before Optimization
- `max_tokens: 4096` (fixed)
- ~4000 tokens generated for 5 tasks
- ~8 seconds response time

### After Optimization
- `max_tokens: 1050` (dynamic for 5 tasks)
- ~1000-1200 tokens generated
- ~2 seconds response time
- 4x faster

### How Dynamic Token Budget Works
```text
tokenBudget = min(tasks.length × 150 + 300, 4096)

5 tasks  → 1050 tokens → ~2s
10 tasks → 1800 tokens → ~3.6s
20 tasks → 3300 tokens → ~6.6s
30 tasks → 4800 tokens → ~9.6s (capped at 4096 → ~8s)
```

---

## Integration Points

### TanStack Query
- `useReschedule` hook uses `useMutation`
- Invalidates `['tasks']` query on success and undo
- Optimistic updates not needed (AI response replaces all)

### Zustand
- `undo-store` holds snapshot + timeout management
- No task data cached in Zustand (fetched from Supabase)
- Snapshot cleared after 5s or on undo

### Supabase
- `fetchIncompleteTasks()` — SELECT * WHERE completed=false
- `batchUpdateTasks()` — UPDATE each task with AI results
- Edge Function validates Supabase JWT from Authorization header

### Toast System
- `useToast()` hook provides `show()` and `hide()`
- Toast positioned at top of screen, below safe area
- Fade animation (200ms)
- Auto-dismiss after configurable duration (default 5s)

---

## Next Steps

1. **Deploy Edge Function** — `supabase functions deploy reschedule`
2. **Set OpenRouter API key** — `supabase secrets set OPENROUTER_API_KEY=<key>`
3. **Verify model slugs** — Check [openrouter.ai/models](https://openrouter.ai/models)
4. **Test end-to-end** — Manual integration testing (see above)
5. **Phase 7: Notifications** — `syncNotifications()` after reschedule
6. **Phase 8: Onboarding** — Wire `userContext` from preferences
7. **Phase 9: Payments** — RevenueCat paywall for AI features

---

## Critical Context

### Project Root
```text
C:\Shift
```

### Config Files
```text
supabase/functions/reschedule/config.ts  → Edge Function (models, prompts, timeouts)
src/constants/reschedule.ts              → Client (toast, undo, whatChanged templates)
```

### Key Data Flow
```text
User taps Reschedule
  → fetchIncompleteTasks() from Supabase
  → Snapshot tasks in undo-store
  → rescheduleTasks() calls Edge Function
    → Edge Function: OpenAI SDK → OpenRouter → model fallback chain
    → Zod validates response
  → batchUpdateTasks() writes to Supabase
  → Invalidate TanStack Query cache
  → Show toast with Undo
  → Start 5s timeout
  → (Undo? → restore snapshot)
```

### File Paths
```text
src/store/undo-store.ts                          — Zustand undo store
src/components/primitives/Toast.tsx              — Toast component
src/providers/toast-provider.tsx                 — Toast context + hook
src/services/ai.ts                               — Edge Function caller
src/features/schedule/hooks/useReschedule.ts     — Reschedule mutation hook
src/features/schedule/components/TaskFormSheet.tsx — Task form with AI toggle
src/features/schedule/components/RescheduleSheet.tsx — Reschedule bottom sheet
src/features/schedule/api.ts                     — Supabase CRUD functions
src/constants/reschedule.ts                      — Client-side constants
supabase/functions/reschedule/config.ts          — Edge Function config
supabase/functions/reschedule/index.ts           — Edge Function handler
```

---

## What's NOT in This Summary

- Sentry integration (Phase 3, already complete)
- Auth flow (Phase 2, already complete)
- Schedule UI details (Phase 4, already complete)
- Task CRUD details (Phase 5, already complete)
- Database schema (see `.planning/shift/04-01-SUMMARY.md`)
- Component styling details (see Phase 4/5 summaries)

---

## AI Deadline Support (Added Later)

Both Edge Functions (`reschedule` and `place-task`) now return a `deadline` field in their response, allowing the AI to set or edit task deadlines when the user explicitly requests it.

### What Changed

| File | Change |
|------|--------|
| `supabase/functions/reschedule/index.ts` | Added `deadline: z.string().nullable()` to `TaskResultSchema` |
| `supabase/functions/place-task/index.ts` | Added `deadline: z.string().nullable()` to `NewTaskSchema` |
| `supabase/functions/reschedule/config.ts` | Added DEADLINE RULE + deadline field description to prompt |
| `supabase/functions/place-task/config.ts` | Added DEADLINE RULE + deadline field description to prompt |
| `src/services/ai.ts` | Added `deadline: string \| null` to `RescheduleResult` and `PlaceTaskResult` |
| `src/features/schedule/api.ts` | Added `deadline` to `TaskUpdate` type; `batchUpdateTasks` writes deadline |
| `src/features/schedule/hooks/usePlaceTask.ts` | Uses `result.deadline` (AI-returned) instead of `taskData.deadline` |
| `src/features/schedule/hooks/useReschedule.ts` | Undo snapshot includes `deadline` in batch update payload |

### Prompt Rules

The DEADLINE RULE in both prompts instructs the AI:
- Any mention of "due", "deadline", "by when", or a specific completion date IS an explicit request
- Examples: "due today", "due tomorrow", "due by Friday", "deadline next week"
- If user doesn't mention a deadline, return it unchanged (or null)
- NEVER infer or guess deadlines from task name or context alone
- Resolve relative dates ("today", "tomorrow") using the provided timezone context

### Design Decisions
- AI-set deadlines look identical to user-picked ones (no visual distinction)
- AI-set deadlines persist and remain editable via the date picker
- Both `place-task` and `reschedule` can set deadlines
- No database migration needed — `deadline` column already exists

---

## Summary

Phase 6 delivers a complete AI rescheduling flow with:
- ✅ Edge Function with model fallback chain
- ✅ Dynamic token budget for fast responses
- ✅ Zod schema enforcement + malformed JSON cleanup
- ✅ Undo with 5-second timeout and snapshot restore
- ✅ Toast notification system
- ✅ Selective reschedule triggers (only when AI fields change)
- ✅ AI can set/edit deadlines when user explicitly requests
- ✅ 376 tests passing
- ✅ TypeScript clean
- ✅ Toast for info only (not errors)
- ✅ Inline errors in sheets
- ✅ Undo instantly updates screen

**Pending:** Edge Function deployment + OpenRouter API key configuration.
