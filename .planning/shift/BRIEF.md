# Shift - AI-Powered Day Scheduler

## Objective

Build mobile AI scheduling app. Intelligent, auto-arranged daily schedule recalculates when life happens.

## Problem Statement

Users struggle maintaining productive schedules when unexpected events occur. Manual rescheduling tedious, leads to suboptimal time allocation. Need intelligent assistant to quickly rearrange day based on changing circumstances while respecting preferences/constraints.

## Scope

### In Scope
- **Authentication:** Supabase Auth for user management
- **Onboarding:** 3-screen flow to collect productivity preferences and scheduling context
- **Schedule View:** Time-ordered task list with completion tracking
- **Task Management:** Add, edit, view details, mark complete
- **AI Reschedule:** Intelligent task rearrangement based on user input
- **Undo Functionality:** One-tap undo after AI reschedule
- **Push Notifications:** Task reminders, completion alerts, nudges
- **Payments:** RevenueCat for subscription management
- **Settings:** User preferences management

### Out of Scope
- Calendar integration (future)
- Multi-day scheduling (current focus: single-day)
- Team/shared scheduling
- Web platform (mobile-only for now)

## Tech Stack

- **Framework:** Expo + React Native
- **Language:** TypeScript (strict mode)
- **Navigation:** Expo Router
- **State Management:** Zustand (client state only)
- **Backend:** Supabase (Postgres + Auth + Edge Functions)
- **AI Provider:** OpenRouter (via Supabase Edge Functions)
- **Payments:** RevenueCat
- **Notifications:** expo-notifications

## Architecture Overview

### Folder Structure
```
app/          # Routes and screens (Expo Router)
components/   # Reusable UI components
constants/    # Theme, images, limits
data/         # Hardcoded content (onboarding steps, etc.)
hooks/        # Business logic hooks
lib/          # External service helpers (supabase, ai, notifications, revenuecat)
store/        # Zustand stores
types/        # TypeScript type definitions
assets/       # Images and other assets
providers/    # Context providers
```

### Key Principles
- Fetch from Supabase directly in hooks; don't cache task data in Zustand
- AI calls through Supabase Edge Functions only (never call OpenRouter from client)
- All notifications managed centrally in `lib/notifications.ts`
- Use FlatList for task lists (not .map())
- Theme-aware styling with `createStyles(theme)` pattern
- Minimum 48×48 hitbox for clickable components

## Success Criteria

### Functional
- [ ] Users authenticate via Supabase Auth
- [ ] Users complete onboarding, preferences stored
- [ ] Users view daily schedule with tasks ordered by time
- [ ] Users add, edit, complete tasks
- [ ] AI reschedules tasks based on user input
- [ ] Users undo AI reschedule within 5 seconds
- [ ] Notifications fire at correct times (10 min before, on end, 5 min nudge)
- [ ] Paid users unlimited reschedules; free users daily limit
- [ ] Users update scheduling preferences in settings

### Technical
- [ ] No TypeScript errors in strict mode
- [ ] No `any` types in production code
- [ ] All screens use proper safe area handling
- [ ] Proper separation of concerns (screens vs components vs hooks vs lib)
- [ ] Notifications always synced after schedule changes
- [ ] AI responses validated before writing to DB

### UX
- [ ] Clean, intuitive interface matching design specs
- [ ] Smooth animations and transitions
- [ ] Clear feedback for user actions
- [ ] Helpful AI justifications for task placement

## Manual Setup Steps (User Action Required)

User must complete before development:

1. **Supabase:**
   - Create Supabase project
   - Set up Postgres tables (tasks, user_preferences)
   - Create Edge Function for AI reschedule
   - Configure environment variables

2. **OpenRouter:**
   - Create account, get API key
   - Verify model slugs at openrouter.ai/models
   - Add API key to Supabase Edge Function secrets

3. **RevenueCat:**
   - Create RevenueCat project
   - Configure products and offerings
   - Set up webhook to Supabase (if needed)

4. **Expo/EAS:**
   - Configure app.json/app.config.js
   - Set up EAS Build for device deployment
   - Configure push notification credentials

## Notes

Phased approach — build incrementally, validate each feature before moving to next. Each phase results in working, testable app state.
