/* Push messaging service worker (not an app-shell cache). */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "Daily study log", body: event.data ? event.data.text() : "" };
  }
  const title = payload.title || "Daily study log";
  const options = {
    body: payload.body || "Time to log the questions you solved today.",
    icon: payload.icon || "/icon-192.png",
    badge: "/icon-192.png",
    tag: "daily-study-log",
    renotify: true,
    data: { url: payload.url || "/home" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/home";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
