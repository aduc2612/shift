import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ToastProvider } from '@/providers/toast-provider';
import BottomSheet from '../BottomSheet';

const mockTheme = {
  colors: { primary: '#FFFFFF', onPrimary: '#000000', surface: '#1E1E1E', surfaceVariant: '#2C2C2C', onSurface: '#E6E6E6', onSurfaceVariant: '#AAAAAA', outline: '#808080', outlineVariant: '#404040', onBackground: '#E6E6E6', background: '#121212', scrim: '#00000066', error: '#CF6679' },
  typography: { labelSmall: { fontSize: 11 }, bodySmall: { fontSize: 12 }, bodyMedium: { fontSize: 14 }, labelMedium: { fontSize: 13 }, titleLarge: { fontSize: 22, fontWeight: '600' } },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 40, xxxxl: 48 },
  borderRadius: { sm: 4, md: 8, lg: 12, xl: 16, xxl: 24 },
  shadows: { lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 } },
  interaction: { pressedOpacity: 0.7 },
  componentStyles: { button: {} },
};
jest.mock('@/providers/theme-provider', () => ({
  useTheme: () => mockTheme,
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text: RNText } = require('react-native');
  return {
    Ionicons: (props: Record<string, unknown>) => React.createElement(RNText, { ...props, testID: 'icon-' + (props.name || 'icon') }, props.name || 'icon'),
  };
});

function renderWithProviders(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe('BottomSheet', () => {
  it('renders children when visible', async () => {
    const onClose = jest.fn();
    const { getByTestId, getByText } = await renderWithProviders(
      <BottomSheet visible={true} onClose={onClose}>
        <Text testID="child-content">Sheet Content</Text>
      </BottomSheet>,
    );
    expect(getByTestId('child-content')).toBeTruthy();
    expect(getByText('Sheet Content')).toBeTruthy();
  });

  it('does not render children when visible=false', async () => {
    const onClose = jest.fn();
    const { queryByTestId } = await renderWithProviders(
      <BottomSheet visible={false} onClose={onClose}>
        <Text testID="child-content">Sheet Content</Text>
      </BottomSheet>,
    );
    expect(queryByTestId('child-content')).toBeNull();
  });

  it('calls onClose when backdrop is pressed', async () => {
    const onClose = jest.fn();
    const { getByTestId } = await renderWithProviders(
      <BottomSheet visible={true} onClose={onClose}>
        <Text>Content</Text>
      </BottomSheet>,
    );
    fireEvent.press(getByTestId('bottom-sheet-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

