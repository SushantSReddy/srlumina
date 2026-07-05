import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Flame } from "lucide-react";
import { getProfile, getStreak } from "@/lib/tracker.functions";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

export function TopHeader({
  title,
  subtitle,
}: {
  title?: string;
  subtitle?: string;
}) {
  const getProfileFn = useServerFn(getProfile);
  const getStreakFn = useServerFn(getStreak);
  const profileQ = useQuery({ queryKey: ["profile"], queryFn: () => getProfileFn() });
  const streakQ = useQuery({ queryKey: ["streak"], queryFn: () => getStreakFn() });

  const name = profileQ.data?.display_name?.split(" ")[0];
  const streak = streakQ.data?.streak ?? 0;

  const now = new Date();
  const greet =
    now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening";

  const resolvedTitle = title ?? name ?? "Today";
  const resolvedSub = subtitle ?? `${greet}${name ? "," : ""}`;

  return (
    <header className="sticky top-0 z-40 px-5 pt-[max(env(safe-area-inset-top),20px)] pb-4 flex items-center justify-between gap-3 glass-strong">
      <div className="flex items-center gap-3 min-w-0">
        <Logo size={36} />
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{resolvedSub}</p>
          <h1 className="text-2xl font-bold tracking-tight truncate">{resolvedTitle}</h1>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="glass rounded-full px-3 py-1.5 flex items-center gap-1.5 text-sm font-semibold">
          <Flame className="h-4 w-4 text-[var(--ios-orange)] flame-flicker" fill="currentColor" />
          <span className="tabular-nums">{streak}</span>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
