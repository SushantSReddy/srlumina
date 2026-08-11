import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

const KEY_ENABLED = "reminder-enabled";
const KEY_TIME = "reminder-time";
const KEY_LAST = "reminder-last-fired";

export type ReminderState = {
  enabled: boolean;
  time: string;
  permission: NotificationPermission | "unsupported";
};

function today() {
  return new Date().toDateString();
}

/* ---------------- shared store (single source of truth across components) --------------- */

let state: { enabled: boolean; time: string } = { enabled: false, time: "20:00" };
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  state = {
    enabled: localStorage.getItem(KEY_ENABLED) === "1",
    time: localStorage.getItem(KEY_TIME) ?? "20:00",
  };
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY_ENABLED || e.key === KEY_TIME) {
      hydrated = false;
      hydrate();
      emit();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

const serverSnapshot = { enabled: false, time: "20:00" };
function getSnapshot() {
  hydrate();
  return state;
}

function setState(next: Partial<typeof state>) {
  state = { ...state, ...next };
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY_ENABLED, state.enabled ? "1" : "0");
    localStorage.setItem(KEY_TIME, state.time);
  }
  emit();
}

function fire(body: string, onFallback?: (msg: string) => void) {
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    try {
      new Notification("Daily study log", { body, icon: "/favicon.ico" });
      return;
    } catch {
      /* some mobile browsers require a service worker — fall through */
    }
  }
  onFallback?.(body);
}

const MESSAGE = "Time to log the questions you solved today.";

/* ---------------------------------- hook ---------------------------------- */

/**
 * Local daily study-log reminder. Fires a browser notification (with in-app
 * fallback) at the chosen time while the app is open in a tab. State is shared
 * across every component that calls this hook.
 */
export function useDailyReminder(onFallback?: (msg: string) => void) {
  const { enabled, time } = useSyncExternalStore(subscribe, getSnapshot, () => serverSnapshot);
  const [permission, setPermission] = useState<ReminderState["permission"]>("unsupported");

  useEffect(() => {
    setPermission(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
  }, []);

  const setTime = useCallback((t: string) => setState({ time: t }), []);

  const toggle = useCallback(async (next: boolean) => {
    if (next && typeof Notification !== "undefined" && Notification.permission === "default") {
      try {
        setPermission(await Notification.requestPermission());
      } catch {
        /* ignore */
      }
    } else if (typeof Notification !== "undefined") {
      setPermission(Notification.permission);
    }
    if (next) {
      // don't instantly fire if today's time already passed when turning it on
      const [h, m] = state.time.split(":").map(Number);
      const now = new Date();
      const passed = now.getHours() > h! || (now.getHours() === h! && now.getMinutes() >= m!);
      if (passed) localStorage.setItem(KEY_LAST, today());
      else localStorage.removeItem(KEY_LAST);
    }
    setState({ enabled: next });
  }, []);

  const test = useCallback(() => fire(MESSAGE, onFallback), [onFallback]);

  useEffect(() => {
    if (!enabled || !onFallback) return; // only the mounted app shell schedules
    const check = () => {
      const [h, m] = time.split(":").map(Number);
      if (Number.isNaN(h) || Number.isNaN(m)) return;
      const now = new Date();
      const due = now.getHours() > h! || (now.getHours() === h! && now.getMinutes() >= m!);
      if (!due) return;
      if (localStorage.getItem(KEY_LAST) === today()) return;
      localStorage.setItem(KEY_LAST, today());
      fire(MESSAGE, onFallback);
    };
    check();
    const id = window.setInterval(check, 20_000);
    return () => window.clearInterval(id);
  }, [enabled, time, onFallback]);

  return { enabled, time, permission, setTime, toggle, test };
}
