import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '@/providers/theme-provider';
import RescheduleSheet from '../RescheduleSheet';

async function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('RescheduleSheet', () => {
  it('renders "What changed?" title', async () => {
    const { getByText } = await renderWithTheme(
      <RescheduleSheet visible={true} onClose={jest.fn()} />,
    );
    expect(getByText('What changed?')).toBeTruthy();
  });

  it('renders example chips', async () => {
    const { getByText } = await renderWithTheme(
      <RescheduleSheet visible={true} onClose={jest.fn()} />,
    );
    expect(getByText(/I woke up late/)).toBeTruthy();
    expect(getByText(/I need to leave at 5 PM/)).toBeTruthy();
  });

  it('renders Reschedule button', async () => {
    const { getByText } = await renderWithTheme(
      <RescheduleSheet visible={true} onClose={jest.fn()} />,
    );
    expect(getByText('Reschedule')).toBeTruthy();
  });
});
