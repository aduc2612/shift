You are an expert React Native and Expo engineer helping me build a mobile AI scheduling app.
Write clean, simple, maintainable code. Prioritize clarity over unnecessary abstraction.
Think like a senior mobile developer.

---

## Project Overview

We are building an AI-powered day scheduler for mobile. The app gives users an intelligent, auto-arranged daily schedule that recalculates on the fly when life happens.

The app includes:

- **Schedule view:** A time-ordered list of tasks for the day with duration, start/end times, and completion checkboxes.
- **AI Reschedule:** User taps Reschedule, optionally describes what changed in plain text, and the AI rearranges the entire day optimally. After rescheduling, the user can undo with one tap.
- **Task detail:** Tap any task to view/edit its name, duration, deadline, AI justification (why the AI placed it here), and a hidden AI context field for nuances (preferred time, effort level, strict or flexible, etc.).
- **Add task:** FAB opens a bottom sheet with task name, duration (manual or AI-estimated, manual if the user ran out of AI limits), deadline, and optional instructions for the AI.
- **Onboarding:** 3-screen flow collecting productivity peak, wake-up time, and freeform scheduling context. Stored as AI system prompt context.
- **Settings:** Freeform text input for the user to update their scheduling instructions at any time.
- **Push notifications:** 10 min before a task starts, on task end, and a nudge 5 min after task end if it is not checked off. Notifications are always cancelled and fully rewritten after every reschedule.
- **Payments:** RevenueCat paywall gating AI features.

## Keep the implementation simple and readable.

---

## Tech Stack

- Expo
- React Native
- TypeScript
- Expo Router
- Zustand
- Supabase (Postgres backend + Auth)
- Supabase Edge Functions (AI proxy — never call OpenRouter from the client)
- OpenAI SDK inside Edge Functions, pointed at OpenRouter
- RevenueCat (payments)
- expo-notifications (push notifications)

Do not introduce new major libraries unless there is a strong reason.
Ask before installing anything new.

---

## Development Philosophy

Build feature by feature.
For every feature:

1. Read this file first.
2. Keep the implementation simple.
3. Avoid overengineering.
4. Prefer readable code over clever code.
5. Build the smallest useful version first.
6. Refactor only when repetition appears.

---

## Decision Making

If something is unclear or could be improved, suggest a better approach. If a new library would significantly help, recommend it, explain why, and ask before adding it.
Do not install new libraries without approval.

---

## Architecture

Use this folder structure (all folders inside `src/`):

```
app/
  (auth)/
  (tabs)/

components/

constants/

data/

hooks/

lib/
  supabase.ts
  ai.ts
  notifications.ts
  revenuecat.ts

store/

types/

assets/

providers/
```

**app/** is for routes and screens only. Screens compose components and call hooks or stores. They must not contain large reusable UI blocks or business logic.

**components/** is for reusable UI. Create a component when it is reused in multiple places, when it makes a screen easier to read, or when it represents a clear UI concept. Examples: `TaskCard`, `RescheduleSheet`, `AddTaskSheet`, `TaskDetailSheet`. Do not create components too early.

**data/** holds hardcoded content such as onboarding steps and example notification copy. Keep it typed.

**hooks/** holds custom hooks for business logic: fetching tasks, triggering reschedule, syncing notifications.

**lib/** holds external service helpers.

- `supabase.ts` — exports the Supabase client.
- `ai.ts` — calls the Supabase Edge Function that proxies OpenRouter. Never call OpenRouter directly from the client.
- `notifications.ts` — exports `syncNotifications(tasks: Task[])`. This is the only place notifications are scheduled. It always cancels all pending notifications before rewriting them from scratch.
- `revenuecat.ts` — exports the RevenueCat client and paywall helpers.

**store/** holds Zustand stores. Do not persist auth state here. Do not cache task data in Zustand — fetch from Supabase directly via hooks and keep UI state (optimistic updates, undo snapshot) in Zustand.

**providers/** holds React context providers (theme, RevenueCat, safe area).

---

## UI Rules

Always make the hitbox / hitslop of a clickable component at least **48×48**.

Always use **useSafeAreaInsets** (not SafeAreaView) from `react-native-safe-area-context` wherever safe area handling is needed. Ensure `SafeAreaProvider` is at the root of the app.

Never use `.map()` for lists unless the list is guaranteed to be very small (fewer than ~5 static items). Use **FlatList** instead.

For any UI task:

- Replicate the provided design exactly.
- Match layout, spacing, padding, font sizes, font hierarchy, colors, border radius, shadows, alignment, and proportions.
- Do not approximate. Do not simplify unless explicitly asked.

---

## Styling Rules

Use `StyleSheet.create` for all styles. Do not use NativeWind or className-based styling.

Avoid using borders as much as possible. Use different surface colors and/or shadows to create visual separation.

Static base tokens (colors, spacing, typography, border radii, shadows) are defined in `constants/theme.ts` and adapt to the system theme via `createTheme(isDark)`.

For component styles that depend on theme colors or values, use a **theme-aware style factory** pattern:

1. **Factory function (preferred):** Define a `createStyles(theme)` function outside the component that returns `StyleSheet.create(...)`. Call it inside the component with the current theme.

   ```ts
   function createStyles(theme: Theme) {
     return StyleSheet.create({
       container: {
         backgroundColor: theme.colors.background,
         padding: spacing.lg,
       },
     });
   }

   export default function MyComponent() {
     const theme = useTheme();
     const styles = createStyles(theme);
     // ...
   }
   ```

2. **useMemo alternative:** Use `useMemo` with `theme` in the dependency array when the factory pattern is impractical.

   ```ts
   const styles = useMemo(() => StyleSheet.create({ ... }), [theme]);
   ```

Do not hardcode color or spacing values inline. Always reference tokens from `constants/theme.ts` or the current theme object.
Refer to `constants/ThemeExampleStylesheet.tsx` as a reference if needed.

---

## Image Rule

Use centralized image imports.

1. Check if `constants/images.ts` exists.
2. If not, create it.
3. Import all app images there and export a typed `images` object.
4. Use images only through this object.

```ts
import logo from "@/assets/images/logo.png";
export const images = {
  logo,
};
```

```tsx
<Image source={images.logo} />
```

Do not import image assets directly inside screens or components.

---

## State Management

- **Zustand** for global client state: UI state, optimistic task list, undo snapshot after reschedule, onboarding completion flag.
- **Local state** for temporary UI state: input values, bottom sheet visibility, loading flags.
- Do not store the auth session in Zustand — read it from Supabase directly via `supabase.auth.getSession()`.
- Do not mirror server data into Zustand permanently. Fetch from Supabase in hooks, apply optimistic updates in the store, and reconcile on refetch.

### Undo after reschedule

Before calling the AI reschedule:

1. Snapshot the current task list in Zustand (`undoSnapshot`).
2. Apply the AI result optimistically.
3. Show an undo toast for 5 seconds.
4. If the user taps Undo, restore the snapshot and revert the Supabase write.
5. After 5 seconds with no undo, clear the snapshot.

---

## Database

Tasks live in Supabase Postgres. Fetch them via the Supabase JS client in hooks. Do not use raw SQL outside of Edge Functions.

Every table must include a `user_id` column referencing the authenticated user. Use UUID primary keys.

### Core schema (reference)

```ts
// types/task.ts
export type Task = {
  id: string; // uuid
  userId: string;
  name: string;
  startTime: string; // ISO 8601, e.g. "2025-06-10T08:00:00"
  endTime: string; // ISO 8601
  durationMinutes: number;
  deadline: string | null; // ISO 8601 date
  completed: boolean;
  aiContext: string | null; // hidden field — AI nuances only, never shown to user
  aiJustification: string | null; // visible — why the AI placed this task here
  createdAt: string;
  updatedAt: string;
};
```

```ts
// types/userPreferences.ts
export type UserPreferences = {
  userId: string;
  productivityPeak: "morning" | "afternoon" | "evening" | "varies";
  wakeUpTime: string; // "HH:MM"
  schedulingContext: string; // freeform, passed into AI system prompt
};
```

---

## AI Integration

**Never call OpenRouter from the client.** All AI calls go through a single Supabase Edge Function.

### Edge Function contract

The function lives at `supabase/functions/reschedule/index.ts`.

**Request body:**

```ts
{
  tasks: Task[];
  userContext: string;       // from UserPreferences.schedulingContext
  whatChanged: string;       // user's plain-text description, may be empty
}
```

**Response body:**

```ts
{
  tasks: {
    id: string;
    startTime: string; // ISO 8601
    endTime: string; // ISO 8601
    durationMinutes: number;
    aiJustification: string; // one sentence, shown to user
    aiContext: string; // nuances stored silently
  }
  [];
}
```

The Edge Function must validate and strip any extra fields before returning. The client writes the returned task updates to Supabase and then calls `syncNotifications`.

### Model fallback chain

The Edge Function tries models in this order and falls back on error or timeout:

1. Primary
2. Fallback 1
3. Fallback 2

> **Note:** Confirm the exact OpenRouter model slugs before implementing the Edge Function. The model names in the project brief may not match live OpenRouter slugs. Always verify at [openrouter.ai/models](https://openrouter.ai/models).

### Prompt rules

- Always instruct the model to return **only valid JSON** matching the response schema. No preamble, no markdown fences.
- Strip ` ```json ` fences before parsing if the model ignores the instruction.
- Validate the parsed response shape before writing to the DB. If validation fails, return an error to the client — do not write partial data.

---

## Notifications

All notification logic lives in `lib/notifications.ts`. No other file schedules or cancels notifications.

```ts
// lib/notifications.ts
export async function syncNotifications(tasks: Task[]): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const task of tasks) {
    if (task.completed) continue;
    // 10 min before start
    // On task end
    // Nudge 5 min after end (cancelled if task is checked off)
    // Schedule all three using expo-notifications
  }
}
```

Call `syncNotifications` after:

- Initial app load
- Every AI reschedule (success path only)
- Every manual task edit that changes start/end time
- Every task completion (to cancel its nudge)

Request notification permissions during onboarding, before the first screen that explains what they are for.

---

## Payments

RevenueCat handles all payment logic. The client lives in `lib/revenuecat.ts`.

- Gate AI reschedule behind a paywall. Free users may have a limited number of reschedules per day (define the limit in `constants/limits.ts`).
- Show the RevenueCat paywall sheet when a free user hits the limit or taps an upsell surface.
- Never implement custom receipt validation — RevenueCat handles this.
- Never store subscription status in Supabase manually — read it from RevenueCat at runtime.

---

## Onboarding

Three screens, kept minimal. Store results in `UserPreferences` via Supabase after the final screen.

- **Screen 1 — Productivity peak:** Single-select: Morning / Afternoon / Evening / Varies.
- **Screen 2 — Wake-up time:** Time picker defaulting to 7:00 AM.
- **Screen 3 — Scheduling context:** Freeform text input with placeholder examples ("I'm a student.", "I work night shifts.", "I have ADHD.").

Request notification permissions after Screen 3, before entering the main app.

---

## Authentication

Use Supabase Auth. Do not build custom auth.

- The Supabase client lives in `lib/supabase.ts`.
- Use `supabase.auth.getSession()` to read the current session.
- Protect routes using Expo Router layout guards in `app/(auth)/`.
- Never store the access token manually — Supabase handles refresh.

```ts
// lib/supabase.ts
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@env";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

---

## Secrets

- Never expose secret keys in client code.
- Use `.env` with `@env` (react-native-dotenv) for `SUPABASE_URL` and `SUPABASE_ANON_KEY` only — these are safe to expose.
- The OpenRouter API key lives only in Supabase Edge Function environment variables. It must never appear in the client bundle.
- Never put the Supabase service role key in client code.

---

## TypeScript

- Strict mode.
- No `any`.
- Keep types simple and readable.
- Define all shared types in `types/`. Do not define types inline in screens or components.

---

## Feature Implementation

When building a feature:

1. Read this file first.
2. Identify the files to change.
3. Keep changes focused.
4. Always inform the user of any manual steps they must perform (Supabase dashboard changes, EAS configuration, RevenueCat setup). Do not attempt those operations yourself unless explicitly asked.
5. Do not rewrite unrelated code.
6. Follow existing patterns.
7. Make sure the feature works end to end.
8. Fix all lint and type errors before finishing.

---

## Communication

Be concise. Explain what changed and how to test it.

---

## Final Reminder

Before every feature:

- Read this file.
- Follow it strictly.
- Build clean, simple code.
- Follow basic principles: Separation of Concerns, Reusability, Performance.
- Replicate UI exactly when designs are provided.
