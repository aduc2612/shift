import { Text, useColorScheme } from 'react-native';
import { act, render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider, useTheme, useThemePreference } from '../theme-provider';

const mockUseColorScheme = useColorScheme as jest.Mock;

function Probe() {
  const { preference, setThemePreference } = useThemePreference();
  const theme = useTheme();
  return (
    <>
      <Text testID="pref">{preference}</Text>
      <Text testID="isDark">{String(theme.isDark)}</Text>
      <Text testID="set" onPress={() => setThemePreference('dark')}>set-dark</Text>
      <Text testID="set-light" onPress={() => setThemePreference('light')}>set-light</Text>
    </>
  );
}

describe('ThemeProvider', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
    mockUseColorScheme.mockReturnValue('light');
  });

  it('defaults to "system" preference on first launch', async () => {
    const { getByTestId } = await render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(getByTestId('pref').props.children).toBe('system');
    });
  });

  it('reads stored preference from AsyncStorage on mount', async () => {
    await AsyncStorage.setItem('theme-preference', 'dark');

    const { getByTestId } = await render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(getByTestId('pref').props.children).toBe('dark');
      expect(getByTestId('isDark').props.children).toBe('true');
    });
  });

  it('uses system color scheme when preference is "system"', async () => {
    mockUseColorScheme.mockReturnValue('dark');

    const { getByTestId } = await render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(getByTestId('pref').props.children).toBe('system');
      expect(getByTestId('isDark').props.children).toBe('true');
    });
  });

  it('forces light theme when preference is "light" regardless of system', async () => {
    mockUseColorScheme.mockReturnValue('dark');
    await AsyncStorage.setItem('theme-preference', 'light');

    const { getByTestId } = await render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(getByTestId('pref').props.children).toBe('light');
      expect(getByTestId('isDark').props.children).toBe('false');
    });
  });

  it('setThemePreference writes to AsyncStorage and updates state', async () => {
    const { getByTestId } = await render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(getByTestId('pref').props.children).toBe('system');
    });

    await act(async () => {
      getByTestId('set').props.onPress();
    });

    await waitFor(() => {
      expect(getByTestId('pref').props.children).toBe('dark');
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith('theme-preference', 'dark');
  });
});
