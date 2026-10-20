<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep the first-visit book intro isolated in `src/components/intro/` and mount it only over the public index page; this preserves the existing scrolling landing experience and lets session/reduced-motion behavior remain independent.
- Group removal permissions live in a protected manager table and are enforced by authenticated database RPCs; exclusion records prevent removed members reappearing through mutual friends without touching question logs.
- PYQ practice uses authenticated `pyq.functions.ts` boundaries and transactional database RPCs; private answer keys are never selected into browser payloads except deliberate per-question solutions.
- PYQ attempts and daily credits remain separate; a per-user transaction lock and unique user/question/day key make progress inserts idempotent and feed the existing question_logs services.
- New study activity uses the profile study timezone; existing log dates and the established streak/goal behavior are preserved.
- PYQ pages remain secondary protected pages reached from Home; reuse the existing theme, shell, navigation and controls rather than creating another app layout.

- Revision sessions select only the authenticated student’s saved verified questions through a database RPC and reuse the existing practice engine; this preserves private keys and unique daily credits.
- Prepare content imports offline with provenance and answer-shape validation; keep raw batches and private keys outside served project files, and insert question/key pairs atomically without rewriting student records.
