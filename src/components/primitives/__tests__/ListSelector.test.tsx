import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import ListSelector from '../ListSelector';

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
    background: '#f4f3f8',
  },
  typography: {
    titleLarge: { fontSize: 22, fontWeight: '700', lineHeight: 28 },
    titleMedium: { fontSize: 16, fontWeight: '700', lineHeight: 24 },
    bodyMedium: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
    bodySmall: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
  },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
  borderRadius: { sm: 4, md: 8, lg: 12, xl: 16, xxl: 24 },
  shadows: {},
  interaction: { pressedOpacity: 0.6 },
  componentStyles: {},
};

jest.mock('@/providers/theme-provider', () => ({
  useTheme: () => mockTheme,
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@/components/primitives/BottomSheet', () => {
  const R = require('react');
  const RN = require('react-native');
  return {
    __esModule: true,
    default: ({ visible, children, onClose }: { visible: boolean; children: React.ReactNode; onClose: () => void }) => {
      if (!visible) return null;
      return R.createElement(RN.View, { testID: 'list-selector-sheet' }, [
        R.createElement(RN.Pressable, { key: 'backdrop', testID: 'backdrop', onPress: onClose }),
        R.createElement(RN.View, { key: 'content' }, children),
      ]);
    },
  };
});

describe('ListSelector', () => {
  const options = [
    { value: 'a', label: 'Option A' },
    { value: 'b', label: 'Option B' },
    { value: 'c', label: 'Option C' },
  ];

  it('renders nothing when not visible', async () => {
    const { queryByText } = await render(
      <ListSelector
        visible={false}
        onClose={jest.fn()}
        onSelect={jest.fn()}
        title="Pick one"
        options={options}
      />,
    );
    expect(queryByText('Option A')).toBeNull();
  });

  it('renders all options when visible', async () => {
    const { getByText, queryByText } = await render(
      <ListSelector
        visible={true}
        onClose={jest.fn()}
        onSelect={jest.fn()}
        title="Pick one"
        options={options}
      />,
    );
    expect(queryByText('Pick one')).toBeNull();
    expect(getByText('Option A')).toBeTruthy();
    expect(getByText('Option B')).toBeTruthy();
    expect(getByText('Option C')).toBeTruthy();
  });

  it('calls onSelect with the option value when row is pressed', async () => {
    const onSelect = jest.fn();
    const { getByText } = await render(
      <ListSelector
        visible={true}
        onClose={jest.fn()}
        onSelect={onSelect}
        title="Pick one"
        options={options}
      />,
    );
    fireEvent.press(getByText('Option B'));
    expect(onSelect).toHaveBeenCalledWith('b');
  });

  it('shows checkmark next to the selected option', async () => {
    const { getAllByText } = await render(
      <ListSelector
        visible={true}
        onClose={jest.fn()}
        onSelect={jest.fn()}
        title="Pick one"
        options={options}
        selectedValue="b"
      />,
    );
    const checks = getAllByText('checkmark');
    expect(checks.length).toBe(1);
  });

  it('calls onClose when backdrop is pressed', async () => {
    const onClose = jest.fn();
    const { getByTestId } = await render(
      <ListSelector
        visible={true}
        onClose={onClose}
        onSelect={jest.fn()}
        title="Pick one"
        options={options}
      />,
    );
    fireEvent.press(getByTestId('backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
