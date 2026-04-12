import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Otimização de imagens
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 dias
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      }
    ],
  },

  // Compressão
  compress: true,

  // Impedir bundling do Prisma pelo Turbopack para evitar erro do Edge Runtime
  serverExternalPackages: ['@prisma/client', 'prisma'],

  // Performance
  poweredByHeader: false,

  // Redirecionamentos de segurança
  async redirects() {
    return [
      {
        source: '/\\sitemap.xml',
        destination: '/sitemap.xml',
        permanent: true,
      },
    ];
  },

  // Headers de segurança
  async headers() {
    const cspHeader = `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.stripe.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      img-src 'self' blob: data: https://*.stripe.com https://*.supabase.co https://images.unsplash.com;
      font-src 'self' https://fonts.gstatic.com;
      connect-src 'self' https://*.stripe.com https://*.supabase.co https://api.resend.com https://api.groq.com;
      frame-src 'self' https://js.stripe.com https://checkout.stripe.com https://*.supabase.co;
      worker-src 'self' blob:;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      upgrade-insecure-requests;
    `.replace(/\s+/g, ' ').trim();

    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader,
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      // Headers para prevenir cache de chunks JavaScript após deploy
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Evitar que servidores agressivos (ex: LiteSpeed Cache no Hostinger)
      // salvem e entreguem páginas HTML antigas que dependem de chunks JavaScript deletados
      {
        source: '/((?!_next/static|_next/image|favicon.ico|manifest.json).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
          {
            key: 'X-LiteSpeed-Cache-Control',
            value: 'no-cache',
          },
        ],
      },
      // Headers específicos para webhooks (sem CSP para permitir chamadas externas)
      {
        source: '/api/webhook/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },

  // Configurações de build
  typescript: {
    ignoreBuildErrors: false,
  },

  // Experimental features
  experimental: {
    optimizeCss: true,
  },

  // Transpilar pacotes ESM problemáticos
  transpilePackages: ["mammoth", "docx"],
};


export default nextConfig;
