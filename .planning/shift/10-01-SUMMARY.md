# Phase 10 — RevenueCat Integration — Summary

## What Changed

### Files Created
- `src/hooks/useSubscription.ts` — hook for subscription status, backed by shared module-level store (`useSyncExternalStore`) so all consumers see the same state
- `src/app/(paywall).tsx` — standalone paywall screen using native `RevenueCatUI.Paywall` component
- `src/constants/limits.ts` — `PLAN_LABELS` mapping RevenueCat product identifiers to display names
- `src/services/__tests__/revenuecat.test.ts` — 8 tests for service layer
- `src/hooks/__tests__/useSubscription.test.tsx` — 3 tests for hook

### Files Modified
- `src/services/revenuecat.ts` — full implementation: `configureRevenueCat`, `getCustomerInfo`, `isSubscribed`, `presentPaywall`, `presentPaywallIfNeeded`, `presentCustomerCenter`
- `src/app/_layout.tsx` — RevenueCat SDK init on startup; paywall route in Stack.Protected
- `src/features/onboarding/hooks/useOnboardingRouting.ts` — added `shouldShowPaywall` guard (subscribed → tabs, not subscribed → paywall)
- `src/features/schedule/hooks/useReschedule.ts` — subscription check before AI reschedule
- `src/app/(tabs)/settings.tsx` — Subscription section with current plan (mapped via `PLAN_LABELS`), renewal date, Customer Center
- `jest.setup.ts` — mocks for `react-native-purchases` and `react-native-purchases-ui`
- `src/hooks/__tests__/useOnboardingRouting.test.tsx` — added `useSubscription` mock
- `src/app/(tabs)/__tests__/settings.test.tsx` — added subscription/revenuecat mocks
- `src/features/schedule/__tests__/useReschedule.test.tsx` — added revenuecat mock

### Bug Fixes (post-initial implementation)
- **Paywall not redirecting after purchase:** `useSubscription` used per-component `useState`, so the paywall screen and root layout had isolated state. Refactored to a shared module-level store using `useSyncExternalStore` — one source of truth, all consumers re-render together.
- **`onPurchaseCompleted` was a no-op:** Now calls `refresh()` immediately on purchase, not waiting for `onDismiss`.
- **Plan label hardcoded to "Shift AI Pro":** Now maps `productIdentifier` to "Shift AI Pro Monthly" / "Shift AI Pro Yearly" via `PLAN_LABELS`.

### Dependencies Added
- `react-native-purchases` (core SDK)
- `react-native-purchases-ui` (native paywall + customer center)

## Verification
- ✅ TypeScript: `npx tsc --noEmit` — no errors
- ✅ Tests: 47 suites, 362 tests all passing
- ✅ No existing tests broken

## Manual Steps Required
- [ ] RevenueCat dashboard: verify entitlement `default` exists
- [ ] RevenueCat dashboard: verify products `yearly_sub`/`monthly_main` attached to offering
- [ ] RevenueCat dashboard: configure paywall design (visual editor)
- [ ] iOS: enable In-App Purchase capability in Xcode
- [ ] Android: verify BILLING permission in AndroidManifest.xml
- [ ] Test purchases with sandbox accounts on device
