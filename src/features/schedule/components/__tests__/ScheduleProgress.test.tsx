import { render } from '@testing-library/react-native';
import { ThemeProvider } from '@/providers/theme-provider';
import ScheduleProgress from '../ScheduleProgress';

async function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('ScheduleProgress', () => {
  it('renders completed/total text', async () => {
    const { getByText } = await renderWithTheme(
      <ScheduleProgress completed={2} total={3} />,
    );
    expect(getByText('2 of 3 done')).toBeTruthy();
  });

  it('handles total=0 gracefully', async () => {
    const { getByText } = await renderWithTheme(
      <ScheduleProgress completed={0} total={0} />,
    );
    expect(getByText('0 of 0 done')).toBeTruthy();
  });

  it('handles completed > total gracefully', async () => {
    const { getByText } = await renderWithTheme(
      <ScheduleProgress completed={5} total={3} />,
    );
    expect(getByText('5 of 3 done')).toBeTruthy();
  });
});
