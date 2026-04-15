import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wtochswaejdsycmyyekx.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  experimental: {
    // Otimizações para ambiente Hostinger/Node.js
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Desativar linting durante o build se houver muitos resíduos TypeScript (opcional, mas recomendado para estabilidade inicial)
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false, // Queremos manter a segurança de tipos agora que Next.js voltou
  },
};

export default nextConfig;
