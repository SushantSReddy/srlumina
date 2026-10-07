import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const PENDING_INVITE_KEY = "solve-pending-invite";

/** Accepts an invite saved from an /invite link once the user is signed in. */
export async function acceptPendingInvite() {
  const code = localStorage.getItem(PENDING_INVITE_KEY);
  if (!code) return;
  localStorage.removeItem(PENDING_INVITE_KEY);
  const { data, error } = await supabase.rpc("add_friend_by_code", { _code: code });
  if (error) toast.error(error.message);
  else if (data) toast.success(`You and ${data} are now friends`);
}
