// Service worker: tiene una copia dell'app sul telefono così funziona anche senza rete.
// Strategia "prima la rete": se sei online prendi sempre l'ultima versione (e la copia si aggiorna),
// se sei offline usi la copia salvata.
const CACHE = 'impasti-v4';
const FILES = ['./', './index.html', './manifest.webmanifest',
               './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  // Solo i file dell'app: il foglio Google e altri siti passano senza toccarli.
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  // cache 'no-cache': chiede sempre al sito se c'è una versione nuova, invece di usare
  // la copia del browser (che su GitHub Pages può restare vecchia per 10 minuti).
  e.respondWith(
    fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' })
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true })
        .then((hit) => hit || (req.mode === 'navigate' ? caches.match('./index.html') : undefined)))
  );
});
