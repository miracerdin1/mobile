const CACHE_NAME = "linkflow-shell-v2";
// Registered on localhost too (Web Push needs it), but never caches there: a
// cached bundle would hide a restarting Metro dev server.
const IS_LOCAL_DEV = ["localhost", "127.0.0.1"].includes(self.location.hostname);
const CACHEABLE_DESTINATIONS = new Set([
  "font",
  "image",
  "manifest",
  "script",
  "style",
]);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.add("/"))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter(
              (cacheName) =>
                cacheName.startsWith("linkflow-shell-") &&
                cacheName !== CACHE_NAME,
            )
            .map((cacheName) => caches.delete(cacheName)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (IS_LOCAL_DEV || request.method !== "GET") return;

  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => (await caches.match("/")) ?? Response.error()),
    );
    return;
  }

  if (requestUrl.search || !CACHEABLE_DESTINATIONS.has(request.destination))
    return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const cacheControl = response.headers.get("Cache-Control") ?? "";
        const cacheAllowed =
          response.ok &&
          response.type === "basic" &&
          !request.headers.has("Authorization") &&
          !/\b(?:no-store|private)\b/i.test(cacheControl);
        if (!cacheAllowed) return response;

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
        return response;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) return cachedResponse;

        return Response.error();
      }),
  );
});

// Web Push from the server (reminders, weekly recap). iOS revokes the
// subscription if a push does not show a notification, so every push shows one.
self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : "" };
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || "LinkFlow", {
      body: payload.body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: payload.tag,
      data: { url: payload.url, route: payload.route },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const { url, route } = event.notification.data || {};

  event.waitUntil(
    (async () => {
      // A saved link opens as is; anything else opens a screen of the app.
      if (url && /^https?:\/\//i.test(url)) {
        await self.clients.openWindow(url);
        return;
      }

      const target = new URL(route || "/", self.location.origin).href;
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const appWindow = windows.find((client) => new URL(client.url).origin === self.location.origin);
      if (appWindow) {
        await appWindow.focus();
        if ("navigate" in appWindow) await appWindow.navigate(target).catch(() => {});
        return;
      }
      await self.clients.openWindow(target);
    })(),
  );
});
