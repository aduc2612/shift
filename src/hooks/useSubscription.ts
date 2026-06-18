import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { useFocusEffect } from 'expo-router';
import { getCustomerInfo } from '@/services/revenuecat';
import type { CustomerInfo } from 'react-native-purchases';

// ── Shared module-level store ─────────────────────────────────────────────
// Each component that calls useSubscription() must see the same subscription
// state. useState creates isolated state per component instance, so the
// paywall screen and root layout would each have their own copy.  When the
// paywall refreshed after purchase the root layout guards never updated.
// A tiny external store fixes this: one source of truth, all consumers
// subscribe and re-render together.

const ENTITLEMENT_ID = 'Shift AI Pro';

type SubState = {
  subscribed: boolean;
  customerInfo: CustomerInfo | null;
  loading: boolean;
};

let state: SubState = { subscribed: false, customerInfo: null, loading: true };
let listeners: Array<() => void> = [];

function emitChange() {
  for (const l of listeners) l();
}

function setState(next: Partial<SubState>) {
  state = { ...state, ...next };
  emitChange();
}

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getSnapshot() {
  return state;
}

// Fetch latest from RevenueCat and push into shared store.
// Single getCustomerInfo() call — we check entitlements inline rather than
// calling isSubscribed() which would fetch customer info a second time.
async function refreshStore() {
  try {
    const info = await getCustomerInfo();
    const active = ENTITLEMENT_ID in info.entitlements.active;
    setState({ customerInfo: info, subscribed: active, loading: false });
  } catch {
    setState({ subscribed: false, customerInfo: null, loading: false });
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────

export function useSubscription() {
  const snap = useSyncExternalStore(subscribe, getSnapshot);

  // Initial fetch on first mount.
  useEffect(() => {
    refreshStore();
  }, []);

  // Re-fetch whenever the consuming screen regains focus.
  useFocusEffect(
    useCallback(() => {
      refreshStore();
    }, []),
  );

  return {
    isSubscribed: snap.subscribed,
    isLoading: snap.loading,
    customerInfo: snap.customerInfo,
    refresh: refreshStore,
  };
}
