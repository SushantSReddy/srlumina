import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { MeshBackground } from "@/components/tracker/MeshBackground";
import { Footer } from "@/components/tracker/Footer";
import { Logo } from "@/components/tracker/Logo";

export const Route = createFileRoute("/auth")({
  ssr: false,
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Sign in — Reps" },
      { name: "description", content: "Sign in to your daily question tracker." },
    ],
  }),
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/home", replace: true });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Account created. You're in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/home", replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setBusy(true);
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (res.error) {
      toast.error(res.error.message ?? "Google sign-in failed");
      setBusy(false);
      return;
    }
    if (res.redirected) return;
    navigate({ to: "/home", replace: true });
  }

  return (
    <div className="min-h-dvh relative flex flex-col px-6 py-10">
      <MeshBackground />

      <div className="flex-1 flex flex-col justify-center">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-10 flex flex-col items-center text-center">
            <Logo size={64} />
            <h1 className="mt-5 text-[32px] font-bold tracking-tight leading-none">
              Welcome to Reps
            </h1>
            <p className="mt-2 text-[15px] text-muted-foreground">
              Track every question. Every day.
            </p>
          </div>

          <div className="glass rounded-[28px] p-5 spring-in">
            <button
              type="button"
              onClick={google}
              disabled={busy}
              className="w-full rounded-2xl bg-foreground/[0.04] hover:bg-foreground/[0.07] border border-foreground/5 py-3.5 text-[15px] font-semibold tap active:tap-active flex items-center justify-center gap-3 disabled:opacity-60 transition-colors"
            >
              <GoogleIcon /> Continue with Google
            </button>

            <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground/70">
              <div className="h-px flex-1 bg-border/70" />
              or
              <div className="h-px flex-1 bg-border/70" />
            </div>

            <form onSubmit={submit} className="space-y-2.5">
              <input
                type="email" required autoComplete="email"
                placeholder="Email"
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl bg-foreground/[0.04] border border-foreground/5 px-4 py-3.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-[var(--ios-blue)]/60 transition-shadow placeholder:text-muted-foreground/70"
              />
              <input
                type="password" required minLength={6}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                placeholder="Password"
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl bg-foreground/[0.04] border border-foreground/5 px-4 py-3.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-[var(--ios-blue)]/60 transition-shadow placeholder:text-muted-foreground/70"
              />
              <button
                type="submit" disabled={busy}
                className="w-full rounded-2xl bg-[var(--ios-blue)] text-white py-3.5 text-[15px] font-semibold tap active:tap-active disabled:opacity-60 shadow-lg shadow-[color-mix(in_oklab,var(--ios-blue)_35%,transparent)] mt-1"
              >
                {busy ? "…" : mode === "signup" ? "Create account" : "Sign in"}
              </button>
            </form>
          </div>

          <button
            type="button"
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            className="mt-5 w-full text-center text-[13px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {mode === "signup" ? "Have an account? Sign in" : "New here? Create an account"}
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5 17.1 35.5 11.5 29.9 11.5 23S17.1 10.5 24 10.5c3.1 0 6 1.2 8.1 3.1l5.7-5.7C34.5 4.6 29.5 2.5 24 2.5 12.7 2.5 3.5 11.7 3.5 23S12.7 43.5 24 43.5 44.5 34.3 44.5 23c0-1.3-.1-2.1-.9-2.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.9 19 13 24 13c3.1 0 6 1.2 8.1 3.1l5.7-5.7C34.5 6.5 29.5 4.5 24 4.5c-7.6 0-14.1 4.3-17.7 10.2z"/>
      <path fill="#4CAF50" d="M24 43.5c5.3 0 10.2-2 13.9-5.3l-6.4-5.4c-2.1 1.4-4.7 2.2-7.5 2.2-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C10 39.3 16.5 43.5 24 43.5z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.4 5.4c-.5.5 6.8-5 6.8-15.4 0-1.3-.1-2.1-.9-3z"/>
    </svg>
  );
}
