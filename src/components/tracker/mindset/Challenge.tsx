import { useState } from "react";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarCheck, CheckCircle2, Circle, Lock, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { mindsetOptions } from "@/lib/mindset.queries";
import { startChallenge, toggleChallengeDay, saveReflection } from "@/lib/mindset.functions";
import { CHALLENGE_DAYS } from "@/lib/mindset/content";
import { shiftDay } from "@/lib/study-day";

function DayCard({ day, runId, title, task, guidance, done, available, reflection, onToggle, onSaveReflection, saving }: {
  day: number; runId: string; title: string; task: string; guidance: string;
  done: boolean; available: boolean; reflection: string;
  onToggle: () => void; onSaveReflection: (text: string) => void; saving: boolean;
}) {
  const [text, setText] = useState(reflection);
  return (
    <article className="glass rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{day}</span>
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold">{title}</h4>
          <p className="mt-1 text-sm">{task}</p>
          <p className="mt-1 text-xs text-muted-foreground">{guidance}</p>
        </div>
        <button
          type="button"
          disabled={!available || saving}
          onClick={onToggle}
          aria-label={done ? `Unmark day ${day}` : `Mark day ${day} complete`}
          className="shrink-0 tap active:tap-active disabled:opacity-40"
        >
          {done ? <CheckCircle2 className="h-6 w-6 text-primary" /> : available ? <Circle className="h-6 w-6 text-muted-foreground" /> : <Lock className="h-5 w-5 text-muted-foreground/50" />}
        </button>
      </div>
      {available && (
        <div className="mt-3 space-y-2 border-t border-border pt-3">
          <label className="block space-y-1.5 text-xs font-medium"><span>Reflection <span className="text-muted-foreground font-normal">(optional)</span></span>
            <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="How did today's task go?" maxLength={2000} rows={2} />
          </label>
          <Button variant="outline" size="sm" disabled={saving || text === reflection} onClick={() => onSaveReflection(text)}>Save reflection</Button>
        </div>
      )}
    </article>
  );
}

export function Challenge() {
  const { data, refetch } = useSuspenseQuery(mindsetOptions());
  const start = useServerFn(startChallenge);
  const toggleDay = useServerFn(toggleChallengeDay);
  const saveReflect = useServerFn(saveReflection);
  const invalidate = () => refetch();
  const startMut = useMutation({
    mutationFn: () => start(),
    onSuccess: () => { toast.success("7-day challenge started — day 1 begins today"); invalidate(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't start"),
  });
  const toggleMut = useMutation({
    mutationFn: (input: { runId: string; day: number }) => toggleDay({ data: input }),
    onSuccess: invalidate,
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't save"),
  });
  const reflectMut = useMutation({
    mutationFn: (input: { runId: string; day: number; text: string }) => saveReflect({ data: input }),
    onSuccess: () => { toast.success("Reflection saved"); invalidate(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't save"),
  });

  const run = data.challenge;
  const completed = run?.completed_days ?? [];
  const completedSet = new Set(completed);

  if (!run) {
    return (
      <div className="space-y-4">
        <section className="glass rounded-3xl p-5 text-center">
          <CalendarCheck className="mx-auto h-9 w-9 text-primary" />
          <h3 className="mt-3 font-semibold">The 7-day topper challenge</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            One focused task a day for a week: name your weakness, attack it, analyse mistakes, revise, and finish with a plan. Most past runs complete {data.pastRuns.length ? `in ${data.pastRuns.length} archived run${data.pastRuns.length > 1 ? "s" : ""}` : "in one run"} — start yours now.
          </p>
          <Button className="mt-4 w-full sm:w-auto" disabled={startMut.isPending} onClick={() => startMut.mutate()}>
            {startMut.isPending ? "Starting…" : "Start the challenge"}
          </Button>
        </section>
      </div>
    );
  }

  const allDone = completed.length === CHALLENGE_DAYS.length;
  return (
    <div className="space-y-4">
      <section className="glass rounded-3xl p-5">
        <div className="flex items-baseline justify-between">
          <h3 className="font-semibold">Run started {run.started_on}</h3>
          <span className="text-sm font-semibold text-primary">{completed.length}/7 days</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(completed.length / 7) * 100}%` }} />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          disabled={startMut.isPending}
          onClick={() => {
            if (window.confirm("Start a fresh 7-day cycle? The current run will be archived with its reflections.")) startMut.mutate();
          }}
        >
          <RotateCcw /> {allDone ? "Start a new cycle" : "Restart from day 1"}
        </Button>
      </section>

      <div className="space-y-3">
        {CHALLENGE_DAYS.map((d) => {
          const available = shiftDay(run.started_on, d.day - 1) <= data.today;
          return (
            <DayCard
              key={d.day}
              day={d.day}
              runId={run.id}
              title={d.title}
              task={d.task}
              guidance={d.guidance}
              done={completedSet.has(d.day)}
              available={available}
              reflection={run.reflections?.[String(d.day)] ?? ""}
              saving={toggleMut.isPending || reflectMut.isPending}
              onToggle={() => toggleMut.mutate({ runId: run.id, day: d.day })}
              onSaveReflection={(text) => reflectMut.mutate({ runId: run.id, day: d.day, text })}
            />
          );
        })}
      </div>
    </div>
  );
}
