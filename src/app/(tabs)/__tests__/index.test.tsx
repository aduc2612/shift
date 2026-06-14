jest.mock("@expo/ui/community/datetime-picker", () => {
  const R = require("react");
  const RN = require("react-native");
  return { DateTimePicker: (p: unknown) => R.createElement(RN.View) };
});

jest.mock("@/providers/theme-provider", () => {
  const R = require("react");
  return {
    useTheme: () => ({
      isDark: false,
      colors: {
        background: "#f4f3f8", primary: "#000000", onPrimary: "#FFFFFF",
        onSurface: "#1C1C1C", onSurfaceVariant: "#666666", surfaceVariant: "#F5F5F5",
        outline: "#D0D0D0", outlineVariant: "#E0E0E0", error: "#B3261E", surface: "#FFFFFF",
      },
      typography: {
        titleMedium: { fontSize: 16, fontWeight: "700", lineHeight: 24 },
        bodyMedium: { fontSize: 14, fontWeight: "400", lineHeight: 20 },
        bodySmall: { fontSize: 12, fontWeight: "400", lineHeight: 16 },
        labelSmall: { fontSize: 11, fontWeight: "700", lineHeight: 16 },
      },
      spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 40, xxxxl: 48, tabBar: 80 },
      borderRadius: { sm: 4, md: 8, lg: 12, xl: 16, xxl: 24, round: 28 },
      shadows: { none: {}, sm: {}, md: { shadowColor: "#000", shadowOpacity: 0.08 }, lg: {} },
      interaction: { pressedOpacity: 0.6 },
      componentStyles: {},
    }),
    ThemeProvider: ({ children }: { children: React.ReactNode }) =>
      R.createElement(R.Fragment, null, children),
  };
});

jest.mock("@/features/auth/hooks/useAuth", () => ({
  useAuth: () => ({ isAuthenticated: true, loading: false }),
}));

jest.mock("@/features/schedule/hooks/useTasks", () => ({
  useTasks: () => ({ data: [], isLoading: false, isError: false, error: null }),
  useCreateTask: () => ({ mutate: jest.fn(), isPending: false }),
  useUpdateTask: () => ({ mutate: jest.fn(), isPending: false }),
  useDeleteTask: () => ({ mutate: jest.fn(), isPending: false }),
  useToggleComplete: () => ({ mutate: jest.fn(), isPending: false }),
}));

jest.mock("@/features/schedule/utils", () => ({
  buildScheduleData: () => ({ items: [], activeTaskId: null }),
  getTaskState: () => "upcoming",
}));

jest.mock("@/components/primitives/FAB", () => {
  const R = require("react");
  const RN = require("react-native");
  return { __esModule: true, default: () => R.createElement(RN.View) };
});

jest.mock("@/utils/date", () => ({ formatTime: () => "9:00 AM" }));
jest.mock("@/hooks/useCurrentTime", () => ({ useCurrentTime: () => new Date() }));
jest.mock("@/features/schedule/hooks/useReschedule", () => ({
  useReschedule: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));
jest.mock("@/features/schedule/hooks/useSyncNotifications", () => ({
  useSyncNotifications: () => {},
}));

jest.mock("@/providers/toast-provider", () => ({
  useToast: () => ({ show: jest.fn(), hide: jest.fn() }),
}));

jest.mock("@/features/schedule/components/ScheduleHeader", () => {
  const R = require("react"); const RN = require("react-native");
  return { __esModule: true, default: () => R.createElement(RN.View, { testID: "schedule-header" }) };
});
jest.mock("@/features/schedule/components/ScheduleProgress", () => {
  const R = require("react"); const RN = require("react-native");
  return { __esModule: true, default: () => R.createElement(RN.View, { testID: "schedule-progress" }) };
});
jest.mock("@/features/schedule/components/RescheduleSheet", () => {
  const R = require("react"); const RN = require("react-native");
  return {
    __esModule: true,
    default: (props: Record<string, unknown>) =>
      R.createElement(RN.View, {
        testID: "reschedule-sheet",
        "data-visible": props.visible,
        "data-onreschedule": typeof props.onReschedule,
        "data-isrescheduling": props.isRescheduling,
      }),
  };
});
jest.mock("@/features/schedule/components/TaskFormSheet", () => {
  const R = require("react"); const RN = require("react-native");
  return { __esModule: true, default: () => R.createElement(RN.View, { testID: "task-form-sheet" }) };
});

import React from "react";
import { render } from "@testing-library/react-native";
import ScheduleScreen from "../index";

describe("ScheduleScreen — reschedule integration", () => {
  it("renders without crashing", async () => {
    const result = await render(React.createElement(ScheduleScreen));
    expect(result.getByTestId("schedule-header")).toBeTruthy();
    expect(result.getByTestId("reschedule-sheet")).toBeTruthy();
  });

  it("passes visible=false to RescheduleSheet", async () => {
    const { getByTestId } = await render(React.createElement(ScheduleScreen));
    const sheet = getByTestId("reschedule-sheet");
    expect(sheet.props["data-visible"]).toBe(false);
  });

  it("passes onReschedule function to RescheduleSheet", async () => {
    const { getByTestId } = await render(React.createElement(ScheduleScreen));
    const sheet = getByTestId("reschedule-sheet");
    expect(sheet.props["data-onreschedule"]).toBe("function");
  });

  it("passes isRescheduling as false", async () => {
    const { getByTestId } = await render(React.createElement(ScheduleScreen));
    const sheet = getByTestId("reschedule-sheet");
    expect(sheet.props["data-isrescheduling"]).toBe(false);
  });
});
