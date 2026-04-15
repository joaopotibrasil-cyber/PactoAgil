## Objetivo

Escolher a melhor **abordagem de backend/SSR** para rodar com estabilidade na **Hostinger** (Node.js) e evitar “deploy que compila mas cai no start”, mantendo o app funcional em produção.

---

## Contexto do repositório (o que já aconteceu)

- O projeto **era Next.js** (há commits “Create Next App” e o commit `ae7ee08` migra de **Next.js → Astro**).
- Houve sintomas de **chunks/assets quebrados** e **cache antigo** (especialmente resquícios de `/_next/`), e foram adicionadas medidas de “purge”.
- Hoje o projeto está como **Astro SSR** com `@astrojs/node` gerando:
  - `dist/server/entry.mjs` (servidor SSR)
  - `dist/client/...` (assets)

---

## Recomendação (Hostinger): **Astro + @astrojs/node (SSR)** + `npm start`

Para Hostinger (um processo Node com porta dinâmica), a opção mais estável é **manter Astro SSR** e “padronizar” a inicialização via `npm start`.

- **Por quê**:
  - O Astro SSR gera um **entry SSR único** (`dist/server/entry.mjs`) que inicia o servidor.
  - Menos superfície de erro do que Next.js standalone em hospedagens compartilhadas.
  - O deploy fica previsível: `npm run build` → `npm start`.

### Configuração ideal na Hostinger (sem “Arquivo de entrada”)

Se o campo **Arquivo de entrada** é opcional, **deixe vazio** e use comandos:

- **Install**: `npm install`
- **Build**: `npm run build`
- **Start**: `npm start` (ou `npm run start`)
- **Output dir**: `dist`

> Observação: a Hostinger normalmente injeta `PORT`. Em PaaS/shared hosting, o bind em `0.0.0.0` e o uso de `PORT` são críticos.

---

## Quando escolher Express/Fastify/Nest em vez de Astro SSR?

Escolha **Express** ou **Fastify** (ou Nest) apenas se você quiser **separar frontend e backend**:

- **Frontend**: build estático (ex.: Astro `output: static` / Vite) hospedado como site estático.
- **Backend**: API Node (Express/Fastify/Nest) rodando como app Node separado.

Isso melhora isolamento, mas aumenta complexidade (dois deploys, CORS, rotas, etc.).

### Express vs Fastify (se for separar)

- **Fastify**: melhor performance e plugins modernos; ótimo para API.
- **Express**: mais simples/ubíquo; mais tutoriais; suficiente para a maioria.
- **NestJS**: ótimo para equipe grande/arquitetura, mas mais “pesado” para shared hosting.

---

## Sobre voltar para Next.js (commit anterior)

É viável voltar para Next.js **se**:
- você já consegue limpar cache pelo painel (CDN/cache do site),
- e remove/evita servir resquícios de `/_next/` antigos.

Mas: em Hostinger, Next.js tende a ser mais sensível a:
- cache de assets versionados,
- configuração de “start”/SSR,
- limites do ambiente.

### Caminho seguro (recomendado)

1. **Manter Astro SSR** até estabilizar deploy e start.
2. Só depois considerar rollback para Next.js se houver motivo forte (ex.: App Router features específicas).

### Como identificar o ponto de rollback

- O commit que migra para Astro é: `ae7ee08` (**Next.js → Astro**)
- Um rollback “pré-Astro” seria para um commit **antes** dele, por exemplo:
  - `0c40c2c` (parece relacionado a Vercel)
  - `c15ce35` (Create Next App)

> Atenção: voltar para Next.js vai exigir revalidar rotas, APIs e estrutura do `src/app`.

---

## Checklist do “deploy compila mas cai no start” (Hostinger)

Quando a UI mostra logs só até “Build Complete!”, o erro real costuma estar no **start**:

- **PORT**: o processo precisa ouvir em `process.env.PORT`
- **HOST**: bind em `0.0.0.0` (não apenas `localhost`)
- **ENV**: variáveis obrigatórias ausentes (Stripe/Supabase/Resend etc.)
- **Linux case-sensitive**: imports com diferença de maiúsculas/minúsculas quebram só em produção
- **Arquivos duplicados** com `\` no nome (Windows) quebram no Linux (isso já ocorreu com `src\\middleware.ts`)

---

## Segurança (obrigatório)

Chaves de produção (Stripe live, Supabase service role, Resend etc.) foram expostas em texto.

- **Rotacione/revogue** imediatamente.
- Atualize na Hostinger (variáveis de ambiente).
- Garanta que `.env` fique no `.gitignore` e nunca seja commitado.

