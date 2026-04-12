'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Tenta detectar ChunkLoadError e fazer um reload agressivo do cache se necessário
    const isChunkError =
      error.message?.includes('ChunkLoadError') ||
      error.message?.includes('Loading chunk') ||
      error.message?.includes('Failed to fetch dynamically imported module');
      
    if (isChunkError) {
      console.warn('GlobalError Boundary capturou um erro de Chunk! Fazendo hard reload...');
      // Quebra de cache para servidores/CDNs que retiveram a versão antiga
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('ts', Date.now().toString());
      window.location.href = currentUrl.toString();
    }
  }, [error]);

  return (
    <html lang="pt-BR">
      <body className="flex items-center justify-center min-h-screen bg-[#04142d] text-white">
        <div className="p-8 max-w-lg text-center space-y-4">
          <h1 className="text-2xl font-bold">Hmm... algo deu errado.</h1>
          <p className="text-white/80">
            A aplicação encontrou um erro crítico ou está passando por uma atualização neste momento.
          </p>
          <button
            onClick={() => {
              const currentUrl = new URL(window.location.href);
              currentUrl.searchParams.set('ts', Date.now().toString());
              window.location.href = currentUrl.toString();
            }}
            className="mt-6 px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition"
          >
            Tentar Carregar Novamente
          </button>
        </div>
      </body>
    </html>
  );
}
