# Fix — Toast visibility inside modals — Summary

## What Changed

### Files Modified
- `src/providers/toast-provider.tsx` — exposed `toast` state in context (previously only `show`/`hide` were available to consumers)
- `src/components/primitives/BottomSheet.tsx` — renders a second `<Toast />` instance inside the `<Modal>` so toasts appear in the same native window as bottom sheets
- `src/components/primitives/Toast.tsx` — replaced `PanResponder` swipe-to-dismiss with `Pressable` tap-to-dismiss (gestures don't reliably cross Modal native window boundaries)
- `src/components/primitives/__tests__/BottomSheet.test.tsx` — wrapped test renders in `<ToastProvider>` since `BottomSheet` now calls `useToast()`
- `src/app/(tabs)/settings.tsx` — added "Test toast in sheet" debug row (DEV only) that opens a bottom sheet and fires a toast simultaneously

## Problem
React Native's `<Modal>` creates a separate native window that renders on top of the root application view. The `<Toast>` component was rendered at root level (inside `ToastProvider` in `_layout.tsx`), so it appeared behind any open bottom sheet or modal.

## Solution
The `BottomSheet` primitive is the single chokepoint for all modals in the app. By rendering a `<Toast>` instance inside `BottomSheet`'s `<Modal>` that reads from the same `ToastProvider` context, the toast now appears in the correct native window. No new providers, no new dependencies.

For dismiss interaction, `PanResponder` was unreliable inside Modal contexts (the modal's native layer intercepts gestures). Replaced with a `Pressable` wrapper — tap anywhere on the toast to dismiss. Inner action buttons (e.g. "Undo") are nested `Pressable` components that capture their own press without bubbling up.

## Verification
- ✅ TypeScript: `npx tsc --noEmit` — no errors
- ✅ Tests: 11 toast/BottomSheet tests all passing
- ✅ No existing tests broken
