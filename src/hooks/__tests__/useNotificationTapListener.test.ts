import { renderHook } from '@testing-library/react-native';
import { useNotificationTapListener } from '../useNotificationTapListener';
import * as notifications from '@/services/notifications';

jest.mock('@/services/notifications', () => ({
  onNotificationTapped: jest.fn().mockReturnValue({ remove: jest.fn() }),
}));

describe('useNotificationTapListener', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers notification tap listener on mount', async () => {
    await renderHook(() => useNotificationTapListener());
    expect(notifications.onNotificationTapped).toHaveBeenCalled();
  });

  it('passes a callback function to onNotificationTapped', async () => {
    await renderHook(() => useNotificationTapListener());
    const callback = (notifications.onNotificationTapped as jest.Mock).mock
      .calls[0][0];
    expect(typeof callback).toBe('function');
  });

  it('removes listener on unmount', async () => {
    const mockRemove = jest.fn();
    (notifications.onNotificationTapped as jest.Mock).mockReturnValue({
      remove: mockRemove,
    });

    const { unmount } = await renderHook(() => useNotificationTapListener());
    await unmount();

    expect(mockRemove).toHaveBeenCalled();
  });
});
