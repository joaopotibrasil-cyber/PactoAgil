/**
 * Arquivo de entrada para a plataforma Hostinger (Node.js SSR)
 * Importa o entry gerado pelo Astro após `npm run build`.
 *
 * Usa caminho absoluto a partir deste ficheiro — alguns hosts mudam o CWD ao arrancar.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const entryPath = join(__dirname, 'dist', 'server', 'entry.mjs');
const entryUrl = pathToFileURL(entryPath).href;

console.log("[PactoAgil] Arranque Astro SSR (@astrojs/node) — não é Next.js");
console.log("[PactoAgil] Entry:", entryPath);

import(entryUrl).catch((err) => {
  console.error(
    '[PactoAgil] Falha ao carregar dist/server/entry.mjs. Corra "npm run build" nesta pasta e confirme que o diretório raiz no hPanel é ./',
  );
  console.error(err);
  process.exit(1);
});
