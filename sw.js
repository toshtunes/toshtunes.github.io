/* global self, caches, fetch, Response, URL */
// ToshTunes on the phone opens without internet: this keeps the app's own files on the phone.
// The page itself is always asked for fresh first (so updates arrive the moment they're out) and
// comes from the phone only when offline. Everything else from this site (the app's code, fonts,
// icons and the Japanese dictionary) has a version in its name or never changes, so the phone's
// copy is used once it has one. Spotify, LRCLIB and covers are never stored here.
const CACHE = 'toshtunes-v1'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    // The page: fresh when online (sign-in answers come back here too), the phone's copy offline.
    event.respondWith(
      fetch(request, { cache: 'no-cache' })
        .then((res) => {
          if (res.ok) {
            const copy = res.clone()
            void caches.open(CACHE).then((c) => c.put('/', copy))
          }
          return res
        })
        .catch(() => caches.match('/').then((r) => r ?? Response.error()))
    )
    return
  }

  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ??
        fetch(request).then((res) => {
          if (res.ok) {
            const copy = res.clone()
            void caches.open(CACHE).then((c) => c.put(request, copy))
          }
          return res
        })
    )
  )
})
