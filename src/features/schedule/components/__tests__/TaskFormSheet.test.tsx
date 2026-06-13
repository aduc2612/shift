import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
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
    const { getByText, getByTestId } = await renderWithTheme(
      <TaskFormSheet visible onClose={jest.fn()} task={task} mode="edit" />,
    );
    expect(getByText('Cancel')).toBeTruthy();
    expect(getByTestId('done-btn')).toBeTruthy();
  });

  it('shows "Let AI decide" toggle in edit mode', async () => {
    const task = makeTask();
    const { getByText } = await renderWithTheme(
      <TaskFormSheet visible onClose={jest.fn()} task={task} mode="edit" />,
    );
    expect(getByText('Let AI decide')).toBeTruthy();
  });

  // ─── Add mode tests ────────────────────────────────────────────────

  it('"Let AI decide" toggle is OFF and disabled until Phase 6', async () => {
    const { getByTestId } = await renderWithTheme(
      <TaskFormSheet visible onClose={jest.fn()} mode="add" />,
    );
    expect(getByTestId('ai-decides-switch').props.value).toBe(false);
    expect(getByTestId('ai-decides-switch').props.disabled).toBe(true);
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

  it('calls onCancel when Cancel is pressed', async () => {
    const onCancel = jest.fn();
    const task = makeTask();
    const { getByText } = await renderWithTheme(
      <TaskFormSheet visible onClose={jest.fn()} task={task} mode="edit" onCancel={onCancel} />,
    );
    fireEvent.press(getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onSave with correct payload', async () => {
    const onSave = jest.fn();
    const onClose = jest.fn();
    const task = makeTask({ aiDecidesTime: false });
    const { getByTestId } = await renderWithTheme(
      <TaskFormSheet visible onClose={onClose} task={task} mode="edit" onSave={onSave} />,
    );
    fireEvent.press(getByTestId('done-btn'));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Morning standup',
        startTime: '2026-06-12T09:00:00',
        endTime: '2026-06-12T09:30:00',
        durationMinutes: 30,
        aiDecidesTime: false,
      }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // ─── Validation tests ──────────────────────────────────────────────

  it('blocks save and shows error when name is empty', async () => {
    const onSave = jest.fn();
    const { getByPlaceholderText, getByTestId, getByText } = await renderWithTheme(
      <TaskFormSheet visible onClose={jest.fn()} mode="add" onSave={onSave} />,
    );
    await act(async () => {
      fireEvent.changeText(getByPlaceholderText('Task name'), '');
      fireEvent.press(getByTestId('done-btn'));
    });
    expect(getByText('Task name is required')).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('blocks save when AI decide is off and times are missing', async () => {
    const onSave = jest.fn();
    const task = makeTask({ aiDecidesTime: false, startTime: '', endTime: '' });
    const { getByTestId, getByText } = await renderWithTheme(
      <TaskFormSheet visible onClose={jest.fn()} mode="edit" task={task} onSave={onSave} />,
    );
    await act(async () => {
      fireEvent.press(getByTestId('done-btn'));
    });
    expect(getByText('Start and end times are required')).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('blocks save when end time is before start time', async () => {
    const onSave = jest.fn();
    const task = makeTask({
      aiDecidesTime: false,
      startTime: '2026-06-12T09:00:00',
      endTime: '2026-06-12T08:00:00',
    });
    const { getByTestId, getByText } = await renderWithTheme(
      <TaskFormSheet visible onClose={jest.fn()} mode="edit" task={task} onSave={onSave} />,
    );
    await act(async () => {
      fireEvent.press(getByTestId('done-btn'));
    });
    expect(getByText('End time must be after start time')).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
  });

  // ─── Render state tests ────────────────────────────────────────────

  it('Switch renders with correct initial value', async () => {
    const task = makeTask({ aiDecidesTime: false });
    const { getByTestId } = await renderWithTheme(
      <TaskFormSheet visible onClose={jest.fn()} task={task} mode="edit" />,
    );
    expect(getByTestId('ai-decides-switch').props.value).toBe(false);
  });

  it('input has error border after validation failure', async () => {
    const { getByPlaceholderText, getByTestId } = await renderWithTheme(
      <TaskFormSheet visible onClose={jest.fn()} mode="add" />,
    );
    await act(async () => {
      fireEvent.press(getByTestId('done-btn'));
    });
    const input = getByPlaceholderText('Task name');
    const styles = Array.isArray(input.props.style) ? input.props.style : [input.props.style];
    const borderStyle = styles.find(
      (s: Record<string, unknown>) => s && typeof s === 'object' && 'borderColor' in s,
    );
    expect(borderStyle?.borderColor).toBeDefined();
  });
});
