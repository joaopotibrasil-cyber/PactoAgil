import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';

// https://astro.build/config
// Hostinger (e a maioria dos hosts Node): usar standalone para o entry iniciar o HTTP.
// middleware só exporta handler — exigiria Express/Fastify à parte.
export default defineConfig({
  server: {
    // Escuta em todas as interfaces; necessário atrás do proxy reverso da hospedagem
    host: true,
  },
  integrations: [react()],
  adapter: node({ mode: 'standalone' }),
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      external: ['@prisma/client'],
    },
    resolve: {
      alias: {
        '@': '/src',
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (id.includes("react") || id.includes("scheduler")) return "vendor-react";
              if (id.includes("lucide-react") || id.includes("framer-motion")) return "vendor-ui";
              if (id.includes("docx") || id.includes("mammoth")) return "vendor-docs";
              if (id.includes("@supabase")) return "vendor-supabase";
            }
          },
        },
      },
    },
  },
  output: 'server',
});
