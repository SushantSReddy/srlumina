import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Public VAPID key — safe to ship to the browser. */
export const VAPID_PUBLIC_KEY =
  "BBXmeq1EST_2eB78TdZ67iXHjCQIzv8UQIaQA5G3lqRCWIXBM5SDFtJd51DoQOisNntn7lQTrbEGJNTN-D-uO3Q";

export const getReminderSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("reminder_enabled, reminder_time, reminder_tz_offset")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return {
      enabled: data?.reminder_enabled ?? false,
      time: (data?.reminder_time ?? "20:00:00").slice(0, 5),
      tzOffset: data?.reminder_tz_offset ?? 0,
    };
  });

export const updateReminderSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        enabled: z.boolean().optional(),
        time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
        tzOffset: z.number().int().min(-840).max(840).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const patch: Record<string, unknown> = {};
    if (data.enabled !== undefined) patch["reminder_enabled"] = data.enabled;
    if (data.time !== undefined) patch["reminder_time"] = `${data.time}:00`;
    if (data.tzOffset !== undefined) patch["reminder_tz_offset"] = data.tzOffset;
    // changing settings clears the "already sent today" marker
    patch["reminder_last_sent_on"] = null;
    const { error } = await context.supabase.from("profiles").update(patch).eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const savePushSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        endpoint: z.string().url().max(2000),
        p256dh: z.string().min(10).max(500),
        auth: z.string().min(4).max(500),
        userAgent: z.string().max(400).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("push_subscriptions").upsert(
      {
        user_id: context.userId,
        endpoint: data.endpoint,
        p256dh: data.p256dh,
        auth: data.auth,
        user_agent: data.userAgent ?? null,
      },
      { onConflict: "endpoint" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deletePushSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ endpoint: z.string().url().max(2000) }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", data.endpoint)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Sends a push to all of the caller's registered devices — used by the Test button. */
export const sendTestPush = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: subs, error } = await context.supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    if (!subs?.length) return { sent: 0 };
    const { sendPush } = await import("./push.server");
    let sent = 0;
    for (const s of subs) {
      const ok = await sendPush(s, {
        title: "Daily study log",
        body: "Test reminder — this is what you'll get each day.",
        url: "/home",
      });
      if (ok) sent += 1;
    }
    return { sent };
  });
