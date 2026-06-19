import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { getCustomerInfo } from '@/services/revenuecat';
import { ENTITLEMENT_ID } from '@/constants/limits';
import type { CustomerInfo } from 'react-native-purchases';

type SubState = {
  subscribed: boolean;
  customerInfo: CustomerInfo | null;
  loading: boolean;
  error: unknown;
};

let state: SubState = {
  subscribed: false,
  customerInfo: null,
  loading: true,
  error: null,
};
let listeners: Array<() => void> = [];

/** Reset shared state — used in tests to avoid leakage between test cases. */
export function resetSubscriptionState() {
  state = { subscribed: false, customerInfo: null, loading: true, error: null };
  listeners = [];
}

function emit() {
  for (const l of listeners) l();
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

function refreshStore() {
  (async () => {
    try {
      const customerInfo = await getCustomerInfo();
      const subscribed = ENTITLEMENT_ID in customerInfo.entitlements.active;
      state = { subscribed, customerInfo, loading: false, error: null };
    } catch (e) {
      // Preserve previous subscription state on transient errors (e.g. network blip).
      // Only a successful RevenueCat response can confirm no entitlement.
      console.error('[useSubscription] Failed to check subscription:', e);
      state = { ...state, loading: false, error: e };
    }
    emit();
  })();
}

// Expose refresh so callers (PaywallScreen, etc.) can force a re-check after purchases.
refreshStore.refresh = refreshStore;

export { refreshStore };

export function useSubscription() {
  const { subscribed, customerInfo, loading, error } = useSyncExternalStore(
    subscribe,
    getSnapshot,
  );

  useEffect(() => {
    refreshStore();
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (status) => {
      if (status === 'active') refreshStore();
    });
    return () => sub.remove();
  }, []);

  const refresh = useCallback(() => {
    state = { ...state, loading: true };
    emit();
    refreshStore();
  }, []);

  return { isSubscribed: subscribed, isLoading: loading, customerInfo, refresh, error };
}
