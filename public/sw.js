const CACHE_NAME = 'silverquill-v1';

// 1. Install Event: The browser found this script
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installed');
  self.skipWaiting(); // Take over immediately
});

// 2. Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// 3. Fetch Event: Intercept network requests
self.addEventListener('fetch', (event) => {
  // Ignore Supabase/API calls (let them go to network)
  if (event.request.url.includes('supabase.co')) {
    return;
  }

  // For everything else (HTML, JS, CSS, Images), try Cache first
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version if found
      if (response) {
        return response;
      }
      
      // Otherwise, fetch from network and cache the result for next time
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});