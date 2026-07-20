import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowDown, Target, Flame, LineChart, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Footer } from "@/components/tracker/Footer";

export const Route = createFileRoute("/")({
  ssr: false,
  component: LandingPage,
  head: () => ({
    meta: [
      { title: "SOLVE — Master your daily study grind" },
      {
        name: "description",
        content:
          "SOLVE is the intelligent question tracker that turns your daily study goals into an unbreakable streak. Log, analyze, and dominate every subject.",
      },
      { property: "og:title", content: "SOLVE — Master your daily study grind" },
      {
        property: "og:description",
        content:
          "The intelligent question tracker for serious students. Streaks, analytics, and momentum.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function LandingPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  const [vh, setVh] = useState(800);
  const [vw, setVw] = useState(1024);


  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/home", replace: true });
      else setChecking(false);
    });
  }, [navigate]);

  useEffect(() => {
    const onResize = () => setVh(window.innerHeight);
    onResize();
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        setScrollY(window.scrollY);
        raf = 0;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  if (checking) {
    return <div className="min-h-dvh bg-[#0A0A0E]" />;
  }

  // Scroll progress across the 4 pinned sections (hero + 3 features + CTA = 5 * vh)
  const totalScroll = vh * 4;
  const p = Math.min(1, Math.max(0, scrollY / totalScroll));

  // Book animation stages
  // 0.00 – 0.20 hero (closed, tilted)
  // 0.20 – 0.40 open + face camera (Section 1)
  // 0.40 – 0.60 explode layers (Section 2)
  // 0.60 – 0.80 flame emerges (Section 3)
  // 0.80 – 1.00 upright portal (CTA)
  const seg = (from: number, to: number) =>
    Math.min(1, Math.max(0, (p - from) / (to - from)));

  const openAmt = seg(0.18, 0.38);
  const explode = seg(0.4, 0.6);
  const flame = seg(0.6, 0.8);
  const portal = seg(0.8, 1.0);

  const bookRotY = -25 + openAmt * 25 + explode * -15 + portal * 15; // final ~0
  const bookRotX = -8 + openAmt * 3 + explode * 40 - portal * 35;
  const bookScale = 1 + portal * 0.15;
  const bookGlow = 0.35 + Math.max(openAmt, explode, flame, portal) * 0.6;

  return (
    <div className="relative bg-[#0A0A0E] text-white min-h-dvh overflow-x-clip">
      <AmbientBackground />

      {/* ─── Header ─── */}
      <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-[#0A0A0E]/60 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="relative">
              <span className="text-[17px] font-semibold tracking-tight">SOLVE</span>
              <span
                aria-hidden
                className="absolute -right-2 top-1.5 h-1.5 w-1.5 rounded-full bg-indigo-400"
                style={{ boxShadow: "0 0 12px 2px rgb(129 140 248 / 0.9)" }}
              />
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-[13px] text-white/70">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how" className="hover:text-white transition-colors">How It Works</a>
            <a href="#streaks" className="hover:text-white transition-colors">Streaks</a>
          </nav>
          <Link
            to="/auth"
            className="relative inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold text-white bg-gradient-to-b from-indigo-500 to-violet-600 shadow-[0_8px_30px_-6px_rgba(139,92,246,0.6)] hover:brightness-110 transition"
          >
            Log In / Get Started
          </Link>
        </div>
      </header>

      {/* ─── Sticky 3D Stage (persists across sections) ─── */}
      <div className="sticky top-0 h-dvh w-full pointer-events-none z-10">
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ perspective: "1600px" }}
        >
          <Book
            rotX={bookRotX}
            rotY={bookRotY}
            scale={bookScale}
            open={openAmt}
            explode={explode}
            flame={flame}
            portal={portal}
            glow={bookGlow}
          />
        </div>
      </div>

      {/* ─── Content Sections (overlay on sticky stage) ─── */}
      <main className="relative z-20 -mt-[100dvh]">
        {/* HERO */}
        <section className="min-h-dvh flex flex-col items-center justify-center px-6 text-center relative">
          <h1
            className="text-[44px] sm:text-[72px] md:text-[92px] font-semibold leading-[0.95] tracking-[-0.045em] max-w-5xl bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(180deg, #ffffff 0%, #ffffff 45%, #a5b4fc 100%)",
            }}
          >
            Master Your
            <br />
            Daily Study Grind.
          </h1>
          <p className="mt-6 text-[16px] sm:text-[19px] text-white/60 max-w-xl leading-relaxed">
            The intelligent question tracker that turns your daily study goals
            into an unbreakable streak.
          </p>
          <div className="mt-9 flex items-center gap-3">
            <Link
              to="/auth"
              className="group inline-flex items-center gap-2 rounded-full bg-white text-[#0A0A0E] px-6 py-3 text-[14px] font-semibold hover:bg-white/90 transition"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2.4} />
            </Link>
            <a
              href="#features"
              className="text-[14px] font-medium text-white/70 hover:text-white px-3 py-3 transition-colors"
            >
              See how it works ›
            </a>
          </div>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/50 text-[11px] tracking-[0.25em] uppercase animate-bounce-slow">
            Scroll to Explore
            <ArrowDown className="h-4 w-4" strokeWidth={2} />
          </div>
        </section>

        {/* SECTION 1 – Tracker */}
        <FeatureSection
          id="features"
          align="left"
          eyebrow="01 · Tracker"
          title="Visual Momentum."
          desc="Log your solved questions across any subject and watch your daily goal ring fill up in real-time."
        />

        {/* SECTION 2 – Analytics */}
        <FeatureSection
          id="how"
          align="right"
          eyebrow="02 · Analytics"
          title="Deep Analytics."
          desc="Automatically categorize your solved problems and track your mastery across every subject over time."
        />

        {/* SECTION 3 – Streaks */}
        <FeatureSection
          id="streaks"
          align="left"
          eyebrow="03 · Streaks"
          title="Unbreakable Habits."
          desc="Build daily momentum. Our smart reminder system ensures you never break your streak."
        />

        {/* CTA */}
        <section className="min-h-dvh flex flex-col items-center justify-center px-6 text-center relative">
          <div className="mt-[42vh] flex flex-col items-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] tracking-wider text-white/70 uppercase mb-6">
              <Sparkles className="h-3 w-3 text-indigo-300" /> Ready when you are
            </div>
            <h2
              className="text-[40px] sm:text-[64px] font-semibold leading-[0.98] tracking-[-0.04em] max-w-3xl bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(180deg, #fff 0%, #c7d2fe 100%)",
              }}
            >
              Ready to start your
              <br />
              streak today?
            </h2>
            <p className="mt-5 text-[16px] text-white/60 max-w-md">
              Your study vault is waiting. Join thousands building unbreakable habits.
            </p>
            <Link
              to="/auth"
              className="group mt-9 relative inline-flex items-center gap-2 rounded-full px-8 py-4 text-[15px] font-semibold text-white bg-gradient-to-b from-indigo-500 to-violet-600 shadow-[0_20px_60px_-10px_rgba(139,92,246,0.7)] hover:brightness-110 hover:scale-[1.02] transition-all"
            >
              <span
                aria-hidden
                className="absolute inset-0 rounded-full opacity-70 blur-2xl -z-10"
                style={{ background: "linear-gradient(180deg, #6366f1, #8b5cf6)" }}
              />
              Enter Your Study Vault
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" strokeWidth={2.4} />
            </Link>
          </div>
        </section>
      </main>

      <div className="relative z-20 bg-[#0A0A0E]">
        <Footer />
      </div>

      <style>{`
        @keyframes bounceSlow {
          0%,100% { transform: translateY(0); opacity: .55; }
          50% { transform: translateY(6px); opacity: 1; }
        }
        .animate-bounce-slow { animation: bounceSlow 2.2s ease-in-out infinite; }
        @keyframes floatY {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes flicker {
          0%,100% { opacity: .9; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.06); }
        }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  3D Book (pure CSS transforms)                              */
/* ─────────────────────────────────────────────────────────── */
function Book({
  rotX, rotY, scale, open, explode, flame, portal, glow,
}: {
  rotX: number; rotY: number; scale: number;
  open: number; explode: number; flame: number; portal: number; glow: number;
}) {
  const size = { w: 320, h: 420 };
  const portalMode = portal > 0.5;

  return (
    <div
      className="relative"
      style={{
        width: size.w,
        height: size.h,
        transformStyle: "preserve-3d",
        transform: `rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${scale})`,
        transition: "transform 120ms linear",
        animation: "floatY 6s ease-in-out infinite",
      }}
    >
      {/* halo glow */}
      <div
        aria-hidden
        className="absolute inset-[-25%] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(closest-side, rgba(129,140,248,0.55), rgba(139,92,246,0.25) 40%, transparent 70%)",
          filter: `blur(40px)`,
          opacity: glow,
          transform: "translateZ(-120px)",
        }}
      />

      {/* Back cover */}
      <Panel
        w={size.w} h={size.h}
        style={{
          transform: `translateZ(-24px)`,
          background:
            "linear-gradient(135deg, #1a1a24 0%, #0f0f18 100%)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      />

      {/* Inner pages (exploded layers) */}
      {[0, 1, 2, 3].map((i) => {
        const z = -18 + i * 6 + explode * (i - 1.5) * 40;
        const tY = explode * (i - 1.5) * 22;
        return (
          <Panel
            key={i}
            w={size.w - 14} h={size.h - 18}
            style={{
              left: 7, top: 9,
              transform: `translate3d(0, ${tY}px, ${z}px)`,
              background: "linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)",
              borderRadius: 10,
              boxShadow: "0 6px 20px rgba(0,0,0,0.35)",
            }}
          >
            {i === 2 && open > 0.5 && (
              <PageContent explode={explode} />
            )}
          </Panel>
        );
      })}

      {/* Floating analytics chips during explode */}
      {explode > 0.05 && (
        <>
          <Chip label="Calculus +15" color="#818cf8"
            x={-140} y={-60} z={90} explode={explode} />
          <Chip label="Physics +20" color="#a78bfa"
            x={140} y={-40} z={110} explode={explode} />
          <Chip label="Coding +10" color="#22d3ee"
            x={-120} y={90} z={70} explode={explode} />
          <Chip label="Biology +8" color="#f472b6"
            x={130} y={100} z={80} explode={explode} />
        </>
      )}

      {/* Front cover (opens like a door on the left spine) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transformOrigin: "left center",
          transform: `rotateY(${-open * 155}deg) translateZ(24px)`,
          transition: "transform 120ms linear",
          transformStyle: "preserve-3d",
        }}
      >
        <Panel
          w={size.w} h={size.h}
          style={{
            background:
              "linear-gradient(135deg, #1e1b4b 0%, #312e81 45%, #4c1d95 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.12), 0 30px 60px -20px rgba(0,0,0,0.7)",
          }}
        >
          {/* Emblem */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div
              className="h-20 w-20 rounded-2xl flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.03))",
                border: "1px solid rgba(255,255,255,0.18)",
                boxShadow:
                  "0 0 40px rgba(129,140,248,0.6), inset 0 1px 0 rgba(255,255,255,0.25)",
                backdropFilter: "blur(6px)",
              }}
            >
              <span className="text-[26px] font-bold tracking-tight text-white">S</span>
            </div>
            <span className="text-[11px] tracking-[0.4em] text-white/60 uppercase">
              Solve
            </span>
          </div>
        </Panel>
      </div>

      {/* Holographic flame (Section 3) */}
      {flame > 0.05 && (
        <div
          className="absolute left-1/2 top-1/2 pointer-events-none"
          style={{
            transform: `translate(-50%, -50%) translateZ(${140 * flame}px) scale(${0.4 + flame})`,
            opacity: flame,
            animation: "flicker 1.6s ease-in-out infinite",
          }}
        >
          <div
            className="relative h-40 w-28 rounded-[50%_50%_45%_45%/60%_60%_40%_40%]"
            style={{
              background:
                "radial-gradient(ellipse at 50% 70%, #fef08a 0%, #fb923c 30%, #a855f7 65%, transparent 80%)",
              filter: "blur(0.5px) drop-shadow(0 0 30px rgba(168,85,247,0.8))",
            }}
          />
          <Flame className="absolute inset-0 m-auto h-16 w-16 text-white/90" strokeWidth={1.5} />
        </div>
      )}

      {/* Portal card overlay (final CTA state) */}
      {portalMode && (
        <div
          className="absolute inset-0 rounded-3xl flex items-center justify-center pointer-events-none"
          style={{
            opacity: (portal - 0.5) * 2,
            background:
              "linear-gradient(135deg, rgba(99,102,241,0.35), rgba(139,92,246,0.25))",
            border: "1px solid rgba(255,255,255,0.2)",
            boxShadow: "0 0 80px 10px rgba(139,92,246,0.5)",
            backdropFilter: "blur(10px)",
            transform: "translateZ(30px)",
          }}
        >
          <div className="text-center">
            <div className="text-[10px] tracking-[0.4em] text-white/70 uppercase mb-2">Vault</div>
            <div className="text-[42px] font-semibold tracking-tight">SOLVE</div>
          </div>
        </div>
      )}
    </div>
  );
}

function Panel({
  w, h, style, children,
}: { w: number; h: number; style?: React.CSSProperties; children?: React.ReactNode }) {
  return (
    <div
      className="absolute rounded-xl"
      style={{
        width: w,
        height: h,
        backfaceVisibility: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function PageContent({ explode }: { explode: number }) {
  const pct = 0.84;
  const r = 46;
  const c = 2 * Math.PI * r;
  return (
    <div className="absolute inset-0 p-5 flex flex-col text-[#0A0A0E]" style={{ opacity: 1 - explode * 0.6 }}>
      <div className="text-[9px] tracking-[0.3em] text-indigo-500 uppercase font-semibold">Today</div>
      <div className="text-[13px] font-semibold mt-0.5">Daily Goal</div>
      <div className="flex-1 flex items-center justify-center">
        <div className="relative">
          <svg width="120" height="120" className="rotate-[-90deg]">
            <circle cx="60" cy="60" r={r} strokeWidth="10" fill="none" stroke="#e2e8f0" />
            <circle cx="60" cy="60" r={r} strokeWidth="10" fill="none"
              stroke="url(#g1)" strokeLinecap="round"
              strokeDasharray={c} strokeDashoffset={c * (1 - pct)} />
            <defs>
              <linearGradient id="g1" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[22px] font-bold">42</span>
            <span className="text-[9px] text-slate-500">of 50 solved</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {["Math", "Phys", "Chem"].map((s) => (
          <div key={s} className="rounded-md bg-slate-100 py-1 text-center text-[9px] font-medium text-slate-700">{s}</div>
        ))}
      </div>
    </div>
  );
}

function Chip({
  label, color, x, y, z, explode,
}: { label: string; color: string; x: number; y: number; z: number; explode: number }) {
  return (
    <div
      className="absolute left-1/2 top-1/2 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap"
      style={{
        transform: `translate(-50%, -50%) translate3d(${x * explode}px, ${y * explode}px, ${z * explode}px)`,
        opacity: Math.min(1, explode * 1.5),
        background: `${color}22`,
        border: `1px solid ${color}66`,
        color: "#fff",
        boxShadow: `0 0 20px ${color}55`,
        backdropFilter: "blur(6px)",
      }}
    >
      {label}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Feature text section (overlays sticky book stage)          */
/* ─────────────────────────────────────────────────────────── */
function FeatureSection({
  id, align, eyebrow, title, desc,
}: {
  id?: string; align: "left" | "right";
  eyebrow: string; title: string; desc: string;
}) {
  const alignSide = align === "left" ? "md:justify-start md:text-left" : "md:justify-end md:text-right";
  const iconFor: Record<string, typeof Target> = { Tracker: Target, Analytics: LineChart, Streaks: Flame };
  const key = eyebrow.split("·")[1]?.trim() ?? "Tracker";
  const Icon = iconFor[key] ?? Target;

  const ref = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(
      ([e]) => setInView(e.intersectionRatio > 0.25),
      { threshold: [0, 0.25, 0.5, 0.75] }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  return (
    <section
      id={id}
      ref={ref}
      className="min-h-dvh flex items-center px-6 sm:px-12"
    >
      <div className={`w-full max-w-6xl mx-auto flex ${alignSide}`}>
        <div
          className="max-w-md transition-all duration-700 ease-out"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? "translateY(0)" : "translateY(30px)",
          }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] tracking-[0.2em] text-white/70 uppercase backdrop-blur-sm">
            <Icon className="h-3 w-3 text-indigo-300" strokeWidth={2.4} />
            {eyebrow}
          </div>
          <h2
            className="mt-5 text-[36px] sm:text-[52px] font-semibold tracking-[-0.035em] leading-[1] bg-clip-text text-transparent"
            style={{
              backgroundImage: "linear-gradient(180deg, #ffffff 0%, #a5b4fc 100%)",
            }}
          >
            {title}
          </h2>
          <p className="mt-4 text-[15px] sm:text-[17px] text-white/60 leading-relaxed">
            {desc}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Ambient background: gradients + noise                      */
/* ─────────────────────────────────────────────────────────── */
function AmbientBackground() {
  return (
    <div aria-hidden className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div
        className="absolute -top-40 left-1/2 -translate-x-1/2 h-[700px] w-[900px] rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(99,102,241,0.35), transparent 70%)",
          filter: "blur(60px)",
        }}
      />
      <div
        className="absolute top-1/3 -right-40 h-[600px] w-[600px] rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(139,92,246,0.28), transparent 70%)",
          filter: "blur(70px)",
        }}
      />
      <div
        className="absolute bottom-0 -left-40 h-[600px] w-[600px] rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(56,189,248,0.18), transparent 70%)",
          filter: "blur(80px)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "3px 3px",
        }}
      />
    </div>
  );
}
