# Phase 4 — Core Schedule UI — Summary

## Outcome
✅ Complete — all tasks done, verification passes.

## Files Created (19)

### Primitives (`src/components/primitives/`)
- `Badge.tsx` — Pill label, default/accent variants (uses `withOpacity` for accent bg)
- `BottomSheet.tsx` — Modal + Pressable backdrop, theme-aware, no animation (animationType=none), no keyboard logic
- `Checkbox.tsx` — Circular Pressable, primary bg when checked, transparent border when checked
- `FAB.tsx` — 52×52 floating action button
- `ProgressBar.tsx` — Thin fill bar

### Schedule Components (`src/features/schedule/components/`)
- `NowIndicator.tsx` — Standalone now row with pulsing dot + live time (30s interval). Used when no active task.
- `ScheduleHeader.tsx` — "Today"/"Past"/"Future" label + tappable date + Reschedule button
- `ScheduleProgress.tsx` — Progress bar + "X of Y done"
- `TaskCard.tsx` — Name, checkbox, duration, time range, badge, AI justification, 3 visual states (uses `withOpacity` for active border)
- `TimelineRow.tsx` — Time column + spine (dot + line) + content slot + optional embedded now indicator
- `RescheduleSheet.tsx` — Reschedule bottom sheet (wraps BottomSheet, self-contained state)

### Hooks
- `src/hooks/useCurrentTime.ts` — Returns Date that updates every 30s via setInterval
- `src/hooks/useKeyboardHeight.ts` — Returns keyboard height, platform-aware events

### Utils
- `src/utils/date.ts` — formatTime, formatTimeRange, formatDuration, formatRelativeDay, formatFullDate, isSameDay, isToday
- `src/utils/color.ts` — withOpacity(hex, alpha) helper for hex color transparency
- `src/features/schedule/utils.ts` — Extracted business logic: getTaskState, buildScheduleData, ListItem, ScheduleData types

### Data
- `src/features/schedule/mockTasks.ts` — 5 sample tasks for development

### Screen
- `src/app/(tabs)/index.tsx` — Full schedule screen. Pure composition — no business logic, no sheet content inline.

## Files Modified (8)
- `src/app/_layout.tsx` — Fixed pre-existing useMemo hooks rule violation
- `app.json` — Removed `@react-native-community/datetimepicker` plugin
- `src/components/primitives/Badge.tsx` — Uses `withOpacity` for accent background
- `src/features/schedule/components/TaskCard.tsx` — Uses `withOpacity` for active card border
- `src/features/schedule/components/TimelineRow.tsx` — Merged duplicate dot styles into `dotHighlighted`, animation value created conditionally, simplified line style logic
- `src/components/primitives/BottomSheet.tsx` — Refactored: removed keyboard logic, theme colors via createStyles, no animation
- `src/features/schedule/components/RescheduleSheet.tsx` — Uses `useKeyboardHeight` to add keyboard-aware padding
- `src/constants/theme.ts` — `scrim` changed from opaque `#000000` to semi-transparent `#00000066`

## Packages Changed
- **Added:** `@expo/ui` (Expo DateTimePicker drop-in replacement)
- **Removed:** `@react-native-community/datetimepicker` (replaced by `@expo/ui`)

## Verification
- `npx tsc --noEmit` — ✅ zero errors
- `npx expo lint` — ✅ zero errors, zero warnings

## Design Decisions
- No green accent — all highlights use `theme.colors.primary` (white in dark mode)
- All times 24h format
- No monospace font — standard system font via theme typography
- "Today" label only when `isToday(date)`, "Past" for past dates, "Future" for future dates
- Bottom sheet from scratch with `animationType="none"`, theme-aware `scrim` backdrop, `surface` sheet bg. Keyboard padding delegated to consumers via `useKeyboardHeight` hook
- `@expo/ui/community/datetimepicker` with `presentation="inline"` — no platform branching
- Checkbox: transparent border when checked (clean look)
- Task state: `done` only when `task.completed === true` — unchecked tasks with passed time stay `upcoming` (no auto-strikethrough)
- Now indicator: embedded on active task's spine (`showNow` prop on TimelineRow), standalone row when no active task
- Now indicator time: live-updating every 30s via `setInterval`
- Now insertion: uses `task.endTime <= now` for positioning (not visual state)

## Open Items for Next Phases
- Mock tasks hardcoded for 2026-06-12 — needs Supabase hook in Phase 5
- Reschedule sheet CTA is no-op — wiring to AI service in Phase 6
- FAB onPress is no-op — opens AddTaskSheet in Phase 5
- Checkbox toggle is no-op — wired to Supabase in Phase 5
- Unit tests written and passing — Jest + jest-expo + @testing-library/react-native setup complete (84 tests, 16 files)
