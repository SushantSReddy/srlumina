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
        const { getQuoteForDateKey } = await import("@/lib/quotes");


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
          // the job ticks every 5 min: allow firing up to 4 min early so a
          // reminder lands on (or just before) its time instead of minutes late
          if (nowMinutes < dueMinutes - 4 || nowMinutes - dueMinutes > 120) continue;

          considered += 1;
          const { data: subs } = await supabaseAdmin
            .from("push_subscriptions")
            .select("endpoint, p256dh, auth")
            .eq("user_id", p.id);
          if (!subs?.length) continue;

          const dead: string[] = [];
          let delivered = 0;
          const quote = getQuoteForDateKey(localDate);
          for (const s of subs) {
            const res = await sendPush(s, {
              title: `"${quote.text}"`,
              body: `— ${quote.author}\nLog the questions you solved today.`,
              url: "/home",
            });

            if (res.delivered) {
              sent += 1;
              delivered += 1;
            }
            if (!res.keep) dead.push(s.endpoint);
          }
          if (dead.length) {
            await supabaseAdmin.from("push_subscriptions").delete().in("endpoint", dead);
          }
          // only mark the day as done when a device actually accepted it,
          // so a transient failure retries on the next 5-minute tick
          if (delivered > 0) {
            await supabaseAdmin
              .from("profiles")
              .update({ reminder_last_sent_on: localDate })
              .eq("id", p.id);
          }
        }

        // ---- per-task reminders (same tick, same 5-minute cron) ----
        let taskSent = 0;
        const { data: tasks } = await supabaseAdmin
          .from("tasks")
          .select("id, user_id, title, due_on, due_time, reminder_time, reminder_last_sent_on, completed_at")
          .is("completed_at", null)
          .not("reminder_time", "is", null);

        const offsets = new Map<string, number>();
        for (const p of profiles ?? []) offsets.set(p.id, p.reminder_tz_offset ?? 0);

        for (const t of tasks ?? []) {
          let offset = offsets.get(t.user_id);
          if (offset === undefined) {
            const { data: prof } = await supabaseAdmin
              .from("profiles")
              .select("reminder_tz_offset")
              .eq("id", t.user_id)
              .maybeSingle();
            offset = prof?.reminder_tz_offset ?? 0;
            offsets.set(t.user_id, offset);
          }
          const local = new Date(nowUtcMs + offset * 60_000);
          const localDate = local.toISOString().slice(0, 10);
          if (t.reminder_last_sent_on === localDate) continue;
          if (t.due_on && t.due_on !== localDate) continue;

          const [th, tm] = String(t.reminder_time).split(":").map(Number);
          const dueMinutes = (th ?? 0) * 60 + (tm ?? 0);
          const nowMinutes = local.getUTCHours() * 60 + local.getUTCMinutes();
          if (nowMinutes < dueMinutes || nowMinutes - dueMinutes > 60) continue;

          const { data: subs } = await supabaseAdmin
            .from("push_subscriptions")
            .select("endpoint, p256dh, auth")
            .eq("user_id", t.user_id);
          if (!subs?.length) continue;

          const dead: string[] = [];
          let delivered = 0;
          for (const s of subs) {
            const res = await sendPush(s, {
              title: "Task reminder",
              body: t.title,
              url: "/tasks",
            });
            if (res.delivered) {
              taskSent += 1;
              delivered += 1;
            }
            if (!res.keep) dead.push(s.endpoint);
          }
          if (dead.length) {
            await supabaseAdmin.from("push_subscriptions").delete().in("endpoint", dead);
          }
          if (delivered > 0) {
            await supabaseAdmin
              .from("tasks")
              .update({ reminder_last_sent_on: localDate })
              .eq("id", t.id);
          }
        }

        return new Response(JSON.stringify({ ok: true, considered, sent, taskSent }), {
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
