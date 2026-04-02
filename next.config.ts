import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Otimização de imagens
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 dias
  },

  // Compressão
  compress: true,

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
      img-src 'self' blob: data: https://*.stripe.com https://*.supabase.co;
      font-src 'self' https://fonts.gstatic.com;
      connect-src 'self' https://*.stripe.com https://*.supabase.co https://api.resend.com https://api.groq.com;
      frame-src 'self' https://js.stripe.com https://checkout.stripe.com https://*.supabase.co;
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
};

export default nextConfig;
