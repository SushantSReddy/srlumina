# Task Manager for Reps

Add a full task manager that feels native to the existing study app: same glass/iOS + Claude theming, same bottom nav, same account and database, and wired into the question log.

## What you get

**New Tasks tab** in the bottom nav (Home · Tasks · Analytics · Settings).

**Tasks screen**
- Compact header with today's progress ("4 / 7 completed") plus questions logged today and streak.
- Filter pills: All · Today · Upcoming · Completed.
- Sections: Overdue (subtle warm accent, no alarm-red noise), Today, Tomorrow, This week, Later, Completed (collapsed).
- Thoughtful empty states ("Your day is clear. Nice." + Add task).

**Quick add**
- A single always-visible input: type a title, press Enter, task exists. No dialog needed.
- Natural-language parsing runs locally and instantly: "Solve 20 physics questions tomorrow 7pm" → title, subject Physics, 20 questions, tomorrow 19:00. No waiting on AI for the common case.
- An optional "Smart" toggle sends the phrase to the built-in AI for messier input (chapter names, "next Monday evening"). Falls back silently to local parsing if AI is slow or unavailable.
- A "More options" expand reveals the full form: notes, due date/time, priority, subject, chapter, question target, repeat, reminder, tags, subtasks.

**Task cards**
- Checkbox, title, and a quiet meta line (due time, subject dot, chapter, subtask progress, reminder bell, priority as a thin left bar — low/medium/high, not colored blocks).
- Tap card → details sheet. Tap checkbox → completes with a soft strike-through + fade into Completed (optimistic, instant).
- Swipe left → delete, swipe right → complete, on touch devices.
- Long-press → edit.

**Task details sheet**
- Everything editable inline: title, notes, due date/time, priority, subject, chapter, question target, subtasks checklist, tags, repeat, reminder. Shows created date and completion status. Delete asks once.

**Study integration**
- A task can carry subject + chapter (reusing your existing subjects and chapters — no duplicate lists) and a question target.
- Such a task shows "0 / 30 questions" and auto-fills from your question log for that subject/chapter on the due date; logging enough questions auto-completes the task.
- The log sheet gets a small "counts toward" hint when an open question task matches what you just logged.

**Home screen**
- New "Today's Tasks" card under the rings: up to 4 tasks, tap to tick, "View all" to the Tasks tab. Hidden entirely when you have no tasks, so the home screen stays calm.

**Reminders**
- Reuses the existing web-push setup. Per-task reminder time (or "at due time"), delivered by the same 5-minute reminder job that already sends your daily nudge. Only fires if you've already granted notification permission; no new prompts.
- Repeating tasks (daily / weekly / custom weekdays) roll to the next occurrence when completed.

## Technical notes

Database (new migration, existing data untouched):
- `tasks` — id, user_id, title, notes, due_on (date), due_at_time, priority enum (low/medium/high), subject (existing `app_subject`), chapter_id → `chapters`, question_target int, questions_from_log bool, repeat_rule jsonb, reminder_minutes_before / reminder_time, reminder_last_sent_on, tags text[], completed_at, sort_order, created_at, updated_at.
- `subtasks` — id, task_id → tasks (cascade), title, done, position.
- Both: GRANTs for authenticated + service_role, RLS enabled, own-row policies on `auth.uid() = user_id` (subtasks via parent task ownership), `updated_at` trigger reusing `touch_updated_at()`.

Server functions in `src/lib/tasks.functions.ts` with `requireSupabaseAuth`: listTasks (range-filtered), createTask, quickAddTask, updateTask, toggleTask (handles repeat roll-forward), deleteTask, subtask CRUD, reorderTasks, getTaskOverview. Question progress computed server-side from `question_logs` joined by subject/chapter/date.

AI quick add: one `createServerFn` calling the Lovable AI gateway with a strict JSON schema, invoked only when the Smart toggle is on; 3s timeout then local fallback. No key needed.

Reminders: extend `src/routes/api/public/hooks/send-reminders.ts` to also scan due task reminders in the same tick, reusing `sendPush`, per-task `reminder_last_sent_on` guard, and the existing expired-subscription pruning. No new cron job — same 5-minute schedule that already runs.

Frontend: new route `src/routes/_authenticated/tasks.tsx`, components under `src/components/tracker/tasks/` (QuickAdd, TaskCard, TaskSection, TaskDetailSheet, TaskFilters, TodayTasksCard). Existing design tokens, glass utilities, spring animations, and both themes; local NL parser in `src/lib/task-parse.ts`. TanStack Query with optimistic updates for toggle/delete. `BottomNav` grid becomes 4 columns.

Nothing in the question logger, analytics, onboarding, auth, or push daily reminder changes behaviour.
