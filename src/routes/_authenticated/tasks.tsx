import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { listTasks, toggleTask, deleteTask, type Task } from "@/lib/tasks.functions";
import { getProfile } from "@/lib/tracker.functions";
import { BottomNav } from "@/components/tracker/BottomNav";
import { MeshBackground } from "@/components/tracker/MeshBackground";
import { TopHeader } from "@/components/tracker/TopHeader";
import { Footer } from "@/components/tracker/Footer";
import { QuickAdd } from "@/components/tracker/tasks/QuickAdd";
import { TaskCard } from "@/components/tracker/tasks/TaskCard";
import { TaskDetailSheet } from "@/components/tracker/tasks/TaskDetailSheet";
import { BUCKET_LABELS, BUCKET_ORDER, bucketOf, isoDay, type Bucket } from "@/components/tracker/tasks/util";

export const Route = createFileRoute("/_authenticated/tasks")({
  component: TasksPage,
  head: () => ({
    meta: [
      { title: "Tasks — SOLVE" },
      { name: "description", content: "Plan your study day: quick-add tasks, question targets and reminders." },
      { property: "og:title", content: "Tasks — SOLVE" },
      { property: "og:description", content: "Plan your study day with question-linked tasks and reminders." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type Filter = "all" | "today" | "upcoming" | "completed";

function TasksPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listTasks);
  const toggleFn = useServerFn(toggleTask);
  const deleteFn = useServerFn(deleteTask);
  const getProfileFn = useServerFn(getProfile);

  const tasksQ = useQuery({ queryKey: ["tasks"], queryFn: () => listFn() });
  const profileQ = useQuery({ queryKey: ["profile"], queryFn: () => getProfileFn() });
  const [filter, setFilter] = useState<Filter>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const subjects = (profileQ.data?.stream === "neet"
    ? (["physics", "chemistry", "biology"] as const)
    : (["physics", "chemistry", "math"] as const)) as ("physics" | "chemistry" | "math" | "biology")[];

  const toggleMut = useMutation({
    mutationFn: (v: { id: string; done: boolean }) => toggleFn({ data: v }),
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const prev = qc.getQueryData<Task[]>(["tasks"]);
      qc.setQueryData<Task[]>(["tasks"], (old) =>
        (old ?? []).map((t) => (t.id === v.id ? { ...t, completed_at: v.done ? new Date().toISOString() : null } : t)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["tasks"], ctx.prev);
      toast.error("Couldn't update task");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const prev = qc.getQueryData<Task[]>(["tasks"]);
      qc.setQueryData<Task[]>(["tasks"], (old) => (old ?? []).filter((t) => t.id !== id));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["tasks"], ctx.prev);
      toast.error("Couldn't delete task");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const tasks = tasksQ.data ?? [];
  const today = isoDay();

  const filtered = useMemo(() => {
    if (filter === "today") return tasks.filter((t) => !t.completed_at && t.due_on && t.due_on <= today);
    if (filter === "upcoming") return tasks.filter((t) => !t.completed_at && (!t.due_on || t.due_on > today));
    if (filter === "completed") return tasks.filter((t) => !!t.completed_at);
    return tasks;
  }, [tasks, filter, today]);

  const groups = useMemo(() => {
    const map = new Map<Bucket, Task[]>();
    for (const t of filtered) {
      const b = bucketOf(t, today);
      map.set(b, [...(map.get(b) ?? []), t]);
    }
    return BUCKET_ORDER.filter((b) => map.get(b)?.length).map((b) => [b, map.get(b)!] as const);
  }, [filtered, today]);

  const todayTasks = tasks.filter((t) => t.due_on === today);
  const doneToday = todayTasks.filter((t) => t.completed_at).length;
  const openTask = tasks.find((t) => t.id === openId) ?? null;

  return (
    <div className="min-h-dvh pb-28 relative">
      <MeshBackground />
      <TopHeader />

      <section className="px-4 pt-2">
        <div className="glass rounded-2xl px-4 py-3 flex items-baseline justify-between">
          <div>
            <p className="text-sm font-semibold">Today</p>
            <p className="text-xs text-muted-foreground">
              {todayTasks.length ? `${doneToday} / ${todayTasks.length} completed` : "Nothing scheduled"}
            </p>
          </div>
          <p className="text-2xl font-semibold tabular-nums">
            {todayTasks.length ? Math.round((doneToday / todayTasks.length) * 100) : 0}%
          </p>
        </div>
      </section>

      <section className="px-4 mt-3">
        <QuickAdd />
      </section>

      <section className="px-4 mt-3 flex gap-2 overflow-x-auto no-scrollbar">
        {(["all", "today", "upcoming", "completed"] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className="glass rounded-full px-3.5 py-1.5 text-xs font-medium capitalize shrink-0 tap active:tap-active"
            style={
              filter === f
                ? { background: "color-mix(in oklab, var(--primary) 16%, transparent)", color: "var(--primary)" }
                : undefined
            }
          >
            {f}
          </button>
        ))}
      </section>

      <section className="px-4 mt-4 space-y-5">
        {tasksQ.isLoading && <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>}
        {!tasksQ.isLoading && groups.length === 0 && (
          <div className="glass rounded-2xl py-10 text-center">
            <p className="text-sm font-medium">Your day is clear. Nice.</p>
            <p className="mt-1 text-xs text-muted-foreground">Add a task above to get started.</p>
          </div>
        )}
        {groups.map(([bucket, items]) => (
          <div key={bucket}>
            <p
              className="px-1 text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: bucket === "overdue" ? "var(--ios-orange, #ff9f0a)" : "var(--muted-foreground)" }}
            >
              {BUCKET_LABELS[bucket]}
            </p>
            <div className="mt-2 space-y-2">
              {items.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  onToggle={(done) => toggleMut.mutate({ id: t.id, done })}
                  onOpen={() => setOpenId(t.id)}
                  onDelete={() => deleteMut.mutate(t.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </section>

      <TaskDetailSheet task={openTask} onClose={() => setOpenId(null)} subjects={subjects} />

      <Footer className="mt-8" />
      <BottomNav />
    </div>
  );
}
