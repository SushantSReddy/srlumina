import { Link } from "@tanstack/react-router";
import { Home, BarChart3, Settings } from "lucide-react";

export function BottomNav() {
  const items = [
    { to: "/home" as const, label: "Home", Icon: Home },
    { to: "/analytics" as const, label: "Analytics", Icon: BarChart3 },
    { to: "/settings" as const, label: "Settings", Icon: Settings },
  ];
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 glass-strong border-t border-border pb-[max(env(safe-area-inset-bottom),8px)] pt-2"
    >
      <div className="mx-auto max-w-md grid grid-cols-3">
        {items.map(({ to, label, Icon }) => (
          <Link
            key={to} to={to}
            activeOptions={{ exact: true }}
            className="flex flex-col items-center justify-center gap-1 py-1.5 text-[10px] font-medium text-muted-foreground [&.active]:text-[var(--ios-blue)]"
            activeProps={{ className: "active" }}
          >
            <Icon className="h-6 w-6" strokeWidth={2} />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
