## Add class + target-year onboarding, exam countdown, and liquid-glass polish

### 1. Schema
Add two columns to `profiles`:
- `class_level` (enum: `class_9`, `class_10`, `class_11`, `class_12`, `dropper`)
- `target_year` (int, e.g. 2026–2030)

Update `handle_new_user` trigger untouched. Regenerate types after migration.

### 2. Onboarding flow (`_authenticated/onboarding.tsx`)
Extend the existing stream step into a 3-step glassy wizard:
1. Stream — JEE / NEET (existing)
2. Class — 5 chips: Class 9, 10, 11, 12, Dropper
3. Target year — segmented picker (current year → +5), with the auto-picked exam date shown live ("JEE Main ~ 24 Jan 2027 · 573 days to go")

Persist all three via `updateProfile`. Redirect to `/home` at the end.
`home.tsx` already redirects users without `stream` back to onboarding — extend the guard to also require `class_level` and `target_year`.

### 3. Exam date helper (`src/lib/exam-dates.ts`)
Pure function `getExamDate(stream, year)` returning canonical dates:
- JEE Main Session 1: **Jan 24** of target year
- NEET UG: **May 3** of target year

And `daysUntil(date)` returning an integer (floor of diff in days, clamped ≥ 0).

### 4. Home screen countdown
New `ExamCountdown` card rendered above the goal ring:
- Big tabular number (days), label "days to <JEE Main | NEET UG> <year>"
- Small secondary line with the exact date and class (e.g. "Class 12 · 24 Jan 2027")
- Liquid-glass surface with animated conic-gradient sheen and a subtle shimmer sweep on mount
- If exam is today/past: shows "Exam day 🎯" / "Best of luck!"

### 5. Liquid glass + animation upgrade (full showcase)
Design tokens & utilities in `src/styles.css`:
- New `.liquid-glass` utility: layered `backdrop-filter: blur(28px) saturate(180%)`, inner highlight ring via `box-shadow: inset 0 1px 0 rgba(255,255,255,.4)`, soft outer glow, `border: 1px solid color-mix(...)`.
- `.liquid-glass-strong` variant for the countdown/ring hero.
- New keyframes: `sheen` (moving gradient), `float-blob`, `shimmer`, `spring-in`, `pop`.
- Animated gradient-mesh background layer (fixed, `-z-10`) with 3 slowly drifting radial-gradient blobs behind everything.

Component-level motion (CSS-only, no new deps):
- `GoalRing`: animated blob behind ring + pulsing outer halo when goal is met; number counts up on mount.
- Subject cards: `spring-in` stagger on mount, `tap-active` scale + inner highlight.
- `LogSheet`: liquid-glass surface, spring slide-up, keypad buttons get a soft press glow.
- `BottomNav`: stronger blur, active tab pill morphs with a shared layout feel (CSS transition on `left`/`width`).
- Streak flame gets a gentle flicker animation.

### 6. Settings
Add "Class" and "Target exam year" rows so users can change them later. Reuses the same pickers as onboarding.

### Technical notes
- Migration: `ALTER TYPE`-style enum add for `class_level` + column adds; `target_year` int with CHECK `>= 2025 AND <= 2035`.
- `updateProfile` server fn: extend inputValidator to accept the new fields (all optional).
- No new npm packages — animations are pure CSS/SVG.
- Countdown recomputes on mount only (avoids hydration mismatch); safe because "days" only changes at date boundaries.
- Keep light + dark parity for every new glass surface.

### Out of scope
- Multiple exam sessions (JEE Advanced, Session 2) — v2.
- Push/email reminders as the countdown crosses milestones.
- Editing the exact exam date (only year is user-picked).