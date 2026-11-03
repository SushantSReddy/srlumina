import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { shiftDay } from "./study-day";
import { userStudyDay } from "./study-day.server";
import { buildAssessmentReport, ASSESSMENT_QUESTIONS, type AssessmentReport } from "./mindset/content";

// The mindset_* tables are added by a staged draft migration; generated
// Database types don't include them yet, so plain row types are declared here.
export type MindsetCodeRow = { user_id: string; principle_key: string; challenge_done: boolean; updated_at: string };
export type MindsetMistakeRow = {
  id: string; user_id: string; subject: string; chapter: string; category: string;
  question_ref: string | null; reason: string; should_have_done: string; prevention: string;
  resolved: boolean; created_at: string;
};
export type MindsetOsRow = { user_id: string; logged_on: string; done_items: string[] };
export type MindsetChallengeRow = {
  id: string; user_id: string; started_on: string; active: boolean;
  completed_days: number[]; reflections: Record<string, string>;
};
export type MindsetAssessmentRow = {
  id: string; user_id: string; answers: number[]; score: number;
  report: AssessmentReport; created_at: string;
};
export type MindsetState = {
  today: string;
  code: MindsetCodeRow[];
  mistakes: MindsetMistakeRow[];
  osToday: string[];
  osWeek: { logged_on: string; count: number }[];
  challenge: MindsetChallengeRow | null;
  pastRuns: { id: string; started_on: string; completed_days: number[] }[];
  assessment: MindsetAssessmentRow | null;
  assessmentHistory: { id: string; score: number; created_at: string }[];
  context: { streak: number; weekQuestions: number; incorrectCount: number; bookmarkedCount: number };
};

const subjectSchema = z.enum(["physics", "chemistry", "math", "biology"]);
const mistakeCategorySchema = z.enum(["conceptual", "calculation", "misread", "time"]);

export const getMindsetState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ timeZone: z.string().max(100) }).parse(input))
  .handler(async ({ data, context }) => {
    const today = await userStudyDay(context.supabase, context.userId);
    const weekStart = shiftDay(today, -6);
    const farPast = shiftDay(today, -399);
    const [code, mistakes, osRows, activeRuns, pastRuns, assessments, assessmentHistory, streakLogs, weekLogs, incorrectCol, bookmarkedCol] = await Promise.all([
      context.supabase.from("mindset_code_progress").select("user_id,principle_key,challenge_done,updated_at").eq("user_id", context.userId),
      context.supabase.from("mindset_mistakes").select("*").eq("user_id", context.userId).order("created_at", { ascending: false }).limit(200),
      context.supabase.from("mindset_daily_os").select("logged_on,done_items").eq("user_id", context.userId).gte("logged_on", weekStart).lte("logged_on", today),
      context.supabase.from("mindset_challenge_runs").select("*").eq("user_id", context.userId).eq("active", true).order("started_on", { ascending: false }).limit(1),
      context.supabase.from("mindset_challenge_runs").select("id,started_on,completed_days").eq("user_id", context.userId).eq("active", false).order("started_on", { ascending: false }).limit(10),
      context.supabase.from("mindset_assessments").select("*").eq("user_id", context.userId).order("created_at", { ascending: false }).limit(1),
      context.supabase.from("mindset_assessments").select("id,score,created_at").eq("user_id", context.userId).order("created_at", { ascending: false }).limit(10),
      context.supabase.from("question_logs").select("logged_on").eq("user_id", context.userId).gte("logged_on", farPast).order("logged_on", { ascending: false }),
      context.supabase.from("question_logs").select("logged_on,count").eq("user_id", context.userId).gte("logged_on", weekStart).lte("logged_on", today),
      context.supabase.from("pyq_collections").select("question_id", { count: "exact", head: true }).eq("user_id", context.userId).eq("incorrect", true),
      context.supabase.from("pyq_collections").select("question_id", { count: "exact", head: true }).eq("user_id", context.userId).eq("bookmarked", true),
    ]);
    const firstError = [code, mistakes, osRows, activeRuns, pastRuns, assessments, assessmentHistory, streakLogs, weekLogs].find((r) => r.error)?.error;
    if (firstError) throw new Error(firstError.message);
    if (incorrectCol.error || bookmarkedCol.error) throw new Error(incorrectCol.error?.message ?? bookmarkedCol.error!.message);

    const loggedDays = new Set((streakLogs.data ?? []).map((r) => r.logged_on));
    let streak = 0;
    let day = today;
    while (streak < 400) {
      if (loggedDays.has(day)) { streak++; day = shiftDay(day, -1); }
      else break;
    }
    const weekQuestions = (weekLogs.data ?? []).reduce((sum, r) => sum + r.count, 0);

    const osMap = new Map((osRows.data ?? []).map((r) => [r.logged_on, r.done_items as string[]]));
    const osWeek = Array.from({ length: 7 }, (_, i) => {
      const loggedOn = shiftDay(weekStart, i);
      return { logged_on: loggedOn, count: (osMap.get(loggedOn) ?? []).length };
    });

    return {
      today,
      code: (code.data ?? []) as MindsetCodeRow[],
      mistakes: (mistakes.data ?? []) as MindsetMistakeRow[],
      osToday: osMap.get(today) ?? [],
      osWeek,
      challenge: ((activeRuns.data ?? [])[0] ?? null) as MindsetChallengeRow | null,
      pastRuns: (pastRuns.data ?? []) as { id: string; started_on: string; completed_days: number[] }[],
      assessment: ((assessments.data ?? [])[0] ?? null) as MindsetAssessmentRow | null,
      assessmentHistory: (assessmentHistory.data ?? []) as { id: string; score: number; created_at: string }[],
      context: {
        streak,
        weekQuestions,
        incorrectCount: incorrectCol.count ?? 0,
        bookmarkedCount: bookmarkedCol.count ?? 0,
      },
    };
  });

export const toggleCodeChallenge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ principleKey: z.string().min(1).max(60), done: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("mindset_code_progress").upsert(
      { user_id: context.userId, principle_key: data.principleKey, challenge_done: data.done },
      { onConflict: "user_id,principle_key" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addMistake = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    subject: subjectSchema,
    chapter: z.string().trim().min(1).max(160),
    category: mistakeCategorySchema,
    questionRef: z.string().trim().max(160).optional(),
    reason: z.string().trim().min(1).max(2000),
    shouldHaveDone: z.string().trim().min(1).max(2000),
    prevention: z.string().trim().min(1).max(2000),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("mindset_mistakes").insert({
      user_id: context.userId, subject: data.subject, chapter: data.chapter, category: data.category,
      question_ref: data.questionRef || null, reason: data.reason,
      should_have_done: data.shouldHaveDone, prevention: data.prevention,
    }).select("id").single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const setMistakeResolved = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid(), resolved: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("mindset_mistakes").update({ resolved: data.resolved }).eq("id", data.id).eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteMistake = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("mindset_mistakes").delete().eq("id", data.id).eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleOsItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ itemKey: z.string().min(1).max(60), done: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    const today = await userStudyDay(context.supabase, context.userId);
    const { data: row, error: readError } = await context.supabase.from("mindset_daily_os").select("done_items").eq("user_id", context.userId).eq("logged_on", today).maybeSingle();
    if (readError) throw new Error(readError.message);
    const current = (row?.done_items as string[] | null) ?? [];
    const doneItems = data.done ? Array.from(new Set([...current, data.itemKey])) : current.filter((k) => k !== data.itemKey);
    const { error } = await context.supabase.from("mindset_daily_os").upsert(
      { user_id: context.userId, logged_on: today, done_items: doneItems },
      { onConflict: "user_id,logged_on" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const startChallenge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const today = await userStudyDay(context.supabase, context.userId);
    const { error: closeError } = await context.supabase.from("mindset_challenge_runs").update({ active: false }).eq("user_id", context.userId).eq("active", true);
    if (closeError) throw new Error(closeError.message);
    const { data: run, error } = await context.supabase.from("mindset_challenge_runs").insert({
      user_id: context.userId, started_on: today, active: true, completed_days: [], reflections: {},
    }).select("id").single();
    if (error) throw new Error(error.message);
    return { id: run.id };
  });

export const toggleChallengeDay = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ runId: z.string().uuid(), day: z.number().int().min(1).max(7) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: run, error: readError } = await context.supabase.from("mindset_challenge_runs").select("completed_days,active").eq("id", data.runId).eq("user_id", context.userId).single();
    if (readError) throw new Error(readError.message);
    if (!run.active) throw new Error("This challenge run has ended");
    const days = new Set((run.completed_days as number[]) ?? []);
    if (days.has(data.day)) days.delete(data.day); else days.add(data.day);
    const completedDays = Array.from(days).sort((a, b) => a - b);
    const { error } = await context.supabase.from("mindset_challenge_runs").update({ completed_days: completedDays }).eq("id", data.runId).eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true, completedDays };
  });

export const saveReflection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ runId: z.string().uuid(), day: z.number().int().min(1).max(7), text: z.string().max(2000) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: run, error: readError } = await context.supabase.from("mindset_challenge_runs").select("reflections,active").eq("id", data.runId).eq("user_id", context.userId).single();
    if (readError) throw new Error(readError.message);
    if (!run.active) throw new Error("This challenge run has ended");
    const reflections = run.reflections && typeof run.reflections === "object" && !Array.isArray(run.reflections) ? run.reflections as Record<string, string> : {};
    const { error } = await context.supabase.from("mindset_challenge_runs").update({ reflections: { ...reflections, [String(data.day)]: data.text } }).eq("id", data.runId).eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveAssessment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ answers: z.array(z.number().int().min(1).max(5)).length(ASSESSMENT_QUESTIONS.length) }).parse(input))
  .handler(async ({ data, context }) => {
    const { score, report } = buildAssessmentReport(data.answers);
    const { data: row, error } = await context.supabase.from("mindset_assessments").insert({
      user_id: context.userId, answers: data.answers, score, report,
    }).select("*").single();
    if (error) throw new Error(error.message);
    return { assessment: row as MindsetAssessmentRow };
  });
