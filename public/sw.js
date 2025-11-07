// Simple service worker: app shell cache + offline navigation fallback
const CACHE_NAME = 'panier-cache-v1'
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  const url = new URL(req.url)

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return

  // For navigations, try network first, fall back to cache → /index.html
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(async () => {
        const cache = await caches.open(CACHE_NAME)
        const cached = await cache.match('/index.html')
        return cached || Response.error()
      })
    )
    return
  }

  // For static assets, cache-first
  if (req.method === 'GET') {
    event.respondWith(
      caches.match(req).then((resp) => resp || fetch(req).then((net) => {
        const copy = net.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(()=>{})
        return net
      }))
    )
  }
})
