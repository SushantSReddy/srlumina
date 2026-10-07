import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronLeft, Share2, Trophy } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/tracker/BottomNav";

export const Route = createFileRoute("/_authenticated/friends")({
  head: () => ({
    meta: [
      { title: "Friends ranking — SR Lumina" },
      { name: "description", content: "Compare solved questions with your friends." },
      { property: "og:title", content: "Friends ranking — SR Lumina" },
      { property: "og:description", content: "Compare solved questions with your friends." },
    ],
  }),
  component: FriendsPage,
});

const RANGES = [
  { label: "Week", days: 7 },
  { label: "Month", days: 30 },
  { label: "Lifetime", days: 0 },
];

function FriendsPage() {
  const [days, setDays] = useState(7);
  const board = useQuery({
    queryKey: ["friend-leaderboard", days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("friend_leaderboard", { _days: days });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function share() {
    const { data: code, error } = await supabase.rpc("my_invite_code");
    if (error || !code) return toast.error("Couldn't create your link");
    const url = `${window.location.origin}/invite/${code}`;
    const text = "Join me on SR Lumina and let's compete on solved questions!";
    try {
      if (navigator.share) await navigator.share({ title: "SR Lumina", text, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Invite link copied");
      }
    } catch {
      /* share cancelled */
    }
  }

  const rows = board.data ?? [];
  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="mx-auto max-w-lg px-5 pt-6">
        <Link to="/home" className="inline-flex items-center text-sm text-muted-foreground">
          <ChevronLeft className="h-4 w-4" /> Home
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Friends ranking</h1>
        <p className="mt-1 text-sm text-muted-foreground">Who solved the most questions?</p>

        <button
          onClick={share}
          className="mt-5 w-full rounded-2xl bg-primary py-3 text-sm font-semibold text-primary-foreground inline-flex items-center justify-center gap-2 active:scale-[.98] transition-transform"
        >
          <Share2 className="h-4 w-4" /> Invite friends with a link
        </button>

        <div className="mt-5 grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => setDays(r.days)}
              className={`rounded-lg py-1.5 text-sm font-medium ${days === r.days ? "bg-background shadow-sm" : "text-muted-foreground"}`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="mt-4 glass rounded-2xl divide-y divide-border">
          {board.isLoading && <p className="p-4 text-sm text-muted-foreground">Loading…</p>}
          {rows.map((r, i) => (
            <div key={r.user_id} className={`flex items-center gap-3 p-4 ${r.is_me ? "bg-primary/10" : ""}`}>
              <span className="w-7 text-center font-bold">
                {i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}
              </span>
              <span className="flex-1 truncate font-medium">
                {r.display_name}
                {r.is_me && <span className="text-muted-foreground"> (you)</span>}
              </span>
              <span className="font-semibold tabular-nums">{Number(r.total)}</span>
            </div>
          ))}
          {!board.isLoading && rows.length <= 1 && (
            <p className="p-4 text-sm text-muted-foreground flex items-center gap-2">
              <Trophy className="h-4 w-4" /> Share your link to add friends.
            </p>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
