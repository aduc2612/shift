import Purchases, { type CustomerInfo } from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';

const API_KEY = 'test_RjiJngvmmoReLpTJNcmunXnrJSf';
const ENTITLEMENT_ID = 'Shift AI Pro';

// Configure once at import time — creates the singleton on the native side
// before any component mounts. The native bridge call completes well before
// any useEffect fires.
Purchases.configure({ apiKey: API_KEY });

/** Backward-compat wrapper — callers that imported this still work. */
export async function configureRevenueCat(): Promise<void> {
  // Already configured at import. No-op.
}

export async function getCustomerInfo(): Promise<CustomerInfo> {
  return Purchases.getCustomerInfo();
}

export async function isSubscribed(): Promise<boolean> {
  const info = await getCustomerInfo();
  const active = ENTITLEMENT_ID in info.entitlements.active;
  console.log('[RevenueCat] isSubscribed check:', active, '| Active entitlements:', Object.keys(info.entitlements.active));
  return active;
}

export async function presentPaywall(): Promise<boolean> {
  const result = await RevenueCatUI.presentPaywall();
  return result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED;
}

export async function presentPaywallIfNeeded(): Promise<boolean> {
  const result = await RevenueCatUI.presentPaywallIfNeeded({
    requiredEntitlementIdentifier: ENTITLEMENT_ID,
  });
  return result === PAYWALL_RESULT.NOT_PRESENTED || result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED;
}

export async function presentCustomerCenter(): Promise<void> {
  await RevenueCatUI.presentCustomerCenter();
}
