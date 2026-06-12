import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ThemeProvider } from '@/providers/theme-provider';
import TaskFormSheet from '../TaskFormSheet';
import type { Task } from '@/types/task';

// Mock DateTimePicker since it's a native module
jest.mock('@expo/ui/community/datetime-picker', () => {
  const mockReact = require('react');
  const RN = require('react-native');
  return {
    DateTimePicker: (props: Record<string, unknown>) => {
      return mockReact.createElement(RN.View, {
        testID: 'date-time-picker',
        accessibilityLabel: props.mode as string,
      });
    },
  };
});

// Mock useKeyboardHeight
jest.mock('@/hooks/useKeyboardHeight', () => ({
  useKeyboardHeight: () => 0,
}));

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: '1',
    userId: 'u1',
    name: 'Morning standup',
    startTime: '2026-06-12T09:00:00',
    endTime: '2026-06-12T09:30:00',
    durationMinutes: 30,
    deadline: '2026-06-12',
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

describe('TaskFormSheet', () => {
  // ─── View mode tests ───────────────────────────────────────────────

  it('renders task name as text in view mode', async () => {
    const task = makeTask({ name: 'Deep work session' });
    const { getByText } = await renderWithTheme(
      <TaskFormSheet visible onClose={jest.fn()} task={task} mode="view" />,
    );
    expect(getByText('Deep work session')).toBeTruthy();
  });

  it('shows AI justification in view mode when present', async () => {
    const task = makeTask({ aiJustification: 'Scheduled before lunch for peak focus' });
    const { getByText } = await renderWithTheme(
      <TaskFormSheet visible onClose={jest.fn()} task={task} mode="view" />,
    );
    expect(getByText('Scheduled before lunch for peak focus')).toBeTruthy();
  });

  it('does not show AI justification in view mode when absent', async () => {
    const task = makeTask({ aiJustification: null });
    const { queryByText } = await renderWithTheme(
      <TaskFormSheet visible onClose={jest.fn()} task={task} mode="view" />,
    );
    expect(queryByText('AI Justification')).toBeNull();
  });

  it('does not show AI context textarea in view mode', async () => {
    const task = makeTask();
    const { queryByPlaceholderText } = await renderWithTheme(
      <TaskFormSheet visible onClose={jest.fn()} task={task} mode="view" />,
    );
    expect(queryByPlaceholderText(/deep work task/i)).toBeNull();
  });

  it('does not show footer in view mode', async () => {
    const task = makeTask();
    const { queryByText } = await renderWithTheme(
      <TaskFormSheet visible onClose={jest.fn()} task={task} mode="view" />,
    );
    expect(queryByText('Cancel')).toBeNull();
    expect(queryByText('Done')).toBeNull();
  });

  // ─── Edit mode tests ───────────────────────────────────────────────

  it('shows text input for task name in edit mode', async () => {
    const task = makeTask({ name: 'Review PRs' });
    const { getByPlaceholderText } = await renderWithTheme(
      <TaskFormSheet visible onClose={jest.fn()} task={task} mode="edit" />,
    );
    const input = getByPlaceholderText('Task name');
    expect(input).toBeTruthy();
    expect(input.props.value).toBe('Review PRs');
  });

  it('shows AI context textarea in edit mode', async () => {
    const task = makeTask({ aiContext: 'Deep work, needs 2h block' });
    const { getByPlaceholderText } = await renderWithTheme(
      <TaskFormSheet visible onClose={jest.fn()} task={task} mode="edit" />,
    );
    expect(getByPlaceholderText(/deep work task/i)).toBeTruthy();
  });

  it('hides AI justification in edit mode', async () => {
    const task = makeTask({ aiJustification: 'Best time for team sync' });
    const { queryByText } = await renderWithTheme(
      <TaskFormSheet visible onClose={jest.fn()} task={task} mode="edit" />,
    );
    expect(queryByText('AI Justification')).toBeNull();
    expect(queryByText('Best time for team sync')).toBeNull();
  });

  it('shows Cancel and Done buttons in edit mode', async () => {
    const task = makeTask();
    const { getByText } = await renderWithTheme(
      <TaskFormSheet visible onClose={jest.fn()} task={task} mode="edit" />,
    );
    expect(getByText('Cancel')).toBeTruthy();
    expect(getByText('Done')).toBeTruthy();
  });

  it('shows "Let AI decide" toggle in edit mode', async () => {
    const task = makeTask();
    const { getByText } = await renderWithTheme(
      <TaskFormSheet visible onClose={jest.fn()} task={task} mode="edit" />,
    );
    expect(getByText('Let AI decide')).toBeTruthy();
  });

  // ─── Add mode tests ────────────────────────────────────────────────

  it('"Let AI decide" toggle defaults to ON in add mode', async () => {
    const { getByText, toJSON } = await renderWithTheme(
      <TaskFormSheet visible onClose={jest.fn()} mode="add" />,
    );
    expect(getByText('Let AI decide')).toBeTruthy();
    // Verify the Switch is present and ON by checking the rendered tree
    const tree = toJSON();
    const jsonStr = JSON.stringify(tree);
    // The Switch renders with value=true when aiDecidesTime defaults to true
    expect(jsonStr).toContain('"value":true');
  });

  it('shows empty task name input in add mode', async () => {
    const { getByPlaceholderText } = await renderWithTheme(
      <TaskFormSheet visible onClose={jest.fn()} mode="add" />,
    );
    const input = getByPlaceholderText('Task name');
    expect(input).toBeTruthy();
    expect(input.props.value).toBe('');
  });

  // ─── Interaction tests ─────────────────────────────────────────────

  it('calls onCancel when Cancel is pressed in edit mode', async () => {
    const onCancel = jest.fn();
    const task = makeTask();
    const { getByText } = await renderWithTheme(
      <TaskFormSheet visible onClose={jest.fn()} task={task} mode="edit" onCancel={onCancel} />,
    );
    fireEvent.press(getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Done is pressed', async () => {
    const onClose = jest.fn();
    const onSave = jest.fn();
    const task = makeTask();
    const { getByText } = await renderWithTheme(
      <TaskFormSheet visible onClose={onClose} task={task} mode="edit" onSave={onSave} />,
    );
    fireEvent.press(getByText('Done'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
