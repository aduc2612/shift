# Phase 8 — Onboarding Bug Fixes

**Status:** ✅ Complete

---

## Issue 1: Replace text emojis with Ionicons

**Problem:** Text emojis (`✓`, `✗`, `░`, `🧠`, `⏱`, `🔄`, `🔔`, `✅`, `💬`) render inconsistently and look cheap. Need real `@expo/vector-icons` Ionicons (already installed, already used in 6+ places).

### Files and changes:

**`src/app/(onboarding)/processing-theatre.tsx`**
- `CHECKPOINTS`: replace `emoji: '✓'` → `icon: 'checkmark-circle'`, `emoji: '░'` → `icon: 'ellipse-outline'`
- Render: `<Ionicons name={cp.icon} size={18} color={...} />` instead of `<Text>{cp.emoji}</Text>`
- When item not visible: still show `<Ionicons name="ellipse-outline" size={18} color={theme.colors.outline} />` (not `'○'`)

**`src/app/(onboarding)/animation.tsx`**
- Replace `<Text style={styles.statusText}>{task.status === 'missed' ? '✗' : ''}</Text>` → `<Ionicons name="close" size={14} color="#fff" />`
- Replace `<Text style={styles.statusText}>{task.status === 'done' ? '✓' : ''}</Text>` → `<Ionicons name="checkmark" size={14} color="#fff" />`
- Pending: keep empty circle, no icon needed

**`src/app/(onboarding)/schedule-preview.tsx`**
- Add `const BULLET_ICONS = ['bulb-outline', 'timer-outline', 'sync-outline'] as const;`
- Replace bullet rendering: `<Ionicons name={BULLET_ICONS[i]} size={18} color={theme.colors.primary} />` + plain text (no emoji prefix)
- Also update `buildSchedulePreview` in `src/features/onboarding/utils.ts` to return plain text without emoji prefixes (remove `🧠  `, `⏱   `, `🔄  ` from bullet strings)

**`src/app/(onboarding)/notif-warmup.tsx`**
- Header bell `🔔`: `<Ionicons name="notifications-outline" size={48} color={theme.colors.primary} />`
- Bullet `🔔`: `<Ionicons name="notifications-outline" size={20} color={theme.colors.onSurface} />`
- Bullet `✅`: `<Ionicons name="checkmark-circle-outline" size={20} color={theme.colors.onSurface} />`
- Bullet `💬`: `<Ionicons name="chatbubble-ellipses-outline" size={20} color={theme.colors.onSurface} />`
- Remove `bell` and `bulletEmoji` Text styles (no longer needed)

---

## Issue 2: Wake up and sleep time should open native time picker

**Problem:** Current `sleep-wake.tsx` uses a custom `TimeStepper` component with up/down arrows cycling through hours. User wants a real native time picker (same as TaskFormSheet).

**No new dep needed.** TaskFormSheet already uses `DateTimePicker` from `@expo/ui/community/datetime-picker` (bundled with Expo, part of `@expo/ui`).

### File: `src/app/(onboarding)/sleep-wake.tsx`

**Delete:**
- `TimeStepper` component
- `cycleHour`, `cycleMinute` helper functions
- `stepperContainer`, `stepperValue`, `stepButton`, `stepButtonText` styles

**Add:**
- `import { DateTimePicker } from '@expo/ui/community/datetime-picker';`
- Two state flags: `const [showWakePicker, setShowWakePicker] = useState(false);` and `const [showSleepPicker, setShowSleepPicker] = useState(false);`
- Two pressable time display buttons (same pattern as TaskFormSheet)
- `DateTimePicker` conditionally rendered when flag is true

**Pattern (from TaskFormSheet):**
```tsx
{showWakePicker ? (
  <DateTimePicker
    value={wakeDate}  // Date object from wakeH/wakeM
    mode="time"
    onValueChange={(_event: unknown, date?: Date) => {
      if (date) { setWakeH(date.getHours()); setWakeM(date.getMinutes()); }
      setShowWakePicker(false);
    }}
    onDismiss={() => setShowWakePicker(false)}
  />
) : (
  <Pressable style={styles.timeDisplayBtn} onPress={() => setShowWakePicker(true)}>
    <Text style={styles.timeDisplayText}>{formatTime(wakeH, wakeM)}</Text>
  </Pressable>
)}
```

Same for sleep picker. Keep `formatTime` and `toHHMM` helpers.

---

## Issue 3: Time replanning should also be a bar chart, label closer to chart

**Problem:** `progress-graph.tsx` shows completion rate as bar chart (good) but time replanning as plain stat text (bad). User wants replanning also as a bar chart. Also "Completion rate" label should be closer to its chart (currently it's a subtitle far above).

### File: `src/app/(onboarding)/progress-graph.tsx`

**Remove:**
- `statsRow`, `stat`, `statValue`, `statLabel`, `statArrow` styles
- The entire `<View style={styles.statsRow}>...</View>` block
- `subtitle` style (no longer used — label moves inside card)

**Add:**
- `chartLabel` style (inside each card, above the bars)
- Second `<View style={styles.chartCard}>` with replanning bars
- Reuse existing `AnimatedBar` component for both charts

**New layout:**
```tsx
<Text style={styles.title}>Here's what users see in their first week.</Text>

<View style={styles.chartCard}>
  <Text style={styles.chartLabel}>Completion rate</Text>
  <View style={styles.chartRow}>
    <BarGroup label="Without Shift AI" value={withoutRate} suffix="%" />
    <BarGroup label="With Shift AI" value={withRate} suffix="%" />
  </View>
</View>

<View style={styles.chartCard}>
  <Text style={styles.chartLabel}>Time replanning</Text>
  <View style={styles.chartRow}>
    <BarGroup label="Without" value={withoutMin} suffix=" min" />
    <BarGroup label="With" value={withMin} suffix=" min" />
  </View>
</View>
```

Extract `BarGroup` as a small local component (label + value + AnimatedBar). Two instances per card, two cards total.

For replanning bars: scale `value / maxReplanning` where `maxReplanning = 80` (a bit above the 75 min max, so the bar doesn't fill 100%).

---

## Issue 4: Processing Theatre timing bug

**Problem (3 symptoms):**
1. First item has slight delay before appearing
2. Next 2 items appear at the same time (instead of one-by-one)
3. After 12s, 4th item stays unchecked, continue button disabled

**Root cause:** `CHECKPOINTS` uses `time` (in ms) as both `setTimeout` delay AND display index via `Math.max(i, cp.time / 1000)`. At T+3s, `visibleItems` jumps from 0 to 3 (not 1), showing items 1+2+3 simultaneously.

```ts
// Current broken code:
CHECKPOINTS[0].time = 0;    → setTimeout(…, 0),   sets visibleItems = Math.max(x, 0) = 0
CHECKPOINTS[1].time = 3000; → setTimeout(…, 3000), sets visibleItems = Math.max(x, 3)
CHECKPOINTS[2].time = 6000; → setTimeout(…, 6000), sets visibleItems = Math.max(x, 6)
CHECKPOINTS[3].time = 9000; → setTimeout(…, 9000), sets visibleItems = Math.max(x, 9)

// visible = i <= visibleItems
// At T+3s: visibleItems=3, all 4 items show (i=0,1,2,3 all <= 3)
// The 12s timer sets visibleItems=4, but item 3 needs i<=4 (3<=4=true) so it SHOULD be visible
// But the caption shows (visibleItems >= 4), so the 12s timer DID fire
// The real remaining bug: canAdvance = ritualComplete && done
// If done=false, button stays disabled — save may have silently failed
```

### File: `src/app/(onboarding)/processing-theatre.tsx`

**Replace `setTimeout` cascade with `setInterval`:**

```ts
const CHECKPOINTS = [
  { label: 'Learning your peak hours', icon: 'checkmark-circle' as const },
  { label: 'Mapping your fixed commitments', icon: 'checkmark-circle' as const },
  { label: 'Calibrating your AI assistant', icon: 'checkmark-circle' as const },
  { label: 'Personalizing your experience', icon: 'ellipse-outline' as const },
];

// On mount (in useEffect, with saveStarted ref guard):
doSave();
const interval = setInterval(() => {
  setVisibleItems(i => Math.min(i + 1, CHECKPOINTS.length));
}, 3_000);
return () => clearInterval(interval);
```

**Remove:**
- `CHECKPOINTS[].time` field
- The `CHECKPOINTS.forEach((cp) => { setTimeout(…) })` block
- The separate 12-second `setTimeout` timer
- `RITUAL_DURATION_MS` constant

**Timing with `setInterval` (3s each):**
- T+0: mount, `visibleItems=0`, item 0 visible (i=0 <= 0)
- T+3s: `visibleItems=1`, items 0,1 visible
- T+6s: `visibleItems=2`, items 0,1,2 visible
- T+9s: `visibleItems=3`, all 4 visible (item 3 shows ellipse-outline = "in progress")
- T+12s: `visibleItems=4`, `ritualComplete=true`, caption shows, `canAdvance = true && done`

**Keep:**
- `saveStarted` ref guard (prevent double save)
- `mountedRef` for cleanup
- `canAdvance = ritualComplete && done` logic
- `doSave` callback as-is
- Error/retry UI as-is

---

## Notes

- All icons use `Ionicons` from `@expo/vector-icons` (already installed, import: `import { Ionicons } from '@expo/vector-icons'`)
- Time picker uses `DateTimePicker` from `@expo/ui/community/datetime-picker` (already installed, same as TaskFormSheet)
- No new deps needed
- Do not commit until user says so
- After fixes: run `npm test`, `npx tsc --noEmit`
