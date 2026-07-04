import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import {
  daysUntil,
  formatExamDate,
  getExamDate,
  getExamLabel,
  classLabel,
  type Stream,
} from "@/lib/exam-dates";

export function ExamCountdown({
  stream,
  year,
  classLevel,
}: {
  stream: Stream;
  year: number;
  classLevel?: string | null;
}) {
  // Compute on mount only to avoid SSR/CSR hydration drift.
  const [days, setDays] = useState<number | null>(null);
  useEffect(() => {
    const d = getExamDate(stream, year);
    setDays(daysUntil(d));
  }, [stream, year]);

  const date = getExamDate(stream, year);
  const label = getExamLabel(stream);
  const cls = classLabel(classLevel);
  const isDone = days === 0;

  return (
    <div className="relative liquid liquid-sheen glass-strong rounded-3xl px-5 py-4 overflow-hidden spring-in">
      {/* Refractive accent */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-1 opacity-60"
        style={{
          background:
            "radial-gradient(120% 60% at 0% 0%, color-mix(in oklab, var(--ios-blue) 35%, transparent), transparent 60%), radial-gradient(120% 60% at 100% 100%, color-mix(in oklab, var(--ios-indigo) 30%, transparent), transparent 60%)",
        }}
      />
      <div className="relative flex items-center gap-4">
        <div
          className="h-12 w-12 rounded-2xl flex items-center justify-center pop-in"
          style={{ background: "color-mix(in oklab, var(--ios-blue) 22%, transparent)" }}
        >
          <CalendarDays className="h-6 w-6 text-[var(--ios-blue)]" strokeWidth={2.2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {cls ? `${cls} · ` : ""}{label} {year}
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            {isDone ? (
              <span className="text-2xl font-bold shimmer-text">Exam day — best of luck!</span>
            ) : (
              <>
                <span className="text-4xl font-bold tabular-nums tracking-tight shimmer-text">
                  {days ?? "—"}
                </span>
                <span className="text-sm font-medium text-muted-foreground">
                  day{days === 1 ? "" : "s"} to go
                </span>
              </>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 truncate">
            {formatExamDate(date)}
          </div>
        </div>
      </div>
    </div>
  );
}
