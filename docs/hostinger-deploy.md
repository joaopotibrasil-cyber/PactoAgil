# Deploy na Hostinger (Node.js Web App)

Este projeto é **Astro SSR** com adapter **`@astrojs/node`** em modo **`standalone`**: o comando `npm run start` sobe um servidor HTTP a partir de `dist/server/entry.mjs`.

## Definições no hPanel (Deployments → Settings)

| Campo | Valor recomendado |
|--------|-------------------|
| **Node.js** | **20.x** (LTS; alinhado a `engines` no `package.json`) |
| **Install command** | `npm ci` (com `package-lock.json` no repositório) ou `npm install` |
| **Build command** | `npm run build` |
| **Start command** | `npm run start` |
| **Diretório de output** (se pedido) | `dist` — confirme na documentação atual do painel; o runtime usa o script `start`, não só ficheiros estáticos |

## Variáveis de ambiente

Configure no painel da aplicação Node (não commite segredos):

- **`DATABASE_URL`** — URL PostgreSQL (obrigatório em produção para a app e para o Prisma em runtime).
- Outras variáveis que o projeto use (`PUBLIC_*`, Supabase, Stripe, etc.), conforme o vosso `.env` local.

A plataforma costuma definir **`PORT`**; o servidor Astro usa `process.env.PORT` quando existe.

## Checklist se o build falhar

1. **Log completo** do deploy — copie desde `npm ci` até ao primeiro `Error`.
2. **Branch** — confirme que o deploy aponta para o branch com `package.json` e `package-lock.json` atualizados.
3. **`DATABASE_URL`** — mesmo que o build só precise de `prisma generate`, convém ter as variáveis críticas definidas para evitar diferenças face ao CI local.

## Checklist se o site não abrir após “sucesso”

1. Modo **`standalone`** e `server.host` no `astro.config.mjs` — necessário para o processo escutar corretamente atrás do proxy.
2. Comando de arranque **`npm run start`** (não apenas `node` sem o caminho do `package.json`).
