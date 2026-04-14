var CACHE_VERSION = 'v2';
var CACHE_NAME = 'pacto-agil-' + CACHE_VERSION;

self.addEventListener('install', function(event) {
  console.log('[SW] Instalando nova versão do cache:', CACHE_NAME);
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('[SW] Ativando nova versão e limpando caches antigos');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Removendo cache absoluto:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      // Força o SW a tomar controle de todas as abas abertas imediatamente
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(event) {
  const url = event.request.url;
  
  // Bloquear requisições para o diretório do Next.js
  if (url.includes('_next/')) {
    console.log('[SW] Bloqueando requisição legada do Next.js:', url);
    event.respondWith(
      new Response('Legacy Next.js asset blocked for cache purge', {
        status: 410,
        statusText: 'Gone'
      })
    );
    return;
  }

  // Deixa o navegador processar as demais requisições normalmente
  return;
});
