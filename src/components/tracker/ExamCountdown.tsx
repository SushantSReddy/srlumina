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
    <div className="relative glass rounded-3xl px-5 py-4 spring-in">
      <div className="flex items-center gap-4">
        <div
          className="h-11 w-11 rounded-2xl flex items-center justify-center"
          style={{ background: "color-mix(in oklab, var(--ios-blue) 14%, transparent)" }}
        >
          <CalendarDays className="h-5 w-5 text-[var(--ios-blue)]" strokeWidth={2.2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {cls ? `${cls} · ` : ""}{label} {year}
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            {isDone ? (
              <span className="text-xl font-semibold text-[var(--ios-blue)]">
                Exam day — best of luck
              </span>
            ) : (
              <>
                <span className="text-4xl font-bold tabular-nums tracking-tight text-foreground">
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
