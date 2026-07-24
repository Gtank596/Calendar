// v22: Shared Calendars V2-V5 — no caching behavior change at all; version
// bump only, so installed clients re-cache the app shell and pick up the new
// script.js/index.html/style.css (V2 invites, mirror layer, flagged editing
// and realtime). Supabase remains strictly network-only and is never cached,
// which already covers all new V2-V5 tables, RPCs, and realtime traffic.
//
// v20: Web Push V2 — added the "push" event handler below (closed-app
// reminders delivered by the send-due-reminders Supabase Edge Function).
// Bumping the version forces a clean shell re-cache on activate so clients
// pick up the new script.js (which contains the push subscription UI).
// Caching behavior is otherwise UNCHANGED: Supabase (auth/REST/Edge
// Functions) remains strictly network-only and is never cached.
//
// v19: Reminders V1 shipped in the app shell; also added the Supabase
// never-cache bypass below and a notificationclick handler. Bumping the
// version forces a clean shell re-cache on activate (local assets are
// cache-first, so without this users could keep running the old script.js).
// v24: Account Privacy follow-up — script.js-only change. After a privacy
// clear, the next login now runs a forced FULL cloud pull (cleared-baseline
// marker) instead of the unclaimed/adoption path, fixing the A->B->A case
// where A's events would not render until a manual Pull. Caching behavior
// unchanged; Supabase remains never-cached.
//
// v23: Account Privacy — script.js-only change (private-by-default account
// switching: logout/switch clears the previous account's local view). Version
// bump forces the shell re-cache so all clients get the fix promptly — this
// matters more than usual because it is a privacy fix. Caching behavior
// unchanged; Supabase remains never-cached.
// v25: Shared Calendars V2 calendar-creation hotfix — script.js change only
// (RPC-first calendar creation, non-fatal refresh when the personal mirror
// calendar can't be created, diagnoseSharedV2Setup() helper). Pair with
// shared-calendars-v2-hotfix2.sql on the database.
// v26: Shared Calendars V5 rollout — script.js/index.html/style.css change.
// V4 editing + V5 realtime are now ON by default; V2/V5 panel is primary and
// the old V1 read-only sharing is collapsed under "Legacy read-only sharing".
// No caching-behavior change; Supabase stays never-cached.
// v27: Shared Calendars UX/accessibility pass — calendar destination picker
// in the normal editor, truthful permission badges in the shared detail
// modal, card sub-lines, aria-labels. script.js/index.html/style.css only.
// v28: Quality Foundation V1 — script.js-only changes: (1) guarded
// ?testMode=1 seam (skips SW registration during browser tests; inert in
// normal use), (2) recurrence DST fix — weekly interval>1 series no longer
// shift a week after a DST change (Math.round on the day diff). Caching
// behavior unchanged; Supabase remains never-cached.
// v29: Trust Layer V1 — index.html/style.css/script.js shell changes (data
// safety & recovery panel, sync status/history dashboard, restore review,
// shared attribution + activity). Caching behavior unchanged; Supabase
// (including the new calendar_activity reads) remains never-cached.
const CACHE_NAME = "my-calendar-pwa-v29";

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

// ============================================================================
// WEB PUSH V2: receive server-sent reminders while the app is CLOSED.
// The Supabase Edge Function `send-due-reminders` sends a small encrypted
// payload (title, when-text, reminder/event/occurrence IDs — never full event
// notes). We display it here.
//
// Dedupe with local Reminders V1: the notification `tag` is the SAME
// deterministic reminder ID V1 uses (v1|eventId|occDate|startMinutes|offset),
// so if the app happens to be open and V1 also fires, the OS collapses the
// two notifications into one instead of showing duplicates.
// ============================================================================
self.addEventListener("push", event => {
  // Defensive parse: a malformed payload must never throw inside the handler.
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (err) {
    payload = {};
  }

  const title = payload.title ? `⏰ ${payload.title}` : "⏰ Reminder";
  const options = {
    body: payload.body || "",
    // Same tag => OS-level dedupe against local Reminders V1 (see note above).
    tag: payload.reminderId || undefined,
    icon: "icons/icon-192.png",
    badge: "icons/icon-192.png",
    // Same data shape V1 uses, so the existing notificationclick handler and
    // any future click-routing work identically for both delivery channels.
    data: {
      reminderId: payload.reminderId || "",
      occDateISO: payload.occDate || "",
      eventId: payload.eventId || ""
    }
  };

  // Browsers require a user-visible notification for every push received
  // with userVisibleOnly:true — always call showNotification.
  event.waitUntil(self.registration.showNotification(title, options));
});

// Reminders V1: clicking a reminder notification focuses an open calendar
// window (or opens one). Display-only for LOCAL reminders — Web Push V2
// notifications (handler above) reuse this same click behavior.
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
