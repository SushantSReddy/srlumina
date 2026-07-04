import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { getProfile, updateProfile } from "@/lib/tracker.functions";
import { MeshBackground } from "@/components/tracker/MeshBackground";
import { Footer } from "@/components/tracker/Footer";
import { Logo } from "@/components/tracker/Logo";
import {
  CLASS_OPTIONS,
  daysUntil,
  formatExamDate,
  getExamDate,
  getExamLabel,
  type ClassLevel,
  type Stream,
} from "@/lib/exam-dates";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: Onboarding,
  head: () => ({ meta: [{ title: "Set up — Reps" }] }),
});

function Onboarding() {
  const navigate = useNavigate();
  const getProfileFn = useServerFn(getProfile);
  const updateFn = useServerFn(updateProfile);

  const profileQ = useQuery({ queryKey: ["profile"], queryFn: () => getProfileFn() });

  const [step, setStep] = useState(0);
  const [stream, setStream] = useState<Stream | null>(null);
  const [cls, setCls] = useState<ClassLevel | null>(null);
  const currentYear = new Date().getFullYear();
  const years = useMemo(
    () => Array.from({ length: 5 }, (_, i) => currentYear + i),
    [currentYear],
  );
  const [year, setYear] = useState<number>(currentYear + 1);

  // Prefill from existing profile (e.g. redo settings)
  useEffect(() => {
    if (profileQ.data) {
      if (profileQ.data.stream) setStream(profileQ.data.stream as Stream);
      if (profileQ.data.class_level) setCls(profileQ.data.class_level as ClassLevel);
      if (profileQ.data.target_year) setYear(profileQ.data.target_year);
      if (profileQ.data.stream && profileQ.data.class_level && profileQ.data.target_year) {
        navigate({ to: "/home", replace: true });
      }
    }
  }, [profileQ.data, navigate]);

  const mut = useMutation({
    mutationFn: () => updateFn({
      data: { stream: stream!, class_level: cls!, target_year: year },
    }),
    onSuccess: () => navigate({ to: "/home", replace: true }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't save"),
  });

  const canNext =
    (step === 0 && !!stream) ||
    (step === 1 && !!cls) ||
    (step === 2 && !!year);

  function next() {
    if (step < 2) setStep((s) => s + 1);
    else mut.mutate();
  }

  return (
    <div className="min-h-dvh relative px-6 py-10 flex flex-col">
      <MeshBackground />

      {/* Header with logo + progress */}
      <div className="flex flex-col items-center mb-6">
        <Logo size={44} />
        <div className="mt-6 flex items-center justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ease-out ${
                i === step ? "w-8 bg-[var(--ios-blue)]" : i < step ? "w-4 bg-[var(--ios-blue)]/60" : "w-4 bg-border"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 max-w-sm w-full mx-auto" key={step}>
        {step === 0 && (
          <div className="spring-in">
            <h1 className="text-3xl font-bold tracking-tight">Which exam?</h1>
            <p className="mt-1 text-sm text-muted-foreground">Pick the one you're preparing for.</p>
            <div className="mt-8 space-y-3">
              <PickCard selected={stream === "jee"} onSelect={() => setStream("jee")} accent="var(--ios-indigo)"
                title="JEE" subtitle="Physics · Chemistry · Mathematics" />
              <PickCard selected={stream === "neet"} onSelect={() => setStream("neet")} accent="var(--ios-green)"
                title="NEET" subtitle="Physics · Chemistry · Biology" />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="spring-in">
            <h1 className="text-3xl font-bold tracking-tight">What's your class?</h1>
            <p className="mt-1 text-sm text-muted-foreground">Helps us tailor your dashboard.</p>
            <div className="mt-8 grid grid-cols-2 gap-2.5">
              {CLASS_OPTIONS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCls(c.id)}
                  className={`glass rounded-2xl py-4 text-sm font-semibold tap active:tap-active liquid transition-all ${
                    cls === c.id ? "ring-2 ring-[var(--ios-blue)] bg-[color-mix(in_oklab,var(--ios-blue)_10%,transparent)]" : ""
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && stream && (
          <div className="spring-in">
            <h1 className="text-3xl font-bold tracking-tight">Target year?</h1>
            <p className="mt-1 text-sm text-muted-foreground">We'll count down to exam day.</p>
            <div className="mt-8 flex flex-wrap gap-2">
              {years.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => setYear(y)}
                  className={`rounded-full px-5 py-2.5 text-sm font-semibold tap active:tap-active border transition-all ${
                    year === y
                      ? "bg-[var(--ios-blue)] text-white border-transparent scale-105"
                      : "glass border-transparent"
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>

            <div className="mt-8 glass rounded-3xl p-5 pop-in">
              <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {getExamLabel(stream)} {year}
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-5xl font-bold tabular-nums tracking-tight text-foreground">
                  {daysUntil(getExamDate(stream, year))}
                </span>
                <span className="text-sm text-muted-foreground">days to go</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {formatExamDate(getExamDate(stream, year))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-sm w-full mx-auto pb-[max(env(safe-area-inset-bottom),16px)] flex gap-2">
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="glass h-14 w-14 rounded-2xl flex items-center justify-center tap active:tap-active"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <button
          disabled={!canNext || mut.isPending}
          onClick={next}
          className="flex-1 rounded-2xl bg-[var(--ios-blue)] h-14 text-base font-semibold text-white tap active:tap-active disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg shadow-[color-mix(in_oklab,var(--ios-blue)_40%,transparent)]"
        >
          {mut.isPending ? "Saving…" : step === 2 ? (<><Check className="h-5 w-5" /> Start</>) : (<>Continue <ArrowRight className="h-5 w-5" /></>)}
        </button>
      </div>
      <Footer />
    </div>
  );
}

function PickCard({ selected, onSelect, title, subtitle, accent }: {
  selected: boolean; onSelect: () => void; title: string; subtitle: string; accent: string;
}) {
  return (
    <button
      type="button" onClick={onSelect}
      className={`w-full text-left liquid glass rounded-3xl p-5 tap active:tap-active transition-all ${
        selected ? "ring-2 scale-[1.01]" : ""
      }`}
      style={selected ? ({ ["--tw-ring-color" as string]: accent } as React.CSSProperties) : undefined}
    >
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
          style={{ background: accent, boxShadow: `0 8px 20px -6px color-mix(in oklab, ${accent} 60%, transparent)` }}>{title[0]}</div>
        <div className="flex-1">
          <div className="text-lg font-semibold">{title}</div>
          <div className="text-xs text-muted-foreground">{subtitle}</div>
        </div>
        <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${selected ? "border-[var(--ios-blue)] bg-[var(--ios-blue)]" : "border-border"}`}>
          {selected && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
        </div>
      </div>
    </button>
  );
}
