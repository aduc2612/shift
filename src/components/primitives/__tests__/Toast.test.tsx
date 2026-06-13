import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Toast from '../Toast';

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

describe('Toast', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders message when visible', async () => {
    const { getByText } = await render(
      <Toast visible message="Task saved" onDismiss={jest.fn()} />,
    );
    expect(getByText('Task saved')).toBeTruthy();
  });

  it('does not render when not visible', async () => {
    const { queryByText } = await render(
      <Toast visible={false} message="Task saved" onDismiss={jest.fn()} />,
    );
    expect(queryByText('Task saved')).toBeNull();
  });

  it('renders action button when actionLabel provided', async () => {
    const { getByText } = await render(
      <Toast visible message="Updated" actionLabel="Undo" onDismiss={jest.fn()} />,
    );
    expect(getByText('Undo')).toBeTruthy();
  });

  it('calls onAction when action button pressed', async () => {
    const onAction = jest.fn();
    const { getByText } = await render(
      <Toast visible message="Updated" actionLabel="Undo" onAction={onAction} onDismiss={jest.fn()} />,
    );
    fireEvent.press(getByText('Undo'));
    expect(onAction).toHaveBeenCalled();
  });

  it('calls onDismiss after duration', async () => {
    const onDismiss = jest.fn();
    await render(
      <Toast visible message="Updated" onDismiss={onDismiss} duration={5000} />,
    );
    jest.advanceTimersByTime(5000);
    expect(onDismiss).toHaveBeenCalled();
  });
});
