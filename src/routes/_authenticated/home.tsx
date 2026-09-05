import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, RotateCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { getProfile, getTodaySummary, resetToday } from "@/lib/tracker.functions";
import { BottomNav } from "@/components/tracker/BottomNav";
import { SubjectRings } from "@/components/tracker/SubjectRings";
import { DailyQuote } from "@/components/tracker/DailyQuote";

import { LogSheet, type SubjectMeta } from "@/components/tracker/LogSheet";
import { ExamCountdown } from "@/components/tracker/ExamCountdown";
import { MeshBackground } from "@/components/tracker/MeshBackground";
import { Footer } from "@/components/tracker/Footer";
import { TopHeader } from "@/components/tracker/TopHeader";
import { TodayTasksCard } from "@/components/tracker/tasks/TodayTasksCard";
import {
  DreamCollegeBanner,
  DreamCollegeShowcase,
} from "@/components/tracker/DreamCollege";
import type { Stream } from "@/lib/exam-dates";

export const Route = createFileRoute("/_authenticated/home")({
  component: Home,
  head: () => ({ meta: [{ title: "Today — Reps" }] }),
});

const JEE_SUBJECTS: SubjectMeta[] = [
  { id: "physics", label: "Physics", color: "var(--ios-blue)" },
  { id: "chemistry", label: "Chemistry", color: "var(--ios-mint)" },
  { id: "math", label: "Math", color: "var(--ios-indigo)" },
];
const NEET_SUBJECTS: SubjectMeta[] = [
  { id: "physics", label: "Physics", color: "var(--ios-blue)" },
  { id: "chemistry", label: "Chemistry", color: "var(--ios-mint)" },
  { id: "biology", label: "Biology", color: "var(--ios-green)" },
];

function Home() {
  const navigate = useNavigate();
  const getProfileFn = useServerFn(getProfile);
  const getTodayFn = useServerFn(getTodaySummary);

  const profileQ = useQuery({ queryKey: ["profile"], queryFn: () => getProfileFn() });
  const todayQ = useQuery({ queryKey: ["today"], queryFn: () => getTodayFn() });
  const qc = useQueryClient();
  const resetFn = useServerFn(resetToday);
  const resetMut = useMutation({
    mutationFn: (subject: SubjectMeta["id"] | null) =>
      resetFn({ data: { subject: subject ?? null } }),
    onSuccess: (_d, subject) => {
      toast.success(subject ? `${subject} cleared for today` : "Today's log cleared");
      qc.invalidateQueries({ queryKey: ["today"] });
      qc.invalidateQueries({ queryKey: ["streak"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't reset"),
  });
  function handleReset() {
    if (window.confirm("Reset all questions logged today? This cannot be undone.")) {
      resetMut.mutate(null);
    }
  }
  function handleResetSubject(s: SubjectMeta) {
    if (window.confirm(`Reset today's ${s.label} count?`)) {
      resetMut.mutate(s.id);
    }
  }

  useEffect(() => {
    if (profileQ.data && (!profileQ.data.stream || !profileQ.data.class_level || !profileQ.data.target_year)) {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [profileQ.data, navigate]);

  const [active, setActive] = useState<SubjectMeta | null>(null);

  const subjects = profileQ.data?.stream === "neet" ? NEET_SUBJECTS : JEE_SUBJECTS;

  // Home-screen shortcut deep link: /home?log=physics
  useEffect(() => {
    if (typeof window === "undefined" || !profileQ.data) return;
    const want = new URLSearchParams(window.location.search).get("log");
    if (!want) return;
    const match = subjects.find((s) => s.id === want);
    if (match) setActive(match);
    window.history.replaceState({}, "", window.location.pathname);
  }, [profileQ.data, subjects]);

  const goal = profileQ.data?.daily_goal ?? 50;
  const total = todayQ.data?.total ?? 0;
  const stream = (profileQ.data?.stream as Stream | null) ?? null;
  const year = profileQ.data?.target_year ?? null;

  return (
    <div className="min-h-dvh pb-28 relative">
      <MeshBackground />

      <TopHeader />

      {/* Exam countdown */}
      {stream && year && (
        <section className="px-4">
          <ExamCountdown stream={stream} year={year} classLevel={profileQ.data?.class_level} />
        </section>
      )}

      {/* Per-subject rings */}
      <section className="pt-6">
        <SubjectRings
          subjects={subjects}
          totals={(todayQ.data?.totals as Record<string, number>) ?? {}}
          perSubjectGoal={Math.max(1, Math.ceil(goal / subjects.length))}
          onPick={setActive}
          onReset={handleResetSubject}
          resettingId={resetMut.isPending ? (resetMut.variables ?? null) : null}
        />
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {total >= goal
            ? "Daily goal hit — keep going."
            : `${total} of ${goal} today · ${goal - total} to go`}
        </p>
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={handleReset}
            disabled={resetMut.isPending || total === 0}
            className="glass rounded-full px-4 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-1.5 tap active:tap-active disabled:opacity-40"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {resetMut.isPending ? "Resetting…" : "Reset today"}
          </button>
        </div>
      </section>

      {/* Today's tasks */}
      <section className="px-4 mt-6">
        <TodayTasksCard />
      </section>

      {/* Daily quote */}
      <section className="px-4 mt-6">
        <DailyQuote />
      </section>

      {/* Log CTAs */}
      <section className="px-4 mt-4 space-y-2.5">
        {subjects.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActive(s)}
            className="w-full glass rounded-2xl px-4 py-3 flex items-center gap-3 tap active:tap-active text-left spring-in"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
            <span className="flex-1 text-sm font-medium">Log {s.label}</span>
            <span
              className="h-8 w-8 rounded-full flex items-center justify-center text-white"
              style={{ background: s.color }}
            >
              <Plus className="h-4 w-4" strokeWidth={2.6} />
            </span>
          </button>
        ))}
      </section>

      {/* Dream board */}
      <section className="px-4 mt-4">
        <Link
          to="/dreams"
          className="w-full glass rounded-2xl px-4 py-3.5 flex items-center gap-3 tap active:tap-active spring-in"
          style={{ animationDelay: "200ms" }}
        >
          <span className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center">
            <Sparkles className="h-4.5 w-4.5 text-primary" />
          </span>
          <span className="flex-1 text-left">
            <span className="block text-sm font-semibold">Dream Board</span>
            <span className="block text-xs text-muted-foreground">
              Pin your dream college & goals
            </span>
          </span>
          <span className="text-muted-foreground text-lg leading-none">›</span>
        </Link>
      </section>

      <LogSheet
        open={!!active}
        onClose={() => setActive(null)}
        subject={active}
        stream={stream}
      />

      <Footer className="mt-8" />
      <BottomNav />
    </div>
  );
}
