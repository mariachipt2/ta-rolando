const VERSION = "ta-rolando-static-v1";
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((c) =>
        c.addAll([
          "/offline.html",
          "/icons/icon-192.png",
          "/icons/icon-512.png",
        ]),
      ),
  );
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("ta-rolando-") && k !== VERSION)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});
self.addEventListener("fetch", (event) => {
  const u = new URL(event.request.url);
  if (
    u.origin !== self.location.origin ||
    event.request.method !== "GET" ||
    u.pathname.startsWith("/admin") ||
    u.pathname.startsWith("/api") ||
    u.pathname === "/agenda"
  )
    return;
  if (
    u.pathname.startsWith("/_next/static/") ||
    u.pathname.startsWith("/icons/")
  ) {
    event.respondWith(
      caches.open(VERSION).then(async (c) => {
        const cached = await c.match(event.request);
        if (cached) return cached;
        const res = await fetch(event.request);
        if (res.ok) c.put(event.request, res.clone());
        return res;
      }),
    );
    return;
  }
  if (event.request.mode === "navigate")
    event.respondWith(
      fetch(event.request).catch(() => caches.match("/offline.html")),
    );
});
