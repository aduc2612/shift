import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '@/providers/theme-provider';
import { ToastProvider } from '@/providers/toast-provider';
import RescheduleSheet from '../RescheduleSheet';

async function renderWithTheme(ui: React.ReactElement) {
  return render(
    <ThemeProvider>
      <ToastProvider>{ui}</ToastProvider>
    </ThemeProvider>,
  );
}

describe('RescheduleSheet', () => {
  it('renders "What changed?" title', async () => {
    const { getByText } = await renderWithTheme(
      <RescheduleSheet
        visible={true}
        onClose={jest.fn()}
        onReschedule={jest.fn()}
        isRescheduling={false}
      />,
    );
    expect(getByText('What changed?')).toBeTruthy();
  });

  it('renders example chips', async () => {
    const { getByText } = await renderWithTheme(
      <RescheduleSheet
        visible={true}
        onClose={jest.fn()}
        onReschedule={jest.fn()}
        isRescheduling={false}
      />,
    );
    expect(getByText(/I woke up late/)).toBeTruthy();
    expect(getByText(/I need to leave at 5 PM/)).toBeTruthy();
  });

  it('renders Reschedule button', async () => {
    const { getByText } = await renderWithTheme(
      <RescheduleSheet
        visible={true}
        onClose={jest.fn()}
        onReschedule={jest.fn()}
        isRescheduling={false}
      />,
    );
    expect(getByText('Reschedule')).toBeTruthy();
  });

  it('renders Cancel button', async () => {
    const { getByText } = await renderWithTheme(
      <RescheduleSheet
        visible={true}
        onClose={jest.fn()}
        onReschedule={jest.fn()}
        isRescheduling={false}
      />,
    );
    expect(getByText('Cancel')).toBeTruthy();
  });

  describe('reschedule interaction', () => {
    it('calls onReschedule with text input on CTA press', async () => {
      const onReschedule = jest.fn().mockResolvedValue(undefined);
      const { getByPlaceholderText, getByText } = await renderWithTheme(
        <RescheduleSheet
          visible={true}
          onClose={jest.fn()}
          onReschedule={onReschedule}
          isRescheduling={false}
        />,
      );

      await act(async () => {
        fireEvent.changeText(
          getByPlaceholderText(/I woke up late, gym is closed today/),
          'I woke up late',
        );
      });

      await act(async () => {
        fireEvent.press(getByText('Reschedule'));
      });

      await waitFor(() => {
        expect(onReschedule).toHaveBeenCalledWith('I woke up late');
      });
    });

    it('shows spinner on CTA while rescheduling', async () => {
      const { getByTestId } = await renderWithTheme(
        <RescheduleSheet
          visible={true}
          onClose={jest.fn()}
          onReschedule={jest.fn()}
          isRescheduling={true}
        />,
      );

      expect(getByTestId('reschedule-spinner')).toBeTruthy();
    });

    it('disables CTA press while rescheduling', async () => {
      const onReschedule = jest.fn();
      const { getByTestId } = await renderWithTheme(
        <RescheduleSheet
          visible={true}
          onClose={jest.fn()}
          onReschedule={onReschedule}
          isRescheduling={true}
        />,
      );

      const pressable = getByTestId('reschedule-cta');
      expect(pressable.props.accessibilityState.disabled).toBe(true);

      await act(async () => {
        fireEvent.press(pressable);
      });

      expect(onReschedule).not.toHaveBeenCalled();
    });

    it('closes sheet on success', async () => {
      const onClose = jest.fn();
      const onReschedule = jest.fn().mockResolvedValue(undefined);
      const { getByText } = await renderWithTheme(
        <RescheduleSheet
          visible={true}
          onClose={onClose}
          onReschedule={onReschedule}
          isRescheduling={false}
        />,
      );

      await act(async () => {
        fireEvent.press(getByText('Reschedule'));
      });

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('does not close on error and displays error message', async () => {
      const onClose = jest.fn();
      const onReschedule = jest.fn().mockRejectedValue(new Error('Reschedule failed'));
      const { getByText } = await renderWithTheme(
        <RescheduleSheet
          visible={true}
          onClose={onClose}
          onReschedule={onReschedule}
          isRescheduling={false}
        />,
      );

      await act(async () => {
        fireEvent.press(getByText('Reschedule'));
      });

      await waitFor(() => {
        expect(onClose).not.toHaveBeenCalled();
        expect(getByText('Reschedule failed')).toBeTruthy();
      });
    });

    it('clears text input on success', async () => {
      const onReschedule = jest.fn().mockResolvedValue(undefined);
      const { getByText, getByPlaceholderText } = await renderWithTheme(
        <RescheduleSheet
          visible={true}
          onClose={jest.fn()}
          onReschedule={onReschedule}
          isRescheduling={false}
        />,
      );

      const input = getByPlaceholderText(/I woke up late, gym is closed today/);
      await act(async () => {
        fireEvent.changeText(input, 'test input');
      });

      await act(async () => {
        fireEvent.press(getByText('Reschedule'));
      });

      await waitFor(() => {
        expect(input.props.value).toBe('');
      });
    });

    it('calls onClose when Cancel is pressed', async () => {
      const onClose = jest.fn();
      const { getByText } = await renderWithTheme(
        <RescheduleSheet
          visible={true}
          onClose={onClose}
          onReschedule={jest.fn()}
          isRescheduling={false}
        />,
      );

      await act(async () => {
        fireEvent.press(getByText('Cancel'));
      });

      expect(onClose).toHaveBeenCalled();
    });
  });
});
