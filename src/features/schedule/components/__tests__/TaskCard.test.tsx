import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '@/providers/theme-provider';
import TaskCard from '../TaskCard';
import type { Task } from '@/types/task';

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: '1',
    userId: 'u1',
    name: 'Morning standup',
    startTime: '2026-06-12T09:00:00',
    endTime: '2026-06-12T09:30:00',
    durationMinutes: 30,
    deadline: null,
    completed: false,
    aiContext: null,
    aiDecidesTime: false,
    aiJustification: 'Best time for team sync',
    createdAt: '2026-06-12T00:00:00',
    updatedAt: '2026-06-12T00:00:00',
    ...overrides,
  };
}

async function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('TaskCard', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-12T10:00:00'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });
  it('renders task name', async () => {
    const task = makeTask({ name: 'Morning standup' });
    const { getByText } = await renderWithTheme(
      <TaskCard
        task={task}
        state="upcoming"
        onToggleComplete={jest.fn()}
        onPress={jest.fn()}
      />,
    );
    expect(getByText('Morning standup')).toBeTruthy();
  });

  it('renders duration when present', async () => {
    const task = makeTask({ durationMinutes: 30 });
    const { getByText } = await renderWithTheme(
      <TaskCard
        task={task}
        state="upcoming"
        onToggleComplete={jest.fn()}
        onPress={jest.fn()}
      />,
    );
    expect(getByText('30m')).toBeTruthy();
  });

  it('renders time range when start and end are present', async () => {
    const task = makeTask({
      startTime: '2026-06-12T09:00:00',
      endTime: '2026-06-12T09:30:00',
    });
    const { getByText } = await renderWithTheme(
      <TaskCard
        task={task}
        state="upcoming"
        onToggleComplete={jest.fn()}
        onPress={jest.fn()}
      />,
    );
    expect(getByText('09:00 – 09:30')).toBeTruthy();
  });

  it('renders AI justification text when present', async () => {
    const task = makeTask({ aiJustification: 'Best time for team sync' });
    const { getByText } = await renderWithTheme(
      <TaskCard
        task={task}
        state="upcoming"
        onToggleComplete={jest.fn()}
        onPress={jest.fn()}
      />,
    );
    expect(getByText('Best time for team sync')).toBeTruthy();
  });

  it('does not render AI justification when absent', async () => {
    const task = makeTask({ aiJustification: null });
    const { queryByText } = await renderWithTheme(
      <TaskCard
        task={task}
        state="upcoming"
        onToggleComplete={jest.fn()}
        onPress={jest.fn()}
      />,
    );
    expect(queryByText(/justification/i)).toBeNull();
  });

  it('shows "Due today" badge when deadline is present and not completed', async () => {
    const task = makeTask({
      deadline: '2026-06-12',
      completed: false,
    });
    const { getByText } = await renderWithTheme(
      <TaskCard
        task={task}
        state="upcoming"
        onToggleComplete={jest.fn()}
        onPress={jest.fn()}
      />,
    );
    expect(getByText('Due today')).toBeTruthy();
  });

  it('does not show deadline badge when task is completed', async () => {
    const task = makeTask({
      deadline: '2026-06-12',
      completed: true,
    });
    const { queryByText } = await renderWithTheme(
      <TaskCard
        task={task}
        state="done"
        onToggleComplete={jest.fn()}
        onPress={jest.fn()}
      />,
    );
    expect(queryByText('Due today')).toBeNull();
  });

  it('calls onPress when pressed', async () => {
    const onPress = jest.fn();
    const task = makeTask();
    const { getByText } = await renderWithTheme(
      <TaskCard
        task={task}
        state="upcoming"
        onToggleComplete={jest.fn()}
        onPress={onPress}
      />,
    );

    fireEvent.press(getByText('Morning standup'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
