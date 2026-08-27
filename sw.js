// Service worker: cachea toda la app (shell + datos + imagenes de criterios)
// en la instalacion para que funcione 100% offline desde el primer uso, y
// sirve cache-first con relleno en segundo plano (stale-while-revalidate)
// para lo que no estuviera precacheado.

const CACHE_VERSION = "v5";
const CACHE_NAME = `calculadora-normativa-${CACHE_VERSION}`;

const SCOPE = self.registration.scope;
const u = (p) => new URL(p, SCOPE).toString();

const APP_SHELL = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "css/tokens.css",
  "css/app.css",
  "js/app.js",
  "js/router.js",
  "js/nav.js",
  "js/icons.js",
  "js/util/format.js",
  "js/calc/perdidas.js",
  "js/calc/regulacion.js",
  "js/calc/cortocircuito.js",
  "js/views/inicio.js",
  "js/views/perdidas.js",
  "js/views/regulacion.js",
  "js/views/cortocircuito.js",
  "icons/icon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "data/conductores-aereos.json",
  "data/conductores-subterraneos.json",
  "assets/criterios/perdidas-1.jpg",
  "assets/criterios/perdidas-2.jpg",
  "assets/criterios/regulacion-1.jpg",
  "assets/criterios/regulacion-2.jpg",
  "assets/criterios/regulacion-3.jpg",
  "assets/criterios/cortocircuito-1.jpg",
  "assets/criterios/cortocircuito-2.jpg",
].map(u);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
      .catch((err) => console.warn("[sw] fallo precacheando el shell completo:", err))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || !req.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(req);
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
