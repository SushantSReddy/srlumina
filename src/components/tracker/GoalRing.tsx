import { useEffect, useState } from "react";

export function GoalRing({ value, goal, size = 200 }: { value: number; goal: number; size?: number }) {
  const pct = Math.min(1, goal > 0 ? value / goal : 0);
  const stroke = 16;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const hit = value >= goal && goal > 0;

  // Count-up on mount
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const from = 0;
    const to = value;
    const dur = 800;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Blob halo behind */}
      <div
        aria-hidden
        className="absolute inset-2 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, color-mix(in oklab, var(--ios-blue) 45%, transparent), transparent 65%)",
          filter: "blur(24px)",
          animation: hit ? "ringHalo 2.2s ease-in-out infinite" : "ringHalo 4s ease-in-out infinite",
        }}
      />
      <svg width={size} height={size} className="rotate-[-90deg] relative">
        <defs>
          <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--ios-blue)" />
            <stop offset="100%" stopColor="var(--ios-indigo)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke}
          className="fill-none stroke-muted" />
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} strokeLinecap="round"
          fill="none" stroke="url(#ring-grad)"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.2,0.8,0.2,1)" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-bold tabular-nums tracking-tight">{display}</span>
        <span className="text-xs text-muted-foreground mt-0.5">of {goal} today</span>
      </div>
    </div>
  );
}
