import { Link } from "@tanstack/react-router";
import { Home, BarChart3, Settings, CheckCircle2 } from "lucide-react";

export function BottomNav() {
  const items = [
    { to: "/home" as const, label: "Home", Icon: Home },
    { to: "/tasks" as const, label: "Tasks", Icon: CheckCircle2 },
    { to: "/analytics" as const, label: "Analytics", Icon: BarChart3 },
    { to: "/settings" as const, label: "Settings", Icon: Settings },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none pb-[max(env(safe-area-inset-bottom),10px)] px-4">
      <div className="mx-auto max-w-md glass-strong liquid rounded-full grid grid-cols-4 p-1.5 pointer-events-auto">
        {items.map(({ to, label, Icon }) => (
          <Link
            key={to} to={to}
            activeOptions={{ exact: true }}
            className="group relative flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium text-muted-foreground rounded-full tap active:tap-active transition-colors [&.active]:text-[var(--ios-blue)]"
            activeProps={{ className: "active" }}
          >
            <span
              aria-hidden
              className="absolute inset-1 rounded-full opacity-0 group-[.active]:opacity-100 transition-opacity"
              style={{ background: "color-mix(in oklab, var(--ios-blue) 15%, transparent)" }}
            />
            <Icon className="relative h-5 w-5 transition-transform group-[.active]:scale-110" strokeWidth={2.2} />
            <span className="relative">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
