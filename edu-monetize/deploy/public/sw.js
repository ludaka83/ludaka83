self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  event.respondWith(
    caches.open("v1").then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) return cached;
      try {
        const response = await fetch(request);
        if (response && response.status === 200 && response.type === "basic") {
          cache.put(request, response.clone());
        }
        return response;
      } catch (e) {
        return cached || Response.error();
      }
    })
  );
});