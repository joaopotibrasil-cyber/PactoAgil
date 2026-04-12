var CACHE_VERSION = 'v1';
var CACHE_NAME = 'pacto-agil-' + CACHE_VERSION;

self.addEventListener('install', function(event) {
  console.log('[SW] Instalando nova versão do cache:', CACHE_NAME);
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('[SW] Ativando nova versão');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME && cacheName.startsWith('pacto-agil-')) {
            console.log('[SW] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(event) {
  // Deixa o Next.js gerenciar seus próprios chunks
  return;
});
