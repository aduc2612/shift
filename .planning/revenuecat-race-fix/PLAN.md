# Fix: RevenueCat "no singleton instance" race condition

## Problem

`configureRevenueCat()` is called as fire-and-forget in `RootNavigator`'s `useEffect`. `useSubscription` mounts on the same cycle and calls `getCustomerInfo()` before `configure()` has resolved, throwing `UninitializedPurchasesError`.

## Solution

Move RevenueCat configuration to module level in `revenuecat.ts`, capturing the promise. Have `getCustomerInfo()` await that promise before making any SDK call.

## Changes

### 1. `src/services/revenuecat.ts`

- Add a module-level `const ready = Purchases.configure({ apiKey: API_KEY })` (runs on import)
- Add `await ready` at the top of `getCustomerInfo()`
- Keep `configureRevenueCat()` as a no-op / thin wrapper for backward compat (tests import it)
- Remove the unused `ENTITLEMENT_ID` export if it's only used locally (check first)

### 2. `src/app/_layout.tsx`

- Remove `import { configureRevenueCat }` 
- Remove `configureRevenueCat().catch(...)` from the `useEffect`

### 3. Tests

- Update `src/services/__tests__/revenuecat.test.ts` to reflect the new pattern (configure happens at import, not via explicit call)

## Verification

- `npx tsc --noEmit`
- `npm test`
- Console should show no "no singleton instance" errors on app launch
