import { useState } from "react";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronDown, CircleCheck, Circle, ArrowDown, ArrowUp } from "lucide-react";
import { toast } from "sonner";
import { mindsetOptions } from "@/lib/mindset.queries";
import { toggleCodeChallenge } from "@/lib/mindset.functions";
import { PRINCIPLES } from "@/lib/mindset/content";

export function TopperCode() {
  const { data, refetch } = useSuspenseQuery(mindsetOptions());
  const [openKey, setOpenKey] = useState<string | null>(null);
  const toggle = useServerFn(toggleCodeChallenge);
  const toggleMut = useMutation({
    mutationFn: (input: { principleKey: string; done: boolean }) => toggle({ data: input }),
    onSuccess: () => refetch(),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't save"),
  });
  const doneKeys = new Set(data.code.filter((c) => c.challenge_done).map((c) => c.principle_key));

  return (
    <div className="space-y-3">
      <p className="px-1 text-sm text-muted-foreground">Eight principles that separate toppers from the average grind. Take the challenge on each one.</p>
      {PRINCIPLES.map((p) => {
        const open = openKey === p.key;
        const done = doneKeys.has(p.key);
        return (
          <article key={p.key} className="glass overflow-hidden rounded-2xl">
            <button
              type="button"
              className="flex w-full items-center gap-3 p-4 text-left"
              onClick={() => setOpenKey(open ? null : p.key)}
              aria-expanded={open}
            >
              <span className="flex-1 font-semibold">{p.title}</span>
              {done && <CircleCheck className="h-5 w-5 shrink-0 text-primary" />}
              <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
              <div className="space-y-3 px-4 pb-4 text-sm">
                <p className="text-muted-foreground">{p.meaning}</p>
                <div className="rounded-xl border border-border bg-background/40 p-3">
                  <p className="flex items-start gap-2"><ArrowDown className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" /><span className="text-muted-foreground">{p.average}</span></p>
                  <p className="mt-2 flex items-start gap-2"><ArrowUp className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{p.topper}</span></p>
                </div>
                <p><span className="font-medium">Example · </span><span className="text-muted-foreground">{p.example}</span></p>
                <p className="rounded-xl bg-primary/10 p-3"><span className="font-medium">Today · </span>{p.today}</p>
                <div className="rounded-xl border border-border p-3">
                  <p className="font-medium">The challenge</p>
                  <p className="mt-1 text-muted-foreground">{p.challenge}</p>
                  <button
                    type="button"
                    disabled={toggleMut.isPending}
                    onClick={() => toggleMut.mutate({ principleKey: p.key, done: !done })}
                    className="mt-3 flex items-center gap-2 text-sm font-medium tap active:tap-active"
                  >
                    {done ? <CircleCheck className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                    {done ? "Challenge completed" : "Mark challenge complete"}
                  </button>
                </div>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
