import { useState } from "react";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Target, TrendingUp, Wrench, CalendarClock, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { mindsetOptions } from "@/lib/mindset.queries";
import { saveAssessment } from "@/lib/mindset.functions";
import { ASSESSMENT_QUESTIONS, LIKERT_OPTIONS, DIMENSIONS, type AssessmentReport } from "@/lib/mindset/content";

function Report({ score, report }: { score: number; report: AssessmentReport }) {
  return (
    <section className="glass rounded-3xl p-5">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary">{score}</div>
        <div>
          <h3 className="font-semibold">Your mindset score</h3>
          <p className="text-xs text-muted-foreground">Based on 10 honest answers · retake after two weeks of work</p>
        </div>
      </div>
      <div className="mt-4 space-y-3 text-sm">
        <div><p className="flex items-center gap-1.5 font-medium"><TrendingUp className="h-4 w-4 text-primary" />Strongest</p><p className="mt-1 text-muted-foreground">{report.strongest.join(" · ") || "—"}</p></div>
        {report.improve.length > 0 && <div><p className="flex items-center gap-1.5 font-medium"><Wrench className="h-4 w-4 text-primary" />Improve</p><p className="mt-1 text-muted-foreground">{report.improve.join(" · ")}</p></div>}
        {report.actions.length > 0 && <div><p className="flex items-center gap-1.5 font-medium"><Target className="h-4 w-4 text-primary" />This week's actions</p><ul className="mt-1 list-disc space-y-1 pl-4 text-muted-foreground">{report.actions.map((a) => <li key={a}>{a}</li>)}</ul></div>}
        <div><p className="flex items-center gap-1.5 font-medium"><CalendarClock className="h-4 w-4 text-primary" />Two-week target</p><p className="mt-1 text-muted-foreground">{report.target}</p></div>
      </div>
    </section>
  );
}

export function MindsetProgress() {
  const { data, refetch } = useSuspenseQuery(mindsetOptions());
  const [answers, setAnswers] = useState<number[]>(Array(ASSESSMENT_QUESTIONS.length).fill(0));
  const [taking, setTaking] = useState(false);
  const save = useServerFn(saveAssessment);
  const saveMut = useMutation({
    mutationFn: (input: { answers: number[] }) => save({ data: input }),
    onSuccess: () => { toast.success("Assessment saved"); setTaking(false); refetch(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't save"),
  });
  const complete = answers.every((a) => a >= 1);
  const dimensionLabel = (key: string) => DIMENSIONS.find((d) => d.key === key)?.label ?? key;

  return (
    <div className="space-y-5">
      {data.assessment && !taking && <Report score={data.assessment.score} report={data.assessment.report} />}

      {!taking ? (
        <section className="glass rounded-3xl p-5">
          <h3 className="font-semibold">{data.assessment ? "Re-take the assessment" : "Take the mindset assessment"}</h3>
          <p className="mt-2 text-sm text-muted-foreground">10 quick questions across 8 dimensions. Answer honestly — the report is only as good as the input.</p>
          <Button className="mt-4 w-full sm:w-auto" onClick={() => { setAnswers(Array(ASSESSMENT_QUESTIONS.length).fill(0)); setTaking(true); }}>
            <RotateCcw /> {data.assessment ? "Start re-take" : "Start assessment"}
          </Button>
          {data.assessmentHistory.length > 1 && (
            <div className="mt-5 border-t border-border pt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">History</p>
              <ul className="mt-2 space-y-1 text-sm">
                {data.assessmentHistory.map((h) => (
                  <li key={h.id} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{new Date(h.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</span>
                    <span className="font-semibold">{h.score}%</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      ) : (
        <section className="space-y-3">
          {ASSESSMENT_QUESTIONS.map((q, i) => (
            <article key={i} className="glass rounded-2xl p-4">
              <p className="text-sm font-medium">{i + 1}. {q.text}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{dimensionLabel(q.dimension)}</p>
              <div className="mt-3 flex flex-wrap gap-1.5" role="radiogroup" aria-label={`Answer for question ${i + 1}`}>
                {LIKERT_OPTIONS.map((label, li) => {
                  const value = li + 1;
                  const selected = answers[i] === value;
                  return (
                    <button
                      key={label}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setAnswers((old) => old.map((v, idx) => (idx === i ? value : v)))}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium tap active:tap-active ${selected ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </article>
          ))}
          <Button
            className="w-full"
            disabled={!complete || saveMut.isPending}
            onClick={() => saveMut.mutate({ answers })}
          >
            {saveMut.isPending ? "Scoring…" : complete ? "See my report" : "Answer all 10 questions"}
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => setTaking(false)}>Cancel</Button>
        </section>
      )}
    </div>
  );
}
