import { useState } from "react";
import { WORKED_PROBLEM } from "@/lib/mindset/content";
import { ChevronDown, Eye } from "lucide-react";

export function ThinkLikeTopper() {
  const stages = WORKED_PROBLEM.stages;
  const [revealed, setRevealed] = useState(0);
  const allRevealed = revealed >= stages.length;

  return (
    <div className="space-y-5">
      <section className="glass rounded-3xl p-5">
        <h3 className="font-semibold">The topper's 5-step approach</h3>
        <ol className="mt-3 space-y-2 text-sm">
          {stages.map((s, i) => (
            <li key={s.title} className="flex items-start gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">{i + 1}</span>
              <span><span className="font-medium">{s.title.replace(/^\d+ · /, "")}</span></span>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-muted-foreground">Walk the worked problem below one step at a time — try the step yourself before revealing it.</p>
      </section>

      <section className="glass rounded-3xl p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-primary">{WORKED_PROBLEM.subject}</p>
        <p className="mt-2 text-sm font-medium">{WORKED_PROBLEM.prompt}</p>
        <div className="mt-4 space-y-3">
          {stages.slice(0, revealed).map((s, i) => (
            <details key={s.title} open={i === revealed - 1} className="rounded-xl border border-border bg-background/40 p-3">
              <summary className="cursor-pointer list-none font-medium">{s.title}</summary>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </details>
          ))}
        </div>
        {!allRevealed ? (
          <button
            type="button"
            onClick={() => setRevealed((r) => Math.min(r + 1, stages.length))}
            className="mt-4 flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground tap active:tap-active"
          >
            <Eye className="h-4 w-4" />
            {revealed === 0 ? "Reveal step 1" : `Reveal step ${revealed + 1}`}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => { setRevealed(0); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            className="mt-4 flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium tap active:tap-active"
          >
            <ChevronDown className="h-4 w-4" /> Hide steps and try again
          </button>
        )}
      </section>
    </div>
  );
}
