# Shift Implementation Roadmap

## Overview

Roadmap breaks Shift into 10 phases. Each builds on previous, results in working, testable app state. Ordered to minimize rework, allow early validation of core features.

## Phase Breakdown

### Phase 1: Project Setup & Infrastructure
**Goal:** Establish foundation — Expo project, folder structure, Supabase client, basic navigation.

**Deliverables:**
- Expo project initialized with TypeScript
- Folder structure per AGENTS.md
- Supabase client configured in `lib/supabase.ts`
- Expo Router basic setup with tab navigation
- Theme system in `constants/theme.ts`
- Safe area provider at app root
- Basic app shell with placeholder screens

**Validation:** App runs without errors, can navigate between tabs.

---

### Phase 2: Authentication
**Goal:** Implement Supabase Auth with route protection.

**Deliverables:**
- Login/signup screens
- Supabase Auth integration
- Auth state management (via Supabase, not Zustand)
- Route guards in `app/(auth)/` layout
- Redirect logic (auth -> tabs, no auth -> login)

**Validation:** Users sign up, log in, log out. Protected routes redirect correctly.

**Supabase Setup Required:**
- Enable Email auth provider
- Configure auth settings

---

### Phase 3: Sentry Setup
**Goal:** Add error monitoring, tracing, session replay, and profiling for early visibility into issues during development.

**Deliverables:**
- Install `@sentry/react-native`
- Configure `metro.config.js` with `getSentryExpoConfig` for source maps
- Add `@sentry/react-native/expo` plugin to `app.json`
- Create `Sentry.init()` in `src/app/_layout.tsx` with:
  - Error monitoring (JS + native crashes)
  - Tracing (navigation, app start, network)
  - Session Replay (on error + sampled sessions)
  - Profiling (CPU profiling)
  - Logging (`Sentry.logger.*`)
- Wrap `RootLayout` with `Sentry.wrap()`
- Create `android/sentry.properties`
- Create `ios/sentry.properties`
- Add `EXPO_PUBLIC_SENTRY_DSN` to `.env`
- Set up source map uploads for production builds

**Validation:** App runs with Sentry initialized. Errors captured in Sentry dashboard. Source maps upload correctly on build.

**Manual Setup Required:**
- Create Sentry project at sentry.io
- Get DSN from Sentry project settings
- Generate Sentry Auth Token for source map uploads
- Add `SENTRY_AUTH_TOKEN` to `.env.local` (gitignored)
- Add `SENTRY_AUTH_TOKEN` to EAS secrets for CI builds

---

### Phase 4: Core Schedule UI
**Goal:** Display daily schedule with tasks ordered by time.

**Deliverables:**
- Schedule view screen in `app/(tabs)/`
- TaskCard component
- FlatList for task list
- Fetch tasks from Supabase in hook
- Display task name, time range, duration, completion status
- Empty state when no tasks
- Date display (today's date)

**Validation:** Schedule screen displays tasks fetched from Supabase, ordered by start time.

**Supabase Setup Required:**
- Create `tasks` table with all columns from AGENTS.md schema
- Row Level Security (RLS) policies for tasks

---

### Phase 5: Task Management
**Goal:** Enable users to add, edit, complete tasks.

**Deliverables:**
- FAB (Floating Action Button) on schedule screen
- AddTaskSheet bottom sheet component
- Task input form: name, duration, deadline, AI instructions
- TaskDetailSheet for viewing/editing tasks
- Edit functionality: name, duration, deadline, AI context
- Completion checkbox on TaskCard
- Supabase CRUD via hooks
- Optimistic updates for completion

**Validation:** Users add tasks, view/edit task details, mark complete. All changes persist to Supabase.

---

### Phase 6: AI Reschedule
**Goal:** Implement AI-powered rescheduling with undo.

**Deliverables:**
- Supabase Edge Function for AI reschedule
- AI service in `lib/ai.ts` to call Edge Function
- RescheduleSheet component with text input for "what changed"
- Reschedule button on schedule screen
- Model fallback chain (primary, fallback 1, fallback 2)
- Response validation before DB write
- Undo with Zustand store (snapshot before reschedule)
- Undo toast with 5-second timeout
- AI justification display in TaskDetailSheet
- AI context field (hidden, used by AI)

**Validation:** User taps reschedule, optionally describes changes, AI rearranges tasks, user can undo within 5 seconds.

**Supabase Setup Required:**
- Create Edge Function `reschedule`
- Add OpenRouter API key to Edge Function secrets
- Configure model slugs (verify at openrouter.ai/models)

---

### Phase 7: Notifications
**Goal:** Implement push notifications for task reminders and nudges.

**Deliverables:**
- Notification service in `lib/notifications.ts`
- `syncNotifications(tasks)` function
- Cancel all notifications before rewriting
- Schedule 3 notifications per task:
  - 10 minutes before start
  - On task end
  - Nudge 5 minutes after end (cancelled if task completed)
- Call `syncNotifications` after:
  - Initial app load
  - AI reschedule (success only)
  - Manual task edit (time changes)
  - Task completion (to cancel nudge)
- Notification content and data payload
- Handle notification tap (navigate to task)

**Validation:** Notifications fire at correct times. Nudge cancels when task marked complete. All notifications resync after reschedule.

**Manual Setup Required:**
- Configure push notification credentials in Expo/EAS
- Test on physical device (notifications don't work in Expo Go)

---

### Phase 8: Onboarding Flow
**Goal:** Collect user preferences through 3-screen onboarding.

**Deliverables:**
- Screen 1: Productivity peak selection (morning/afternoon/evening/varies)
- Screen 2: Wake-up time picker (default 7:00 AM)
- Screen 3: Freeform scheduling context input
- Store preferences in Supabase `user_preferences` table
- Onboarding completion flag in Zustand
- Notification permission request after Screen 3

**Validation:** New users complete onboarding, preferences saved to Supabase, returning users skip onboarding.

**Supabase Setup Required:**
- Create `user_preferences` table: user_id, productivity_peak, wake_up_time, scheduling_context

---

### Phase 9: Payments
**Goal:** Implement RevenueCat subscription management, gate AI features.

**Deliverables:**
- RevenueCat client in `lib/revenuecat.ts`
- RevenueCat provider in `providers/`
- Paywall component using RevenueCat UI
- Daily reschedule limit for free users (define in `constants/limits.ts`)
- Check entitlement before reschedule
- Show paywall when free user hits limit
- Track reschedule count per day (reset at midnight)

**Validation:** Free users reschedule up to daily limit, then see paywall. Paid users unlimited.

**Manual Setup Required:**
- Create RevenueCat project
- Configure products (monthly/annual subscriptions)
- Set up offerings
- Add RevenueCat API keys to app

---

### Phase 10: Settings & Polish
**Goal:** Add settings screen and final polish.

**Deliverables:**
- Settings screen accessible from profile/settings tab
- Freeform text input for updating scheduling context
- Save changes to Supabase `user_preferences`
- Dark mode support (theme adapts to system)
- Loading states and error handling throughout app
- Empty states with helpful messaging
- Final UI polish (spacing, typography, animations)
- Test on both iOS and Android

**Validation:** Users update preferences in settings. App looks good in light/dark mode. No crashes or major bugs.

---

## Phase Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Auth)
    ↓
Phase 3 (Sentry Setup) ← Run early for dev visibility
    ↓
Phase 4 (Core Schedule UI)
    ↓
Phase 5 (Task Management)
    ↓
Phase 6 (AI Reschedule) ← Requires Supabase Edge Function
    ↓
Phase 7 (Notifications) ← Integrates with Phase 5 & 6
    ↓
Phase 8 (Onboarding)
    ↓
Phase 9 (Payments) ← Can potentially run in parallel with 8
    ↓
Phase 10 (Settings & Polish)
```

## Testing Strategy

After each phase:
1. Test on iOS simulator (if on Mac) or Android emulator
2. Verify Supabase data correct
3. Check TypeScript errors
4. Validate UI matches design specs (if available)
5. Test edge cases (empty states, error states, loading states)

## Manual Steps Checklist

Track here as completed:

- [ ] Create Supabase project
- [ ] Enable Email auth in Supabase
- [ ] Create `tasks` table
- [ ] Create `user_preferences` table
- [ ] Set up RLS policies for both tables
- [ ] Create Sentry project at sentry.io
- [ ] Get Sentry DSN and add to `.env`
- [ ] Generate Sentry Auth Token for source map uploads
- [ ] Add `SENTRY_AUTH_TOKEN` to EAS secrets
- [ ] Create Edge Function `reschedule`
- [ ] Add OpenRouter API key to Edge Function
- [ ] Verify OpenRouter model slugs
- [ ] Configure push notification credentials in Expo
- [ ] Create RevenueCat project
- [ ] Configure RevenueCat products and offerings
- [ ] Add RevenueCat API keys to app

## Next Steps

After roadmap created:
1. Review and confirm phase breakdown
2. Use `/skill:start-work-plan` to create detailed execution plan for Phase 1
3. Use `/skill:start-work-run` to execute Phase 1 plan
