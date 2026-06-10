# Shift - AI-Powered Day Scheduler

## Objective

Build a mobile AI scheduling app that gives users an intelligent, auto-arranged daily schedule that recalculates on the fly when life happens.

## Problem Statement

Users struggle to maintain productive daily schedules when unexpected events occur. Manual rescheduling is tedious and often leads to suboptimal time allocation. Users need an intelligent assistant that can quickly rearrange their day based on changing circumstances while respecting their preferences and constraints.

## Scope

### In Scope
- **Authentication:** Supabase Auth for user management
- **Onboarding:** 3-screen flow to collect productivity preferences and scheduling context
- **Schedule View:** Time-ordered list of tasks with completion tracking
- **Task Management:** Add, edit, view details, mark complete
- **AI Reschedule:** Intelligent rearrangement of tasks based on user input
- **Undo Functionality:** One-tap undo after AI reschedule
- **Push Notifications:** Task reminders, completion alerts, and nudges
- **Payments:** RevenueCat integration for subscription management
- **Settings:** User preferences management

### Out of Scope
- Calendar integration (future consideration)
- Multi-day scheduling (current focus is single-day)
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
- AI calls go through Supabase Edge Functions only (never call OpenRouter from client)
- All notifications managed centrally in `lib/notifications.ts`
- Use FlatList for task lists (not .map())
- Theme-aware styling with `createStyles(theme)` pattern
- Minimum 48×48 hitbox for clickable components

## Success Criteria

### Functional
- [ ] Users can authenticate via Supabase Auth
- [ ] Users complete onboarding and preferences are stored
- [ ] Users can view their daily schedule with tasks ordered by time
- [ ] Users can add, edit, and complete tasks
- [ ] AI can reschedule tasks based on user input
- [ ] Users can undo AI reschedule within 5 seconds
- [ ] Notifications fire at correct times (10 min before, on end, 5 min nudge)
- [ ] Paid users have unlimited reschedules; free users have daily limit
- [ ] Users can update scheduling preferences in settings

### Technical
- [ ] No TypeScript errors in strict mode
- [ ] No `any` types in production code
- [ ] All screens use proper safe area handling
- [ ] Proper separation of concerns (screens vs components vs hooks vs lib)
- [ ] Notifications are always synced after schedule changes
- [ ] AI responses are validated before writing to DB

### UX
- [ ] Clean, intuitive interface matching design specs
- [ ] Smooth animations and transitions
- [ ] Clear feedback for user actions
- [ ] Helpful AI justifications for task placement

## Manual Setup Steps (User Action Required)

These steps must be completed by the user before development:

1. **Supabase:**
   - Create Supabase project
   - Set up Postgres tables (tasks, user_preferences)
   - Create Edge Function for AI reschedule
   - Configure environment variables

2. **OpenRouter:**
   - Create account and get API key
   - Verify model slugs at openrouter.ai/models
   - Add API key to Supabase Edge Function secrets

3. **RevenueCat:**
   - Create RevenueCat project
   - Configure products and offerings
   - Set up webhook to Supabase (if needed)

4. **Expo/EAS:**
   - Configure app.json/app.config.js
   - Set up EAS Build if deploying to devices
   - Configure push notification credentials

## Notes

This project follows a phased approach to build incrementally and validate each feature before moving to the next. Each phase should result in a working, testable application state.
