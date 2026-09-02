import { useRef, useState } from "react";
import { Bell, Check, Repeat, Target } from "lucide-react";
import type { Task } from "@/lib/tasks.functions";
import { SUBJECT_COLORS, SUBJECT_LABELS, formatTime } from "./util";

const PRIORITY_OPACITY: Record<string, string> = { low: "0.25", medium: "0.55", high: "1" };

export function TaskCard({
  task,
  onToggle,
  onOpen,
  onDelete,
}: {
  task: Task;
  onToggle: (done: boolean) => void;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const done = !!task.completed_at;
  const [dx, setDx] = useState(0);
  const start = useRef<number | null>(null);

  const subtasksDone = task.subtasks.filter((s) => s.done).length;
  const meta: string[] = [];
  if (task.due_time) meta.push(formatTime(task.due_time)!);
  if (task.chapter_name) meta.push(task.chapter_name);
  if (task.subtasks.length) meta.push(`${subtasksDone}/${task.subtasks.length}`);

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div className="absolute inset-0 flex items-center justify-between px-5 text-xs font-medium">
        <span className="text-[var(--ios-green,#34c759)]">Complete</span>
        <span className="text-destructive">Delete</span>
      </div>
      <div
        className="relative glass rounded-2xl flex items-stretch gap-3 pr-3 tap"
        style={{ transform: `translateX(${dx}px)`, transition: start.current === null ? "transform .25s ease" : "none" }}
        onTouchStart={(e) => {
          start.current = e.touches[0]!.clientX;
        }}
        onTouchMove={(e) => {
          if (start.current === null) return;
          setDx(Math.max(-120, Math.min(120, e.touches[0]!.clientX - start.current)));
        }}
        onTouchEnd={() => {
          start.current = null;
          if (dx > 80) onToggle(!done);
          else if (dx < -80) onDelete();
          setDx(0);
        }}
      >
        <span
          aria-hidden
          className="w-[3px] rounded-full my-3 ml-1.5"
          style={{
            background: "var(--foreground)",
            opacity: done ? 0.12 : PRIORITY_OPACITY[task.priority] ?? "0.5",
          }}
        />
        <button
          type="button"
          aria-label={done ? "Mark incomplete" : "Mark complete"}
          onClick={() => onToggle(!done)}
          className="shrink-0 self-center h-6 w-6 rounded-full border flex items-center justify-center transition-colors active:scale-90"
          style={{
            borderColor: done ? "transparent" : "color-mix(in oklab, var(--foreground) 30%, transparent)",
            background: done ? "var(--primary)" : "transparent",
          }}
        >
          {done && <Check className="h-3.5 w-3.5 text-primary-foreground" strokeWidth={3} />}
        </button>

        <button type="button" onClick={onOpen} className="flex-1 text-left py-3 min-w-0">
          <p className={`text-sm font-medium truncate ${done ? "line-through text-muted-foreground" : ""}`}>
            {task.title}
          </p>
          <div className="mt-0.5 flex items-center gap-1.5 flex-wrap text-[11px] text-muted-foreground">
            {task.subject && (
              <span className="inline-flex items-center gap-1">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: SUBJECT_COLORS[task.subject] }}
                />
                {SUBJECT_LABELS[task.subject]}
              </span>
            )}
            {meta.map((m) => (
              <span key={m}>· {m}</span>
            ))}
            {task.question_target ? (
              <span className="inline-flex items-center gap-1">
                · <Target className="h-3 w-3" />
                {Math.min(task.questions_logged, task.question_target)}/{task.question_target}
              </span>
            ) : null}
            {task.reminder_time && <Bell className="h-3 w-3" />}
            {task.repeat_rule && <Repeat className="h-3 w-3" />}
          </div>
        </button>
      </div>
    </div>
  );
}
