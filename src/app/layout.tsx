import type { Metadata } from 'next';
import { Inter, Playfair_Display, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const fontSerif = Playfair_Display({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
});

const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Pacto Ágil - Negociações coletivas com inteligência',
  description:
    'Micro-SaaS para sindicatos e escritórios trabalhistas: análise, criação e gestão de ACT e CCT com fluxo inteligente.',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/logo-pacto-agil-new.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/logo-pacto-agil-new.png',
    apple: '/logo-pacto-agil-new.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </head>
      <body className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable} font-sans antialiased bg-background text-foreground min-h-screen relative flex flex-col selection:bg-accent selection:text-accent-foreground overflow-x-hidden`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('pacto-theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (stored === 'dark' || (!stored && prefersDark)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (_) {}
              })();

              /* Service Worker para invalidação de cache após deploy */
              if ('serviceWorker' in navigator) {
                var swCode = \`
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
                \`;

                var blob = new Blob([swCode], { type: 'application/javascript' });
                var swUrl = URL.createObjectURL(blob);

                navigator.serviceWorker.register(swUrl)
                  .then(function(registration) {
                    console.log('[SW] Service Worker registrado:', registration.scope);

                    registration.addEventListener('updatefound', function() {
                      var newWorker = registration.installing;
                      if (newWorker) {
                        newWorker.addEventListener('statechange', function() {
                          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('[SW] Nova versão disponível - recarregando...');
                            window.location.reload();
                          }
                        });
                      }
                    });
                  })
                  .catch(function(error) {
                    console.log('[SW] Erro no registro:', error);
                  });
              }

              /* Correção automática para erro de ChunkLoadError após deploy - com Hard Refresh */
              var CHUNK_RELOAD_KEY = 'pactoagil_chunk_reloaded';
              var CHUNK_RELOAD_TIMESTAMP = 'pactoagil_reload_time';
              var RELOAD_TIMEOUT = 5000; // 5 segundos
              var ERROR_COUNT_KEY = 'pactoagil_error_count';

              // Função para hard refresh real (limpa cache e recarrega)
              function forceHardRefresh() {
                // Limpa caches do service worker se existir
                if ('caches' in window) {
                  caches.keys().then(function(names) {
                    for (var i = 0; i < names.length; i++) {
                      caches.delete(names[i]);
                    }
                  });
                }
                // Limpa storage
                try {
                  sessionStorage.clear();
                  localStorage.removeItem('pacto-theme');
                } catch(_) {}
                // Redireciona para página de refresh forçado
                window.location.href = '/force-refresh.html?ts=' + Date.now();
              }

              // Verifica se já tentou recarregar há menos de 5 segundos (evita loop)
              function canReload() {
                var lastReload = sessionStorage.getItem(CHUNK_RELOAD_TIMESTAMP);
                if (lastReload && Date.now() - parseInt(lastReload) < RELOAD_TIMEOUT) {
                  return false;
                }
                return true;
              }

              // Handler global de erros - detecta scripts 404
              window.addEventListener('error', function(e) {
                // Detecta erro de script 404 (MIME type error ou ChunkLoadError)
                var isScript404 = e.target && e.target.tagName === 'SCRIPT' && e.target.src && e.target.src.includes('_next/static');
                var isChunkLoadError = e.message && (
                  e.message.includes('ChunkLoadError') ||
                  e.message.includes('Loading chunk') ||
                  e.message.includes('Failed to fetch dynamically imported module') ||
                  e.message.includes("MIME type")
                );

                if (isScript404 || isChunkLoadError) {
                  // Conta erros para decidir se faz refresh total
                  var errorCount = parseInt(sessionStorage.getItem(ERROR_COUNT_KEY) || '0') + 1;
                  sessionStorage.setItem(ERROR_COUNT_KEY, errorCount.toString());
                  sessionStorage.setItem(CHUNK_RELOAD_TIMESTAMP, Date.now().toString());

                  if (errorCount >= 1) {
                    console.warn('[PactoÁgil] Script 404 ou ChunkLoadError detectado (' + errorCount + ') - forçando refresh total...');
                    console.warn('[PactoÁgil] Script:', e.target ? e.target.src : 'unknown');
                    forceHardRefresh();
                  }
                }
              });

              // Handler de promises não tratadas
              window.addEventListener('unhandledrejection', function(e) {
                if (e.reason && e.reason.message && (
                  e.reason.message.includes('ChunkLoadError') ||
                  e.reason.message.includes('Loading chunk') ||
                  e.reason.message.includes('Failed to fetch dynamically imported module') ||
                  e.reason.message.includes("MIME type")
                )) {
                  if (canReload()) {
                    console.warn('[PactoÁgil] ChunkLoadError (promise) detectado - forçando refresh...');
                    forceHardRefresh();
                  }
                }
              });

              // Detecta quando o próprio HTML está desatualizado (version mismatch)
              window.addEventListener('load', function() {
                // Se houver erros acumulados do sessionStorage anterior, limpa
                var previousErrors = sessionStorage.getItem(ERROR_COUNT_KEY);
                if (previousErrors && parseInt(previousErrors) > 0) {
                  sessionStorage.removeItem(ERROR_COUNT_KEY);
                }
              });
            `,
          }}
        />
        <div className="bg-noise" />
        <ThemeToggle />
        {children}
      </body>
    </html>
  );
}
