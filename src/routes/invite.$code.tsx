import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { acceptPendingInvite, PENDING_INVITE_KEY } from "@/lib/friends";

export const Route = createFileRoute("/invite/$code")({
  head: () => ({
    meta: [
      { title: "You're invited — SOLVE" },
      { name: "description", content: "Join your friend on SOLVE and compete on solved questions." },
      { property: "og:title", content: "You're invited — SOLVE" },
      { property: "og:description", content: "Join your friend on SOLVE and compete on solved questions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InvitePage,
});

function InvitePage() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  useEffect(() => {
    localStorage.setItem(PENDING_INVITE_KEY, code);
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        await acceptPendingInvite();
        navigate({ to: "/friends" });
      } else navigate({ to: "/auth" });
    });
  }, [code, navigate]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
      Joining your friend…
    </div>
  );
}
