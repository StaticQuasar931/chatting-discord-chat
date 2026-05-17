/* =========================================================================
   Static Chat — Service Worker
   Caches the app shell (HTML, CSS, JS) for offline use.
   ========================================================================= */

const CACHE_VERSION = "sc-v1";
const SHELL_ASSETS = [
  "/chatting-discord-chat/",
  "/chatting-discord-chat/index.html",
  "/chatting-discord-chat/style.css",
  "/chatting-discord-chat/app.js",
  "/chatting-discord-chat/ui.js",
  "/chatting-discord-chat/tips.js",
  "/chatting-discord-chat/firebase.js",
  "/chatting-discord-chat/name-blocklist.js",
  "/chatting-discord-chat/manifest.json",
];

// ── Install: cache app shell ──────────────────────────────────────────────
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => {
      // Cache what we can; don't fail install if external CDN is unavailable
      return Promise.allSettled(
        SHELL_ASSETS.map(url => cache.add(url).catch(() => {}))
      );
    }).then(() => self.skipWaiting())
  );
});

// ── Activate: delete old caches ───────────────────────────────────────────
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: network-first for Firebase, cache-first for shell ─────────────
self.addEventListener("fetch", event => {
  const { request } = event;
  const url = new URL(request.url);

  // Always bypass for Firebase / Google APIs — never cache these
  if (
    url.hostname.includes("firebaseio.com") ||
    url.hostname.includes("firestore.googleapis.com") ||
    url.hostname.includes("googleapis.com") ||
    url.hostname.includes("gstatic.com") ||
    url.hostname.includes("tenor.com") ||
    url.hostname.includes("giphy.com")
  ) {
    return; // let browser handle normally
  }

  // For navigation requests (HTML), try network first then fall back to cache
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(res => {
          // Update cache with fresh response
          const resClone = res.clone();
          caches.open(CACHE_VERSION).then(c => c.put(request, resClone));
          return res;
        })
        .catch(() => caches.match(request).then(r => r || caches.match("/chatting-discord-chat/index.html")))
    );
    return;
  }

  // For app shell assets: cache-first (they change rarely; version bump handles updates)
  if (
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".json") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".ico")
  ) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(res => {
          const resClone = res.clone();
          caches.open(CACHE_VERSION).then(c => c.put(request, resClone));
          return res;
        });
      })
    );
    return;
  }
});

// ── Push notifications (future-ready stub) ───────────────────────────────
self.addEventListener("push", event => {
  if (!event.data) return;
  let data = {};
  try { data = event.data.json(); } catch(_) { data = { title: "Static Chat", body: event.data.text() }; }
  event.waitUntil(
    self.registration.showNotification(data.title || "Static Chat", {
      body: data.body || "New message",
      icon: "https://cdn.jsdelivr.net/gh/StaticQuasar931/Images@main/icon.png",
      badge: "https://cdn.jsdelivr.net/gh/StaticQuasar931/Images@main/icon.png",
      tag: data.tag || "sc-message",
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
      const existing = list.find(w => w.url.includes("chatting-discord-chat"));
      if (existing) return existing.focus();
      return clients.openWindow(event.notification.data?.url || "/chatting-discord-chat/");
    })
  );
});
