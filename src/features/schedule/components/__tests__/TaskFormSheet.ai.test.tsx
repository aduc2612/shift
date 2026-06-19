import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { ThemeProvider } from "@/providers/theme-provider";
import { ToastProvider } from "@/providers/toast-provider";
import TaskFormSheet from "../TaskFormSheet";
import type { Task } from "@/types/task";

// Mock DateTimePicker
jest.mock("@expo/ui/community/datetime-picker", () => {
  const mockReact = require("react");
  const RN = require("react-native");
  return {
    DateTimePicker: (props: Record<string, unknown>) => {
      return mockReact.createElement(RN.View, {
        testID: "date-time-picker",
        accessibilityLabel: props.mode as string,
      });
    },
  };
});

// Mock Alert
jest.mock("@/components/primitives/Alert", () => {
  const mockReact = require("react");
  const RN = require("react-native");
  return {
    __esModule: true,
    default: ({
      visible,
      title,
      message,
      confirmLabel,
      cancelLabel,
      onConfirm,
      onCancel,
    }: Record<string, unknown>) => {
      if (!visible) return null;
      return mockReact.createElement(RN.View, { testID: "mock-alert" }, [
        mockReact.createElement(RN.Text, { key: "title" }, title as string),
        message
          ? mockReact.createElement(
              RN.Text,
              { key: "message" },
              message as string,
            )
          : null,
        mockReact.createElement(
          RN.Pressable,
          {
            key: "confirm",
            testID: "alert-confirm-btn",
            onPress: onConfirm as () => void,
          },
          mockReact.createElement(
            RN.Text,
            null,
            (confirmLabel as string) ?? "Confirm",
          ),
        ),
        mockReact.createElement(
          RN.Pressable,
          {
            key: "cancel",
            testID: "alert-cancel-btn",
            onPress: onCancel as () => void,
          },
          mockReact.createElement(
            RN.Text,
            null,
            (cancelLabel as string) ?? "Cancel",
          ),
        ),
      ]);
    },
  };
});

// Mock supabase — needed because TaskFormSheet imports usePlaceTask which imports api which imports supabase
jest.mock("@/services/supabase", () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: "u1" } } }),
    },
    from: jest.fn(),
  },
}));

// Mutable mock for usePlaceTask — lets tests toggle isPending
let mockIsPending = false;
const mockMutateAsync = jest.fn();
jest.mock("@/features/schedule/hooks/usePlaceTask", () => ({
  usePlaceTask: () => ({
    mutateAsync: mockMutateAsync,
    get isPending() {
      return mockIsPending;
    },
  }),
}));

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "1",
    userId: "u1",
    name: "Morning standup",
    startTime: "2026-06-12T09:00:00",
    endTime: "2026-06-12T09:30:00",
    durationMinutes: 30,
    deadline: "2026-06-12",
    completed: false,
    aiContext: null,
    aiDecidesTime: false,
    aiJustification: "Best time for team sync",
    createdAt: "2026-06-12T00:00:00",
    updatedAt: "2026-06-12T00:00:00",
    ...overrides,
  };
}

async function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider><ToastProvider>{ui}</ToastProvider></ThemeProvider>);
}

describe("TaskFormSheet — AI fields", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsPending = false;
  });

  describe("AI toggle", () => {
    it("toggle is enabled in edit mode", async () => {
      const task = makeTask();
      const { getByTestId } = await renderWithTheme(
        <TaskFormSheet
          visible
          onClose={jest.fn()}
          task={task}
          mode="edit"
          onSave={jest.fn()}
          onCancel={jest.fn()}
        />,
      );
      const toggle = getByTestId("ai-decides-switch");
      expect(toggle.props.disabled).toBe(false);
    });

    it("toggle is enabled in add mode", async () => {
      const { getByTestId } = await renderWithTheme(
        <TaskFormSheet
          visible
          onClose={jest.fn()}
          mode="add"
          onSave={jest.fn()}
          onCancel={jest.fn()}
        />,
      );
      const toggle = getByTestId("ai-decides-switch");
      expect(toggle.props.disabled).toBe(false);
    });

    it("hides time pickers when toggle is on (shows AI will set times text)", async () => {
      const { getByTestId, getByText } = await renderWithTheme(
        <TaskFormSheet
          visible
          onClose={jest.fn()}
          mode="add"
          onSave={jest.fn()}
          onCancel={jest.fn()}
        />,
      );

      // Toggle AI on
      await act(async () => {
        fireEvent(getByTestId("ai-decides-switch"), "onValueChange", true);
      });

      // AI placeholder text should appear
      expect(getByText("AI will set times automatically")).toBeTruthy();
    });
  });

  describe("reschedule on AI field change (edit mode)", () => {
    it("triggers reschedule when aiDecidesTime changes to true on save", async () => {
      mockMutateAsync.mockResolvedValue([]);
      const onSave = jest.fn();
      const onClose = jest.fn();
      const task = makeTask({
        aiDecidesTime: false,
        aiContext: "",
        name: "Test task",
      });

      const { getByTestId } = await renderWithTheme(
        <TaskFormSheet
          visible
          onClose={onClose}
          task={task}
          mode="edit"
          onSave={onSave}
          onCancel={jest.fn()}
        />,
      );

      // Toggle AI on
      await act(async () => {
        fireEvent(getByTestId("ai-decides-switch"), "onValueChange", true);
      });

      // Press Done
      await act(async () => {
        fireEvent.press(getByTestId("done-btn"));
      });

      // AI flow: onSave should NOT be called — placeTask handles it
      expect(onSave).not.toHaveBeenCalled();
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            whatChanged: expect.stringContaining("Test task"),
            mode: "edit",
          }),
        );
      });
    });

    it("does NOT trigger reschedule when non-AI fields change in edit mode", async () => {
      const onSave = jest.fn();
      const onClose = jest.fn();
      const task = makeTask({ aiDecidesTime: false, aiContext: "" });

      const { getByTestId, getByPlaceholderText } = await renderWithTheme(
        <TaskFormSheet
          visible
          onClose={onClose}
          task={task}
          mode="edit"
          onSave={onSave}
          onCancel={jest.fn()}
        />,
      );

      // Change name only (non-AI field)
      await act(async () => {
        fireEvent.changeText(getByPlaceholderText("Task name"), "New name");
      });

      await act(async () => {
        fireEvent.press(getByTestId("done-btn"));
      });

      expect(onSave).toHaveBeenCalled();
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it("shows spinner on Done button while rescheduling isPending", async () => {
      mockIsPending = true;

      const task = makeTask({ aiDecidesTime: false });

      const { getByTestId, queryByText } = await renderWithTheme(
        <TaskFormSheet
          visible
          onClose={jest.fn()}
          task={task}
          mode="edit"
          onSave={jest.fn()}
          onCancel={jest.fn()}
        />,
      );

      // Done button should show spinner instead of text
      const doneBtn = getByTestId("done-btn");
      expect(doneBtn.props.accessibilityState?.disabled).toBe(true);
      expect(queryByText("Done")).toBeNull();
    });
  });

  describe("reschedule on creation with aiDecidesTime (add mode)", () => {
    it("creates task then reschedules when aiDecidesTime is true", async () => {
      mockMutateAsync.mockResolvedValue([]);
      const onSave = jest.fn();
      const onClose = jest.fn();

      const { getByTestId, getByPlaceholderText } = await renderWithTheme(
        <TaskFormSheet
          visible
          onClose={onClose}
          mode="add"
          onSave={onSave}
          onCancel={jest.fn()}
        />,
      );

      // Enter a task name
      await act(async () => {
        fireEvent.changeText(getByPlaceholderText("Task name"), "New AI task");
      });

      // Toggle AI on
      await act(async () => {
        fireEvent(getByTestId("ai-decides-switch"), "onValueChange", true);
      });

      // Press Done
      await act(async () => {
        fireEvent.press(getByTestId("done-btn"));
      });

      // AI flow: onSave should NOT be called — placeTask handles creation
      expect(onSave).not.toHaveBeenCalled();

      // placeTask should have been triggered
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            taskData: expect.objectContaining({ name: "New AI task", durationMinutes: expect.any(Number) }),
            mode: "add",
            whatChanged: expect.stringContaining("New AI task"),
          }),
        );
      });
    });
  });
});
