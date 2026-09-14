const CACHE_NAME = "linkflow-shell-v2";
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
  if (request.method !== "GET") return;

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
