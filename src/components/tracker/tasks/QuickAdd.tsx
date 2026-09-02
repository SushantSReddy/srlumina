import { useState } from "react";
import { Sparkles, Plus } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { aiParseTask, createTask } from "@/lib/tasks.functions";
import { parseTaskInput } from "@/lib/task-parse";
import { isoDay } from "./util";

export function QuickAdd({ defaultDay }: { defaultDay?: string }) {
  const qc = useQueryClient();
  const createFn = useServerFn(createTask);
  const aiFn = useServerFn(aiParseTask);
  const [text, setText] = useState("");
  const [smart, setSmart] = useState(false);
  const [busy, setBusy] = useState(false);

  const mut = useMutation({
    mutationFn: async (raw: string) => {
      let parsed = parseTaskInput(raw);
      if (smart) {
        try {
          const ai = await aiFn({ data: { text: raw } });
          if (ai?.title) {
            parsed = {
              title: ai.title,
              due_on: ai.due_on ?? parsed.due_on,
              due_time: ai.due_time ?? parsed.due_time,
              subject: ai.subject ?? parsed.subject,
              question_target: ai.question_target ?? parsed.question_target,
              priority: ai.priority ?? parsed.priority,
            };
          }
        } catch {
          /* silent fallback to local parse */
        }
      }
      return createFn({
        data: {
          title: parsed.title,
          due_on: parsed.due_on ?? defaultDay ?? isoDay(),
          due_time: parsed.due_time,
          subject: parsed.subject,
          question_target: parsed.question_target,
          priority: parsed.priority ?? "medium",
        },
      });
    },
    onSuccess: () => {
      setText("");
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't add task"),
    onSettled: () => setBusy(false),
  });

  function submit() {
    const raw = text.trim();
    if (!raw) return;
    setBusy(true);
    mut.mutate(raw);
  }

  return (
    <div className="glass rounded-2xl px-3 py-2 flex items-center gap-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        placeholder="Solve 20 physics questions tomorrow 7pm"
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70 py-1.5"
      />
      <button
        type="button"
        aria-label="Smart parsing"
        aria-pressed={smart}
        onClick={() => setSmart((s) => !s)}
        className="h-8 w-8 rounded-full flex items-center justify-center transition-colors"
        style={{
          background: smart ? "color-mix(in oklab, var(--primary) 18%, transparent)" : "transparent",
          color: smart ? "var(--primary)" : "var(--muted-foreground)",
        }}
      >
        <Sparkles className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="Add task"
        onClick={submit}
        disabled={busy || !text.trim()}
        className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 active:scale-90 transition-transform"
      >
        <Plus className="h-4 w-4" strokeWidth={2.6} />
      </button>
    </div>
  );
}
