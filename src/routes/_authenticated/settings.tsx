import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Trash2, LogOut, Plus, ShieldCheck } from "lucide-react";
import { addCustomSource, deleteSource, getProfile, listSources, updateProfile } from "@/lib/tracker.functions";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/tracker/BottomNav";
import { MeshBackground } from "@/components/tracker/MeshBackground";
import { TopHeader } from "@/components/tracker/TopHeader";
import { Footer } from "@/components/tracker/Footer";
import { CLASS_OPTIONS, type ClassLevel } from "@/lib/exam-dates";
import { useDailyReminder } from "@/lib/reminder";


export const Route = createFileRoute("/_authenticated/settings")({
  component: Settings,
  head: () => ({ meta: [{ title: "Settings — Reps" }] }),
});

function Settings() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const getProfileFn = useServerFn(getProfile);
  const updateFn = useServerFn(updateProfile);
  const listSourcesFn = useServerFn(listSources);
  const addSourceFn = useServerFn(addCustomSource);
  const delSourceFn = useServerFn(deleteSource);

  const profileQ = useQuery({ queryKey: ["profile"], queryFn: () => getProfileFn() });
  const sourcesQ = useQuery({ queryKey: ["sources"], queryFn: () => listSourcesFn() });
  const isAdminQ = useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return false;
      const { data } = await supabase
        .from("user_roles" as never)
        .select("role")
        .eq("user_id", u.user.id)
        .eq("role", "admin")
        .maybeSingle();
      return !!data;
    },
  });

  const [name, setName] = useState("");
  const [goal, setGoal] = useState(50);
  const [newSource, setNewSource] = useState("");
  const reminder = useDailyReminder();


  useEffect(() => {
    if (profileQ.data) {
      setName(profileQ.data.display_name ?? "");
      setGoal(profileQ.data.daily_goal ?? 50);
    }
  }, [profileQ.data]);

  const saveMut = useMutation({
    mutationFn: (patch: {
      display_name?: string;
      stream?: "jee" | "neet";
      daily_goal?: number;
      class_level?: ClassLevel;
      target_year?: number;
    }) => updateFn({ data: patch }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["today"] });
      toast.success("Saved");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't save"),
  });

  const addMut = useMutation({
    mutationFn: (n: string) => addSourceFn({ data: { name: n } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sources"] }); setNewSource(""); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't add"),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => delSourceFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sources"] }),
  });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const stream = profileQ.data?.stream;
  const clsLevel = profileQ.data?.class_level;
  const targetYear = profileQ.data?.target_year;
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => Array.from({ length: 5 }, (_, i) => currentYear + i), [currentYear]);

  return (
    <div className="min-h-dvh pb-28 relative">
      <MeshBackground />
      <TopHeader title="Settings" subtitle="Preferences and account" />

      <section className="px-4 space-y-4">
        <Group title="Profile">
          <Field label="Display name">
            <input value={name} maxLength={60}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => name !== profileQ.data?.display_name && saveMut.mutate({ display_name: name })}
              className="bg-transparent text-right w-full outline-none"
            />
          </Field>
        </Group>

        <Group title="Exam">
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
            {(["jee", "neet"] as const).map((s) => (
              <button key={s}
                onClick={() => stream !== s && saveMut.mutate({ stream: s })}
                className={`rounded-lg py-2 text-sm font-medium uppercase tap active:tap-active ${stream === s ? "bg-surface shadow-sm" : "text-muted-foreground"}`}>
                {s}
              </button>
            ))}
          </div>
        </Group>

        <Group title="Class">
          <div className="flex flex-wrap gap-2">
            {CLASS_OPTIONS.map((c) => (
              <button key={c.id}
                onClick={() => clsLevel !== c.id && saveMut.mutate({ class_level: c.id })}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium border tap active:tap-active transition-colors ${
                  clsLevel === c.id ? "bg-[var(--ios-blue)] text-white border-transparent" : "bg-surface border-border text-foreground"
                }`}>
                {c.label}
              </button>
            ))}
          </div>
        </Group>

        <Group title="Target exam year">
          <div className="flex flex-wrap gap-2">
            {years.map((y) => (
              <button key={y}
                onClick={() => targetYear !== y && saveMut.mutate({ target_year: y })}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold border tap active:tap-active transition-colors ${
                  targetYear === y ? "bg-[var(--ios-blue)] text-white border-transparent" : "bg-surface border-border text-foreground"
                }`}>
                {y}
              </button>
            ))}
          </div>
        </Group>


        <Group title="Daily goal">
          <div className="flex items-center gap-3">
            <input type="range" min={5} max={300} step={5}
              value={goal}
              onChange={(e) => setGoal(Number(e.target.value))}
              onPointerUp={() => goal !== profileQ.data?.daily_goal && saveMut.mutate({ daily_goal: goal })}
              className="flex-1 accent-[var(--ios-blue)]"
            />
            <span className="tabular-nums font-semibold w-14 text-right">{goal}</span>
          </div>
        </Group>

        <Group title="Sources">
          <div className="space-y-1.5">
            {sourcesQ.data?.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-1.5">
                <span className="text-sm">{s.name} {s.is_default && <span className="text-xs text-muted-foreground ml-1">· default</span>}</span>
                {!s.is_default && (
                  <button onClick={() => delMut.mutate(s.id)} className="text-[var(--ios-red)] p-1" aria-label="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <input value={newSource} maxLength={40}
                onChange={(e) => setNewSource(e.target.value)}
                placeholder="Add custom source"
                className="flex-1 bg-transparent text-sm outline-none py-1"
              />
              <button
                disabled={!newSource.trim() || addMut.isPending}
                onClick={() => addMut.mutate(newSource.trim())}
                className="h-8 w-8 rounded-full bg-[var(--ios-blue)] text-white flex items-center justify-center disabled:opacity-40"
                aria-label="Add"
              ><Plus className="h-4 w-4" /></button>
            </div>
          </div>
        </Group>

        <Group title="Daily reminder">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm">Remind me to log</span>
              <button
                role="switch"
                aria-checked={reminder.enabled}
                onClick={() => reminder.toggle(!reminder.enabled)}
                className={`relative h-7 w-12 rounded-full transition-colors ${reminder.enabled ? "bg-[var(--ios-green)]" : "bg-muted"}`}
              >
                <span
                  className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all"
                  style={{ left: reminder.enabled ? 22 : 2 }}
                />
              </button>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">Time</span>
              <input
                type="time"
                value={reminder.time}
                onChange={(e) => reminder.setTime(e.target.value)}
                className="bg-transparent text-sm font-semibold tabular-nums outline-none text-right"
              />
            </div>
            <div className="flex items-center justify-between gap-3 pt-1">
              <span className="text-xs text-muted-foreground">
                {reminder.permission === "denied"
                  ? "Notifications blocked — you'll get an in-app alert instead."
                  : reminder.permission === "granted"
                    ? "Notification will show at this time while the app is open."
                    : "Turn on to allow notifications; otherwise an in-app alert shows."}
              </span>
              <button
                onClick={() => { reminder.test(); toast("Daily study log", { description: "Time to log the questions you solved today.", duration: 6000 }); }}
                className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs font-semibold tap active:tap-active"
              >Test</button>
            </div>

          </div>
        </Group>


        {isAdminQ.data && (
          <Link
            to="/admin/logins"
            className="w-full glass rounded-2xl py-3.5 text-sm font-semibold flex items-center justify-center gap-2 tap active:tap-active"
          >
            <ShieldCheck className="h-4 w-4" /> Login history
          </Link>
        )}

        <button
          onClick={signOut}
          className="w-full glass rounded-2xl py-3.5 text-sm font-semibold text-[var(--ios-red)] flex items-center justify-center gap-2 tap active:tap-active"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </section>

      <Footer className="mt-8" />
      <BottomNav />
    </div>
  );
}



function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="px-2 mb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{title}</div>
      <div className="glass rounded-2xl p-4">{children}</div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex-1 text-sm">{children}</div>
    </div>
  );
}
