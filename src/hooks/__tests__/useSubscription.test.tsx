import { renderHook, waitFor } from '@testing-library/react-native';
import { getCustomerInfo, isSubscribed } from '@/services/revenuecat';

jest.mock('expo-router', () => ({
  useFocusEffect: jest.fn(),
}));

jest.mock('@/services/revenuecat', () => ({
  getCustomerInfo: jest.fn(),
  isSubscribed: jest.fn(),
}));

const mockedGetCustomerInfo = jest.mocked(getCustomerInfo);
const mockedIsSubscribed = jest.mocked(isSubscribed);

import { useSubscription } from '../useSubscription';

describe('useSubscription', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('resolves to not subscribed when no entitlement', async () => {
    mockedGetCustomerInfo.mockResolvedValue({ entitlements: { active: {} } } as any);
    mockedIsSubscribed.mockResolvedValue(false);

    const { result } = await renderHook(() => useSubscription());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isSubscribed).toBe(false);
  });

  it('resolves to subscribed when entitlement active', async () => {
    const info = { entitlements: { active: { 'Shift AI Pro': {} } } };
    mockedGetCustomerInfo.mockResolvedValue(info as any);
    mockedIsSubscribed.mockResolvedValue(true);

    const { result } = await renderHook(() => useSubscription());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isSubscribed).toBe(true);
    expect(result.current.customerInfo).toEqual(info);
  });

  it('handles errors gracefully', async () => {
    mockedGetCustomerInfo.mockRejectedValue(new Error('network'));
    mockedIsSubscribed.mockRejectedValue(new Error('network'));

    const { result } = await renderHook(() => useSubscription());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isSubscribed).toBe(false);
  });
});
