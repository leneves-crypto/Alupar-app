const CACHE_NAME = 'alupar-rns-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Handle push notification events
self.addEventListener('push', event => {
  const data = event.data?.json() || { title: 'Alupar RNS', body: 'Nova atualização do sistema.' };
  
  const options = {
    body: data.body,
    icon: 'https://picsum.photos/seed/alupar/192/192',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '2'
    },
    actions: [
      { action: 'explore', title: 'Abrir App', icon: 'check' },
      { action: 'close', title: 'Fechar', icon: 'x' },
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});
