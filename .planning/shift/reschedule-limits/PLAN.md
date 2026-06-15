# Reschedule Limits — Hard Ceilings on Dynamic Token & Timeout Budgets

## Objective

Add hard upper limits to the dynamic `maxTokens` and `timeout` calculations in the reschedule Edge Function so they cannot grow unbounded as task count increases.

## Context

Currently in `supabase/functions/reschedule/config.ts`:

```ts
export const TOKENS_PER_TASK = 150;
export const TOKENS_BASE = 300;
export const TIMEOUT_PER_TASK = 1_000;
export const TIMEOUT_BASE = 5_000;
```

And in `supabase/functions/reschedule/index.ts` (L81-82):

```ts
const maxTokens = tasks.length * TOKENS_PER_TASK + TOKENS_BASE;
const timeout = tasks.length * TIMEOUT_PER_TASK + TIMEOUT_BASE;
```

These scale linearly with no ceiling. A user with many tasks could produce an excessively large token budget or timeout. Add hard maximums so the values are always clamped.

## Files to Change

| File | Change |
|---|---|
| `supabase/functions/reschedule/config.ts` | Add `MAX_TOKENS` and `MAX_TIMEOUT_MS` constants |
| `supabase/functions/reschedule/index.ts` | Clamp `maxTokens` and `timeout` with `Math.min` |
| `supabase/functions/reschedule/config.test.ts` | New test file — verify clamping logic |

## Tasks

### Task 1: Add ceiling constants to `config.ts`

Add two new exported constants:

```ts
/** Hard ceiling — never exceed this regardless of task count */
export const MAX_TOKENS = 4_096;

/** Hard ceiling — never exceed this regardless of task count (ms) */
export const MAX_TIMEOUT_MS = 30_000;
```

**Rationale for values:**
- `MAX_TOKENS = 4096` — GPT-class models typically output well under this for structured JSON. 4096 is generous headroom.
- `MAX_TIMEOUT_MS = 30_000` (30s) — prevents the function from hanging for too long on a single model attempt. Edge Functions have their own invocation timeout but this keeps it tighter per-model.

### Task 2: Clamp in `index.ts`

Update the two lines where `maxTokens` and `timeout` are computed:

```ts
const maxTokens = Math.min(tasks.length * TOKENS_PER_TASK + TOKENS_BASE, MAX_TOKENS);
const timeout = Math.min(tasks.length * TIMEOUT_PER_TASK + TIMEOUT_BASE, MAX_TIMEOUT_MS);
```

Import `MAX_TOKENS` and `MAX_TIMEOUT_MS` from `./config.ts`.

### Task 3: Write tests

Create `supabase/functions/reschedule/config.test.ts`:

- **Test:** `maxTokens` formula with 1 task produces dynamic value (below ceiling)
- **Test:** `maxTokens` formula with 100 tasks is clamped to `MAX_TOKENS`
- **Test:** `timeout` formula with 1 task produces dynamic value (below ceiling)
- **Test:** `timeout` formula with 100 tasks is clamped to `MAX_TIMEOUT_MS`

These are pure-math tests — no mocks or network needed.

## Verification

1. `npm test` passes with new test file
2. Inspect Edge Function: confirm imports include new constants
3. Manual check: with `tasks.length = 1`, values are unchanged (dynamic < ceiling)
4. Manual check: with `tasks.length = 100`, values hit ceilings

## Done When

- [ ] `MAX_TOKENS` and `MAX_TIMEOUT_MS` exported from `config.ts`
- [ ] `maxTokens` and `timeout` clamped in `index.ts`
- [ ] Unit tests cover both below-ceiling and above-ceiling cases
- [ ] All existing tests still pass
- [ ] Edge Function redeployed (manual step)

## Manual Steps (User Action Required)

- Redeploy the `reschedule` Edge Function after merging changes:
  ```bash
  supabase functions deploy reschedule --project-ref <your-project-ref>
  ```

## Notes

- Ceiling values (`4096` tokens, `30s` timeout) are reasonable defaults. Adjust if real-world usage shows they're too tight or too loose.
- This is purely additive — no existing behavior changes for small task counts where the dynamic value is already below the ceiling.
