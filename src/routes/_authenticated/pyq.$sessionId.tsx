import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Bookmark, Check, RotateCcw, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { TopHeader } from "@/components/tracker/TopHeader";
import { BottomNav } from "@/components/tracker/BottomNav";
import { MeshBackground } from "@/components/tracker/MeshBackground";
import { MathText } from "@/components/tracker/pyq/MathText";
import { pyqSessionOptions } from "@/lib/pyq.queries";
import { submitPyq, savePyqSession, revealPyq, bookmarkPyq, type PyqResult, type PyqSolution } from "@/lib/pyq.functions";

export const Route = createFileRoute("/_authenticated/pyq/$sessionId")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(pyqSessionOptions(params.sessionId)),
  component: PracticePage,
  head: () => ({ meta: [
    { title: "Practice session — SR Lumina" }, { name: "description", content: "Resume your PYQ practice, check answers and study step-by-step solutions on SR Lumina." },
    { property: "og:title", content: "Practice session — SR Lumina" }, { property: "og:description", content: "Your chapter-wise PYQ practice session." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
});

type Answer = string | string[];
type Pending = { requestId: string; sessionId: string; questionId: string; answer: Answer };
function PracticePage() {
  const { sessionId } = Route.useParams();
  const { data } = useSuspenseQuery(pyqSessionOptions(sessionId));
  return <Practice key={sessionId} data={data} />;
}
function Practice({ data }: { data: Awaited<ReturnType<typeof import("@/lib/pyq.functions").getPyqSession>> }) {
  const { session } = data;
  const qc = useQueryClient();
  const submit = useServerFn(submitPyq), save = useServerFn(savePyqSession), reveal = useServerFn(revealPyq), bookmark = useServerFn(bookmarkPyq);
  const [index, setIndex] = useState(Math.min(session.current_index, session.question_ids.length - 1));
  const [answer, setAnswer] = useState<Answer>("");
  const [result, setResult] = useState<PyqResult | null>(null);
  const [solution, setSolution] = useState<PyqSolution | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [bookmarks, setBookmarks] = useState(() => new Set(data.collections.filter((c) => c.bookmarked).map((c) => c.question_id)));
  const [finished, setFinished] = useState(session.finished);
  const lock = useRef(false);
  const question = data.questions.find((q) => q.id === session.question_ids[index]);
  const storageKey = `sr-lumina-pyq:${session.user_id}:${session.id}`;
  const localDrafts = useRef<Record<string, Answer>>({});
  const localPending = useRef<Pending | null>(null);
  const questionRef = useRef(question?.id);
  questionRef.current = question?.id;
  function store() { try { localStorage.setItem(storageKey, JSON.stringify({ drafts: localDrafts.current, pending: localPending.current })); } catch { /* Server saves still work if device storage is unavailable. */ } }
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) ?? "{}");
      if (stored.drafts && typeof stored.drafts === "object") localDrafts.current = stored.drafts;
      if (stored.pending?.sessionId === session.id && session.question_ids.includes(stored.pending.questionId)) {
        localPending.current = stored.pending; setPending(stored.pending);
        setIndex(session.question_ids.indexOf(stored.pending.questionId));
      }
    } catch { /* Ignore invalid local data. */ }
    setReady(true);
  }, [storageKey, session.id, session.question_ids]);
  useEffect(() => {
    if (!ready || !question) return;
    const drafts = session.drafts && typeof session.drafts === "object" && !Array.isArray(session.drafts) ? session.drafts : {};
    const draft = localDrafts.current[question.id] ?? drafts[question.id];
    setAnswer(typeof draft === "string" || Array.isArray(draft) && draft.every((v) => typeof v === "string") ? draft as Answer : question.question_type === "numerical" || question.question_type === "integer" ? "" : []);
    setResult(null); setSolution(null);
  }, [question?.id, ready]);
  useEffect(() => {
    if (!ready || !question || pending) return;
    localDrafts.current[question.id] = answer; store();
    const timer = setTimeout(() => { save({ data: { id: session.id, index, questionId: question.id, answer } }).catch(() => { /* Device draft remains available. */ }); }, 650);
    return () => clearTimeout(timer);
  }, [answer, index, ready, question?.id, pending]);
  async function send(payload: Pending) {
    if (lock.current) return;
    lock.current = true; setBusy(true);
    try {
      const value = await submit({ data: payload });
      localPending.current = null; setPending(null); store();
      if (questionRef.current === payload.questionId) { setResult(value); setSolution(value.solution); }
      for (const key of ["today", "streak", "analytics", "tasks", "chapters", "sources", "friends", "pyq"]) qc.invalidateQueries({ queryKey: [key] });
    } catch (e) { toast.error(e instanceof Error ? `${e.message}. Your answer is kept; retry to sync.` : "Your answer is kept; retry to sync."); }
    finally { lock.current = false; setBusy(false); }
  }
  useEffect(() => {
    const sync = () => { if (localPending.current) void send(localPending.current); };
    window.addEventListener("online", sync);
    return () => window.removeEventListener("online", sync);
  }, []);
  async function checkAnswer() {
    if (!question || busy || !ready) return;
    const payload = pending ?? { requestId: crypto.randomUUID(), sessionId: session.id, questionId: question.id, answer };
    localPending.current = payload; setPending(payload); store();
    await send(payload);
  }
  async function move(next: number, finish = false) {
    if (!question || busy || pending) return;
    setBusy(true);
    try {
      await save({ data: { id: session.id, index: next, questionId: question.id, answer, finished: finish } });
      setIndex(next); setFinished(finish);
      qc.invalidateQueries({ queryKey: ["pyq", "bootstrap"] });
    } catch { toast.error("Couldn't save your place. Your answer is saved on this device."); }
    finally { setBusy(false); }
  }
  if (!question) return <div className="p-6"><p>This question is no longer available.</p><Button asChild variant="outline"><Link to="/pyq">Back to PYQs</Link></Button></div>;
  const numerical = question.question_type === "numerical" || question.question_type === "integer";
  const multiple = question.question_type === "multiple" || question.question_type === "matching";
  const options = Array.isArray(question.options) ? question.options.flatMap((o) => o && typeof o === "object" && !Array.isArray(o) && typeof o.id === "string" && typeof o.text === "string" ? [{ id: o.id, text: o.text }] : []) : [];
  const attempted = data.attempts.filter((a) => a.question_id === question.id);
  const answerPresent = numerical ? typeof answer === "string" && answer.trim().length > 0 : Array.isArray(answer) && answer.length > 0;
  const locked = busy || !!pending || !!solution || !ready;
  return <div className="min-h-dvh relative pb-28"><MeshBackground /><TopHeader title="Practice" subtitle={question.exam.replaceAll("_", " ").toUpperCase()} />
    <main className="max-w-3xl mx-auto px-4 space-y-6">
      <div className="flex items-center justify-between"><Button asChild variant="ghost" size="sm"><Link to="/pyq"><ArrowLeft />PYQs</Link></Button><span className="text-sm tabular-nums text-muted-foreground">{index + 1} / {session.question_ids.length}</span><Button variant="ghost" size="icon" aria-label={bookmarks.has(question.id) ? "Remove bookmark" : "Bookmark question"} title="Bookmark question" disabled={busy} onClick={async () => { setBusy(true); try { const value = !bookmarks.has(question.id); await bookmark({ data: { questionId: question.id, bookmarked: value } }); setBookmarks((old) => { const next = new Set(old); value ? next.add(question.id) : next.delete(question.id); return next; }); } catch { toast.error("Couldn't save bookmark"); } finally { setBusy(false); } }}><Bookmark className={bookmarks.has(question.id) ? "fill-primary text-primary" : ""} /></Button></div>
      {finished && <div role="status" className="border-y border-border py-4"><h2 className="font-semibold flex gap-2 items-center"><Check className="text-ios-green" />Practice finished</h2><p className="text-sm text-muted-foreground mt-1">Your attempts and progress are saved.</p></div>}
      <section className="space-y-5">
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground"><span>{question.year} · {question.source_question}</span><span>· {question.question_type === "multiple" ? "Multiple correct" : numerical ? "Numerical answer" : question.question_type === "matching" ? "Matching" : "Single correct"}</span><span className="capitalize">· {question.difficulty}</span></div>
        <div className="text-lg"><MathText text={question.prompt} /></div>
        {question.diagram_url && <img src={question.diagram_url} alt="Question diagram" className="max-w-full max-h-80 object-contain rounded-lg" loading="lazy" />}
        {numerical ? <label className="block space-y-2 text-sm font-medium"><span>Your answer</span><Input aria-label="Your answer" className="max-w-xs" inputMode="decimal" value={typeof answer === "string" ? answer : ""} onChange={(e) => setAnswer(e.target.value)} disabled={locked} placeholder={question.question_type === "integer" ? "Enter an integer" : "Enter a number"} /></label> : <div className="space-y-3">{options.map((option) => { const selected = Array.isArray(answer) && answer.includes(option.id); return <label key={option.id} className={`flex items-start gap-3 border p-4 rounded-lg cursor-pointer ${selected ? "border-primary bg-primary/5" : "border-border bg-surface"}`}><Checkbox aria-label={`Option ${option.id}`} checked={selected} disabled={locked} onCheckedChange={() => setAnswer(multiple ? selected ? (Array.isArray(answer) ? answer : []).filter((id) => id !== option.id) : [...(Array.isArray(answer) ? answer : []), option.id] : [option.id])} /><span className="font-semibold">{option.id}.</span><MathText text={option.text} /></label>; })}</div>}
        <div className="flex flex-wrap gap-3">
          {!solution && <Button disabled={busy || !ready || (!pending && !answerPresent)} onClick={checkAnswer}><Check />{busy ? "Saving…" : pending ? "Retry sync" : "Check answer"}</Button>}
          {!solution && <Button variant="outline" disabled={busy || !!pending} onClick={async () => { setBusy(true); try { setSolution(await reveal({ data: { questionId: question.id } })); } catch { toast.error("Couldn't load solution"); } finally { setBusy(false); } }}>View solution</Button>}
          {solution && <Button variant="outline" disabled={busy} onClick={() => { setSolution(null); setResult(null); setAnswer(numerical ? "" : []); }}><RotateCcw />Reattempt</Button>}
        </div>
        {pending && <p role="status" className="text-sm text-muted-foreground">Your submission is saved on this device and waiting to sync.</p>}
      </section>
      {solution && <section className="border-y border-border py-6 space-y-4" aria-live="polite">
        <h2 className={`font-semibold text-lg ${result ? result.correct ? "text-ios-green" : "text-ios-red" : "text-foreground"}`}>{result ? result.correct ? "Correct answer" : "Not quite" : "Solution"}</h2>
        {result && <p className="text-sm text-muted-foreground">{result.counted ? "+1 question added to today's progress." : "Already counted today. This attempt is saved separately."}</p>}
        <p className="font-medium">Answer: {Array.isArray(solution.answer) ? solution.answer.join(", ") : String(solution.answer)}</p>
        <MathText text={solution.explanation} />
        <ol className="space-y-4">{solution.steps.map((step, i) => <li key={i} className="flex gap-3"><span className="text-primary font-semibold">{i + 1}.</span><div className="min-w-0"><MathText text={step} /></div></li>)}</ol>
      </section>}
      {attempted.length > 0 && <details className="text-sm"><summary className="cursor-pointer font-medium">Previous attempts · {attempted.length}</summary><ul className="mt-3 space-y-2">{attempted.map((a) => <li key={a.id} className="flex flex-wrap justify-between gap-2 text-muted-foreground"><span>{new Date(a.created_at).toLocaleString()}</span><span>{Array.isArray(a.answer) ? a.answer.join(", ") : String(a.answer)} · {a.correct ? "Correct" : "Incorrect"}</span></li>)}</ul></details>}
      <a className="text-xs text-primary flex items-center gap-2 break-all" href={question.source_url} target="_blank" rel="noreferrer"><ExternalLink className="h-3 w-3 shrink-0" />{question.source_label} · Official source</a>
      <nav aria-label="Question navigation" className="space-y-4">
        <div className="flex flex-wrap gap-2">{session.question_ids.map((id, i) => <Button key={id} variant={i === index ? "default" : data.attempts.some((a) => a.question_id === id) ? "secondary" : "outline"} size="icon" disabled={busy || !!pending} aria-label={`Question ${i + 1}`} onClick={() => move(i)}>{i + 1}</Button>)}</div>
        <div className="flex justify-between gap-3"><Button variant="outline" disabled={index === 0 || busy || !!pending} onClick={() => move(index - 1)}><ArrowLeft />Previous</Button>{index < session.question_ids.length - 1 ? <Button disabled={busy || !!pending} onClick={() => move(index + 1)}>Next<ArrowRight /></Button> : <Button disabled={busy || !!pending || finished} onClick={() => move(index, true)}><Check />Finish practice</Button>}</div>
      </nav>
    </main><BottomNav />
  </div>;
}