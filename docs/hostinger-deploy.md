# Deploy na Hostinger (Node.js Web App)

Este projeto é **Astro SSR** com adapter **`@astrojs/node`** em modo **`standalone`**: o comando `npm run start` sobe um servidor HTTP a partir de `dist/server/entry.mjs`.

## Definições no hPanel (Deployments → Settings)

| Campo | Valor recomendado |
|--------|-------------------|
| **Node.js** | **20.x** (LTS; alinhado a `engines` no `package.json`) |
| **Install command** | `npm ci` (com `package-lock.json` no repositório) ou `npm install` |
| **Build command** | `npm run build` |
| **Start command** | `npm run start` |
| **Diretório de output** | `dist` |
| **Arquivo de entrada** | `server.mjs` (obrigatório para validar no hPanel sem erros). |
| **Preset / framework** | **Astro** (correto para este repositório). |

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

## Os logs de execução mostram “Next.js”?

Se nos **logs em tempo real** aparecer `▲ Next.js` ou `Ready in …ms` típico do Next, **não é este projeto Astro** que está a correr. O painel está a arrancar **outra aplicação** (repositório antigo em Next ou outro site Node).

**O que fazer:**

1. Em **Websites**, confirma **qual** site Node está associado ao domínio **pactoagil.com.br** (pode haver **dois** sites: um Next antigo e um Astro novo).
2. No site Node que deve servir o PactoAgil: **Repositório Git** = este repo, **branch** = a que tem Astro (ex.: `principal` / `main`), **sem** `package.json` de Next no commit deployado.
3. **Comando de arranque** não pode ser `next start` nem o preset Next.js a sobrescrever o comando. Usa **`npm run start`** ou, se o hPanel exigir ficheiro: **`server.mjs`** na raiz (este repo já inclui `server.mjs`, que carrega o Astro em `dist/server/entry.mjs`).
4. Depois de corrigir, os logs devem mostrar **`[PactoAgil] Arranque Astro SSR`** (mensagem em `server.mjs`) e **não** o banner do Next.js.

Cache de HTML não gera logs “Next.js” no servidor — isso é sempre **processo errado**.

## `npm audit` / falha de deploy por vulnerabilidades

- Corre **`npm audit fix`** (sem `--force`) localmente antes de commitar; **`npm audit fix --force`** pode instalar **Astro 6 / @astrojs/node 10** e exigir **Node ≥ 22**, incompatível com o plano atual em Node 20.
- O projeto usa **`overrides`** para corrigir transitivas (Hono, `yaml`, etc.) e **`axios` ≥ 1.15.0** para o aviso **crítico**.
- Pode restar **1 moderado** em `@astrojs/node` &lt; 10 ([GHSA-3rmj-9m5h-8fpv](https://github.com/advisories/GHSA-3rmj-9m5h-8fpv)); o patch oficial é a linha 10.x (Astro 6). Enquanto ficares em Astro 5 + Node 20, isso é aceite.
- No **`.npmrc`** está `audit-level=critical` para que `npm audit` **não falhe só por moderados** (se a Hostinger respeitar o `.npmrc` do repositório no passo de audit).
