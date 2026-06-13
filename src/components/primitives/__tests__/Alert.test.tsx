import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Alert from '../Alert';

const mockTheme = {
  colors: {
    primary: '#FFFFFF',
    onPrimary: '#000000',
    onError: '#000000',
    surface: '#1E1E1E',
    surfaceVariant: '#2C2C2C',
    onSurface: '#E6E6E6',
    onSurfaceVariant: '#AAAAAA',
    outline: '#808080',
    outlineVariant: '#404040',
    onBackground: '#E6E6E6',
    background: '#121212',
    scrim: '#00000066',
    error: '#CF6679',
  },
  typography: {
    labelSmall: { fontSize: 11 },
    bodySmall: { fontSize: 12 },
    bodyMedium: { fontSize: 14 },
    labelMedium: { fontSize: 13 },
    titleSmall: { fontSize: 14, fontWeight: '500' },
    titleMedium: { fontSize: 16, fontWeight: '500' },
    titleLarge: { fontSize: 22, fontWeight: '600' },
  },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 40, xxxxl: 48 },
  borderRadius: { sm: 4, md: 8, lg: 12, xl: 16, xxl: 24 },
  shadows: {
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
  },
  interaction: { pressedOpacity: 0.7 },
  componentStyles: { button: {} },
};

jest.mock('@/providers/theme-provider', () => ({
  useTheme: () => mockTheme,
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe('Alert', () => {
  it('renders title and message when visible', async () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    const { getByText } = await render(
      <Alert
        visible={true}
        title="Delete task?"
        message="This cannot be undone."
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    expect(getByText('Delete task?')).toBeTruthy();
    expect(getByText('This cannot be undone.')).toBeTruthy();
  });

  it('calls onCancel when cancel button pressed', async () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    const { getByText } = await render(
      <Alert
        visible={true}
        title="Delete task?"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    fireEvent.press(getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('calls onConfirm when confirm button pressed', async () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    const { getByText } = await render(
      <Alert
        visible={true}
        title="Delete task?"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    fireEvent.press(getByText('Confirm'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('calls onCancel when backdrop pressed', async () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    const { getByTestId } = await render(
      <Alert
        visible={true}
        title="Delete task?"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    // The outermost Pressable is the backdrop
    const backdrop = getByTestId('alert-backdrop');
    fireEvent.press(backdrop);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('uses custom button labels when provided', async () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    const { getByText, queryByText } = await render(
      <Alert
        visible={true}
        title="Delete task?"
        confirmLabel="Delete"
        cancelLabel="Keep"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    expect(getByText('Delete')).toBeTruthy();
    expect(getByText('Keep')).toBeTruthy();
    expect(queryByText('Confirm')).toBeNull();
    expect(queryByText('Cancel')).toBeNull();
  });

  it('does not render when visible is false', async () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    const { queryByText } = await render(
      <Alert
        visible={false}
        title="Delete task?"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    expect(queryByText('Delete task?')).toBeNull();
  });

  it('renders message only when provided', async () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    const { queryByText } = await render(
      <Alert
        visible={true}
        title="Delete task?"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    // Message not rendered when not provided
    expect(queryByText('This cannot be undone.')).toBeNull();
  });
});
