# Error Handling — Summary

Comprehensive error handling hardening across the app. Two phases: critical/medium fixes, then inline-to-toast migration.

---

## Phase 1: Critical + Medium Fixes

### ErrorBoundary
- `src/components/primitives/ErrorBoundary.tsx` — class component wrapping the root layout
- Catches render crashes via `getDerivedStateFromError` + `componentDidCatch`
- Logs to Sentry, shows "Try again" button that resets state
- `src/app/_layout.tsx` — wraps `RootNavigator`, replaces blank loading screen with `ActivityIndicator`

### fetchWithTimeout
- `src/services/ai.ts` — `fetchWithTimeout` helper wrapping `fetch` with `AbortController`
- 90s timeout for reschedule, 30s for place-task
- Converts `TypeError` to "Network error. Check your connection." and `AbortError` to "Request timed out."
- HTTP errors sanitized: generic user-facing message, details logged to console

### Silent Mutation Failures → Toasts
- `src/features/schedule/hooks/useReschedule.ts` — `onError` shows toast
- `src/features/schedule/hooks/usePlaceTask.ts` — `onError` shows toast, `handleUndo` wrapped in try/catch
- `src/features/schedule/hooks/useTasks.ts` — `useDeleteTask` and `useToggleComplete` show toast on error
- `src/features/profile/hooks/useUpdateUserPreferences.ts` — `onError` shows toast

### syncNotifications Hardening
- `src/services/notifications.ts` — outer try/catch around `cancelAll`, per-task try/catch with `continue` on failure
- Date validation: `isNaN` guard before scheduling, skips invalid dates silently

### Subscription State Preservation
- `src/hooks/useSubscription.ts` — on RevenueCat error, spreads previous state instead of resetting `subscribed` to false
- Exports `resetSubscriptionState()` for test isolation
- `src/constants/limits.ts` — consolidated `ENTITLEMENT_ID` export

### SecureStore Resilience
- `src/services/supabase.ts` — try/catch on all `getItem`/`setItem`/`removeItem` operations
- `isNaN` guards on `parseInt` for chunk metadata

### Edge Function Hardening
- `supabase/functions/reschedule/index.ts` — `req.json()` wrapped in try/catch, explicit `OPENROUTER_API_KEY` check before creating OpenAI client
- `supabase/functions/place-task/index.ts` — same `OPENROUTER_API_KEY` check

### Query/Mutation Cache Logging
- `src/providers/query-provider.tsx` — `QueryCache` and `MutationCache` with `onError` callbacks logging to Sentry

---

## Phase 2: Inline-to-Toast Migration

### RescheduleSheet
- `src/features/schedule/components/RescheduleSheet.tsx` — removed `error` state, `setError` calls, inline error JSX, `errorText` style. Catch block now calls `toast.show()`.

### TaskFormSheet
- `src/features/schedule/components/TaskFormSheet.tsx` — removed `submitError` state, clearing `useEffect`, error banner JSX, `errorBanner`/`errorBannerText` styles. AI placement catch and manual save catch now call `toast.show()`.

### Auth Screen
- `src/features/auth/hooks/useGoogleSignIn.ts` — removed `error` state and `setError`, catch calls `toast.show()`, removed `error` from return value
- `src/app/(auth)/index.tsx` — removed inline error JSX, `error` destructuring, `errorText` style

### Schedule Tabs
- `src/app/(tabs)/index.tsx` — removed full-screen `isError` early return. Added `useEffect` watching `isError` → `toast.show()`. Removed `error` from `useTasks` destructuring, `errorContainer`/`errorText` styles.

### Processing Theatre
- `src/app/(onboarding)/processing-theatre.tsx` — removed `error` state, `setError` calls, error box JSX + styles. Catch shows toast and auto-retries up to 3x with 2s delay. Final toast on exhaustion.

---

## Onboarding Routing Fix

- `src/features/onboarding/hooks/useOnboardingRouting.ts` — destructures `error` from `useSubscription()` and `isError` from `useOnboardingStatus()`. Keeps `loading: true` when either is truthy, preventing incorrect routing to paywall on transient errors.

---

## Files Changed

### Created
- `src/components/primitives/ErrorBoundary.tsx`

### Modified
- `src/app/_layout.tsx`
- `src/app/(tabs)/index.tsx`
- `src/app/(auth)/index.tsx`
- `src/app/(onboarding)/processing-theatre.tsx`
- `src/features/schedule/components/RescheduleSheet.tsx`
- `src/features/schedule/components/TaskFormSheet.tsx`
- `src/features/schedule/hooks/useReschedule.ts`
- `src/features/schedule/hooks/usePlaceTask.ts`
- `src/features/schedule/hooks/useTasks.ts`
- `src/features/auth/hooks/useGoogleSignIn.ts`
- `src/features/profile/hooks/useUpdateUserPreferences.ts`
- `src/features/onboarding/hooks/useOnboardingRouting.ts`
- `src/hooks/useSubscription.ts`
- `src/constants/limits.ts`
- `src/services/ai.ts`
- `src/services/notifications.ts`
- `src/services/supabase.ts`
- `src/providers/query-provider.tsx`
- `supabase/functions/reschedule/index.ts`
- `supabase/functions/place-task/index.ts`

### Tests Updated
- `src/features/schedule/components/__tests__/RescheduleSheet.test.tsx`
- `src/features/schedule/components/__tests__/TaskFormSheet.test.tsx`
- `src/features/schedule/components/__tests__/TaskFormSheet.ai.test.tsx`
- `src/features/profile/__tests__/SchedulingContextSheet.test.tsx`
- `src/hooks/__tests__/useSubscription.test.tsx`
- `src/hooks/__tests__/useOnboardingRouting.test.tsx`
- `src/services/__tests__/ai.test.ts`

## Verification
- ✅ 47 test suites, 370 tests all passing
- ✅ No inline error text remaining in user-facing UI
- ✅ All error paths show toast notifications
- ✅ Onboarding routing stays on loading screen when subscription/status queries fail
