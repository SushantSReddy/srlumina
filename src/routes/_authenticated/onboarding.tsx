import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { getProfile, updateProfile } from "@/lib/tracker.functions";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: Onboarding,
  head: () => ({ meta: [{ title: "Choose your stream — Reps" }] }),
});

function Onboarding() {
  const navigate = useNavigate();
  const getProfileFn = useServerFn(getProfile);
  const updateFn = useServerFn(updateProfile);
  const [choice, setChoice] = useState<"jee" | "neet" | null>(null);

  const profileQ = useQuery({ queryKey: ["profile"], queryFn: () => getProfileFn() });

  useEffect(() => {
    if (profileQ.data?.stream) navigate({ to: "/home", replace: true });
  }, [profileQ.data, navigate]);

  const mut = useMutation({
    mutationFn: (stream: "jee" | "neet") => updateFn({ data: { stream } }),
    onSuccess: () => navigate({ to: "/home", replace: true }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't save"),
  });

  return (
    <div className="min-h-dvh px-6 py-12 flex flex-col">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Welcome</h1>
        <p className="mt-2 text-muted-foreground text-sm">Which exam are you preparing for?</p>
      </div>

      <div className="space-y-3 max-w-sm w-full mx-auto flex-1">
        <StreamCard
          selected={choice === "jee"}
          onSelect={() => setChoice("jee")}
          title="JEE"
          subtitle="Physics · Chemistry · Mathematics"
          accent="var(--ios-indigo)"
        />
        <StreamCard
          selected={choice === "neet"}
          onSelect={() => setChoice("neet")}
          title="NEET"
          subtitle="Physics · Chemistry · Biology"
          accent="var(--ios-green)"
        />
      </div>

      <div className="max-w-sm w-full mx-auto pb-[max(env(safe-area-inset-bottom),16px)]">
        <button
          disabled={!choice || mut.isPending}
          onClick={() => choice && mut.mutate(choice)}
          className="w-full rounded-2xl bg-[var(--ios-blue)] py-4 text-base font-semibold text-white tap active:tap-active disabled:opacity-40"
        >
          {mut.isPending ? "Saving…" : "Continue"}
        </button>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          You can change this later in Settings.
        </p>
      </div>
    </div>
  );
}

function StreamCard({ selected, onSelect, title, subtitle, accent }: {
  selected: boolean; onSelect: () => void; title: string; subtitle: string; accent: string;
}) {
  return (
    <button
      type="button" onClick={onSelect}
      className={`w-full text-left rounded-3xl p-5 border-2 tap active:tap-active transition-colors ${
        selected ? "bg-surface" : "bg-surface border-border"
      }`}
      style={selected ? { borderColor: accent } : undefined}
    >
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg"
          style={{ background: accent }}>{title[0]}</div>
        <div className="flex-1">
          <div className="text-lg font-semibold">{title}</div>
          <div className="text-xs text-muted-foreground">{subtitle}</div>
        </div>
        <div className={`h-6 w-6 rounded-full border-2 ${selected ? "bg-[var(--ios-blue)] border-[var(--ios-blue)]" : "border-border"}`}>
          {selected && <span className="block h-full w-full rounded-full bg-[var(--ios-blue)]" />}
        </div>
      </div>
    </button>
  );
}
