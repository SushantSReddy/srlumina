import { useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  addSubtask,
  deleteSubtask,
  deleteTask,
  toggleSubtask,
  updateTask,
  type Task,
} from "@/lib/tasks.functions";
import { listChapters } from "@/lib/tracker.functions";
import { SUBJECT_COLORS, SUBJECT_LABELS } from "./util";

type Subject = "physics" | "chemistry" | "math" | "biology";

export function TaskDetailSheet({
  task,
  onClose,
  subjects,
}: {
  task: Task | null;
  onClose: () => void;
  subjects: Subject[];
}) {
  const qc = useQueryClient();
  const updateFn = useServerFn(updateTask);
  const deleteFn = useServerFn(deleteTask);
  const addSubFn = useServerFn(addSubtask);
  const toggleSubFn = useServerFn(toggleSubtask);
  const delSubFn = useServerFn(deleteSubtask);
  const listChaptersFn = useServerFn(listChapters);

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [dueOn, setDueOn] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [subject, setSubject] = useState<Subject | "">("");
  const [chapterId, setChapterId] = useState("");
  const [target, setTarget] = useState("");
  const [reminder, setReminder] = useState("");
  const [newSub, setNewSub] = useState("");

  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setNotes(task.notes ?? "");
    setDueOn(task.due_on ?? "");
    setDueTime(task.due_time ? task.due_time.slice(0, 5) : "");
    setPriority(task.priority);
    setSubject((task.subject as Subject) ?? "");
    setChapterId(task.chapter_id ?? "");
    setTarget(task.question_target ? String(task.question_target) : "");
    setReminder(task.reminder_time ? task.reminder_time.slice(0, 5) : "");
    setNewSub("");
  }, [task?.id]);

  const chaptersQ = useQuery({
    queryKey: ["chapters", subject],
    queryFn: () => listChaptersFn({ data: { subject: subject as Subject } }),
    enabled: !!task && !!subject,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["tasks"] });

  const saveMut = useMutation({
    mutationFn: () =>
      updateFn({
        data: {
          id: task!.id,
          title: title.trim() || task!.title,
          notes: notes.trim() || null,
          due_on: dueOn || null,
          due_time: dueTime || null,
          priority,
          subject: subject || null,
          chapter_id: chapterId || null,
          question_target: target ? Number(target) : null,
          reminder_time: reminder || null,
        },
      }),
    onSuccess: () => {
      refresh();
      onClose();
      toast.success("Task saved");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't save"),
  });

  const delMut = useMutation({
    mutationFn: () => deleteFn({ data: { id: task!.id } }),
    onSuccess: () => {
      refresh();
      onClose();
      toast.success("Task deleted");
    },
  });

  const addSubMut = useMutation({
    mutationFn: (t: string) => addSubFn({ data: { task_id: task!.id, title: t } }),
    onSuccess: () => {
      setNewSub("");
      refresh();
    },
  });

  if (!task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative w-full sm:max-w-md glass-strong rounded-t-3xl sm:rounded-3xl p-5 pb-[max(env(safe-area-inset-bottom),20px)] max-h-[88dvh] overflow-y-auto spring-in">
        <div className="flex items-start gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 bg-transparent text-base font-semibold outline-none"
          />
          <button type="button" onClick={onClose} aria-label="Close" className="text-muted-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes"
          rows={2}
          className="mt-3 w-full glass rounded-xl px-3 py-2 text-sm bg-transparent outline-none resize-none"
        />

        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="glass rounded-xl px-3 py-2 text-xs text-muted-foreground">
            Due date
            <input
              type="date"
              value={dueOn}
              onChange={(e) => setDueOn(e.target.value)}
              className="mt-1 w-full bg-transparent text-sm text-foreground outline-none"
            />
          </label>
          <label className="glass rounded-xl px-3 py-2 text-xs text-muted-foreground">
            Time
            <input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className="mt-1 w-full bg-transparent text-sm text-foreground outline-none"
            />
          </label>
        </div>

        <div className="mt-3 flex gap-2">
          {(["low", "medium", "high"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              className="flex-1 rounded-xl py-2 text-xs font-medium capitalize glass"
              style={
                priority === p
                  ? { background: "color-mix(in oklab, var(--primary) 16%, transparent)", color: "var(--primary)" }
                  : undefined
              }
            >
              {p}
            </button>
          ))}
        </div>

        <div className="mt-3 flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setSubject("");
              setChapterId("");
            }}
            className="glass rounded-full px-3 py-1.5 text-xs"
            style={!subject ? { color: "var(--primary)" } : undefined}
          >
            No subject
          </button>
          {subjects.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setSubject(s);
                setChapterId("");
              }}
              className="glass rounded-full px-3 py-1.5 text-xs inline-flex items-center gap-1.5"
              style={subject === s ? { background: "color-mix(in oklab, var(--primary) 14%, transparent)" } : undefined}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: SUBJECT_COLORS[s] }} />
              {SUBJECT_LABELS[s]}
            </button>
          ))}
        </div>

        {subject && (chaptersQ.data?.length ?? 0) > 0 && (
          <select
            value={chapterId}
            onChange={(e) => setChapterId(e.target.value)}
            className="mt-3 w-full glass rounded-xl px-3 py-2 text-sm bg-transparent outline-none"
          >
            <option value="">No chapter</option>
            {chaptersQ.data!.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}

        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="glass rounded-xl px-3 py-2 text-xs text-muted-foreground">
            Question target
            <input
              type="number"
              inputMode="numeric"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="—"
              className="mt-1 w-full bg-transparent text-sm text-foreground outline-none"
            />
          </label>
          <label className="glass rounded-xl px-3 py-2 text-xs text-muted-foreground">
            Reminder
            <input
              type="time"
              value={reminder}
              onChange={(e) => setReminder(e.target.value)}
              className="mt-1 w-full bg-transparent text-sm text-foreground outline-none"
            />
          </label>
        </div>

        {task.question_target ? (
          <p className="mt-2 text-xs text-muted-foreground">
            {task.questions_logged} of {task.question_target} questions logged for this task.
          </p>
        ) : null}

        {/* Subtasks */}
        <div className="mt-4">
          <p className="text-xs font-medium text-muted-foreground">Subtasks</p>
          <div className="mt-2 space-y-1.5">
            {task.subtasks.map((s) => (
              <div key={s.id} className="glass rounded-xl px-3 py-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={s.done}
                  onChange={async (e) => {
                    await toggleSubFn({ data: { id: s.id, done: e.target.checked } });
                    refresh();
                  }}
                  className="accent-[var(--primary)]"
                />
                <span className={`flex-1 text-sm ${s.done ? "line-through text-muted-foreground" : ""}`}>{s.title}</span>
                <button
                  type="button"
                  aria-label="Delete subtask"
                  onClick={async () => {
                    await delSubFn({ data: { id: s.id } });
                    refresh();
                  }}
                  className="text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <div className="glass rounded-xl px-3 py-2 flex items-center gap-2">
              <input
                value={newSub}
                onChange={(e) => setNewSub(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newSub.trim()) addSubMut.mutate(newSub.trim());
                }}
                placeholder="Add subtask"
                className="flex-1 bg-transparent text-sm outline-none"
              />
              <button
                type="button"
                aria-label="Add subtask"
                onClick={() => newSub.trim() && addSubMut.mutate(newSub.trim())}
                className="text-muted-foreground"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Delete this task?")) delMut.mutate();
            }}
            className="glass rounded-xl px-4 py-2.5 text-sm text-destructive flex items-center gap-1.5"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
          <button
            type="button"
            onClick={() => saveMut.mutate()}
            disabled={saveMut.isPending}
            className="flex-1 rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {saveMut.isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
