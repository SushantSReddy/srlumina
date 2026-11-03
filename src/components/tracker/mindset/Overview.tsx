import { useSuspenseQuery } from "@tanstack/react-query";
import { mindsetOptions } from "@/lib/mindset.queries";
import { COMPARISONS, dailyMindsetQuote } from "@/lib/mindset/content";
import { CheckCircle2, Flame, NotebookPen, Quote, Sparkles, X } from "lucide-react";

export function Overview() {
  const { data } = useSuspenseQuery(mindsetOptions());
  const codeDone = data.code.filter((c) => c.challenge_done).length;
  const challengeDone = data.challenge?.completed_days.length ?? 0;
  const openMistakes = data.mistakes.filter((m) => !m.resolved).length;
  const stats = [
    { icon: Sparkles, label: "Code challenges", value: `${codeDone}/8` },
    { icon: NotebookPen, label: "Open mistakes", value: String(openMistakes) },
    { icon: Flame, label: "7-day challenge", value: data.challenge ? `${challengeDone}/7` : "—" },
    { icon: CheckCircle2, label: "Last assessment", value: data.assessment ? `${data.assessment.score}%` : "—" },
  ];
  return (
    <div className="space-y-5">
      <section className="glass rounded-3xl p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-primary">Topper's Mindset</p>
        <h2 className="mt-1 text-xl font-semibold">Study like a topper, not just hard.</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Eight principles, a daily operating system and a 7-day challenge that turn effort into marks. Everything here feeds your existing SR Lumina progress.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-background/40 p-3">
              <s.icon className="h-4 w-4 text-primary" />
              <p className="mt-1.5 text-lg font-semibold leading-none">{s.value}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {data.context.streak} day streak · {data.context.weekQuestions} questions this week · {data.context.incorrectCount} incorrect PYQs saved
        </p>
      </section>

      <section className="glass rounded-3xl p-5">
        <Quote className="h-4 w-4 text-primary" />
        <p className="mt-2 text-sm font-medium italic">“{dailyMindsetQuote()}”</p>
      </section>

      <section className="space-y-3">
        <h3 className="px-1 font-semibold">Average student vs topper</h3>
        {COMPARISONS.map((c) => (
          <article key={c.category} className="glass rounded-2xl p-4">
            <h4 className="font-semibold">{c.category}</h4>
            <p className="mt-0.5 text-xs italic text-muted-foreground">{c.situation}</p>
            <div className="mt-3 flex items-start gap-2 text-sm">
              <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-muted-foreground">{c.common}</p>
            </div>
            <div className="mt-2 flex items-start gap-2 text-sm">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p>{c.topper}</p>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
