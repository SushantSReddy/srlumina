import { useState } from "react";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Circle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mindsetOptions } from "@/lib/mindset.queries";
import { addMistake, setMistakeResolved, deleteMistake } from "@/lib/mindset.functions";
import { MISTAKE_CATEGORIES } from "@/lib/mindset/content";

const SUBJECTS = ["physics", "chemistry", "math", "biology"] as const;

export function MistakeAnalysis() {
  const { data, refetch } = useSuspenseQuery(mindsetOptions());
  const [subject, setSubject] = useState<string>("physics");
  const [chapter, setChapter] = useState("");
  const [category, setCategory] = useState<string>("conceptual");
  const [questionRef, setQuestionRef] = useState("");
  const [reason, setReason] = useState("");
  const [should, setShould] = useState("");
  const [prevention, setPrevention] = useState("");

  const add = useServerFn(addMistake);
  const resolve = useServerFn(setMistakeResolved);
  const remove = useServerFn(deleteMistake);
  const invalidate = () => refetch();

  const addMut = useMutation({
    mutationFn: () => add({ data: { subject: subject as (typeof SUBJECTS)[number], chapter, category, questionRef: questionRef || undefined, reason, shouldHaveDone: should, prevention } }),
    onSuccess: () => {
      toast.success("Mistake added to your notebook");
      setChapter(""); setQuestionRef(""); setReason(""); setShould(""); setPrevention("");
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't save mistake"),
  });
  const resolveMut = useMutation({
    mutationFn: (input: { id: string; resolved: boolean }) => resolve({ data: input }),
    onSuccess: invalidate,
    onError: () => toast.error("Couldn't update"),
  });
  const removeMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: invalidate,
    onError: () => toast.error("Couldn't delete"),
  });

  const valid = chapter.trim() && reason.trim() && should.trim() && prevention.trim() && !addMut.isPending;

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {MISTAKE_CATEGORIES.map((c) => (
          <article key={c.key} className="glass rounded-2xl p-4">
            <h4 className="text-sm font-semibold">{c.title}</h4>
            <p className="mt-1 text-xs text-muted-foreground">{c.description}</p>
            <p className="mt-2 text-xs"><span className="font-medium">Fix · </span><span className="text-muted-foreground">{c.fix}</span></p>
          </article>
        ))}
      </section>

      <section className="glass space-y-3 rounded-3xl p-5">
        <h3 className="font-semibold">Add to your mistake notebook</h3>
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1.5 text-xs font-medium"><span>Subject</span>
            <Select value={subject} onValueChange={setSubject}><SelectTrigger aria-label="Subject"><SelectValue /></SelectTrigger>
              <SelectContent>{SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s === "math" ? "Mathematics" : s[0].toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent>
            </Select>
          </label>
          <label className="space-y-1.5 text-xs font-medium"><span>Category</span>
            <Select value={category} onValueChange={setCategory}><SelectTrigger aria-label="Category"><SelectValue /></SelectTrigger>
              <SelectContent>{MISTAKE_CATEGORIES.map((c) => <SelectItem key={c.key} value={c.key}>{c.title.replace(" mistakes", "")}</SelectItem>)}</SelectContent>
            </Select>
          </label>
        </div>
        <label className="block space-y-1.5 text-xs font-medium"><span>Chapter / topic</span>
          <Input value={chapter} onChange={(e) => setChapter(e.target.value)} placeholder="e.g. Rotational dynamics" maxLength={160} />
        </label>
        <label className="block space-y-1.5 text-xs font-medium"><span>Question reference <span className="text-muted-foreground font-normal">(optional)</span></span>
          <Input value={questionRef} onChange={(e) => setQuestionRef(e.target.value)} placeholder="e.g. PYQ JEE Advanced 2025 Paper 1 Q12" maxLength={160} />
        </label>
        <label className="block space-y-1.5 text-xs font-medium"><span>What exactly went wrong?</span>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="In your own words, one or two lines." maxLength={2000} />
        </label>
        <label className="block space-y-1.5 text-xs font-medium"><span>What should you have done?</span>
          <Textarea value={should} onChange={(e) => setShould(e.target.value)} placeholder="The correct approach at the moment you lost the marks." maxLength={2000} />
        </label>
        <label className="block space-y-1.5 text-xs font-medium"><span>How you'll prevent it</span>
          <Textarea value={prevention} onChange={(e) => setPrevention(e.target.value)} placeholder="A concrete habit, check or rule for next time." maxLength={2000} />
        </label>
        <Button disabled={!valid} onClick={() => addMut.mutate()} className="w-full">{addMut.isPending ? "Saving…" : "Save mistake"}</Button>
      </section>

      <section className="space-y-3">
        <h3 className="px-1 font-semibold">Your notebook <span className="text-muted-foreground font-normal">· {data.mistakes.length}</span></h3>
        {!data.mistakes.length ? (
          <p className="py-8 text-center text-sm text-muted-foreground border-y border-border">Nothing logged yet. Every wrong answer is a lesson — write it down while it's fresh.</p>
        ) : data.mistakes.map((m) => (
          <article key={m.id} className={`glass rounded-2xl p-4 ${m.resolved ? "opacity-70" : ""}`}>
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{m.chapter} <span className="text-xs font-normal text-muted-foreground">· {m.subject === "math" ? "Mathematics" : m.subject[0].toUpperCase() + m.subject.slice(1)} · {MISTAKE_CATEGORIES.find((c) => c.key === m.category)?.title.replace(" mistakes", "")}</span></p>
                {m.question_ref && <p className="mt-0.5 text-xs text-muted-foreground">{m.question_ref}</p>}
                <p className="mt-2 text-sm">{m.reason}</p>
                <p className="mt-1.5 text-xs text-muted-foreground"><span className="font-medium">Should have · </span>{m.should_have_done}</p>
                <p className="mt-1 text-xs text-muted-foreground"><span className="font-medium">Prevention · </span>{m.prevention}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button variant="ghost" size="icon" title={m.resolved ? "Mark unresolved" : "Mark resolved"} aria-label={m.resolved ? "Mark unresolved" : "Mark resolved"} disabled={resolveMut.isPending} onClick={() => resolveMut.mutate({ id: m.id, resolved: !m.resolved })}>
                  {m.resolved ? <CheckCircle2 className="text-primary" /> : <Circle className="text-muted-foreground" />}
                </Button>
                <Button variant="ghost" size="icon" title="Delete" aria-label="Delete mistake" disabled={removeMut.isPending} onClick={() => removeMut.mutate(m.id)}><Trash2 /></Button>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
