const CACHE_NAME = "squad-v1";
const PRECACHE = ["/", "/index.html"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  // Don't cache OAuth or API requests
  if (e.request.url.includes("/~oauth") || e.request.url.includes("/functions/")) return;
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});

// Push notification handler
self.addEventListener("push", (e) => {
  let data = { title: "Squad", body: "You have a new notification", data: {} };
  try {
    data = e.data?.json() || data;
  } catch (_) {}

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      vibrate: [200, 100, 200],
      data: data.data,
      actions: [{ action: "open", title: "Open" }],
    })
  );
});

// Handle notification click
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const activityId = e.notification.data?.activityId;
  const url = activityId ? `/?openActivity=${activityId}` : "/";

  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin)) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
