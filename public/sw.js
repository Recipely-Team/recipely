/*
 * Recipely's service worker.
 *
 * It exists for two reasons, and it is deliberately small enough to be sure of
 * both:
 *
 *   1. Chrome will not offer to install a site without a service worker that
 *      has a NON-EMPTY fetch handler — the check is a proxy for "this site does
 *      something when you are offline", and Chrome ignores handlers that do
 *      nothing, precisely because sites added empty ones to game it.
 *   2. A navigation made with no connection should land on something that says
 *      so in the app's own voice, not on the browser's dinosaur.
 *
 * WHAT IT DELIBERATELY DOES NOT DO: cache the app itself. The bundle is hashed
 * and served immutable, and a shell cached here would be a second, staler copy
 * of the app with its own lifetime — the classic PWA failure where a user is
 * pinned to a build from three deploys ago and no reload frees them. Only
 * navigations are intercepted, and only to fall back when the network fails, so
 * this worker can never serve a stale screen.
 */

/* Bumping this name is what retires the previous cache — see `activate`. */
const CACHE = 'recipely-offline-v3';
const OFFLINE_URL = '/offline.html';

/* Just the fallback page: it inlines its own icon, so it has no subresource to
   fetch — which matters, because this worker leaves non-navigations alone and
   a linked image would simply fail. */
const PRECACHE = [OFFLINE_URL];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      // Take over straight away rather than waiting for every tab to close: the
      // only thing this worker controls is an offline fallback, so there is no
      // half-updated state for an early activation to catch.
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(names.filter((name) => name !== CACHE).map((name) => caches.delete(name))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  // Navigations only. Everything else — the bundle, images, API calls — is left
  // to the browser, which is the whole point: no copy of the app lives here.
  if (event.request.mode !== 'navigate') return;

  event.respondWith(
    fetch(event.request).catch(async () => {
      const cached = await caches.match(OFFLINE_URL);
      return (
        cached ??
        new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } })
      );
    }),
  );
});
