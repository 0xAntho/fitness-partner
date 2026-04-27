const CACHE = "fitcoach-v1";
const OFFLINE_URLS = ["/", "/plan", "/metrics", "/review", "/profile", "/import"];
const API_CACHE = "fitcoach-api-v1";
const CACHED_APIS = ["/api/plan/latest", "/api/metrics?limit=90", "/api/coach/review/latest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(OFFLINE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE && k !== API_CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // API routes: network-first, fall back to cache
  if (url.pathname.startsWith("/api/")) {
    const isCacheable = CACHED_APIS.some((p) => url.pathname + url.search === p || url.pathname === p.split("?")[0]);
    if (!isCacheable) return;

    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(API_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Navigation requests: network-first, fall back to cached shell
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match("/") )
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(request).then((cached) => cached ?? fetch(request).then((response) => {
      if (response.ok && (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/"))) {
        const clone = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, clone));
      }
      return response;
    }))
  );
});
