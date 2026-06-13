# Phase 5 — Task Management — Summary

## Outcome
✅ Complete — all tasks done, verification passes.

## Files Created (7)

### API & Hooks
- `src/features/schedule/api.ts` — Supabase CRUD functions (fetchTasks, createTask, updateTask, deleteTask, toggleTaskComplete) with camelCase↔snake_case mapping
- `src/features/schedule/hooks/useTasks.ts` — TanStack Query hooks with optimistic updates for completion toggle
- `src/providers/query-provider.tsx` — QueryClient provider wrapping app root

### Components
- `src/components/primitives/Alert.tsx` — Custom modal alert dialog (no React Native Alert)

### Tests
- `src/components/primitives/__tests__/Alert.test.tsx` — Alert component tests (7 tests)
- `src/features/schedule/__tests__/api.test.ts` — API function tests (mocked Supabase)
- `src/features/schedule/__tests__/useTasks.test.tsx` — Hook tests with optimistic update coverage

### Planning
- `.planning/shift/05-01-PLAN.md` — Execution plan

## Files Modified (7)
- `package.json` — Added `@tanstack/react-query`
- `src/app/_layout.tsx` — Added `QueryProvider` to app root
- `src/app/(tabs)/index.tsx` — Replaced mock data with `useTasks` hook, wired all CRUD handlers, added loading/error states
- `src/features/schedule/components/TaskFormSheet.tsx` — Wired save/delete, added delete button with Alert confirmation, disabled "Let AI decide" toggle, input bg changed to `surfaceVariant`
- `src/features/schedule/components/RescheduleSheet.tsx` — Updated text/input colors for background sheet
- `src/components/primitives/BottomSheet.tsx` — Sheet bg changed from `surface` to `background`
- `src/components/primitives/Alert.tsx` — Card bg changed from `surface` to `background`, shadow uses theme tokens, added `onRequestClose` for Android

## SQL Migrations
- `003_grant_table_permissions.sql` — Grants SELECT, INSERT, UPDATE, DELETE on tasks and SELECT, INSERT, UPDATE on user_preferences to authenticated role

## Packages Changed
- **Added:** `@tanstack/react-query` (server state management)

## Verification
- `npx tsc --noEmit` — ✅ zero errors
- `npx expo lint` — ✅ 0 errors, 15 warnings (pre-existing)
- `npm test` — ✅ 129 tests passing (was 122 in Phase 4)

## Design Decisions
- **TanStack Query** for all server state — no Zustand caching of tasks
- **Optimistic updates** on completion toggle for instant feedback with rollback on error
- **"Let AI decide" toggle** disabled/forced-off until Phase 6 (no AI to assign times yet)
- **Custom Alert** from scratch — modal with scrim backdrop, theme-aware, `onRequestClose` for Android back button
- **RLS handles user filtering** — no explicit `user_id` filter in fetchTasks, relies on Supabase RLS
- **createTask gets userId** from `supabase.auth.getUser()` — not from client form data
- **Delete button** in edit mode with hitSlop and minHeight 48 for touch target
- **Sheet backgrounds** use `background` (recessed), inputs use `surfaceVariant`, text uses `onBackground`
- **TaskFormSheet** uses conditional rendering with `key` prop instead of useEffect for prop sync
- **handleDelete** waits for mutation success before closing sheet

## Color Pattern (Sheets/Modals)
| Layer | Background | Text |
|-------|-----------|------|
| App screen | `background` | `onBackground` |
| Sheet/modal | `background` | `onBackground` |
| Cards/containers on sheet | `surface` | `onSurface` |
| Input fields | `surfaceVariant` | `onSurface` |
| Secondary text | — | `onSurfaceVariant` |

## Open Items for Next Phases
- "Let AI decide" toggle remains disabled — Phase 6 will enable it
- Tasks without `startTime`/`endTime` not supported — Phase 6 will handle AI-assigned times
- No offline queue for mutations (TanStack Query retry handles transient errors)
- Reschedule sheet CTA is no-op — wiring to AI service in Phase 6
