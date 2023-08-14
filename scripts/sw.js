// https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Tutorials/CycleTracker/Service_workers
const VERSION = "1.0.0";
const CACHE_NAME = `audio-visualizer-${VERSION}`;
const APP_STATIC_RESOURCES = [
  "/",
  "/index.html",
  "/styles/app.css",
  "/scripts/app.js",
  "/scripts/mic.js",
  "/scripts/Note.js",
  "/scripts/Visualizer.js",
  "/favicon.cio.png",
];
  
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      cache.addAll(APP_STATIC_RESOURCES);
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
      await clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  // when seeking an HTML page
  if (event.request.mode === "navigate") {
    // Return to the index.html page
    event.respondWith(caches.match("/"));
    return;
  }

  // For every other request type
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(event.request);
      if (cachedResponse) {
        // Return the cached response if it's available.
        return cachedResponse;
      } else {
        // Respond with a HTTP 404 response status.
        return new Response(null, { status: 404 });
      }
    })()
  );
});
