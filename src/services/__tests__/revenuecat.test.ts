import { configureRevenueCat, getCustomerInfo, isSubscribed, presentPaywall, presentPaywallIfNeeded, presentCustomerCenter } from '../revenuecat';
import Purchases from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';

const mockedPurchases = jest.mocked(Purchases);
const mockedUI = jest.mocked(RevenueCatUI);

describe('revenuecat service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('configureRevenueCat resolves without error', async () => {
    await expect(configureRevenueCat()).resolves.toBeUndefined();
  });

  it('isSubscribed returns true when entitlement active', async () => {
    mockedPurchases.getCustomerInfo.mockResolvedValue({
      entitlements: { active: { 'Shift AI Pro': {} } },
    } as any);

    expect(await isSubscribed()).toBe(true);
  });

  it('isSubscribed returns false when no entitlement', async () => {
    mockedPurchases.getCustomerInfo.mockResolvedValue({
      entitlements: { active: {} },
    } as any);

    expect(await isSubscribed()).toBe(false);
  });

  it('presentPaywall returns true on PURCHASED', async () => {
    mockedUI.presentPaywall.mockResolvedValue(PAYWALL_RESULT.PURCHASED);
    expect(await presentPaywall()).toBe(true);
  });

  it('presentPaywall returns true on RESTORED', async () => {
    mockedUI.presentPaywall.mockResolvedValue(PAYWALL_RESULT.RESTORED);
    expect(await presentPaywall()).toBe(true);
  });

  it('presentPaywall returns false on CANCELLED', async () => {
    mockedUI.presentPaywall.mockResolvedValue(PAYWALL_RESULT.CANCELLED);
    expect(await presentPaywall()).toBe(false);
  });

  it('presentPaywallIfNeeded returns true when NOT_PRESENTED (already subscribed)', async () => {
    mockedUI.presentPaywallIfNeeded.mockResolvedValue(PAYWALL_RESULT.NOT_PRESENTED);
    expect(await presentPaywallIfNeeded()).toBe(true);
  });

  it('presentCustomerCenter calls RevenueCatUI', async () => {
    await presentCustomerCenter();
    expect(mockedUI.presentCustomerCenter).toHaveBeenCalled();
  });
});
