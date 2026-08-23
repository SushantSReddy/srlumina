import { useEffect, useState } from "react";
import { Check } from "lucide-react";

type AppTheme = "default" | "claude";

const THEMES: { id: AppTheme; label: string; hint: string; swatch: string[] }[] = [
  {
    id: "default",
    label: "Default",
    hint: "Clean iOS-style glass",
    swatch: ["oklch(0.97 0.003 260)", "oklch(0.62 0.19 254)", "oklch(0.15 0.01 260)"],
  },
  {
    id: "claude",
    label: "Claude",
    hint: "Warm paper & clay",
    swatch: ["oklch(0.968 0.011 84)", "oklch(0.63 0.13 44)", "oklch(0.24 0.012 60)"],
  },
];

export function applyAppTheme(theme: AppTheme) {
  document.documentElement.classList.toggle("theme-claude", theme === "claude");
}

export function ThemePicker() {
  const [theme, setTheme] = useState<AppTheme>("default");

  useEffect(() => {
    const stored = localStorage.getItem("app-theme");
    setTheme(stored === "claude" ? "claude" : "default");
  }, []);

  const pick = (next: AppTheme) => {
    setTheme(next);
    localStorage.setItem("app-theme", next);
    applyAppTheme(next);
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {THEMES.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => pick(t.id)}
          className={`rounded-xl border p-3 text-left tap active:tap-active transition-colors ${
            theme === t.id
              ? "border-[var(--ios-blue)] bg-secondary"
              : "border-border bg-surface"
          }`}
        >
          <div className="flex items-center gap-1.5 mb-2">
            {t.swatch.map((c) => (
              <span
                key={c}
                className="h-5 w-5 rounded-full border border-border"
                style={{ background: c }}
              />
            ))}
            {theme === t.id && <Check className="h-4 w-4 ml-auto text-[var(--ios-blue)]" />}
          </div>
          <div className="text-sm font-semibold">{t.label}</div>
          <div className="text-xs text-muted-foreground">{t.hint}</div>
        </button>
      ))}
    </div>
  );
}
