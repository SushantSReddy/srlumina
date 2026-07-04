import { useEffect, useState } from "react";
import type { SubjectMeta } from "@/components/tracker/LogSheet";

export function SubjectRings({
  subjects,
  totals,
  perSubjectGoal,
  onPick,
}: {
  subjects: SubjectMeta[];
  totals: Record<string, number>;
  perSubjectGoal: number;
  onPick: (s: SubjectMeta) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-3 px-4">
      {subjects.map((s, i) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onPick(s)}
          className="glass rounded-3xl p-4 flex flex-col items-center gap-2 tap active:tap-active spring-in"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <Ring
            value={totals[s.id] ?? 0}
            goal={perSubjectGoal}
            color={s.color}
            id={`ring-${s.id}`}
          />
          <div className="text-center">
            <div className="text-[13px] font-semibold leading-tight">{s.label}</div>
            <div className="text-[11px] text-muted-foreground tabular-nums">
              {totals[s.id] ?? 0} / {perSubjectGoal}
            </div>
          </div>
        </button>
      ))}
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
