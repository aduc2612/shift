import { renderHook, act } from '@testing-library/react-native';
import { Keyboard, Platform } from 'react-native';
import { useKeyboardHeight } from '../useKeyboardHeight';

describe('useKeyboardHeight', () => {
  let showHandler: Function;
  let hideHandler: Function;
  const removeMock = jest.fn();

  beforeEach(() => {
    removeMock.mockClear();
    jest.spyOn(Keyboard, 'addListener').mockImplementation(((event: string, handler: any) => {
      if (event.includes('Show')) showHandler = handler;
      if (event.includes('Hide')) hideHandler = handler;
      return { remove: removeMock } as any;
    }) as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns 0 initially', async () => {
    const { result } = await renderHook(() => useKeyboardHeight());
    expect(result.current).toBe(0);
  });

  it('updates height when keyboard show event fires', async () => {
    const { result } = await renderHook(() => useKeyboardHeight());

    await act(async () => {
      showHandler!({ endCoordinates: { height: 300 } });
    });

    expect(result.current).toBe(300);
  });

  it('resets height to 0 when keyboard hide event fires', async () => {
    const { result } = await renderHook(() => useKeyboardHeight());

    await act(async () => {
      showHandler!({ endCoordinates: { height: 300 } });
    });
    expect(result.current).toBe(300);

    await act(async () => {
      hideHandler!();
    });
    expect(result.current).toBe(0);
  });

  it('removes listeners on unmount', async () => {
    const { unmount } = await renderHook(() => useKeyboardHeight());

    await unmount();

    // remove() called once per listener (show + hide)
    expect(removeMock).toHaveBeenCalledTimes(2);
  });
});
