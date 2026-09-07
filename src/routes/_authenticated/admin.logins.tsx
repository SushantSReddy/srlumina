import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MeshBackground } from "@/components/tracker/MeshBackground";
import { TopHeader } from "@/components/tracker/TopHeader";
import { BottomNav } from "@/components/tracker/BottomNav";
import { Footer } from "@/components/tracker/Footer";
import { ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/logins")({
  component: AdminLogins,
  head: () => ({ meta: [{ title: "Login history — SOLVE" }] }),
});

type LoginRow = {
  id: string;
  user_id: string;
  email: string | null;
  user_agent: string | null;
  logged_in_at: string;
};

function AdminLogins() {
  const roleQ = useQuery({
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

  const logsQ = useQuery({
    enabled: roleQ.data === true,
    queryKey: ["login-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("login_events" as never)
        .select("id,user_id,email,user_agent,logged_in_at")
        .order("logged_in_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as LoginRow[];
    },
    refetchInterval: 15000,
  });

  return (
    <div className="min-h-dvh pb-28 relative">
      <MeshBackground />
      <TopHeader title="Login history" subtitle="Admin only" />

      <section className="px-4 space-y-3">
        {roleQ.isLoading ? (
          <div className="glass rounded-2xl p-6 text-center text-sm text-muted-foreground">Loading…</div>
        ) : roleQ.data ? (
          <>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground px-1">
              {logsQ.data?.length ?? 0} recent sign-ins · refreshes every 15s
            </div>
            <div className="glass rounded-2xl divide-y divide-border overflow-hidden">
              {logsQ.data?.map((row) => (
                <div key={row.id} className="p-4 flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm truncate">{row.email ?? row.user_id.slice(0, 8)}</span>
                    <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
                      {new Date(row.logged_in_at).toLocaleString()}
                    </span>
                  </div>
                  {row.user_agent && (
                    <div className="text-[11px] text-muted-foreground truncate">{row.user_agent}</div>
                  )}
                </div>
              ))}
              {logsQ.data && logsQ.data.length === 0 && (
                <div className="p-6 text-center text-sm text-muted-foreground">No sign-ins yet.</div>
              )}
            </div>
          </>
        ) : (
          <div className="glass rounded-2xl p-6 text-center space-y-2">
            <ShieldAlert className="h-6 w-6 mx-auto text-[var(--ios-red)]" />
            <div className="text-sm font-semibold">Admins only</div>
            <div className="text-xs text-muted-foreground">You don't have access to this page.</div>
            <Link to="/home" className="inline-block mt-2 text-sm text-[var(--ios-blue)]">Go home</Link>
          </div>
        )}
      </section>

      <Footer className="mt-8" />
      <BottomNav />
    </div>
  );
}
