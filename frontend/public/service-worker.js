const CACHE = "restolog-v1";
const ASSETS = ["/", "/index.html", "/manifest.json", "/icons/icon-192.svg", "/icons/icon-512.svg"];

// Instalar: cachear app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Activar: limpiar caches viejos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
});

// Interceptar fetch: cache first para assets, network first para API
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Solo interceptar nuestro origen
  if (url.origin !== self.location.origin) return;

  // API: network first, fallback a cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Assets: cache first
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((res) => {
      const clone = res.clone();
      caches.open(CACHE).then((cache) => cache.put(event.request, clone));
      return res;
    }))
  );
});

// Push notifications
self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};
  const title = data.titulo || "RestoLogistics";
  self.registration.showNotification(title, {
    body: data.mensaje || "",
    icon: "/icons/icon-192.svg",
    badge: "/icons/icon-192.svg",
    vibrate: [200, 100, 200],
    data: { url: data.url || "/" },
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(clients.openWindow(url));
});
