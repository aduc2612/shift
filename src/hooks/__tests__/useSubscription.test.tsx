import { renderHook, waitFor } from '@testing-library/react-native';
import { getCustomerInfo } from '@/services/revenuecat';

jest.mock('expo-router', () => ({
  useFocusEffect: jest.fn(),
}));

jest.mock('@/services/revenuecat', () => ({
  getCustomerInfo: jest.fn(),
}));

const mockedGetCustomerInfo = jest.mocked(getCustomerInfo);

import { useSubscription } from '../useSubscription';

describe('useSubscription', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts in loading state', async () => {
    mockedGetCustomerInfo.mockReturnValue(new Promise(() => {})); // never resolves

    const { result } = await renderHook(() => useSubscription());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isSubscribed).toBe(false);
    expect(result.current.customerInfo).toBeNull();
  });

  it('resolves to not subscribed when no entitlement', async () => {
    mockedGetCustomerInfo.mockResolvedValue({ entitlements: { active: {} } } as any);

    const { result } = await renderHook(() => useSubscription());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockedGetCustomerInfo).toHaveBeenCalledTimes(1);
    expect(result.current.isSubscribed).toBe(false);
    expect(result.current.customerInfo).toEqual({ entitlements: { active: {} } });
  });

  it('resolves to subscribed when entitlement active', async () => {
    const info = { entitlements: { active: { 'Shift AI Pro': {} } } };
    mockedGetCustomerInfo.mockResolvedValue(info as any);

    const { result } = await renderHook(() => useSubscription());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockedGetCustomerInfo).toHaveBeenCalledTimes(1);
    expect(result.current.isSubscribed).toBe(true);
    expect(result.current.customerInfo).toEqual(info);
  });

  it('handles errors gracefully', async () => {
    mockedGetCustomerInfo.mockRejectedValue(new Error('network'));

    const { result } = await renderHook(() => useSubscription());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockedGetCustomerInfo).toHaveBeenCalledTimes(1);
    expect(result.current.isSubscribed).toBe(false);
    expect(result.current.customerInfo).toBeNull();
  });
});
