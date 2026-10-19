import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BookOpen, ChevronRight, Play, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { BottomNav } from "@/components/tracker/BottomNav";
import { TopHeader } from "@/components/tracker/TopHeader";
import { MeshBackground } from "@/components/tracker/MeshBackground";
import { browsePyq, startPyq, type PyqFilters } from "@/lib/pyq.functions";
import { pyqBootstrapOptions } from "@/lib/pyq.queries";

export const Route = createFileRoute("/_authenticated/pyq/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(pyqBootstrapOptions()),
  component: PyqPage,
  head: () => ({ meta: [
    { title: "PYQ practice — SR Lumina" },
    { name: "description", content: "Chapter-wise previous-year question practice for JEE Main, JEE Advanced and NEET on SR Lumina." },
    { property: "og:title", content: "PYQ practice — SR Lumina" },
    { property: "og:description", content: "Practice verified exam questions and track your daily study progress." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
});

function PyqPage() {
  const { data: bootstrap } = useSuspenseQuery(pyqBootstrapOptions());
  const [filters, setFilters] = useState<PyqFilters>({ exam: "jee_main" });
  const [year, setYear] = useState("");
  const [page, setPage] = useState(0);
  const browse = useServerFn(browsePyq);
  const start = useServerFn(startPyq);
  const navigate = useNavigate();
  const questionsQ = useQuery({ queryKey: ["pyq", "browse", filters, page], queryFn: () => browse({ data: { ...filters, page } }), staleTime: 60_000 });
  const startMut = useMutation({ mutationFn: () => start({ data: filters }), onSuccess: ({ id }) => navigate({ to: "/pyq/$sessionId", params: { sessionId: id } }), onError: (e) => toast.error(e.message) });
  const subjects = filters.exam === "neet" ? ["physics", "chemistry", "biology"] as const : ["physics", "chemistry", "math"] as const;
  const chapters = bootstrap.chapters.filter((c) => !filters.subject || c.subject === filters.subject);
  function update(patch: Partial<PyqFilters>) { setFilters((old) => ({ ...old, ...patch })); setPage(0); }
  return <div className="min-h-dvh relative pb-28">
    <MeshBackground /><TopHeader title="PYQ practice" subtitle="Previous year questions" />
    <main className="mx-auto max-w-3xl px-4 space-y-6">
      <div className="flex items-center justify-between gap-3"><Button asChild variant="ghost" size="sm"><Link to="/home"><ArrowLeft />Today</Link></Button><Button asChild variant="outline" size="sm"><Link to="/pyq/revision"><BookOpen />Revision centre</Link></Button></div>
      <section className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" aria-label="Exam">
          {([['jee_main', 'JEE Main'], ['jee_advanced', 'JEE Advanced'], ['neet', 'NEET']] as const).map(([exam, label]) => <Button key={exam} variant={filters.exam === exam ? "default" : "outline"} onClick={() => update({ exam, subject: undefined, chapter: undefined })}>{label}</Button>)}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <label className="text-xs font-medium space-y-2"><span>Subject</span><Select value={filters.subject ?? "all"} onValueChange={(v) => update({ subject: v === "all" ? undefined : v as PyqFilters["subject"], chapter: undefined })}><SelectTrigger aria-label="Subject"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All subjects</SelectItem>{subjects.map((s) => <SelectItem key={s} value={s}>{s === "math" ? "Mathematics" : s[0].toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent></Select></label>
          <label className="text-xs font-medium space-y-2"><span>Chapter</span><Select value={filters.chapter ?? "all"} onValueChange={(v) => update({ chapter: v === "all" ? undefined : v })}><SelectTrigger aria-label="Chapter"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All chapters</SelectItem>{chapters.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></label>
          <label className="text-xs font-medium space-y-2"><span>Year</span><Input aria-label="Year" inputMode="numeric" placeholder="All years" value={year} onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 4); setYear(v); if (!v || (v.length === 4 && +v >= 1980 && +v <= 2100)) update({ year: v ? +v : undefined }); }} /></label>
          <label className="text-xs font-medium space-y-2"><span>Difficulty</span><Select value={filters.difficulty ?? "all"} onValueChange={(v) => update({ difficulty: v === "all" ? undefined : v as PyqFilters["difficulty"] })}><SelectTrigger aria-label="Difficulty"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All levels</SelectItem>{['easy', 'medium', 'hard'].map((d) => <SelectItem value={d} key={d}>{d[0].toUpperCase() + d.slice(1)}</SelectItem>)}</SelectContent></Select></label>
        </div>
      </section>
      {bootstrap.sessions.length > 0 && <section className="space-y-2"><h2 className="font-semibold">Continue practice</h2>{bootstrap.sessions.map((s) => <Button asChild key={s.id} variant="outline" className="h-auto w-full py-3 justify-between whitespace-normal"><Link to="/pyq/$sessionId" params={{ sessionId: s.id }}><span className="text-left">{typeof s.filters === "object" && s.filters && !Array.isArray(s.filters) ? String(s.filters.exam ?? "Revision").replaceAll("_", " ").toUpperCase() : "PYQ"}<span className="block text-xs text-muted-foreground">Question {Math.min(s.current_index + 1, s.question_ids.length)} of {s.question_ids.length}</span></span><ChevronRight /></Link></Button>)}</section>}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">Question bank {questionsQ.data ? <span className="text-muted-foreground font-normal">· {questionsQ.data.total}</span> : null}</h2><Button onClick={() => startMut.mutate()} disabled={startMut.isPending || !questionsQ.data?.total}><Play />{startMut.isPending ? "Starting…" : "Start practice"}</Button></div>
        {questionsQ.isPending ? <p className="py-8 text-muted-foreground">Loading questions…</p> : questionsQ.isError ? <div role="alert" className="py-8 space-y-3"><p>Questions couldn't be loaded.</p><Button variant="outline" onClick={() => questionsQ.refetch()}>Try again</Button></div> : !questionsQ.data.total ? <div className="py-12 text-center border-y border-border"><BookOpen className="mx-auto h-9 w-9 text-muted-foreground" /><h3 className="mt-4 font-semibold">No verified questions here yet</h3><p className="mt-2 text-sm text-muted-foreground">{filters.exam === "jee_advanced" ? "No questions match these filters." : "Verified papers for this exam haven't been added yet."}</p></div> : <div className="divide-y divide-border">{questionsQ.data.questions.map((q) => <div key={q.id} className="py-4 flex items-center gap-4"><BookOpen className="h-5 w-5 text-primary shrink-0" /><div className="min-w-0 flex-1"><p className="font-medium break-words">{bootstrap.chapters.find((c) => c.id === q.chapter_id)?.name ?? "Chapter"}</p><p className="text-xs text-muted-foreground mt-1">{q.year} · {q.source_question} · {q.question_type} · {q.difficulty}</p><p className="text-xs text-muted-foreground mt-1">{q.source_label}</p></div></div>)}</div>}
        {questionsQ.data && questionsQ.data.total > 50 && <div className="flex items-center justify-between"><Button variant="outline" disabled={!page} onClick={() => setPage((p) => p - 1)}>Previous</Button><span className="text-sm">{page + 1} / {Math.ceil(questionsQ.data.total / 50)}</span><Button variant="outline" disabled={(page + 1) * 50 >= questionsQ.data.total} onClick={() => setPage((p) => p + 1)}>Next</Button></div>}
      </section>
    </main><BottomNav />
  </div>;
}