# Phase 8 — Onboarding (Universal Plan)

> Pure design + specs. No code, no file paths. Read this before reading `08-01-PLAN.md`.

## 1. Purpose

Convert a brand-new authenticated user into a personalized Shift user with rich context the AI reschedule can use. The flow doubles as marketing (credibility, social proof, transformation promise) and product education (reschedule animation, schedule preview, notification opt-in).

A single real persistence event happens mid-flow. Everything before it is in-memory. Everything after it is post-onboarding polish.

## 2. Scope

**In:**

- Hook screen replacing current Google sign-in screen
- 13 questionnaire / sell / opt-in screens
- Onboarding state machine, routing, persistence
- Schema migration extending `user_preferences`
- AI prompt helper that consumes the new fields (defined, not wired — see §10)
- Notification permission request, exactly once

**Out:**

- Paywall (Phase 9 — dropped from this flow)
- Source / attribution tracking (no analytics infra; YAGNI)
- Mid-flow resume / crash recovery (restart on app close)
- Settings screen for editing preferences (Phase 10)
- A/B testing, localization, additional animations

## 3. User Journey

14 screens. Screen 1 (Hook) is shown to unauthenticated users; tapping Get Started triggers Google sign-in. Screens 2-14 are shown to authenticated users with `onboarding_completed = false`.

| # | Screen | Purpose | Data captured | Validation |
|---|--------|---------|---------------|------------|
| 1 | Hook | Marketing entry, triggers auth | — | Always advance on Get Started |
| 2 | Identity | Persona self-labeling | `persona` (single) | Required |
| 3 | Pain points | Problem articulation | `painPoints` (multi) | Optional (zero allowed) |
| 4 | Animation | Desire — show AI reschedule in action | — | Auto-advance after 4s sequence |
| 5 | Sleep & wake | Alertness window | `sleepTime`, `wakeUpTime` | Both required |
| 6 | Energy peak | Chronotype | `productivityPeak` (single) | Required |
| 7 | Hard constraints | Fixed schedule items | `hardConstraints` (multi, mutual exclusion) | Optional, with rule |
| 8 | Freeform context | Open-ended nuance | `schedulingContext` (text) | Optional, has Skip |
| 9 | Persona review | Social proof, segmented by persona | — | Always advance |
| 10 | Progress graph | Transformation proof | — | Always advance (after animation) |
| 11 | Processing theatre | Ritual + real persistence | writes all data | Real save must succeed |
| 12 | Schedule preview | Personalized sample, loss aversion | — | Always advance |
| 13 | Notif warm-up | Consent priming | — | Two buttons |
| 14 | OS notif dialog | System permission | granted / denied | Auto-advance on resolution |

After Screen 14, route to main tabs. No paywall. No welcome screen — the action of completing the last screen IS the transition.

## 4. Data Model

### Schema changes — migration 004

`user_preferences` table gains 5 columns. No other tables change. No new tables.

| Column | Type | Default | Notes |
|---|---|---|---|
| `onboarding_completed` | `boolean NOT NULL` | `false` | Routing signal |
| `persona` | `text NULL` | `NULL` | enum: `student`, `professional`, `parent`, `freelancer`, `shift_worker`, `other` |
| `sleep_time` | `time NULL` | `NULL` | Postgres `time`, "HH:MM:SS" |
| `pain_points` | `text[] NULL` | `NULL` | enum array, see below |
| `hard_constraints` | `text[] NULL` | `NULL` | enum array, see below |

`pain_points` enum values: `delay_collapse`, `no_priorities`, `afternoon_slump`, `replan_too_much`, `unfinished_guilt`, `anxiety`.
`hard_constraints` enum values: `morning_routine`, `school`, `work_hours`, `childcare`, `medical`, `none`.

CHECK constraints in SQL enforce enum membership. RLS policies unchanged.

### Field semantics

- `persona` and `productivity_peak` are single values (radio-style selection).
- `pain_points` and `hard_constraints` are arrays (multi-checkbox).
- `sleep_time` and `wake_up_time` are independent; user can sleep late and wake early (shift worker pattern).
- `scheduling_context` is freeform text, can be empty (user skips).
- `onboarding_completed` flips to `true` only after Screen 11's save succeeds.

### Existing row behavior

Any user with a `user_preferences` row but `onboarding_completed = false` is treated as needing onboarding. New columns default to `NULL` or empty arrays; the flow populates them. No backfill.

## 5. Routing

Three states, evaluated in app root layout:

1. `!isAuthenticated` → `(auth)` — shows the Hook
2. `isAuthenticated && !onboardingComplete` → `(onboarding)/*`
3. `isAuthenticated && onboardingComplete` → `(tabs)`

`onboardingComplete` is read from `user_preferences.onboarding_completed` via a single hook in the root. After Screen 11's save, the query invalidates and the user is rerouted to `(tabs)` (not Screen 12 onwards) — wait, no. After Screen 11's save, the user continues to Screens 12-14 first, then lands in `(tabs)`. The `onboardingCompleted` flag being true doesn't short-circuit the rest of the flow. The flag only prevents future launches from re-running onboarding.

## 6. State Management

### During the flow

In-memory `OnboardingData` object held in a Zustand slice or React context. Updated incrementally as the user moves through screens. **No DB writes until Screen 11.** App restart discards the in-memory state; user restarts from Screen 2.

### Persistence trigger

Screen 11. One UPSERT into `user_preferences` setting every collected field plus `onboarding_completed = true` and `updated_at = now()`. The query that the routing hook listens to is invalidated on success, so subsequent reads return the new state.

### Failure handling on Screen 11

- If save fails: replace progress UI with error + retry button. Do not advance to Screen 12.
- If save succeeds before T=12s: hold the screen, do not advance early — preserve the ritual.
- If save takes longer than T=12s: hold until resolved, then advance.
- No timeout cap. Network call can take as long as it needs; the screen is patient.

## 7. Edge Cases & Rules

### Hard constraints mutual exclusion (Screen 7)

The "Nothing fixed — full flexibility" option (value: `none`) cannot coexist with any other constraint.

- Toggling `none` on → deselect all other constraint options.
- Toggling any non-`none` option on → deselect `none` if currently selected.

This is a UI rule only, not a DB constraint. A user who bypasses the UI is on their own.

### Skip rules

- Screens 2, 5, 6: required selections to advance.
- Screens 3, 7: zero selections allowed, no skip button needed (just Continue).
- Screen 8: explicit "Skip for now →" alongside "Continue →" — both advance.
- Screens 9, 10, 12, 13: no skip — must advance.
- Screen 11: cannot skip, must wait for save to resolve.
- Screen 14: cannot skip, must resolve system prompt.

### Animation (Screen 4)

Reanimated sequence, runs once per screen mount, total 4 seconds. Continue button is disabled until sequence completes.

Sequence:

| Time | Event |
|---|---|
| 0.0s | "BEFORE" panel visible, tasks shown with ✗ marks |
| 1.5s | "Reschedule" button presses (scale 1.0 → 0.95 → 1.0 over 200ms) |
| 2.5s | "BEFORE" panel fades out (300ms) |
| 2.8s | "AFTER" panel fades in (300ms) with reordered tasks + □ checkboxes |
| 4.0s | Stable, Continue button activates |

Looping is not required. One pass is enough.

### Processing theatre (Screen 12)

12-second ritual UI overlaid on the real save. Four checklist items animate in at fixed offsets.

| Time | UI event | Background |
|---|---|---|
| T=0 | "Crafting your personal schedule..." caption | `saveOnboardingData(data)` fires |
| T=0 | ✓ "Learning your peak hours" appears | — |
| T=3 | ✓ "Mapping your fixed commitments" appears | — |
| T=6 | ✓ "Calibrating your AI assistant" appears | — |
| T=9 | ░ "Personalizing your experience" appears (in progress) | — |
| T=12 | advance to Screen 12, only if save succeeded | — |

Caption: "This usually takes about 12 seconds." Aspirational copy, matches the perceived effort.

### Notification permission (Screens 13-14)

- Screen 13 shows the warm-up copy. Two buttons: "Turn on reminders →" and "Maybe later →".
- "Maybe later" → skip permission, advance to `(tabs)`. No flag stored, no re-prompt anywhere.
- "Turn on reminders" → invoke system permission request → advance to Screen 14.
- Screen 14 is a one-shot screen that displays the result (granted/denied) and routes to `(tabs)` on tap.

No re-prompt anywhere else in the app. If the user denies, that's final.

### Schedule preview (Screen 12)

Static template, no AI call, no DB write. Built deterministically from `wakeUpTime` and `productivityPeak`:

- If peak is `morning`: "Deep work 8:00-10:00 AM" sample block.
- If peak is `afternoon`: "Deep work 1:00-3:00 PM".
- If peak is `evening`: "Deep work 6:00-8:00 PM".
- If peak is `varies`: rotating 90-min blocks.

Three bullet points shown verbatim:
- 🧠 Deep work during peak
- ⏱ Tasks under 90 min (focus style)
- 🔄 Buffer time (delay recovery)

### Persona review (Screen 9)

One review card, persona-segmented. Content lives in a constants file: `persona` → `{ name, quote, rating, avatar }`. Six entries (one per persona). Fallback for unmapped personas is a generic "shift worker / ADHD" review that resonates broadly.

### Progress graph (Screen 10)

Single bar chart with two bars, hardcoded data:
- "Without Shift AI" bar at 42% (baseline)
- "With Shift AI" bar at 78% (filled)
- "Time replanning" stat below: 1h 15m → 8 min (text only, no chart)

Simple animation: bars grow from 0 to their target height over ~1.2s on mount. Use Reanimated or `Animated` API. No looping.

Caption: "Here's what users see in their first week." Aspirational copy, no real data.

## 8. Component Inventory (for design parity)

These visual patterns recur — design once, reuse.

- **Progress bar** — appears on Screens 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14. Hidden on Screens 1 and 4.
- **Single-select radio list** — Screens 2, 6. 4-6 options, generous tap targets (48dp+), one selected at a time.
- **Multi-select checkbox list** — Screens 3, 7. 6 options, any combination (with mutual exclusion on Screen 7).
- **Time picker** — Screen 5. Two of them, defaults 7:00 and 23:00.
- **Multiline text input** — Screen 8. With 4 example chips below.
- **Review card** — Screen 9. Avatar, name, 5 stars, quote.
- **Bar chart** — Screen 10. Two bars in one chart, animated fill on mount.
- **Checklist theatre** — Screen 11. Four rows, animated appearance.
- **Schedule preview card** — Screen 12. Three bullet rows.
- **Notif warm-up** — Screen 13. Bell illustration + 3 bullets + dual CTA.

## 9. Test Strategy

- Unit tests for: mutual exclusion rule, persona review lookup, schedule preview generation, AI prompt builder, onboarding save (mocked Supabase), routing hook (mocked).
- Interaction tests for: each form component (selection, Continue enable/disable, skip behavior).
- Skip visual tests for: animation (Screen 4), graphs (Screen 10).
- One integration test for the routing transitions: `!auth` → hook; `auth + !completed` → onboarding; `auth + completed` → tabs.
- Target: 30+ tests, all passing, no real network calls.

## 10. AI System Prompt Helper (deferred wiring)

A new helper function `buildSystemPrompt(prefs)` composes a system prompt string from the new fields:

- Persona (1 sentence framing)
- Sleep + wake window (e.g., "User is awake 7 AM - 11 PM, 16 hours")
- Energy peak (1 sentence)
- Hard constraints (bullet list, with "no fixed constraints" handled)
- Freeform context (verbatim, wrapped in quotes)

Phase 8 **defines and unit-tests** this helper. Wiring it into the `reschedule` and `place-task` Edge Functions is a Phase 6 follow-up — explicitly out of scope here. The helper is pure, deterministic, and testable in isolation.

## 11. Manual Setup (user does, not code)

1. Run migration 004 in Supabase SQL Editor.
2. Verify new columns exist on `user_preferences`.
3. (Already done) Google OAuth provider enabled in Supabase.
4. (Already done) `useGoogleSignIn` hook wired into `(auth)` screen.

## 12. Open Questions / Risks

- **Real work during fake loading:** if the user's network is dead, the 12s screen holds indefinitely with no timeout. Acceptable — better than silently failing the user into tabs.
- **Schedule preview copy** is aspirational. If we ever have real user data showing the AI's actual scheduling patterns, this should be replaced with a real preview.
- **Hard constraint UI rule** is not enforced server-side. If anyone (a buggy future feature, a Supabase dashboard edit) writes `hard_constraints = ['none', 'work_hours']`, the AI will see both. Acceptable risk for v1.
- **Persona review fallback** is generic. If we ship more personas later, we'll need a real "other" review that's not condescending.
