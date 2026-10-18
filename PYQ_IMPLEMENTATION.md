# SR Lumina PYQ upgrade — Phase 1 and Phase 2

## Implemented
- Home shortcut and protected `/pyq` question bank; existing four navigation tabs and landing animations remain unchanged.
- Exam, subject, chapter, year, difficulty filters, actual database counts, paginated browsing and clear empty/error states.
- Resumable sessions (up to 100 questions), answer drafts, question palette, bookmarks, previous attempt history, explanations and steps.
- KaTeX mathematical notation, mhchem chemistry notation, and optional diagram image rendering.
- Server/database validation for single-correct, multiple-correct, numerical, integer and option-based matching answers. Matching means selecting keyed combination options, not a drag-and-drop matrix.
- Separate attempt history, incorrect-question records and unique per-user/question/local-day credits.
- An actual submitted answer, correct or incorrect, counts as one practiced question. Viewing a solution does not count. A question may count again on a different local day, but retries on the same day never add credit.
- Persistent request IDs, transaction locking and unique constraints prevent duplicate or concurrent submissions inflating credit. Offline submission payloads remain on the device and retry on reconnection.

## Existing code reused
- `src/lib/tracker.functions.ts`: daily totals, manual logging, reset, streak and analytics still read `question_logs`; PYQ credits insert into that same source of truth.
- `src/lib/tasks.functions.ts`: existing subject/chapter/day study-task progress automatically includes PYQ credit. Completion remains the existing manual task action.
- `SubjectRings`, `TopHeader`, `MeshBackground`, `BottomNav` and shadcn Button/Input/Select/Checkbox preserve current presentation conventions.
- Existing authenticated route layout and bearer middleware protect all new server functions.
- The existing daily goal and streak rule (consecutive logged days starting today) are preserved. New local-day arithmetic avoids mixing timezone/date representations; existing dated logs are not rewritten.

## New files
- `src/routes/_authenticated/pyq.index.tsx`: question bank and filters.
- `src/routes/_authenticated/pyq.$sessionId.tsx`: practice, navigation, recovery, bookmarks and answer UI.
- `src/lib/pyq.functions.ts`, `pyq.queries.ts`: authenticated data/validation boundaries and query options.
- `src/components/tracker/pyq/MathText.tsx`: safe math/chemistry rendering.
- `src/lib/study-day.ts`, `study-day.server.ts`: student timezone dates.
- `src/lib/study-day.test.js`, `tests/pyq-integration.py`: local-day and real browser regression tests.

## Backward-compatible database additions
Migration `drizzle/migrations/0003_pyq_practice_and_daily_progress.sql` adds a profile study timezone; shared PYQ chapters/questions; private answer keys; user sessions, attempts, daily credits and collections. It adds grants, RLS policies, filter/owner indexes and authenticated session/solution/submission RPCs. No existing table or user progress was removed.

Keys cannot be read as a question-bank table by students. The explicit authenticated solution action releases only the requested verified question's answer/explanation. Scoring and progress creation are atomic in the authenticated submission RPC.

## Content and verification limits
The bank currently contains **one** real JEE Advanced 2025 Paper 1 Mathematics Q12, independently checked against its official final answer key:
https://jeeadv.ac.in/past_qps/2025_1_English.pdf

Its answer is 96. Solution steps are independently derived, not represented as an official solution. Difficulty/chapter labels are editorial.

JEE Main and NEET filtering and engine support are present, but those banks are empty. No fabricated PYQs were inserted. Choice/multi-correct/integer/matching branches and chemistry/diagram rendering exist but have not been verified with authentic content for each format; Phase 1 is therefore not a fully populated or fully verified three-exam product.

## Checks actually run
- Real authenticated guest browser: official question, wrong/correct answer, bookmarks, repeated attempts, persisted draft, offline submission/reconnection, Home subject progress, streak display and lifetime analytics.
- Direct authenticated RPC checks: solution adds zero credit; simultaneous identical requests add exactly one attempt; further retries leave the unique total at one; incorrect collection persists; private keys expose no rows; owner-visible attempts only.
- Desktop and 390px viewport screenshots: formulas render and the page has no horizontal overflow.
- Seven Bun tests pass: four timezone/calendar checks and three existing group-permission regressions.
- Automatic app build/type validation reports build OK.

The browser integration test uses a dedicated test-guest storage file under `/tmp/browser/pyq/`; it must be recreated for later environments. No student's existing account was used or changed for test attempts. Task-page rendering was checked, but creating a linked task and verifying its progress end-to-end was not exercised. Cross-account session denial and all content formats still warrant further tests.

## Deferred
Phase 3's revision-centre screens and chapter accuracy/weak-topic indicators, Phase 4 timed mocks/marking/results, and Phase 5 validated JSON/CSV import are not implemented. Incorrect/bookmarked storage is ready for Phase 3. No claim is made that those later phases are complete.