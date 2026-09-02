import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, ChevronRight } from "lucide-react";
import { listTasks, toggleTask, type Task } from "@/lib/tasks.functions";
import { isoDay } from "./util";

export function TodayTasksCard() {
  const qc = useQueryClient();
  const listFn = useServerFn(listTasks);
  const toggleFn = useServerFn(toggleTask);
  const tasksQ = useQuery({ queryKey: ["tasks"], queryFn: () => listFn() });

  const toggleMut = useMutation({
    mutationFn: (v: { id: string; done: boolean }) => toggleFn({ data: v }),
    onMutate: async (v) => {
      const prev = qc.getQueryData<Task[]>(["tasks"]);
      qc.setQueryData<Task[]>(["tasks"], (old) =>
        (old ?? []).map((t) => (t.id === v.id ? { ...t, completed_at: v.done ? new Date().toISOString() : null } : t)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(["tasks"], ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const today = isoDay();
  const items = (tasksQ.data ?? []).filter((t) => t.due_on && t.due_on <= today).slice(0, 4);
  if (!items.length) return null;

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Today's tasks</p>
        <Link to="/tasks" className="text-xs text-muted-foreground inline-flex items-center gap-0.5">
          View all <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="mt-3 space-y-2">
        {items.map((t) => {
          const done = !!t.completed_at;
          return (
            <div key={t.id} className="flex items-center gap-2.5">
              <button
                type="button"
                aria-label={done ? "Mark incomplete" : "Mark complete"}
                onClick={() => toggleMut.mutate({ id: t.id, done: !done })}
                className="h-5 w-5 shrink-0 rounded-full border flex items-center justify-center active:scale-90 transition-transform"
                style={{
                  borderColor: done ? "transparent" : "color-mix(in oklab, var(--foreground) 30%, transparent)",
                  background: done ? "var(--primary)" : "transparent",
                }}
              >
                {done && <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />}
              </button>
              <span className={`text-sm truncate ${done ? "line-through text-muted-foreground" : ""}`}>{t.title}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
