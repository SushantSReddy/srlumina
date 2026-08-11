import { useCallback, useEffect, useState } from "react";

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

/**
 * Local daily study-log reminder. Fires a browser notification (with in-app
 * fallback) at a fixed time while the app is open in a tab.
 */
export function useDailyReminder(onFallback?: (msg: string) => void) {
  const [enabled, setEnabled] = useState(false);
  const [time, setTime] = useState("20:00");
  const [permission, setPermission] = useState<ReminderState["permission"]>("unsupported");

  useEffect(() => {
    setEnabled(localStorage.getItem(KEY_ENABLED) === "1");
    setTime(localStorage.getItem(KEY_TIME) ?? "20:00");
    setPermission(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
  }, []);

  const setTimeValue = useCallback((t: string) => {
    setTime(t);
    localStorage.setItem(KEY_TIME, t);
  }, []);

  const toggle = useCallback(async (next: boolean) => {
    if (next && typeof Notification !== "undefined" && Notification.permission === "default") {
      const p = await Notification.requestPermission();
      setPermission(p);
    }
    setEnabled(next);
    localStorage.setItem(KEY_ENABLED, next ? "1" : "0");
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const check = () => {
      const [h, m] = time.split(":").map(Number);
      const now = new Date();
      const due = now.getHours() > h! || (now.getHours() === h! && now.getMinutes() >= m!);
      if (!due) return;
      if (localStorage.getItem(KEY_LAST) === today()) return;
      localStorage.setItem(KEY_LAST, today());
      const body = "Time to log the questions you solved today.";
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification("Daily study log", { body, icon: "/favicon.ico" });
      } else {
        onFallback?.(body);
      }
    };
    check();
    const id = window.setInterval(check, 30_000);
    return () => window.clearInterval(id);
  }, [enabled, time, onFallback]);

  return { enabled, time, permission, setTime: setTimeValue, toggle };
}
