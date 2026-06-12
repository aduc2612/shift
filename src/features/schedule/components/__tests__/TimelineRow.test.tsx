import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '@/providers/theme-provider';
import TimelineRow from '../TimelineRow';

async function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('TimelineRow', () => {
  it('renders time label and children', async () => {
    const { getByText } = await renderWithTheme(
      <TimelineRow time="09:00" state="upcoming">
        <Text>Task content</Text>
      </TimelineRow>,
    );
    expect(getByText('09:00')).toBeTruthy();
    expect(getByText('Task content')).toBeTruthy();
  });

  it('renders "Now" label when showNow is true', async () => {
    const { getByText } = await renderWithTheme(
      <TimelineRow time="09:00" state="upcoming" showNow>
        <Text>Task content</Text>
      </TimelineRow>,
    );
    expect(getByText('Now')).toBeTruthy();
  });
});
