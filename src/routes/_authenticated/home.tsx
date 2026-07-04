import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Flame, Plus } from "lucide-react";
import { getProfile, getStreak, getTodaySummary } from "@/lib/tracker.functions";
import { BottomNav } from "@/components/tracker/BottomNav";
import { GoalRing } from "@/components/tracker/GoalRing";
import { LogSheet, type SubjectMeta } from "@/components/tracker/LogSheet";
import { ExamCountdown } from "@/components/tracker/ExamCountdown";
import { MeshBackground } from "@/components/tracker/MeshBackground";
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
  const getStreakFn = useServerFn(getStreak);

  const profileQ = useQuery({ queryKey: ["profile"], queryFn: () => getProfileFn() });
  const todayQ = useQuery({ queryKey: ["today"], queryFn: () => getTodayFn() });
  const streakQ = useQuery({ queryKey: ["streak"], queryFn: () => getStreakFn() });

  useEffect(() => {
    if (profileQ.data && (!profileQ.data.stream || !profileQ.data.class_level || !profileQ.data.target_year)) {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [profileQ.data, navigate]);

  const [active, setActive] = useState<SubjectMeta | null>(null);

  const subjects = profileQ.data?.stream === "neet" ? NEET_SUBJECTS : JEE_SUBJECTS;
  const goal = profileQ.data?.daily_goal ?? 50;
  const total = todayQ.data?.total ?? 0;
  const streak = streakQ.data?.streak ?? 0;
  const name = profileQ.data?.display_name?.split(" ")[0];
  const stream = (profileQ.data?.stream as Stream | null) ?? null;
  const year = profileQ.data?.target_year ?? null;

  const now = new Date();
  const greet = now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="min-h-dvh pb-28 relative">
      <MeshBackground />

      {/* Header */}
      <header className="px-5 pt-[max(env(safe-area-inset-top),20px)] pb-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{greet}{name ? "," : ""}</p>
          <h1 className="text-2xl font-bold tracking-tight">{name ?? "Today"}</h1>
        </div>
        <div className="glass liquid rounded-full px-3 py-1.5 flex items-center gap-1.5 text-sm font-semibold">
          <Flame className="h-4 w-4 text-[var(--ios-orange)] flame-flicker" fill="currentColor" />
          <span className="tabular-nums">{streak}</span>
        </div>
      </header>

      {/* Exam countdown */}
      {stream && year && (
        <section className="px-4">
          <ExamCountdown stream={stream} year={year} classLevel={profileQ.data?.class_level} />
        </section>
      )}

      {/* Goal ring */}
      <section className="px-5 flex flex-col items-center py-6 spring-in">
        <GoalRing value={total} goal={goal} />
        <p className="mt-4 text-sm text-muted-foreground">
          {total >= goal
            ? "Goal hit. Keep going."
            : `${goal - total} to reach today's goal`}
        </p>
      </section>

      {/* Subjects */}
      <section className="px-4 space-y-3">
        {subjects.map((s, i) => {
          const count = (todayQ.data?.totals[s.id] as number | undefined) ?? 0;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setActive(s)}
              className="w-full glass liquid rounded-3xl p-5 flex items-center gap-4 tap active:tap-active text-left spring-in"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div className="h-12 w-12 rounded-2xl flex items-center justify-center"
                style={{ background: `color-mix(in oklab, ${s.color} 20%, transparent)` }}>
                <span className="text-lg font-bold" style={{ color: s.color }}>{s.label[0]}</span>
              </div>
              <div className="flex-1">
                <div className="text-base font-semibold">{s.label}</div>
                <div className="text-xs text-muted-foreground">
                  {count === 0 ? "No questions yet" : `${count} question${count === 1 ? "" : "s"} today`}
                </div>
              </div>
              <div className="h-10 w-10 rounded-full flex items-center justify-center text-white shadow-lg"
                style={{ background: s.color, boxShadow: `0 6px 16px -4px color-mix(in oklab, ${s.color} 60%, transparent)` }}>
                <Plus className="h-5 w-5" strokeWidth={2.5} />
              </div>
            </button>
          );
        })}
      </section>

      <LogSheet
        open={!!active}
        onClose={() => setActive(null)}
        subject={active}
        stream={stream}
      />

      <BottomNav />
    </div>
  );
}
