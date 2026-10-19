import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Bookmark, RotateCcw, Play, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TopHeader } from "@/components/tracker/TopHeader";
import { BottomNav } from "@/components/tracker/BottomNav";
import { MeshBackground } from "@/components/tracker/MeshBackground";
import { revisionOptions, pyqBootstrapOptions } from "@/lib/pyq.queries";
import { startRevision, bookmarkPyq, type RevisionFilters } from "@/lib/pyq.functions";

export const Route = createFileRoute("/_authenticated/pyq/revision")({
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(revisionOptions()), context.queryClient.ensureQueryData(pyqBootstrapOptions())]),
  component: RevisionPage,
  head: () => ({ meta: [
    { title: "PYQ revision centre — SR Lumina" },
    { name: "description", content: "Revisit bookmarked and incorrect JEE and NEET previous-year questions with saved revision sessions on SR Lumina." },
    { property: "og:title", content: "PYQ revision centre — SR Lumina" },
    { property: "og:description", content: "Your saved questions and incorrect attempts, ready for revision." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
});
function RevisionPage() {
  const [filters, setFilters] = useState<RevisionFilters>({ collection: "all", page: 0 });
  const { data, refetch } = useSuspenseQuery(revisionOptions(filters));
  const { data: bootstrap } = useSuspenseQuery(pyqBootstrapOptions());
  const navigate = useNavigate();
  const start = useServerFn(startRevision), bookmark = useServerFn(bookmarkPyq);
  const startMut = useMutation({ mutationFn: (questionIds: string[]) => start({ data: { questionIds, collection: filters.collection } }), onSuccess: ({ id }) => navigate({ to: "/pyq/$sessionId", params: { sessionId: id } }), onError: (e) => toast.error(e.message) });
  const bookmarkMut = useMutation({ mutationFn: (questionId: string) => bookmark({ data: { questionId, bookmarked: false } }), onSuccess: () => refetch(), onError: () => toast.error("Couldn't remove bookmark") });
  function update(patch: Partial<RevisionFilters>) { setFilters((old) => ({ ...old, ...patch, page: 0 })); }
  const sessions = bootstrap.sessions.filter((s) => s.filters && typeof s.filters === "object" && !Array.isArray(s.filters) && s.filters.mode === "revision");
  const subjects = filters.exam === "neet" ? ["physics", "chemistry", "biology"] as const : filters.exam ? ["physics", "chemistry", "math"] as const : ["physics", "chemistry", "math", "biology"] as const;
  const chapters = bootstrap.chapters.filter((c) => !filters.subject || c.subject === filters.subject);
  return <div className="min-h-dvh relative pb-28"><MeshBackground /><TopHeader title="Revision centre" subtitle="PYQ practice" />
    <main className="mx-auto max-w-3xl px-4 space-y-6">
      <Button asChild variant="ghost" size="sm"><Link to="/pyq"><ArrowLeft />PYQs</Link></Button>
      <section className="space-y-4">
        <div className="grid grid-cols-3 gap-2" aria-label="Revision collection">
          {([['all', 'All saved'], ['bookmarked', 'Bookmarks'], ['incorrect', 'Incorrect']] as const).map(([collection, label]) => <Button key={collection} variant={filters.collection === collection ? "default" : "outline"} onClick={() => update({ collection })}>{label}</Button>)}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="text-xs font-medium space-y-2"><span>Exam</span><Select value={filters.exam ?? "all"} onValueChange={(v) => update({ exam: v === "all" ? undefined : v as RevisionFilters["exam"], subject: undefined, chapter: undefined })}><SelectTrigger aria-label="Exam"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All exams</SelectItem><SelectItem value="jee_main">JEE Main</SelectItem><SelectItem value="jee_advanced">JEE Advanced</SelectItem><SelectItem value="neet">NEET</SelectItem></SelectContent></Select></label>
          <label className="text-xs font-medium space-y-2"><span>Subject</span><Select value={filters.subject ?? "all"} onValueChange={(v) => update({ subject: v === "all" ? undefined : v as RevisionFilters["subject"], chapter: undefined })}><SelectTrigger aria-label="Subject"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All subjects</SelectItem>{subjects.map((s) => <SelectItem key={s} value={s}>{s === "math" ? "Mathematics" : s[0].toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent></Select></label>
          <label className="text-xs font-medium space-y-2"><span>Chapter</span><Select value={filters.chapter ?? "all"} onValueChange={(v) => update({ chapter: v === "all" ? undefined : v })}><SelectTrigger aria-label="Chapter"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All chapters</SelectItem>{chapters.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></label>
        </div>
      </section>
      {sessions.length > 0 && <section className="space-y-2"><h2 className="font-semibold">Continue revision</h2>{sessions.map((s) => <Button asChild key={s.id} variant="outline" className="w-full h-auto py-3 justify-between"><Link to="/pyq/$sessionId" params={{ sessionId: s.id }}><span className="text-left">Revision<span className="block text-xs text-muted-foreground">Question {s.current_index + 1} of {s.question_ids.length}</span></span><ChevronRight /></Link></Button>)}</section>}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">Saved questions <span className="text-muted-foreground font-normal">· {data.total}</span></h2><Button disabled={!data.questions.length || startMut.isPending} onClick={() => startMut.mutate(data.questions.map((q) => q.question_id))}><Play />{startMut.isPending ? "Starting…" : "Practice these questions"}</Button></div>
        {!data.total ? <div className="py-12 text-center border-y border-border"><Bookmark className="mx-auto h-9 w-9 text-muted-foreground" /><h3 className="mt-4 font-semibold">{filters.collection === "incorrect" ? "No incorrect questions here" : filters.collection === "bookmarked" ? "No bookmarks here" : "No saved questions here"}</h3></div> : <div className="divide-y divide-border">{data.questions.map((item) => <article key={item.question_id} className="py-4 flex items-start gap-3">
          <div className="min-w-0 flex-1"><h3 className="font-medium break-words">{item.question.chapter.name}</h3><p className="mt-1 text-xs text-muted-foreground">{item.question.exam.replaceAll("_", " ").toUpperCase()} · {item.question.year} · {item.question.source_question}</p><p className="mt-1 text-xs text-muted-foreground">{item.question.source_label}</p><div className="mt-2 flex flex-wrap gap-3 text-xs">{item.incorrect && <span className="text-ios-red">Previously incorrect</span>}{item.bookmarked && <span className="text-primary">Bookmarked</span>}</div></div>
          <div className="flex gap-1 shrink-0">{item.bookmarked && <Button variant="ghost" size="icon" title="Remove bookmark" aria-label="Remove bookmark" disabled={bookmarkMut.isPending} onClick={() => bookmarkMut.mutate(item.question_id)}><Bookmark className="fill-primary text-primary" /></Button>}<Button variant="outline" size="icon" title="Reattempt question" aria-label="Reattempt question" disabled={startMut.isPending} onClick={() => startMut.mutate([item.question_id])}><RotateCcw /></Button></div>
        </article>)}</div>}
        {data.total > 50 && <div className="flex items-center justify-between"><Button variant="outline" disabled={!filters.page} onClick={() => setFilters((old) => ({ ...old, page: old.page - 1 }))}>Previous</Button><span className="text-sm">{filters.page + 1} / {Math.ceil(data.total / 50)}</span><Button variant="outline" disabled={(filters.page + 1) * 50 >= data.total} onClick={() => setFilters((old) => ({ ...old, page: old.page + 1 }))}>Next</Button></div>}
      </section>
    </main><BottomNav />
  </div>;
}
