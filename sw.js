/* Scratch Whiteboard: offline support.
   Keeps a copy of the app's own files so it opens with no connection.
   It never stores drawings or pasted pictures. Those live in memory only and vanish when the app closes. */
'use strict';

const CACHE = 'scratch-whiteboard-v3';
const FILES = ['index.html', 'manifest.json', 'icon-180.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];
const fileURL = (name) => new URL(name, self.registration.scope).href;

// Safari won't load a page from a response that followed a redirect, so keep a clean copy.
async function clean(res) {
  if (!res.redirected) return res;
  const body = await res.blob();
  return new Response(body, { status: res.status, statusText: res.statusText, headers: res.headers });
}

// Fetch the latest copy of one app file and keep it for next time.
async function refresh(url) {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) return null;
  const copy = await clean(res);
  const cache = await caches.open(CACHE);
  await cache.put(url, copy.clone());
  return copy;
}

function offlinePage() {
  return new Response(
    '<!DOCTYPE html><meta name="viewport" content="width=device-width, initial-scale=1"><title>Scratch Whiteboard</title>' +
    '<p style="font:17px/1.5 -apple-system, sans-serif; padding: 32px 24px; color: #1c1c1e">' +
    'Connect to the internet once so the whiteboard can save itself for offline use.</p>',
    { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

// The page itself: try the network first so a new version shows straight away,
// but use the saved copy when offline or when the network takes more than 3 seconds.
async function pageResponse(key, fresh) {
  const timeout = new Promise((resolve) => setTimeout(() => resolve(null), 3000));
  const res = await Promise.race([fresh, timeout]);
  if (res) return res;
  const saved = await caches.match(key, { cacheName: CACHE });
  if (saved) return saved;
  return (await fresh) || offlinePage();
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const page = await fetch(fileURL('index.html'), { cache: 'reload' });
    if (!page.ok) throw new Error('Could not save the whiteboard for offline use');
    await cache.put(fileURL('index.html'), await clean(page));
    await Promise.all(FILES.slice(1).map(async (name) => {
      try {
        const res = await fetch(fileURL(name), { cache: 'reload' });
        if (res.ok) await cache.put(fileURL(name), await clean(res));
      } catch (_) { /* icons and the manifest are optional offline */ }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('scratch-whiteboard-') && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const scope = new URL(self.registration.scope);
  if (url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;
  const rel = url.pathname.slice(scope.pathname.length);
  if (req.mode === 'navigate') {
    if (rel !== '' && rel !== 'index.html') return;
    const key = fileURL('index.html');
    const fresh = refresh(key).catch(() => null);
    event.waitUntil(fresh);
    event.respondWith(pageResponse(key, fresh));
    return;
  }
  if (!FILES.includes(rel)) return;   // anything else goes to the network as usual and is never stored
  // Icons and the manifest: answer from the saved copy, and update it in the background when online.
  const key = fileURL(rel);
  const fresh = refresh(key).catch(() => null);
  event.waitUntil(fresh);
  event.respondWith((async () => {
    const saved = await caches.match(key, { cacheName: CACHE });
    return saved || (await fresh) || Response.error();
  })());
});
