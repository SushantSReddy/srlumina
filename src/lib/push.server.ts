import { buildPushPayload, type PushSubscription } from "@block65/webcrypto-web-push";

export type StoredSubscription = { endpoint: string; p256dh: string; auth: string };

export type PushBody = { title: string; body: string; url?: string };

/**
 * Sends one web-push message. Returns false when the subscription is gone
 * (410/404) so callers can prune it.
 */
export async function sendPush(sub: StoredSubscription, message: PushBody): Promise<boolean> {
  const vapid = {
    subject: process.env["VAPID_SUBJECT"] || "mailto:reminders@example.com",
    publicKey: process.env["VAPID_PUBLIC_KEY"]!,
    privateKey: process.env["VAPID_PRIVATE_KEY"]!,
  };
  const subscription: PushSubscription = {
    endpoint: sub.endpoint,
    expirationTime: null,
    keys: { p256dh: sub.p256dh, auth: sub.auth },
  };
  try {
    const payload = await buildPushPayload(
      { data: JSON.stringify(message), options: { ttl: 3600 } },
      subscription,
      vapid,
    );
    const res = await fetch(sub.endpoint, payload);
    if (res.status === 404 || res.status === 410) return false;
    if (!res.ok) {
      console.error("push failed", res.status, await res.text());
      return true; // keep subscription; transient failure
    }
    return true;
  } catch (e) {
    console.error("push error", e);
    return true;
  }
}
