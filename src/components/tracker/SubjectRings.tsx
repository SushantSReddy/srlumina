import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import type { SubjectMeta } from "@/components/tracker/LogSheet";

export function SubjectRings({
  subjects,
  totals,
  perSubjectGoal,
  onPick,
  onReset,
  resettingId,
}: {
  subjects: SubjectMeta[];
  totals: Record<string, number>;
  perSubjectGoal: number;
  onPick: (s: SubjectMeta) => void;
  onReset?: (s: SubjectMeta) => void;
  resettingId?: string | null;
}) {
  return (
    <div className="grid grid-cols-3 gap-3 px-4">
      {subjects.map((s, i) => {
        const value = totals[s.id] ?? 0;
        return (
          <div
            key={s.id}
            className="relative glass rounded-3xl p-4 flex flex-col items-center gap-2 spring-in"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            {onReset && value > 0 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onReset(s); }}
                disabled={resettingId === s.id}
                aria-label={`Reset ${s.label}`}
                className="absolute top-2 right-2 h-6 w-6 rounded-full flex items-center justify-center bg-foreground/[0.06] hover:bg-foreground/[0.12] text-muted-foreground hover:text-foreground tap active:tap-active disabled:opacity-40"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
            )}
            <button
              type="button"
              onClick={() => onPick(s)}
              className="flex flex-col items-center gap-2 tap active:tap-active"
            >
              <Ring value={value} goal={perSubjectGoal} color={s.color} id={`ring-${s.id}`} />
              <div className="text-center">
                <div className="text-[13px] font-semibold leading-tight">{s.label}</div>
                <div className="text-[11px] text-muted-foreground tabular-nums">
                  {value} / {perSubjectGoal}
                </div>
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
}

function Ring({
  value,
  goal,
  color,
  id,
  size = 84,
}: {
  value: number;
  goal: number;
  color: string;
  id: string;
  size?: number;
}) {
  const pct = Math.min(1, goal > 0 ? value / goal : 0);
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const dur = 700;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          fill="none"
          stroke="color-mix(in oklab, currentColor 10%, transparent)"
          className="text-foreground"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          stroke={color}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.2,0.8,0.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold tabular-nums tracking-tight" style={{ color }}>
          {display}
        </span>
      </div>
    </div>
  );
}
