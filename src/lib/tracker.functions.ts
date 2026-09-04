import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

type Subject = Database["public"]["Enums"]["app_subject"];
type ExamLevel = Database["public"]["Enums"]["app_exam_level"];
type Stream = Database["public"]["Enums"]["app_stream"];

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select(
        "id, display_name, avatar_url, stream, daily_goal, class_level, target_year, dream_college, dream_image_url",
      )
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      display_name: z.string().min(1).max(60).optional(),
      stream: z.enum(["jee", "neet"]).optional(),
      daily_goal: z.number().int().min(1).max(1000).optional(),
      class_level: z.enum(["class_9", "class_10", "class_11", "class_12", "dropper"]).optional(),
      target_year: z.number().int().min(2025).max(2035).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update(data)
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listSources = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("sources")
      .select("id, name, is_default")
      .eq("user_id", context.userId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const addCustomSource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ name: z.string().min(1).max(40) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("sources")
      .insert({ user_id: context.userId, name: data.name.trim(), is_default: false })
      .select("id, name, is_default")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteSource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("sources")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .eq("is_default", false);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listChapters = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      subject: z.enum(["physics", "chemistry", "math", "biology"]).nullable().optional(),
    }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("chapters")
      .select("id, name, subject")
      .eq("user_id", context.userId)
      .order("name", { ascending: true });
    if (data.subject) q = q.eq("subject", data.subject as Subject);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const addChapter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      subject: z.enum(["physics", "chemistry", "math", "biology"]),
      name: z.string().trim().min(1).max(80),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("chapters")
      .insert({ user_id: context.userId, subject: data.subject as Subject, name: data.name.trim() })
      .select("id, name, subject")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteChapter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("chapters")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const logQuestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      subject: z.enum(["physics", "chemistry", "math", "biology"]),
      count: z.number().int().min(1).max(10000),
      source_id: z.string().uuid().nullable(),
      chapter_id: z.string().uuid(),
      exam_level: z.enum(["main", "advanced", "section_a", "section_b"]).nullable(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    // Verify chapter belongs to user + subject
    const { data: chap, error: cErr } = await context.supabase
      .from("chapters")
      .select("id, subject")
      .eq("id", data.chapter_id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (cErr) throw new Error(cErr.message);
    if (!chap || chap.subject !== data.subject) throw new Error("Invalid chapter for subject");

    const { error } = await context.supabase
      .from("question_logs")
      .insert({
        user_id: context.userId,
        subject: data.subject as Subject,
        count: data.count,
        source_id: data.source_id,
        chapter_id: data.chapter_id,
        exam_level: data.exam_level as ExamLevel | null,
      });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const resetToday = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      subject: z.enum(["physics", "chemistry", "math", "biology"]).nullable().optional(),
    }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const today = new Date().toISOString().slice(0, 10);
    let q = context.supabase
      .from("question_logs")
      .delete()
      .eq("user_id", context.userId)
      .eq("logged_on", today);
    if (data.subject) q = q.eq("subject", data.subject as Subject);
    const { error } = await q;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export const getTodaySummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const today = todayISO();
    const { data, error } = await context.supabase
      .from("question_logs")
      .select("subject, count")
      .eq("user_id", context.userId)
      .eq("logged_on", today);
    if (error) throw new Error(error.message);
    const totals: Record<string, number> = { physics: 0, chemistry: 0, math: 0, biology: 0 };
    for (const row of data ?? []) totals[row.subject] += row.count;
    const total = Object.values(totals).reduce((a, b) => a + b, 0);
    return { totals, total };
  });

export const getStreak = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("question_logs")
      .select("logged_on")
      .eq("user_id", context.userId)
      .order("logged_on", { ascending: false })
      .limit(400);
    if (error) throw new Error(error.message);
    const days = new Set((data ?? []).map((r) => r.logged_on));
    let streak = 0;
    const d = new Date();
    // If nothing today, streak may still be alive from yesterday — count from today.
    while (streak < 400) {
      const iso = d.toISOString().slice(0, 10);
      if (days.has(iso)) { streak++; d.setDate(d.getDate() - 1); }
      else break;
    }
    return { streak };
  });

export const getAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      days: z.number().int().min(1).max(365).default(30),
      subject: z.enum(["physics", "chemistry", "math", "biology"]).nullable().optional(),
      source_id: z.string().uuid().nullable().optional(),
      chapter_id: z.string().uuid().nullable().optional(),
      exam_level: z.enum(["main", "advanced", "section_a", "section_b"]).nullable().optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const since = new Date();
    since.setDate(since.getDate() - (data.days - 1));
    const sinceISO = since.toISOString().slice(0, 10);

    let q = context.supabase
      .from("question_logs")
      .select("logged_on, subject, count, source_id, chapter_id, exam_level")
      .eq("user_id", context.userId)
      .gte("logged_on", sinceISO);
    if (data.subject) q = q.eq("subject", data.subject as Subject);
    if (data.source_id) q = q.eq("source_id", data.source_id);
    if (data.chapter_id) q = q.eq("chapter_id", data.chapter_id);
    if (data.exam_level) q = q.eq("exam_level", data.exam_level as ExamLevel);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    // Load chapters for name lookup (scoped to user)
    const { data: chaps } = await context.supabase
      .from("chapters")
      .select("id, name, subject")
      .eq("user_id", context.userId);
    const chapterMap = new Map((chaps ?? []).map((c) => [c.id, c]));

    // Aggregate per day
    const byDay = new Map<string, number>();
    for (let i = 0; i < data.days; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      byDay.set(d.toISOString().slice(0, 10), 0);
    }
    const bySubject: Record<string, number> = { physics: 0, chemistry: 0, math: 0, biology: 0 };
    const bySource = new Map<string, number>();
    const byChapter = new Map<string, number>();
    for (const r of rows ?? []) {
      byDay.set(r.logged_on, (byDay.get(r.logged_on) ?? 0) + r.count);
      bySubject[r.subject] += r.count;
      const key = r.source_id ?? "none";
      bySource.set(key, (bySource.get(key) ?? 0) + r.count);
      const ckey = r.chapter_id ?? "none";
      byChapter.set(ckey, (byChapter.get(ckey) ?? 0) + r.count);
    }
    return {
      series: Array.from(byDay, ([date, count]) => ({ date, count })),
      bySubject,
      bySource: Array.from(bySource, ([source_id, count]) => ({ source_id, count })),
      byChapter: Array.from(byChapter, ([chapter_id, count]) => ({
        chapter_id,
        count,
        name: chapter_id === "none" ? "Unassigned" : (chapterMap.get(chapter_id)?.name ?? "Deleted chapter"),
        subject: chapter_id === "none" ? null : (chapterMap.get(chapter_id)?.subject ?? null),
      })).sort((a, b) => b.count - a.count),
      total: (rows ?? []).reduce((a, r) => a + r.count, 0),
    };
  });


export type { Subject, ExamLevel, Stream };
