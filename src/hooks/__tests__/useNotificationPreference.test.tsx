import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const mockGetPermissionsAsync = jest.fn();
const mockRequestPermissionsAsync = jest.fn();
const mockShow = jest.fn();

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: () => mockGetPermissionsAsync(),
  requestPermissionsAsync: () => mockRequestPermissionsAsync(),
}));

jest.mock('@/providers/toast-provider', () => ({
  useToast: () => ({ show: mockShow, hide: jest.fn() }),
}));

import { useNotificationPreference } from '../useNotificationPreference';

function Probe() {
  const { enabled, setEnabled } = useNotificationPreference();
  return (
    <>
      <Text testID="enabled">{String(enabled)}</Text>
      <Text testID="on" onPress={() => setEnabled(true)}>on</Text>
      <Text testID="off" onPress={() => setEnabled(false)}>off</Text>
    </>
  );
}

describe('useNotificationPreference', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it('initial state reflects OS permission status when granted', async () => {
    mockGetPermissionsAsync.mockResolvedValue({ status: 'granted' });

    const { getByTestId } = await render(<Probe />);

    await waitFor(() => {
      expect(getByTestId('enabled').props.children).toBe('true');
    });
  });

  it('initial state is false when permission not granted', async () => {
    mockGetPermissionsAsync.mockResolvedValue({ status: 'undetermined' });

    const { getByTestId } = await render(<Probe />);

    await waitFor(() => {
      expect(getByTestId('enabled').props.children).toBe('false');
    });
  });

  it('enable: permission undetermined → requests permission', async () => {
    mockGetPermissionsAsync.mockResolvedValue({ status: 'undetermined' });
    mockRequestPermissionsAsync.mockResolvedValue({ status: 'granted' });

    const { getByTestId } = await render(<Probe />);

    await waitFor(() => {
      expect(getByTestId('enabled').props.children).toBe('false');
    });

    await act(async () => {
      fireEvent.press(getByTestId('on'));
    });

    await waitFor(() => {
      expect(mockRequestPermissionsAsync).toHaveBeenCalled();
      expect(getByTestId('enabled').props.children).toBe('true');
    });
  });

  it('enable: permission denied → requests again and shows toast', async () => {
    mockGetPermissionsAsync.mockResolvedValue({ status: 'denied' });
    mockRequestPermissionsAsync.mockResolvedValue({ status: 'denied' });

    const { getByTestId } = await render(<Probe />);

    await waitFor(() => {
      expect(getByTestId('enabled').props.children).toBe('false');
    });

    await act(async () => {
      fireEvent.press(getByTestId('on'));
    });

    await waitFor(() => {
      expect(mockRequestPermissionsAsync).toHaveBeenCalled();
      expect(mockShow).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringMatching(/will not be turned on/i) }),
      );
      expect(getByTestId('enabled').props.children).toBe('false');
    });
  });

  it('enable: permission granted → stores preference', async () => {
    mockGetPermissionsAsync.mockResolvedValue({ status: 'granted' });
    mockRequestPermissionsAsync.mockResolvedValue({ status: 'granted' });

    const { getByTestId } = await render(<Probe />);

    await waitFor(() => {
      expect(getByTestId('enabled').props.children).toBe('true');
    });

    await act(async () => {
      fireEvent.press(getByTestId('on'));
    });

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('notification-enabled', 'true');
    });
  });

  it('disable: stores false, does not revoke OS permission', async () => {
    mockGetPermissionsAsync.mockResolvedValue({ status: 'granted' });

    const { getByTestId } = await render(<Probe />);

    await waitFor(() => {
      expect(getByTestId('enabled').props.children).toBe('true');
    });

    await act(async () => {
      fireEvent.press(getByTestId('off'));
    });

    await waitFor(() => {
      expect(getByTestId('enabled').props.children).toBe('false');
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith('notification-enabled', 'false');
    expect(mockRequestPermissionsAsync).not.toHaveBeenCalled();
  });
});
