import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { validTimeZone } from "./study-day";

export const pyqFilters = z.object({
  exam: z.enum(["jee_main", "jee_advanced", "neet"]),
  subject: z.enum(["physics", "chemistry", "math", "biology"]).optional(),
  chapter: z.string().uuid().optional(),
  year: z.number().int().min(1980).max(2100).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
});
export type PyqFilters = z.infer<typeof pyqFilters>;
export type PyqQuestion = Database["public"]["Tables"]["pyq_questions"]["Row"];
export type PyqSession = Database["public"]["Tables"]["pyq_sessions"]["Row"];
export const solutionSchema = z.object({ answer: z.union([z.string(), z.number(), z.array(z.string())]), explanation: z.string(), steps: z.array(z.string()) });
export type PyqSolution = z.infer<typeof solutionSchema>;
export const resultSchema = z.object({ correct: z.boolean(), counted: z.boolean(), attempt_id: z.string(), solution: solutionSchema });
export type PyqResult = z.infer<typeof resultSchema>;

export const pyqBootstrap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ timeZone: z.string().max(100).refine(validTimeZone) }).parse(input))
  .handler(async ({ data, context }) => {
    const { error: timezoneError } = await context.supabase.from("profiles").update({ study_timezone: data.timeZone }).eq("id", context.userId);
    if (timezoneError) throw new Error(timezoneError.message);
    const [{ data: chapters, error }, { data: sessions, error: sessionError }] = await Promise.all([
      context.supabase.from("pyq_chapters").select("id,name,subject").order("name"),
      context.supabase.from("pyq_sessions").select("*").eq("user_id", context.userId).eq("finished", false).order("updated_at", { ascending: false }).limit(10),
    ]);
    if (error || sessionError) throw new Error(error?.message ?? sessionError?.message);
    return { chapters: chapters ?? [], sessions: sessions ?? [] };
  });

export const browsePyq = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => pyqFilters.extend({ page: z.number().int().min(0).max(10000).default(0) }).parse(input))
  .handler(async ({ data, context }) => {
    let query = context.supabase.from("pyq_questions").select("id,exam,year,chapter_id,difficulty,question_type,source_label,source_question", { count: "exact" }).eq("exam", data.exam).eq("verified", true);
    if (data.subject) {
      const { data: chapters, error } = await context.supabase.from("pyq_chapters").select("id").eq("subject", data.subject);
      if (error) throw new Error(error.message);
      if (!chapters?.length) return { questions: [], total: 0 };
      query = query.in("chapter_id", chapters.map((c) => c.id));
    }
    if (data.chapter) query = query.eq("chapter_id", data.chapter);
    if (data.year) query = query.eq("year", data.year);
    if (data.difficulty) query = query.eq("difficulty", data.difficulty);
    const { data: questions, error, count } = await query.order("year", { ascending: false }).order("id").range(data.page * 50, data.page * 50 + 49);
    if (error) throw new Error(error.message);
    return { questions: questions ?? [], total: count ?? 0 };
  });

export const startPyq = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => pyqFilters.parse(input))
  .handler(async ({ data, context }) => {
    const { data: id, error } = await context.supabase.rpc("start_pyq_session", {
      _exam: data.exam, _subject: data.subject, _chapter: data.chapter, _year: data.year, _difficulty: data.difficulty,
    });
    if (error) throw new Error(error.message);
    return { id };
  });

export const getPyqSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: session, error } = await context.supabase.from("pyq_sessions").select("*").eq("id", data.id).eq("user_id", context.userId).single();
    if (error) throw new Error(error.message);
    const [{ data: questions, error: qErr }, { data: attempts, error: aErr }, { data: collections, error: cErr }] = await Promise.all([
      context.supabase.from("pyq_questions").select("*").in("id", session.question_ids).eq("verified", true),
      context.supabase.from("pyq_attempts").select("id,question_id,answer,correct,counted,created_at").eq("session_id", session.id).eq("user_id", context.userId).order("created_at", { ascending: false }).limit(100),
      context.supabase.from("pyq_collections").select("question_id,bookmarked,incorrect").eq("user_id", context.userId).in("question_id", session.question_ids),
    ]);
    if (qErr || aErr || cErr) throw new Error(qErr?.message ?? aErr?.message ?? cErr?.message);
    return { session, questions: questions ?? [], attempts: attempts ?? [], collections: collections ?? [] };
  });

export const savePyqSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid(), index: z.number().int().min(0).max(99), questionId: z.string().uuid(), answer: z.union([z.string().max(200), z.array(z.string().max(30)).max(20)]), finished: z.boolean().default(false) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: session, error } = await context.supabase.from("pyq_sessions").select("question_ids,drafts").eq("id", data.id).eq("user_id", context.userId).single();
    if (error) throw new Error(error.message);
    if (!session.question_ids.includes(data.questionId) || data.index >= session.question_ids.length) throw new Error("Invalid session question");
    const drafts = session.drafts && typeof session.drafts === "object" && !Array.isArray(session.drafts) ? session.drafts : {};
    const { error: saveError } = await context.supabase.from("pyq_sessions").update({ current_index: data.index, drafts: { ...drafts, [data.questionId]: data.answer }, finished: data.finished, updated_at: new Date().toISOString() }).eq("id", data.id).eq("user_id", context.userId);
    if (saveError) throw new Error(saveError.message);
    return { ok: true };
  });

export const submitPyq = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ requestId: z.string().uuid(), sessionId: z.string().uuid(), questionId: z.string().uuid(), answer: z.union([z.string().max(200), z.array(z.string().max(30)).max(20)]) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: result, error } = await context.supabase.rpc("submit_pyq_attempt", { _request: data.requestId, _session: data.sessionId, _question: data.questionId, _answer: data.answer });
    if (error) throw new Error(error.message);
    return resultSchema.parse(result);
  });

export const revealPyq = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ questionId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: solution, error } = await context.supabase.rpc("pyq_solution", { _question: data.questionId });
    if (error) throw new Error(error.message);
    return solutionSchema.parse(solution);
  });

export const bookmarkPyq = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ questionId: z.string().uuid(), bookmarked: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("pyq_collections").upsert({ user_id: context.userId, question_id: data.questionId, bookmarked: data.bookmarked }, { onConflict: "user_id,question_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const revisionFilters = z.object({
  collection: z.enum(["all", "bookmarked", "incorrect"]).default("all"),
  exam: pyqFilters.shape.exam.optional(), subject: pyqFilters.shape.subject,
  chapter: pyqFilters.shape.chapter, page: z.number().int().min(0).max(10000).default(0),
});
export type RevisionFilters = z.infer<typeof revisionFilters>;
export const browseRevision = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => revisionFilters.parse(input))
  .handler(async ({ data, context }) => {
    let query = context.supabase.from("pyq_collections")
      .select("question_id,bookmarked,incorrect,updated_at,question:pyq_questions!inner(id,exam,year,chapter_id,difficulty,source_question,source_label,chapter:pyq_chapters!inner(id,name,subject))", { count: "exact" })
      .eq("user_id", context.userId).eq("question.verified", true);
    if (data.collection === "all") query = query.or("bookmarked.eq.true,incorrect.eq.true");
    else query = query.eq(data.collection, true);
    if (data.exam) query = query.eq("question.exam", data.exam);
    if (data.subject) query = query.eq("question.chapter.subject", data.subject);
    if (data.chapter) query = query.eq("question.chapter_id", data.chapter);
    const { data: questions, error, count } = await query.order("updated_at", { ascending: false }).order("question_id").range(data.page * 50, data.page * 50 + 49);
    if (error) throw new Error(error.message);
    return { questions: questions ?? [], total: count ?? 0 };
  });
export const startRevision = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ questionIds: z.array(z.string().uuid()).min(1).max(100), collection: revisionFilters.shape.collection }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: id, error } = await context.supabase.rpc("start_pyq_revision", { _questions: data.questionIds, _collection: data.collection });
    if (error) throw new Error(error.message);
    return { id };
  });
