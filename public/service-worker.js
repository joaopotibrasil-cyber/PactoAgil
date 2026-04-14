/* 
  Service Worker No-Op
  Este arquivo desativa qualquer Service Worker anteriormente registrado (comum em sites migrados do Next.js).
*/

self.addEventListener('install', (event) => {
  // Pula a fase de espera e ativa imediatamente
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Desregistra a si mesmo
  self.registration.unregister()
    .then(() => {
      return self.clients.matchAll({ type: 'window' });
    })
    .then((clients) => {
      // Opcional: Recarrega todas as abas abertas para limpar o cache de memória
      clients.forEach((client) => {
        if (client.url && 'navigate' in client) {
          client.navigate(client.url);
        }
      });
    })
    .catch((err) => {
      console.error('Erro ao desinstalar o Service Worker:', err);
    });
});
