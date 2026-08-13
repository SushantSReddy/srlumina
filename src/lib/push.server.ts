import { buildPushPayload, type PushSubscription } from "@block65/webcrypto-web-push";

export type StoredSubscription = { endpoint: string; p256dh: string; auth: string };

export type PushBody = { title: string; body: string; url?: string };

export type PushResult = {
  /** false only when the subscription is gone (404/410) and should be pruned */
  keep: boolean;
  delivered: boolean;
  status?: number;
  error?: string;
};

/** Sends one web-push message and reports what the push service answered. */
export async function sendPush(sub: StoredSubscription, message: PushBody): Promise<PushResult> {
  const publicKey = process.env["VAPID_PUBLIC_KEY"];
  const privateKey = process.env["VAPID_PRIVATE_KEY"];
  if (!publicKey || !privateKey) {
    console.error("push: VAPID keys are not configured");
    return { keep: true, delivered: false, error: "Push keys are not configured on the server." };
  }
  const vapid = {
    subject: process.env["VAPID_SUBJECT"] || "mailto:reminders@example.com",
    publicKey,
    privateKey,
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
    const res = await fetch(sub.endpoint, payload as unknown as RequestInit);
    if (res.status === 404 || res.status === 410) {
      console.error("push: subscription expired", res.status, sub.endpoint.slice(0, 60));
      return { keep: false, delivered: false, status: res.status };
    }
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("push failed", res.status, text.slice(0, 300), sub.endpoint.slice(0, 60));
      return { keep: true, delivered: false, status: res.status, error: text.slice(0, 200) };
    }
    return { keep: true, delivered: true, status: res.status };
  } catch (e) {
    console.error("push error", e);
    return { keep: true, delivered: false, error: e instanceof Error ? e.message : String(e) };
  }
}
