import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronLeft, Share2, Trophy, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/tracker/BottomNav";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/friends")({
  head: () => ({
    meta: [
      { title: "Friends ranking — SR Lumina" },
      { name: "description", content: "Compare solved questions with your friends." },
      { property: "og:title", content: "Friends ranking — SR Lumina" },
      { property: "og:description", content: "Compare solved questions with your friends." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<{ user_id: string; display_name: string } | null>(null);
  const [removing, setRemoving] = useState(false);
  const management = useQuery({
    queryKey: ["friend-group-management"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("can_manage_friend_group");
      if (error) throw error;
      return data === true;
    },
  });
  const board = useQuery({
    queryKey: ["friend-leaderboard", days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("friend_leaderboard", { _days: days });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function removeMember() {
    if (!selected || removing) return;
    setRemoving(true);
    try {
      const { error } = await supabase.rpc("remove_friend_from_group", { _member_id: selected.user_id });
      if (error) throw error;
      setSelected(null);
      await queryClient.invalidateQueries({ queryKey: ["friend-leaderboard"] });
      toast.success("Friend removed from the group");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't remove this friend. Try again.");
    } finally {
      setRemoving(false);
    }
  }

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
              {management.data && !r.is_me && (
                <Button variant="ghost" size="icon" className="shrink-0 text-destructive" aria-label={`Remove ${r.display_name} from group`} title="Remove from group" onClick={() => setSelected(r)}>
                  <UserMinus />
                </Button>
              )}
            </div>
          ))}
          {!board.isLoading && rows.length <= 1 && (
            <p className="p-4 text-sm text-muted-foreground flex items-center gap-2">
              <Trophy className="h-4 w-4" /> Share your link to add friends.
            </p>
          )}
        </div>
      </div>
      <AlertDialog open={selected !== null} onOpenChange={(open) => { if (!open && !removing) setSelected(null); }}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {selected?.display_name}?</AlertDialogTitle>
            <AlertDialogDescription>This friend will no longer appear in your group's ranking. Their solved questions and account will stay unchanged.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
            <Button variant="destructive" disabled={removing} onClick={removeMember}>{removing ? "Removing…" : "Remove friend"}</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <BottomNav />
    </div>
  );
}
