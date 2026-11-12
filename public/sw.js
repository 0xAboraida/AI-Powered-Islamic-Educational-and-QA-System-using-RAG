// Minimal Service Worker to enable PWA "Add to Home Screen" install prompt
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  // Network-first fallback for navigation requests only (prevents stale asset caching)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(
        () =>
          new Response(
            '<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>زاد</title><body style="font-family:sans-serif;text-align:center;padding:3rem;background:#090b10;color:#fff"><h2>أنت غير متصل بالإنترنت حالياً</h2><p>يرجى التحقق من اتصال الإنترنت ثم إعادة المحاولة.</p></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          )
      )
    )
  }
})

