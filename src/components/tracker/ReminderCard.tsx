import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { BellRing } from "lucide-react";
import {
  deletePushSubscription,
  getReminderSettings,
  savePushSubscription,
  sendTestPush,
  updateReminderSettings,
} from "@/lib/push.functions";
import {
  getExistingSubscription,
  isIOS,
  isStandalone,
  pushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push-client";
import { useDailyReminder } from "@/lib/reminder";

/** Daily reminder controls: server-scheduled push + in-app fallback. */
export function ReminderCard() {
  const qc = useQueryClient();
  const getSettings = useServerFn(getReminderSettings);
  const saveSettings = useServerFn(updateReminderSettings);
  const saveSub = useServerFn(savePushSubscription);
  const delSub = useServerFn(deletePushSubscription);
  const testPush = useServerFn(sendTestPush);
  const local = useDailyReminder();

  const settingsQ = useQuery({ queryKey: ["reminder-settings"], queryFn: () => getSettings() });
  const [time, setTime] = useState("20:00");
  const [pushOn, setPushOn] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (settingsQ.data) {
      setTime(settingsQ.data.time);
      local.setLocal({ enabled: settingsQ.data.enabled, time: settingsQ.data.time });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsQ.data]);

  useEffect(() => {
    void getExistingSubscription().then((s) => setPushOn(!!s));
  }, []);

  const save = useMutation({
    mutationFn: (patch: { enabled?: boolean; time?: string }) =>
      saveSettings({
        data: { ...patch, tzOffset: -new Date().getTimezoneOffset() },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reminder-settings"] }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't save"),
  });

  const enabled = settingsQ.data?.enabled ?? false;

  async function toggleReminder(next: boolean) {
    local.setLocal({ enabled: next });
    save.mutate({ enabled: next });
    if (next && !pushOn) await enablePush();
  }

  async function enablePush() {
    if (!pushSupported()) {
      toast.error("This browser can't receive background notifications.");
      return;
    }
    if (isIOS() && !isStandalone()) {
      toast("Add to Home Screen first", {
        description: "On iPhone, tap Share → Add to Home Screen, open the app from there, then turn this on.",
        duration: 9000,
      });
      return;
    }
    setBusy(true);
    try {
      const sub = await subscribeToPush();
      await saveSub({ data: sub });
      setPushOn(true);
      toast.success("Notifications on for this device");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't enable notifications");
    } finally {
      setBusy(false);
    }
  }

  async function disablePush() {
    setBusy(true);
    try {
      const endpoint = await unsubscribeFromPush();
      if (endpoint) await delSub({ data: { endpoint } });
      setPushOn(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm">Remind me to log</span>
        <Switch checked={enabled} onChange={(v) => void toggleReminder(v)} />
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">Time</span>
        <input
          type="time"
          value={time}
          onChange={(e) => {
            setTime(e.target.value);
            local.setLocal({ time: e.target.value });
          }}
          onBlur={() => time !== settingsQ.data?.time && save.mutate({ time })}
          className="bg-transparent text-sm font-semibold tabular-nums outline-none text-right"
        />
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
        <div>
          <div className="text-sm">Notify when app is closed</div>
          <div className="text-xs text-muted-foreground">
            {pushOn ? "This device is registered." : "Turn on for this phone or browser."}
          </div>
        </div>
        <Switch
          checked={pushOn}
          disabled={busy}
          onChange={(v) => void (v ? enablePush() : disablePush())}
        />
      </div>

      <div className="flex items-center justify-between gap-3 pt-1">
        <p className="text-xs text-muted-foreground">
          {isIOS() && !isStandalone()
            ? "On iPhone, add the app to your Home Screen to receive notifications."
            : "Reminders are sent from the server, so they arrive even if the app is closed."}
        </p>
        <button
          onClick={async () => {
            try {
              const res = await testPush();
              if (res.sent > 0) toast.success(`Test sent to ${res.sent} device${res.sent > 1 ? "s" : ""}`);
              else if (res.failed > 0)
                toast.error("Push was rejected", {
                  description: res.error ?? "Turn notifications off and on again to re-register this device.",
                });
              else toast("No registered devices", { description: "Turn on notifications for this device first." });
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Couldn't send test");
            }
          }}
          className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs font-semibold tap active:tap-active inline-flex items-center gap-1.5"
        >
          <BellRing className="h-3.5 w-3.5" /> Test
        </button>
      </div>
    </div>
  );
}

function Switch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
        checked ? "bg-[var(--ios-green)]" : "bg-muted"
      }`}
    >
      <span
        className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all"
        style={{ left: checked ? 22 : 2 }}
      />
    </button>
  );
}
