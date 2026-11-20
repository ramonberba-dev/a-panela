/* Service worker da Panela: guarda os arquivos para abrir rápido e funcionar sem internet. Troque VERSAO a cada publicação. */
const VERSAO = "panela-202611201842";
const ARQS = ["./", "./index.html", "./estilo.css", "./dados.js", "./testes.js", "./app.js", "./temperos.json", "./fundo.svg", "./panela-fundo.jpg", "./logo-h-web.jpg",
  "./avatares/tubarao.png", "./avatares/gato.png", "./avatares/lobo.png", "./avatares/aguia.png", "./icone-192.png", "./icone-512.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(VERSAO).then((c) => c.addAll(ARQS))); self.skipWaiting(); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSAO).map((k) => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then((r) => { const c = r.clone(); caches.open(VERSAO).then((k) => k.put(e.request, c)); return r; }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
