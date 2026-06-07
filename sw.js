const CACHE_NAME = "ecoderm-pwa-v2";

const APP_ASSETS = [
  "./",
  "./index.html",
  "./shop.html",
  "./gallery.html",
  "./team.html",
  "./contact.html",
  "./delivery.html",
  "./payment.html",
  "./face-scan.html",
  "./styles.css",
  "./script.js",
  "./manifest.json",
  "./ecoderm-logo.jpg",
  "./app-icon-192.jpg",
  "./app-icon-512.jpg",
  "./immunity-shot.jpg",
  "./glow-shot.jpg",
  "./lip-balm.jpg",
  "./face-scrub.jpg",
  "./aloe-vera-gel.jpg",
  "./armpit-odor-cream.jpg",
  "./face-mask.jpg",
  "./tan-remover-scrub.jpg",
  "./gallery-face-scrub.jpg",
  "./gallery-face-mask.jpg",
  "./gallery-aloe-gel.jpg",
  "./gallery-lip-balm.jpg",
  "./gallery-shots.jpg",
  "./gallery-armpit-cream.jpg",
  "./gallery-body-scrub.jpg",
  "./gallery-routine-kit.jpg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_ASSETS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(() => caches.match("./index.html"));
    }),
  );
});
