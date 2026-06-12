import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '@/providers/theme-provider';
import NowIndicator from '../NowIndicator';

async function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('NowIndicator', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-12T10:00:00'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders "Now" label', async () => {
    const { getByText } = await renderWithTheme(<NowIndicator />);
    expect(getByText('Now')).toBeTruthy();
  });

  it('renders current time', async () => {
    const { getByText } = await renderWithTheme(<NowIndicator />);
    expect(getByText('10:00')).toBeTruthy();
  });
});
