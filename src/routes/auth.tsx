import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Cloud } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Footer } from "@/components/tracker/Footer";

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

  async function oauth(provider: "apple" | "google") {
    setBusy(true);
    const res = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
    if (res.error) {
      toast.error(res.error.message ?? `${provider} sign-in failed`);
      setBusy(false);
      return;
    }
    if (res.redirected) return;
    navigate({ to: "/home", replace: true });
  }

  const canSubmit = email.length > 0 && password.length >= 6 && !busy;

  return (
    <div
      className="min-h-dvh relative flex flex-col items-center px-6 pt-16 pb-6"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% 0%, color-mix(in oklab, var(--ios-blue) 10%, transparent), transparent 60%), var(--background)",
      }}
    >
      <div className="flex-1 w-full flex flex-col items-center justify-start">
        <div className="w-full max-w-[360px] flex flex-col items-center">
          {/* iCloud-style mark */}
          <div className="flex items-center gap-2 text-foreground/90">
            <Cloud className="h-7 w-7" strokeWidth={1.6} fill="currentColor" fillOpacity={0.08} />
            <span className="text-[22px] font-normal tracking-[-0.02em]">iCloud</span>
          </div>

          <h1 className="mt-8 text-[26px] font-semibold tracking-[-0.02em] text-center leading-tight">
            Sign in with your Apple Account
          </h1>

          {/* Stacked input card — the iCloud hallmark */}
          <form onSubmit={submit} className="mt-8 w-full">
            <div className="rounded-[14px] bg-surface border border-border/70 overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <div className="relative">
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="Apple Account"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent px-4 py-3.5 text-[15px] focus:outline-none placeholder:text-muted-foreground/70"
                />
              </div>
              <div className="h-px bg-border/70" />
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={6}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent px-4 py-3.5 pr-12 text-[15px] focus:outline-none placeholder:text-muted-foreground/70"
                />
                <button
                  type="submit"
                  disabled={!canSubmit}
                  aria-label={mode === "signup" ? "Create account" : "Sign in"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full flex items-center justify-center text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: "var(--ios-blue)" }}
                >
                  <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                </button>
              </div>
            </div>

            <label className="mt-5 flex items-center gap-2 text-[13px] text-foreground/80 select-none cursor-pointer">
              <input type="checkbox" defaultChecked className="h-[15px] w-[15px] accent-[var(--ios-blue)] rounded" />
              Keep me signed in
            </label>
          </form>

          <div className="mt-8 flex flex-col items-center gap-3 text-[13px]">
            <a href="#" className="text-[var(--ios-blue)] hover:underline">
              Forgot password?
            </a>
            <button
              type="button"
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              className="text-[var(--ios-blue)] hover:underline"
            >
              {mode === "signup" ? "Sign in to existing account" : "Create your Apple Account"}
            </button>
          </div>

          {/* Divider + OAuth */}
          <div className="mt-10 w-full flex items-center gap-3 text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70">
            <div className="h-px flex-1 bg-border/70" />
            or
            <div className="h-px flex-1 bg-border/70" />
          </div>

          <div className="mt-5 w-full space-y-2.5">
            <button
              type="button"
              onClick={() => oauth("apple")}
              disabled={busy}
              className="w-full rounded-[10px] bg-foreground text-background py-2.5 text-[14px] font-medium tap active:tap-active flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <AppleIcon /> Sign in with Apple
            </button>
            <button
              type="button"
              onClick={() => oauth("google")}
              disabled={busy}
              className="w-full rounded-[10px] bg-surface border border-border/70 py-2.5 text-[14px] font-medium tap active:tap-active flex items-center justify-center gap-2.5 disabled:opacity-60"
            >
              <GoogleIcon /> Continue with Google
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

function AppleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5 17.1 35.5 11.5 29.9 11.5 23S17.1 10.5 24 10.5c3.1 0 6 1.2 8.1 3.1l5.7-5.7C34.5 4.6 29.5 2.5 24 2.5 12.7 2.5 3.5 11.7 3.5 23S12.7 43.5 24 43.5 44.5 34.3 44.5 23c0-1.3-.1-2.1-.9-2.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.9 19 13 24 13c3.1 0 6 1.2 8.1 3.1l5.7-5.7C34.5 6.5 29.5 4.5 24 4.5c-7.6 0-14.1 4.3-17.7 10.2z"/>
      <path fill="#4CAF50" d="M24 43.5c5.3 0 10.2-2 13.9-5.3l-6.4-5.4c-2.1 1.4-4.7 2.2-7.5 2.2-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C10 39.3 16.5 43.5 24 43.5z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.4 5.4c-.5.5 6.8-5 6.8-15.4 0-1.3-.1-2.1-.9-3z"/>
    </svg>
  );
}
