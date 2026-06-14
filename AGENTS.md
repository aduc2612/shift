Expert React Native/Expo engineer. Build mobile AI scheduling app.
Write clean, simple, maintainable code. Clarity over abstraction.
Think like senior mobile dev.

---

## Project Overview

AI-powered day scheduler for mobile. Intelligent, auto-arranged daily schedule recalculates when life happens.

App includes:

- **Schedule view:** Time-ordered task list with duration, start/end times, completion checkboxes.
- **AI Reschedule:** User taps Reschedule, optionally describes changes in plain text. AI rearranges day optimally. One-tap undo after.
- **Task detail:** Tap task to view/edit name, duration, deadline, AI justification (why placed here), hidden AI context field (preferred time, effort level, strict/flexible, etc.).
- **Add task:** FAB opens bottom sheet with task name, duration (manual or AI-estimated, manual if AI limits exhausted), deadline, optional AI instructions.
- **Onboarding:** 3-screen flow: productivity peak, wake-up time, freeform scheduling context. Stored as AI system prompt context.
- **Settings:** Freeform text input to update scheduling instructions anytime.
- **Push notifications:** 10 min before task start, on task start, on task end, nudge 5 min after end if unchecked. Always cancelled and fully rewritten after every reschedule.
- **Payments:** RevenueCat paywall gating AI features.

## Keep implementation simple and readable.

---

## Tech Stack

- Expo
- React Native
- TypeScript
- Expo Router
- Zustand
- Supabase (Postgres backend + Auth)
- Supabase Edge Functions (AI proxy — never call OpenRouter from client)
- OpenAI SDK inside Edge Functions, pointed at OpenRouter
- RevenueCat (payments)
- expo-notifications (push notifications)
- react-native-keyboard-controller (keyboard-aware scroll views)

Do not introduce new major libraries unless strong reason.
Ask before installing anything new.

---

## Development Philosophy

Build feature by feature.
For every feature:

1. Read this file first.
2. Keep implementation simple.
3. Avoid overengineering.
4. Prefer readable code over clever code.
5. Build smallest useful version first.
6. Refactor only when repetition appears.

---

## Decision Making

If unclear or could be improved, suggest better approach. If new library would significantly help, recommend, explain why, ask before adding.
Do not install new libraries without approval.

---

## Architecture

All app code in `src/`. Config files (app.json, tsconfig.json, babel.config.js, package.json) at project root.

```
src/
  app/
    (auth)/
    (tabs)/
    _layout.tsx
    index.tsx
    +not-found.tsx

  assets/

  components/

  constants/

  features/
    auth/
      components/
      hooks/
      api.ts
    profile/
      components/
      hooks/
      api.ts

  hooks/

  services/
    supabase.ts
    ai.ts
    notifications.ts
    revenuecat.ts

  store/

  types/

  utils/

  providers/
```

**app/** — routes and screens only. Screens compose components, call hooks/stores. No large reusable UI blocks or business logic.

**assets/** — static files (images, fonts, SVGs).

**components/** — global/shared reusable UI. Create when reused in multiple places, makes screen easier to read, or represents clear UI concept. Examples: `TaskCard`, `RescheduleSheet`, `AddTaskSheet`, `TaskDetailSheet`. Do not create too early.

**constants/** — constants (colors, layout dimensions, API endpoints, images).

**features/** — feature-based domains. Each has own `components/`, `hooks/`, `api.ts`. For feature-specific logic not needing global scope. Examples: `auth/`, `profile/`.

**hooks/** — global/shared custom hooks (e.g. `useTheme`).

**services/** — external service helpers and API clients.

- `supabase.ts` — exports Supabase client.
- `ai.ts` — calls Supabase Edge Function proxying OpenRouter. Never call OpenRouter directly from client.
- `notifications.ts` — exports `syncNotifications(tasks: Task[])`. Only place notifications scheduled. Always cancels all pending before rewriting from scratch.
- `revenuecat.ts` — exports RevenueCat client and paywall helpers.

**store/** — Zustand stores. Do not persist auth state here. Do not cache task data in Zustand — fetch from Supabase via hooks, keep UI state (optimistic updates, undo snapshot) in Zustand.

**types/** — all shared TypeScript type definitions. Do not define types inline in screens or components.

**utils/** — helper functions (date formatters, math utilities, hardcoded data like onboarding steps).

**providers/** — React context providers (theme, RevenueCat, safe area).

---

## UI Rules

Hitbox/hitslop of clickable component at least **48×48**.

Use **useSafeAreaInsets** (not SafeAreaView) from `react-native-safe-area-context` for safe area handling. Ensure `SafeAreaProvider` at app root.

For keyboard handling in sheets with text inputs, use **KeyboardAwareScrollView** from `react-native-keyboard-controller`. Do not use manual `useKeyboardHeight` + `paddingBottom` workarounds.

Never use `.map()` for lists unless guaranteed very small (fewer than ~5 static items). Use **FlatList** instead.

For any UI task:

- Replicate provided design exactly.
- Match layout, spacing, padding, font sizes, font hierarchy, colors, border radius, shadows, alignment, proportions.
- Do not approximate. Do not simplify unless explicitly asked.

---

## Styling Rules

Use `StyleSheet.create` for all styles. No NativeWind or className-based styling.

Avoid borders as much as possible. Use different surface colors and/or shadows for visual separation.

Static base tokens (colors, spacing, typography, border radii, shadows) in `src/constants/theme.ts`, adapt to system theme via `createTheme(isDark)`. Theme uses Material Design 3 naming (e.g. `onBackground`, `onSurface`, `surfaceVariant`).

For component styles depending on theme colors/values, use **theme-aware style factory** pattern:

1. **Factory function (preferred):** Define `createStyles(theme)` function outside component returning `StyleSheet.create(...)`. Call inside component with current theme.

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

2. **useMemo alternative:** Use `useMemo` with `theme` in dependency array when factory pattern impractical.

   ```ts
   const styles = useMemo(() => StyleSheet.create({ ... }), [theme]);
   ```

Do not hardcode color or spacing values inline. Always reference tokens from `src/constants/theme.ts` or current theme object.

---

## Image Rule

Use centralized image imports.

1. Check if `src/constants/images.ts` exists.
2. If not, create it.
3. Import all app images there, export typed `images` object.
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
- Do not store auth session in Zustand — read from Supabase directly via `supabase.auth.getSession()`.
- Do not mirror server data into Zustand permanently. Fetch from Supabase in hooks, apply optimistic updates in store, reconcile on refetch.

### Undo after reschedule

Before calling AI reschedule:

1. Snapshot current task list in Zustand (`undoSnapshot`).
2. Apply AI result optimistically.
3. Show undo toast for 5 seconds.
4. If user taps Undo, restore snapshot and revert Supabase write.
5. After 5 seconds with no undo, clear snapshot.

---

## Database

Tasks in Supabase Postgres. Fetch via Supabase JS client in hooks. No raw SQL outside Edge Functions.

Every table must include `user_id` column referencing authenticated user. Use UUID primary keys.

### Core schema (reference)

```ts
// src/types/task.ts
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
  aiJustification: string | null; // visible — why AI placed this task here
  createdAt: string;
  updatedAt: string;
};
```

```ts
// src/types/userPreferences.ts
export type UserPreferences = {
  userId: string;
  productivityPeak: "morning" | "afternoon" | "evening" | "varies";
  wakeUpTime: string; // "HH:MM"
  schedulingContext: string; // freeform, passed into AI system prompt
};
```

### SQL Migrations

SQL migration scripts live in `supabase/migrations/`. When the schema changes:
1. Create a new numbered migration file (e.g., `003_add_feature.sql`)
2. Run it in the Supabase SQL Editor
3. Document the change in the relevant planning files

Never modify existing migration files — always create a new one.

---

## AI Integration

**Never call OpenRouter from client.** All AI calls through single Supabase Edge Function.

### Edge Function contract

Function lives at `supabase/functions/reschedule/index.ts`.

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

Edge Function must validate and strip extra fields before returning. Client writes returned task updates to Supabase, then calls `syncNotifications`.

### Model fallback chain

Edge Function tries models in order, falls back on error or timeout:

1. Primary
2. Fallback 1
3. Fallback 2

> **Note:** Confirm exact OpenRouter model slugs before implementing Edge Function. Model names in project brief may not match live OpenRouter slugs. Always verify at [openrouter.ai/models](https://openrouter.ai/models).

### Prompt rules

- Always instruct model to return **only valid JSON** matching response schema. No preamble, no markdown fences.
- Strip ` ```json ` fences before parsing if model ignores instruction.
- Validate parsed response shape before writing to DB. If validation fails, return error to client — do not write partial data.

---

## Notifications

All notification logic in `src/services/notifications.ts`. No other file schedules or cancels notifications.

```ts
// src/services/notifications.ts
export async function syncNotifications(tasks: Task[]): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const task of tasks) {
    if (task.completed) continue;
    // 10 min before start
    // On task start
    // On task end
    // Nudge 5 min after end (cancelled if task is checked off)
    // Schedule all three using expo-notifications
  }
}
```

Call `syncNotifications` after:

- Initial app load
- Every AI reschedule (success path only)
- Every manual task edit changing start/end time
- Every task completion (to cancel its nudge)

Request notification permissions during onboarding, before first screen explaining what they are for.

---

## Payments

RevenueCat handles all payment logic. Client in `src/services/revenuecat.ts`.

- Gate AI reschedule behind paywall. Free users limited reschedules per day (define limit in `src/constants/limits.ts`).
- Show RevenueCat paywall sheet when free user hits limit or taps upsell surface.
- Never implement custom receipt validation — RevenueCat handles this.
- Never store subscription status in Supabase manually — read from RevenueCat at runtime.

---

## Onboarding

Three screens, kept minimal. Store results in `UserPreferences` via Supabase after final screen.

- **Screen 1 — Productivity peak:** Single-select: Morning / Afternoon / Evening / Varies.
- **Screen 2 — Wake-up time:** Time picker defaulting to 7:00 AM.
- **Screen 3 — Scheduling context:** Freeform text input with placeholder examples ("I'm a student.", "I work night shifts.", "I have ADHD.").

Request notification permissions after Screen 3, before entering main app.

---

## Authentication

Use Supabase Auth. Do not build custom auth.

- Supabase client in `src/services/supabase.ts`.
- Use `supabase.auth.getSession()` to read current session.
- Protect routes using Expo Router layout guards in `app/(auth)/`.
- Never store access token manually — Supabase handles refresh.

```ts
// src/services/supabase.ts
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@env";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

---

## Secrets

- Never expose secret keys in client code.
- Use `.env` with `@env` (react-native-dotenv) for `SUPABASE_URL` and `SUPABASE_ANON_KEY` only — safe to expose.
- OpenRouter API key lives only in Supabase Edge Function environment variables. Never in client bundle.
- Never put Supabase service role key in client code.

---

## TypeScript

- Strict mode.
- No `any`.
- Keep types simple and readable.
- Define all shared types in `types/`. No types inline in screens or components.

---

## Feature Implementation

When building feature:

1. Read this file first.
2. Identify files to change.
3. Keep changes focused.
4. Always inform user of manual steps needed (Supabase dashboard changes, EAS configuration, RevenueCat setup). Do not attempt those operations unless explicitly asked.
5. Do not rewrite unrelated code.
6. Follow existing patterns.
7. Ensure feature works end to end.
8. Fix all lint and type errors before finishing.

---

## Communication

Be concise. Explain what changed and how to test it.

---

## Testing

Every phase must include unit tests before moving to the next phase.

**Stack:** Jest + jest-expo preset + @testing-library/react-native.

**What to test:**
- **Utility functions & data munging** — pure functions, formatters, parsers, builders
- **Form & input fields** — validation, submission, edge cases, required fields
- **Custom hooks** — use `renderHook` from @testing-library/react-native, mock external deps
- **Complex component & event behaviors** — user interactions, conditional rendering, state changes, error states
- **Navigation decisions** — route guards, redirect logic, Expo Router screen rendering

**Conventions:**
- Co-locate tests next to source: `date.test.ts` next to `date.ts`, or in `__tests__/` subfolder
- Name: `<module>.test.ts` or `<module>.test.tsx`
- Mock external services (Supabase, RevenueCat, Notifications) — never call real APIs in tests
- Test edge cases: empty arrays, null values, missing fields, network errors
- Keep tests fast and deterministic — no real timers, no real network

**Scripts:**
- `npm test` — run all tests once
- `npm run test:watch` — watch mode for active development
- `npm run test:coverage` — generate coverage report

## Final Reminder

Before every feature:

- Read this file.
- Follow it strictly.
- Build clean, simple code.
- Follow basic principles: Separation of Concerns, Reusability, Performance.
- Replicate UI exactly when designs provided.
