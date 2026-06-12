import { renderHook, act } from '@testing-library/react-native';
import { useCurrentTime } from '@/hooks/useCurrentTime';

describe('useCurrentTime', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-12T10:00:00'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns a Date on initial render', async () => {
    const { result } = await renderHook(() => useCurrentTime());
    expect(result.current).toBeInstanceOf(Date);
    expect(result.current!.getTime()).toBe(
      new Date('2026-06-12T10:00:00').getTime(),
    );
  });

  it('advances after the default interval (30s)', async () => {
    const { result } = await renderHook(() => useCurrentTime(30_000));

    await act(async () => {
      jest.advanceTimersByTime(30_000);
    });

    expect(result.current!.getTime()).toBe(
      new Date('2026-06-12T10:00:30').getTime(),
    );
  });

  it('uses a custom interval', async () => {
    const { result } = await renderHook(() => useCurrentTime(10_000));

    await act(async () => {
      jest.advanceTimersByTime(10_000);
    });

    expect(result.current!.getTime()).toBe(
      new Date('2026-06-12T10:00:10').getTime(),
    );
  });

  it('cleans up the interval on unmount', async () => {
    const { result, unmount } = await renderHook(() => useCurrentTime(30_000));

    const initialTime = result.current!.getTime();
    await unmount();

    // After unmount, advancing timers should NOT update the hook's state
    jest.advanceTimersByTime(30_000);
    expect(result.current!.getTime()).toBe(initialTime);
  });
});
