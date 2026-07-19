import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Target, Flame, LineChart, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MeshBackground } from "@/components/tracker/MeshBackground";
import { Logo } from "@/components/tracker/Logo";
import { Footer } from "@/components/tracker/Footer";

export const Route = createFileRoute("/")({
  ssr: false,
  component: LandingPage,
  head: () => ({
    meta: [
      { title: "Reps — Track every question you solve" },
      {
        name: "description",
        content:
          "A minimalist Apple-inspired tracker for JEE & NEET aspirants. Log questions by subject, chapter, and source. Build streaks. Hit your daily goal.",
      },
      { property: "og:title", content: "Reps — Track every question you solve" },
      {
        property: "og:description",
        content:
          "Minimalist tracker for JEE & NEET. Subject rings, streaks, chapter-wise analytics.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function LandingPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate({ to: "/home", replace: true });
      } else {
        setChecking(false);
      }
    });
  }, [navigate]);

  if (checking) {
    return (
      <div className="min-h-dvh relative">
        <MeshBackground />
      </div>
    );
  }

  return (
    <div className="min-h-dvh relative flex flex-col">
      <MeshBackground />

      {/* Nav */}
      <header className="w-full px-6 pt-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Logo size={32} />
          <span className="text-[15px] font-semibold tracking-tight">Reps</span>
        </div>
        <Link
          to="/auth"
          className="text-[13px] font-medium text-foreground/70 hover:text-foreground transition-colors"
        >
          Sign in
        </Link>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
        <div className="pop-in mb-8">
          <Logo size={88} />
        </div>

        <h1 className="text-[44px] sm:text-[64px] md:text-[80px] font-semibold leading-[0.98] tracking-[-0.045em] max-w-4xl">
          Every question.
          <br />
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(135deg, var(--ios-blue), var(--ios-indigo))",
            }}
          >
            Every day. Counted.
          </span>
        </h1>

        <p className="mt-6 text-[17px] sm:text-[19px] text-muted-foreground max-w-xl tracking-[-0.01em] leading-relaxed">
          A minimalist tracker for JEE and NEET aspirants. Log what you solve,
          watch your streak grow, and keep the countdown to exam day in sight.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-3">
          <Link
            to="/auth"
            className="group inline-flex items-center gap-2 rounded-full bg-foreground text-background px-7 py-3.5 text-[15px] font-semibold tap active:tap-active shadow-lg shadow-foreground/10 transition-transform"
          >
            Get started
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              strokeWidth={2.4}
            />
          </Link>
          <Link
            to="/auth"
            className="text-[14px] font-medium text-[var(--ios-blue)] hover:opacity-80 transition-opacity px-2"
          >
            Learn more ›
          </Link>
        </div>

        {/* Feature grid */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-3xl">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="glass rounded-3xl p-5 text-left spring-in"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div
                className="h-9 w-9 rounded-2xl flex items-center justify-center mb-3"
                style={{
                  background: `color-mix(in oklab, ${f.tint} 18%, transparent)`,
                  color: f.tint,
                }}
              >
                <f.icon className="h-4.5 w-4.5" strokeWidth={2.2} />
              </div>
              <h3 className="text-[15px] font-semibold tracking-[-0.01em]">
                {f.title}
              </h3>
              <p className="mt-1 text-[13px] text-muted-foreground leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}

const FEATURES = [
  {
    title: "Subject rings",
    desc: "Physics, Chem, Math or Bio — each with its own daily target ring.",
    icon: Target,
    tint: "var(--ios-blue)",
  },
  {
    title: "Streaks that stick",
    desc: "Show up daily. Watch the flame grow. Miss a day, start again.",
    icon: Flame,
    tint: "var(--ios-orange)",
  },
  {
    title: "Chapter-wise analytics",
    desc: "See exactly where your reps are going, chapter by chapter.",
    icon: LineChart,
    tint: "var(--ios-indigo)",
  },
  {
    title: "Source tagging",
    desc: "Tag NCERT, coaching modules, PYQs — your data, your way.",
    icon: BookOpen,
    tint: "var(--ios-green)",
  },
];
