
## Overview

Build a premium, Apple-inspired **Exam Question Tracker** as a responsive web app (works great on mobile browsers). Users sign up, pick their stream (JEE or NEET), log questions solved per subject with source tagging and exam-level toggles, and track goals, streaks, and trends.

## Flow

```text
[Sign in / Sign up]  →  [Onboarding: choose JEE or NEET]  →  [Dashboard]
                                                              ├─ Subject cards (log entry)
                                                              ├─ Goal progress gauge
                                                              ├─ Streak badge
                                                              └─ Bottom tabs: Home · Analytics · Settings
```

## Design (after you pick a direction)

Three iOS-inspired directions will be rendered — you choose one. All three lock:
- SF Pro–style system font stack, bold headers
- System color per subject: Physics `systemBlue`, Chemistry `systemMint`, Math `systemIndigo`, Biology `systemGreen`
- Glassmorphic cards (thin blur, subtle borders), full light + dark support
- Haptic-style feedback on save (Vibration API where supported), smooth spring animations

Directions vary composition/density: e.g. (1) calm single-column with big keypad, (2) compact dashboard with all subjects visible + inline source chips, (3) Apple Watch–style ring gauge as centerpiece with subject cards below.

## Features

**Onboarding**
- First launch (post-signup): pick JEE or NEET. Saved to profile. Changeable in Settings.

**Log entry (per subject)**
- Numeric input (custom iOS-style keypad on mobile, plain input on desktop)
- Source chips: Coaching Modules · PYQs · Reference Books · NCERT · Mock Tests · + Custom (user-added, persisted)
- Exam-level segmented control: JEE → Main / Advanced · NEET → Section A / Section B
- Save button with haptic feedback → optimistic update, toast confirmation

**Dashboard**
- Today's subject cards with count + quick-log
- Daily goal gauge (Apple Watch–style ring OR linear bar per chosen direction)
- Streak badge (consecutive days with ≥1 entry)

**Analytics tab**
- Weekly + monthly line/bar charts (Recharts)
- Filters: subject, source material, exam level, date range
- Totals summary cards

**Settings**
- Change stream, daily goal, manage custom sources, sign out, theme (system/light/dark)

## Technical

**Stack:** TanStack Start + React + Tailwind v4, Lovable Cloud (Supabase) for auth + DB, Recharts for analytics.

**Auth:** Email/password + Google (via Lovable broker). Routes gated under `_authenticated/`.

**Database (public schema, with GRANTs + RLS, all rows scoped to `auth.uid()`):**

- `profiles` — `id (=auth.users.id)`, `display_name`, `avatar_url`, `stream ('jee'|'neet')`, `daily_goal int default 50`, `created_at`. Auto-created via trigger on signup.
- `sources` — `id`, `user_id`, `name`, `is_default bool`. Seeded per user with defaults on first load (or via trigger).
- `question_logs` — `id`, `user_id`, `logged_on date`, `subject ('physics'|'chemistry'|'math'|'biology')`, `count int`, `source_id fk`, `exam_level text` (main/advanced/section_a/section_b), `created_at`.
- Indexes on `(user_id, logged_on)` and `(user_id, subject)`.

**Server functions** (`src/lib/*.functions.ts`, all with `requireSupabaseAuth`):
- `getProfile`, `updateProfile` (stream, goal, display name)
- `listSources`, `addCustomSource`, `deleteCustomSource`
- `logQuestions({subject, count, source_id, exam_level, logged_on?})`
- `getTodaySummary`, `getStreak`
- `getAnalytics({range, subject?, source_id?, exam_level?})`

**Routes:**
```text
src/routes/
  __root.tsx (meta, dark-mode class, auth listener)
  index.tsx → redirects to /auth or /home based on session
  auth.tsx (sign-in + sign-up + Google)
  _authenticated/
    route.tsx (managed gate)
    onboarding.tsx (stream picker; redirects to /home if already set)
    home.tsx (dashboard)
    analytics.tsx
    settings.tsx
```

**Design tokens:** iOS system colors added as CSS vars in `src/styles.css` (`--ios-blue`, `--ios-mint`, `--ios-indigo`, `--ios-green`, etc.), glass utility classes, per-subject semantic tokens.

**Profiles table** (per your choice): includes `display_name` + `avatar_url` alongside `stream` and `daily_goal`. Avatar upload can be added later via storage — not in this initial build unless you want it now.

## Build order

1. Enable Lovable Cloud + configure Google auth.
2. Migration: `profiles`, `sources`, `question_logs` + RLS + GRANTs + signup trigger + default sources seed.
3. Render 3 iOS-inspired design directions → you pick one.
4. Apply chosen tokens to `src/styles.css` + `__root.tsx` meta.
5. Auth route + managed `_authenticated` gate.
6. Onboarding route.
7. Dashboard: subject cards, keypad, source chips, exam-level toggle, save flow, goal ring, streak.
8. Analytics route with Recharts + filters.
9. Settings route.
10. Polish: haptics, animations, dark mode QA, empty states, error boundaries, SEO meta per route.

## Out of scope for v1
Avatar upload UI, push notifications, social/leaderboards, CSV export, offline PWA install prompt (can add later).

Approve to proceed and I'll start with Cloud + migration, then generate the design directions.
