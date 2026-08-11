import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useDailyReminder } from "@/lib/reminder";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const fallback = useCallback((msg: string) => {
    toast("Daily study log", { description: msg, duration: 8000 });
  }, []);
  useDailyReminder(fallback);
  return <Outlet />;
}
