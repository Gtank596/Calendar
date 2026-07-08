// v19: Reminders V1 shipped in the app shell; also added the Supabase
// never-cache bypass below and a notificationclick handler. Bumping the
// version forces a clean shell re-cache on activate (local assets are
// cache-first, so without this users could keep running the old script.js).
const CACHE_NAME = "my-calendar-pwa-v19";

const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Supabase (auth, REST, and Edge Functions such as the receipt scanner) is
  // network-only and NEVER cached: responses can contain per-user data and
  // must not be served stale or persisted in the cache. Non-GET requests were
  // already skipped above; this also excludes Supabase GETs.
  if (url.hostname.endsWith(".supabase.co") || url.hostname.endsWith(".supabase.in")) {
    return; // let the browser handle it directly, no respondWith, no cache
  }

  // Keep API requests network-first so weather etc. stay fresh.
  // CDN scripts are also cached after first successful load so the installed app
  // can still boot while offline.
  if (url.origin !== self.location.origin) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // HTML navigations: network first, cached app shell if offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put("./index.html", copy));
          return response;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Local assets: cache first, then update cache from network.
  event.respondWith(
    caches.match(request).then(cached => {
      const networkFetch = fetch(request).then(response => {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      }).catch(() => cached);

      return cached || networkFetch;
    })
  );
});

// Reminders V1: clicking a reminder notification focuses an open calendar
// window (or opens one). Display-only — this worker does NOT schedule or
// receive push; there is no "push" handler in V1 by design.
self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if ("focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow("./index.html");
    })
  );
});
