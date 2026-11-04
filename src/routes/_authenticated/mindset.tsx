import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/tracker/BottomNav";
import { TopHeader } from "@/components/tracker/TopHeader";
import { MeshBackground } from "@/components/tracker/MeshBackground";
import { mindsetOptions } from "@/lib/mindset.queries";
import { Overview } from "@/components/tracker/mindset/Overview";
import { ThinkLikeTopper } from "@/components/tracker/mindset/ThinkLikeTopper";
import { TopperCode } from "@/components/tracker/mindset/TopperCode";
import { DailyOS } from "@/components/tracker/mindset/DailyOS";
import { Challenge } from "@/components/tracker/mindset/Challenge";
import { MistakeAnalysis } from "@/components/tracker/mindset/MistakeAnalysis";
import { MindsetProgress } from "@/components/tracker/mindset/MindsetProgress";

export const Route = createFileRoute("/_authenticated/mindset")({
  loader: ({ context }) => context.queryClient.ensureQueryData(mindsetOptions()),
  component: MindsetPage,
  head: () => ({ meta: [
    { title: "Topper's Mindset — SR Lumina" },
    { name: "description", content: "Study like a topper: eight principles, a daily operating system, a 7-day challenge, a mistake notebook and a mindset assessment." },
    { property: "og:title", content: "Topper's Mindset — SR Lumina" },
    { property: "og:description", content: "Eight principles, a daily operating system and a 7-day challenge that turn effort into marks." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
});

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "code", label: "Topper code" },
  { key: "os", label: "Daily OS" },
  { key: "challenge", label: "7-day challenge" },
  { key: "mistakes", label: "Mistakes" },
  { key: "progress", label: "Progress" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function MindsetPage() {
  const [tab, setTab] = useState<TabKey>("overview");
  return <div className="min-h-dvh relative pb-28">
    <MeshBackground />
    <TopHeader title="Topper's Mindset" subtitle="Study like a topper" />
    <main className="mx-auto max-w-3xl px-4 space-y-5">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2"><Link to="/home"><ArrowLeft />Today</Link></Button>
      </div>
      <nav aria-label="Mindset sections" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            aria-pressed={tab === t.key}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium tap active:tap-active transition-colors ${tab === t.key ? "bg-primary text-primary-foreground" : "glass text-muted-foreground"}`}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <div>
        {tab === "overview" && <div className="space-y-8"><Overview /><ThinkLikeTopper /></div>}
        {tab === "code" && <TopperCode />}
        {tab === "os" && <DailyOS />}
        {tab === "challenge" && <Challenge />}
        {tab === "mistakes" && <MistakeAnalysis />}
        {tab === "progress" && <MindsetProgress />}
      </div>
    </main>
    <BottomNav />
  </div>;
}
