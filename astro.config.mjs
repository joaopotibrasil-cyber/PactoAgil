import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  adapter: node({ mode: 'middleware' }),
  vite: {
    plugins: [tailwindcss()],
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
