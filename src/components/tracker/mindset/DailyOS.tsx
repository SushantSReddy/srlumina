import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Circle } from "lucide-react";
import { toast } from "sonner";
import { mindsetOptions } from "@/lib/mindset.queries";
import { toggleOsItem } from "@/lib/mindset.functions";
import { DAILY_OS_ITEMS } from "@/lib/mindset/content";

function dayLabel(loggedOn: string): string {
  const date = new Date(`${loggedOn}T12:00:00Z`);
  return date.toLocaleDateString("en", { weekday: "short", timeZone: "UTC" });
}

export function DailyOS() {
  const { data, refetch } = useSuspenseQuery(mindsetOptions());
  const doneSet = new Set(data.osToday);
  const toggle = useServerFn(toggleOsItem);
  const mut = useMutation({
    mutationFn: (input: { itemKey: string; done: boolean }) => toggle({ data: input }),
    onSuccess: () => refetch(),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't save"),
  });
  const doneCount = doneSet.size;
  const maxCount = Math.max(1, ...data.osWeek.map((d) => d.count));

  return (
    <div className="space-y-5">
      <section className="glass rounded-3xl p-5">
        <div className="flex items-baseline justify-between">
          <h3 className="font-semibold">Today's operating system</h3>
          <span className="text-sm font-semibold text-primary">{doneCount}/{DAILY_OS_ITEMS.length}</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(doneCount / DAILY_OS_ITEMS.length) * 100}%` }} />
        </div>
        <ul className="mt-4 space-y-1.5">
          {DAILY_OS_ITEMS.map((item) => {
            const done = doneSet.has(item.key);
            return (
              <li key={item.key}>
                <button
                  type="button"
                  disabled={mut.isPending}
                  onClick={() => mut.mutate({ itemKey: item.key, done: !done })}
                  className="flex w-full items-start gap-3 rounded-xl p-2 text-left tap active:tap-active"
                  aria-pressed={done}
                >
                  {done ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" /> : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />}
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm font-medium ${done ? "line-through opacity-70" : ""}`}>{item.label}</span>
                    <span className="block text-xs text-muted-foreground">{item.hint}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="glass rounded-3xl p-5">
        <h3 className="font-semibold">Last 7 days</h3>
        <div className="mt-4 flex h-28 items-end justify-between gap-2" role="img" aria-label="Daily OS completion over the last 7 days">
          {data.osWeek.map((d) => (
            <div key={d.logged_on} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex h-full w-full max-w-8 items-end">
                <div
                  className={`w-full rounded-t-md ${d.logged_on === data.today ? "bg-primary" : "bg-primary/40"}`}
                  style={{ height: `${Math.max(d.count ? 8 : 2, (d.count / maxCount) * 100)}%` }}
                  title={`${d.count} of ${DAILY_OS_ITEMS.length}`}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">{dayLabel(d.logged_on)}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Each bar is how many of the 8 habits you completed that day.</p>
      </section>
    </div>
  );
}
