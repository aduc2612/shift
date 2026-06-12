import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '@/providers/theme-provider';
import ScheduleHeader from '../ScheduleHeader';

async function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('ScheduleHeader', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-12T10:00:00'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders full date and relative day', async () => {
    const date = new Date('2026-06-12T10:00:00');
    const { getByText } = await renderWithTheme(
      <ScheduleHeader
        date={date}
        onPressDate={jest.fn()}
        onPressReschedule={jest.fn()}
      />,
    );
    expect(getByText('Today')).toBeTruthy();
    expect(getByText('Friday, Jun 12')).toBeTruthy();
  });

  it('renders "Past" for yesterday', async () => {
    const date = new Date('2026-06-11T10:00:00');
    const { getByText } = await renderWithTheme(
      <ScheduleHeader
        date={date}
        onPressDate={jest.fn()}
        onPressReschedule={jest.fn()}
      />,
    );
    expect(getByText('Past')).toBeTruthy();
  });

  it('renders "Future" for tomorrow', async () => {
    const date = new Date('2026-06-13T10:00:00');
    const { getByText } = await renderWithTheme(
      <ScheduleHeader
        date={date}
        onPressDate={jest.fn()}
        onPressReschedule={jest.fn()}
      />,
    );
    expect(getByText('Future')).toBeTruthy();
  });

  it('calls onPressDate when date is pressed', async () => {
    const onPressDate = jest.fn();
    const date = new Date('2026-06-12T10:00:00');
    const { getByText } = await renderWithTheme(
      <ScheduleHeader
        date={date}
        onPressDate={onPressDate}
        onPressReschedule={jest.fn()}
      />,
    );

    fireEvent.press(getByText('Friday, Jun 12'));
    expect(onPressDate).toHaveBeenCalledTimes(1);
  });

  it('renders Reschedule button', async () => {
    const date = new Date('2026-06-12T10:00:00');
    const { getByText } = await renderWithTheme(
      <ScheduleHeader
        date={date}
        onPressDate={jest.fn()}
        onPressReschedule={jest.fn()}
      />,
    );
    expect(getByText('Reschedule')).toBeTruthy();
  });
});
