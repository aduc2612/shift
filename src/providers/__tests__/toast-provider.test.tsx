import React from 'react';
import { Animated } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';
import { ToastProvider, useToast } from '../toast-provider';

const mockTheme = {
  colors: {
    primary: '#000000',
    onPrimary: '#FFFFFF',
    surface: '#FFFFFF',
    onSurface: '#1C1C1C',
    surfaceVariant: '#F5F5F5',
    onSurfaceVariant: '#666666',
    outline: '#D0D0D0',
    outlineVariant: '#E0E0E0',
    scrim: '#00000066',
    shadow: '#000000',
  },
  typography: {
    titleSmall: { fontSize: 14, fontWeight: '700', lineHeight: 20 },
    bodyMedium: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
    labelLarge: { fontSize: 14, fontWeight: '700', lineHeight: 20 },
  },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
  borderRadius: { sm: 4, md: 8, lg: 12, xl: 16, xxl: 24 },
  shadows: { md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 } },
  interaction: { pressedOpacity: 0.6 },
  componentStyles: {},
};

jest.mock('@/providers/theme-provider', () => ({
  useTheme: () => mockTheme,
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Animated.timing uses rAF which doesn't fire synchronously in tests.
// Override start() to resolve the animated value immediately.
const originalTiming = Animated.timing;
jest.spyOn(Animated, 'timing').mockImplementation((value, config) => {
  const animation = originalTiming(value, config);
  return {
    ...animation,
    start: (cb?: (result: { finished: boolean }) => void) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (value as any).setValue(config.toValue);
      cb?.({ finished: true });
    },
  };
});

function ShowButton() {
  const toast = useToast();
  return (
    <Pressable testID="show-btn" onPress={() => toast.show({ message: 'Hello' })}>
      <Text>Show</Text>
    </Pressable>
  );
}

function HideButton() {
  const toast = useToast();
  return (
    <Pressable testID="hide-btn" onPress={() => toast.hide()}>
      <Text>Hide</Text>
    </Pressable>
  );
}

function TimedShowButton() {
  const toast = useToast();
  return (
    <Pressable testID="timed-btn" onPress={() => toast.show({ message: 'Timed', duration: 3000 })}>
      <Text>Show Timed</Text>
    </Pressable>
  );
}

describe('ToastProvider', () => {
  it('show displays toast with message', async () => {
    const { getByTestId, findByText } = await render(
      <ToastProvider>
        <ShowButton />
      </ToastProvider>,
    );

    fireEvent.press(getByTestId('show-btn'));
    expect(await findByText('Hello')).toBeTruthy();
  }, 10000);

  it('hide hides toast', async () => {
    const { getByTestId, findByText, queryByText } = await render(
      <ToastProvider>
        <ShowButton />
        <HideButton />
      </ToastProvider>,
    );

    fireEvent.press(getByTestId('show-btn'));
    await findByText('Hello');

    fireEvent.press(getByTestId('hide-btn'));
    await waitFor(() => {
      expect(queryByText('Hello')).toBeNull();
    });
  });

  it('auto-dismisses after duration', async () => {
    jest.useFakeTimers();
    const { getByTestId, findByText, queryByText } = await render(
      <ToastProvider>
        <TimedShowButton />
      </ToastProvider>,
    );

    fireEvent.press(getByTestId('timed-btn'));
    await findByText('Timed');

    jest.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(queryByText('Timed')).toBeNull();
    });
    jest.useRealTimers();
  });
});
