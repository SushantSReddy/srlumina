import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

type Subject = Database["public"]["Enums"]["app_subject"];
type Priority = Database["public"]["Enums"]["app_task_priority"];

const subjectEnum = z.enum(["physics", "chemistry", "math", "biology"]);
const priorityEnum = z.enum(["low", "medium", "high"]);
const repeatSchema = z
  .object({
    type: z.enum(["daily", "weekly", "custom"]),
    days: z.array(z.number().int().min(0).max(6)).optional(),
  })
  .nullable();

const taskFields = {
  title: z.string().trim().min(1).max(160),
  notes: z.string().trim().max(2000).nullable().optional(),
  due_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  due_time: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  priority: priorityEnum.optional(),
  subject: subjectEnum.nullable().optional(),
  chapter_id: z.string().uuid().nullable().optional(),
  question_target: z.number().int().min(1).max(10000).nullable().optional(),
  repeat_rule: repeatSchema.optional(),
  reminder_time: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(24)).max(8).optional(),
};

export type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];
export type SubtaskRow = Database["public"]["Tables"]["subtasks"]["Row"];
export type Task = TaskRow & {
  subtasks: SubtaskRow[];
  chapter_name: string | null;
  questions_logged: number;
};

const SELECT = "id, title, notes, due_on, due_time, priority, subject, chapter_id, question_target, repeat_rule, reminder_time, tags, completed_at, sort_order, created_at, updated_at, user_id, reminder_last_sent_on";

export const listTasks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Task[]> => {
    const { data: rows, error } = await context.supabase
      .from("tasks")
      .select(SELECT)
      .eq("user_id", context.userId)
      .order("due_on", { ascending: true, nullsFirst: false })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    const tasks = (rows ?? []) as TaskRow[];

    const [{ data: subs }, { data: chaps }] = await Promise.all([
      context.supabase
        .from("subtasks")
        .select("id, task_id, title, done, position, created_at")
        .in("task_id", tasks.length ? tasks.map((t) => t.id) : ["00000000-0000-0000-0000-000000000000"])
        .order("position", { ascending: true }),
      context.supabase.from("chapters").select("id, name").eq("user_id", context.userId),
    ]);
    const chapterMap = new Map((chaps ?? []).map((c) => [c.id, c.name]));

    // question progress for study-linked tasks
    const studyTasks = tasks.filter((t) => t.question_target && t.subject);
    const progress = new Map<string, number>();
    if (studyTasks.length) {
      const dates = Array.from(
        new Set(studyTasks.map((t) => t.due_on ?? new Date().toISOString().slice(0, 10))),
      );
      const { data: logs } = await context.supabase
        .from("question_logs")
        .select("logged_on, subject, chapter_id, count")
        .eq("user_id", context.userId)
        .in("logged_on", dates);
      for (const t of studyTasks) {
        const day = t.due_on ?? new Date().toISOString().slice(0, 10);
        const sum = (logs ?? [])
          .filter(
            (l) =>
              l.logged_on === day &&
              l.subject === t.subject &&
              (!t.chapter_id || l.chapter_id === t.chapter_id),
          )
          .reduce((a, l) => a + l.count, 0);
        progress.set(t.id, sum);
      }
    }

    return tasks.map((t) => ({
      ...t,
      subtasks: (subs ?? []).filter((s) => s.task_id === t.id) as SubtaskRow[],
      chapter_name: t.chapter_id ? (chapterMap.get(t.chapter_id) ?? null) : null,
      questions_logged: progress.get(t.id) ?? 0,
    }));
  });

export const createTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ ...taskFields, subtasks: z.array(z.string().trim().min(1).max(120)).max(20).optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { subtasks, ...fields } = data;
    const { data: row, error } = await context.supabase
      .from("tasks")
      .insert({
        user_id: context.userId,
        ...fields,
        subject: (fields.subject ?? null) as Subject | null,
        priority: (fields.priority ?? "medium") as Priority,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    if (subtasks?.length) {
      const { error: sErr } = await context.supabase.from("subtasks").insert(
        subtasks.map((title, i) => ({ task_id: row.id, title, position: i })),
      );
      if (sErr) throw new Error(sErr.message);
    }
    return { id: row.id };
  });

export const updateTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid(),
        ...Object.fromEntries(
          Object.entries(taskFields).map(([k, v]) => [k, (v as z.ZodTypeAny).optional()]),
        ),
      })
      .passthrough()
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { id, ...patch } = data as Record<string, unknown> & { id: string };
    const { error } = await context.supabase
      .from("tasks")
      .update(patch as Database["public"]["Tables"]["tasks"]["Update"])
      .eq("id", id)
      .eq("user_id", context.userId);

    if (error) throw new Error(error.message);
    return { ok: true };
  });

function nextOccurrence(dueOn: string | null, rule: { type: string; days?: number[] } | null): string | null {
  if (!rule) return null;
  const base = dueOn ? new Date(`${dueOn}T00:00:00`) : new Date();
  base.setHours(0, 0, 0, 0);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  if (rule.type === "daily") {
    base.setDate(base.getDate() + 1);
    return fmt(base);
  }
  if (rule.type === "weekly") {
    base.setDate(base.getDate() + 7);
    return fmt(base);
  }
  const days = (rule.days ?? []).slice().sort((a, b) => a - b);
  if (!days.length) return null;
  for (let i = 1; i <= 7; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    if (days.includes(d.getDay())) return fmt(d);
  }
  return null;
}

export const toggleTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid(), done: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: task, error: tErr } = await context.supabase
      .from("tasks")
      .select("id, due_on, repeat_rule")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (tErr) throw new Error(tErr.message);
    if (!task) throw new Error("Task not found");

    const rule = (task.repeat_rule as { type: string; days?: number[] } | null) ?? null;
    if (data.done && rule) {
      const next = nextOccurrence(task.due_on, rule);
      if (next) {
        const { error } = await context.supabase
          .from("tasks")
          .update({ due_on: next, completed_at: null, reminder_last_sent_on: null })
          .eq("id", data.id)
          .eq("user_id", context.userId);
        if (error) throw new Error(error.message);
        return { ok: true, repeated: next };
      }
    }

    const { error } = await context.supabase
      .from("tasks")
      .update({ completed_at: data.done ? new Date().toISOString() : null })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true, repeated: null };
  });

export const deleteTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("tasks")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

async function assertOwnsTask(
  supabase: { from: (t: string) => any },
  taskId: string,
  userId: string,
) {
  const { data } = await supabase.from("tasks").select("id").eq("id", taskId).eq("user_id", userId).maybeSingle();
  if (!data) throw new Error("Task not found");
}

export const addSubtask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ task_id: z.string().uuid(), title: z.string().trim().min(1).max(120) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertOwnsTask(context.supabase as never, data.task_id, context.userId);
    const { count } = await context.supabase
      .from("subtasks")
      .select("id", { count: "exact", head: true })
      .eq("task_id", data.task_id);
    const { error } = await context.supabase
      .from("subtasks")
      .insert({ task_id: data.task_id, title: data.title, position: count ?? 0 });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleSubtask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid(), done: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("subtasks").update({ done: data.done }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteSubtask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("subtasks").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Optional AI parsing for messy natural-language input. */
export const aiParseTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ text: z.string().trim().min(1).max(300) }).parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return null;
    const today = new Date().toISOString().slice(0, 10);
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 6000);
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        signal: ctrl.signal,
        headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content:
                `Today is ${today}. Convert the student's phrase into a study task. ` +
                `Return only fields you are confident about. Dates must be YYYY-MM-DD, times HH:MM 24h.`,
            },
            { role: "user", content: data.text },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "make_task",
                description: "Structured task",
                parameters: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    due_on: { type: "string" },
                    due_time: { type: "string" },
                    subject: { type: "string", enum: ["physics", "chemistry", "math", "biology"] },
                    question_target: { type: "number" },
                    priority: { type: "string", enum: ["low", "medium", "high"] },
                    chapter: { type: "string" },
                  },
                  required: ["title"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "make_task" } },
        }),
      });
      clearTimeout(timer);
      if (!res.ok) return null;
      const json = (await res.json()) as any;
      const args = json?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      if (!args) return null;
      return JSON.parse(args) as {
        title: string;
        due_on?: string;
        due_time?: string;
        subject?: Subject;
        question_target?: number;
        priority?: Priority;
        chapter?: string;
      };
    } catch {
      return null;
    }
  });
