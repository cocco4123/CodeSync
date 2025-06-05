const CACHE_NAME = 'editor-colaborativo-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/login.html',
  '/dashboard.html',
  '/favicon.svg',
  '/css/styles.css',
  '/js/theme.js',
  '/js/notifications.js'
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activación y limpieza de caches antiguos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
});

// Estrategia de caché: Network First, fallback to Cache
self.addEventListener('fetch', event => {
  // Solo manejamos peticiones GET
  if (event.request.method !== 'GET') return;

  // Excluimos peticiones a la API y WebSocket
  if (event.request.url.includes('/api/') || event.request.url.includes('/socket.io/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Guardamos una copia en caché
        const responseClone = response.clone();
        caches.open(CACHE_NAME)
          .then(cache => cache.put(event.request, responseClone));
        return response;
      })
      .catch(() => {
        // Si falla la red, intentamos desde caché
        return caches.match(event.request);
      })
  );
});

// Manejo de notificaciones push
self.addEventListener('push', event => {
  const data = event.data.json();
  
  const options = {
    body: data.message,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    vibrate: [100, 50, 100],
    data: {
      url: data.url
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Click en notificación
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
}); 