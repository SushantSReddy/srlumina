import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, CartesianGrid } from "recharts";
import { getAnalytics, getProfile, listSources, type Subject, type ExamLevel } from "@/lib/tracker.functions";
import { BottomNav } from "@/components/tracker/BottomNav";
import { TopHeader } from "@/components/tracker/TopHeader";
import { Footer } from "@/components/tracker/Footer";
import { MeshBackground } from "@/components/tracker/MeshBackground";

export const Route = createFileRoute("/_authenticated/analytics")({
  component: Analytics,
  head: () => ({ meta: [{ title: "Analytics — Reps" }] }),
});

const SUBJECT_COLORS: Record<string, string> = {
  physics: "var(--ios-blue)",
  chemistry: "var(--ios-mint)",
  math: "var(--ios-indigo)",
  biology: "var(--ios-green)",
};

function Analytics() {
  const getProfileFn = useServerFn(getProfile);
  const listSourcesFn = useServerFn(listSources);
  const getAnalyticsFn = useServerFn(getAnalytics);

  const [range, setRange] = useState<7 | 30 | 90>(7);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [level, setLevel] = useState<ExamLevel | null>(null);

  const profileQ = useQuery({ queryKey: ["profile"], queryFn: () => getProfileFn() });
  const sourcesQ = useQuery({ queryKey: ["sources"], queryFn: () => listSourcesFn() });
  const dataQ = useQuery({
    queryKey: ["analytics", range, subject, sourceId, level],
    queryFn: () => getAnalyticsFn({ data: { days: range, subject, source_id: sourceId, exam_level: level } }),
  });

  const stream = profileQ.data?.stream;
  const subjects: Subject[] = stream === "neet"
    ? ["physics", "chemistry", "biology"]
    : ["physics", "chemistry", "math"];

  const chartData = useMemo(
    () => (dataQ.data?.series ?? []).map((r) => ({
      day: new Date(r.date).toLocaleDateString(undefined, { weekday: "short", day: "numeric" }),
      count: r.count,
    })),
    [dataQ.data],
  );

  const levels: { id: ExamLevel; label: string }[] = stream === "jee"
    ? [{ id: "main", label: "Main" }, { id: "advanced", label: "Advanced" }]
    : [{ id: "section_a", label: "Section A" }, { id: "section_b", label: "Section B" }];

  return (
    <div className="min-h-dvh pb-28 relative">
      <MeshBackground />
      <TopHeader title="Analytics" subtitle="Trends across subjects and sources" />

      <div className="px-5 py-4">
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
          {([7, 30, 90] as const).map((n) => (
            <button key={n} onClick={() => setRange(n)}
              className={`rounded-lg py-2 text-sm font-medium ${range === n ? "bg-surface shadow-sm" : "text-muted-foreground"}`}>
              {n === 7 ? "Week" : n === 30 ? "Month" : "3 Months"}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <section className="px-4">
        <div className="glass rounded-3xl p-4">
          <div className="flex items-baseline justify-between mb-3 px-1">
            <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wide">Total</span>
            <span className="text-3xl font-bold tabular-nums">{dataQ.data?.total ?? 0}</span>
          </div>
          <div className="h-48 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="day" tickLine={false} axisLine={false}
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  interval={range === 7 ? 0 : "preserveStartEnd"} />
                <Tooltip
                  contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                  cursor={{ fill: "color-mix(in oklab, var(--ios-blue) 10%, transparent)" }}
                />
                <Bar dataKey="count" fill="var(--ios-blue)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="px-5 mt-5 space-y-3">
        <FilterRow label="Subject">
          <Chip active={subject === null} onClick={() => setSubject(null)}>All</Chip>
          {subjects.map((s) => (
            <Chip key={s} active={subject === s} onClick={() => setSubject(s)}
              color={SUBJECT_COLORS[s]}>
              {s[0].toUpperCase() + s.slice(1)}
            </Chip>
          ))}
        </FilterRow>

        <FilterRow label="Source">
          <Chip active={sourceId === null} onClick={() => setSourceId(null)}>All</Chip>
          {sourcesQ.data?.map((s) => (
            <Chip key={s.id} active={sourceId === s.id} onClick={() => setSourceId(s.id)}>
              {s.name}
            </Chip>
          ))}
        </FilterRow>

        <FilterRow label="Level">
          <Chip active={level === null} onClick={() => setLevel(null)}>All</Chip>
          {levels.map((l) => (
            <Chip key={l.id} active={level === l.id} onClick={() => setLevel(l.id)}>
              {l.label}
            </Chip>
          ))}
        </FilterRow>
      </section>

      {/* Subject breakdown */}
      {!subject && dataQ.data && (
        <section className="px-4 mt-5">
          <div className="glass rounded-3xl p-4 space-y-3">
            <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wide">By subject</span>
            {subjects.map((s) => {
              const v = dataQ.data.bySubject[s] ?? 0;
              const max = Math.max(...subjects.map((x) => dataQ.data.bySubject[x] ?? 0), 1);
              return (
                <div key={s}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize">{s}</span>
                    <span className="tabular-nums font-medium">{v}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${(v / max) * 100}%`, background: SUBJECT_COLORS[s] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <BottomNav />
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{label}</div>
      <div className="-mx-5 overflow-x-auto scrollbar-none">
        <div className="flex gap-2 px-5">{children}</div>
      </div>
    </div>
  );
}
function Chip({ active, onClick, children, color }: {
  active: boolean; onClick: () => void; children: React.ReactNode; color?: string;
}) {
  return (
    <button onClick={onClick}
      className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm border tap active:tap-active ${
        active ? "text-white border-transparent" : "bg-surface border-border text-foreground"
      }`}
      style={active ? { background: color ?? "var(--ios-blue)" } : undefined}
    >{children}</button>
  );
}
