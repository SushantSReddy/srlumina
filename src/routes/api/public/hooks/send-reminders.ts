import { createFileRoute } from "@tanstack/react-router";

/**
 * Cron endpoint: sends the daily study-log push to every user whose local
 * reminder time has passed and who hasn't been reminded yet today.
 */
export const Route = createFileRoute("/api/public/hooks/send-reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = request.headers.get("apikey");
        const allowed = [
          process.env["SUPABASE_ANON_KEY"],
          process.env["SUPABASE_PUBLISHABLE_KEY"],
          process.env["VITE_SUPABASE_PUBLISHABLE_KEY"],
          ...(process.env["SUPABASE_PUBLISHABLE_KEYS"] ?? "").split(","),
          ...(process.env["SUPABASE_ANON_KEYS"] ?? "").split(","),
        ].filter(Boolean);
        if (!key || !allowed.includes(key)) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "content-type": "application/json" },
          });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { sendPush } = await import("@/lib/push.server");

        const { data: profiles, error } = await supabaseAdmin
          .from("profiles")
          .select("id, reminder_time, reminder_tz_offset, reminder_last_sent_on")
          .eq("reminder_enabled", true);
        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }

        const nowUtcMs = Date.now();
        let sent = 0;
        let considered = 0;

        for (const p of profiles ?? []) {
          const local = new Date(nowUtcMs + (p.reminder_tz_offset ?? 0) * 60_000);
          const localDate = local.toISOString().slice(0, 10);
          if (p.reminder_last_sent_on === localDate) continue;

          const [h, m] = String(p.reminder_time ?? "20:00:00").split(":").map(Number);
          const dueMinutes = (h ?? 20) * 60 + (m ?? 0);
          const nowMinutes = local.getUTCHours() * 60 + local.getUTCMinutes();
          // fire within a 2-hour window after the chosen time (avoids day-old bursts)
          if (nowMinutes < dueMinutes || nowMinutes - dueMinutes > 120) continue;

          considered += 1;
          const { data: subs } = await supabaseAdmin
            .from("push_subscriptions")
            .select("endpoint, p256dh, auth")
            .eq("user_id", p.id);
          if (!subs?.length) continue;

          const dead: string[] = [];
          for (const s of subs) {
            const res = await sendPush(s, {
              title: "Daily study log",
              body: "Time to log the questions you solved today.",
              url: "/home",
            });
            if (res.delivered) sent += 1;
            if (!res.keep) dead.push(s.endpoint);
          }
          if (dead.length) {
            await supabaseAdmin.from("push_subscriptions").delete().in("endpoint", dead);
          }
          await supabaseAdmin
            .from("profiles")
            .update({ reminder_last_sent_on: localDate })
            .eq("id", p.id);
        }

        return new Response(JSON.stringify({ ok: true, considered, sent }), {
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
