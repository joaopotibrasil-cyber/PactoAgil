import { defineMiddleware } from 'astro:middleware';
import { createSupabaseClient } from './lib/supabase/astro';
import { ROUTES } from './constants/routes';

export const onRequest = defineMiddleware(async (context, next) => {
  const { locals, cookies, url, redirect } = context;
  const { pathname } = url;

  // ─── EMERGÊNCIA: EXPURGO NEXT.JS ───────────────────────────────────
  // 1. Limpeza de cookies legados que podem causar conflitos
  // Nunca limpar cookies do Supabase aqui; eles carregam a sessão autenticada atual.
  // Limpeza restrita apenas a cookies legados do ecossistema NextAuth.
  const legacyCookies = ['__session', 'next-auth.session-token', 'next-auth.callback-url', 'next-auth.state'];
  legacyCookies.forEach(cookieName => {
    if (cookies.has(cookieName)) {
      cookies.delete(cookieName, { path: '/' });
    }
  });

  // 2. Bloqueio de assets do Next.js
  if (pathname.includes('_next/')) {
    return new Response(
      `console.warn('Next.js legacy detected, purging cache...'); window.location.replace('/force-refresh.html?ts=' + Date.now());`,
      {
        status: 200,
        headers: {
          'Content-Type': 'application/javascript',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        }
      }
    );
  }

  // Ignorar assets e manifestos
  if (
    pathname.includes('favicon.ico') ||
    pathname.includes('manifest.json') ||
    pathname.includes('robots.txt') ||
    pathname.startsWith('/_astro/') ||
    pathname.startsWith('/api/') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg')
  ) {
    return next();
  }

  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);

  // Em build/prerender local, as variáveis podem não existir.
  // Nesses casos, segue sem sessão para evitar quebrar o build.
  if (!hasSupabaseEnv) {
    locals.user = null;
    return next();
  }

  const supabase = createSupabaseClient(cookies);

  // Obter usuário
  const { data: { user } } = await supabase.auth.getUser();

  // Armazenar no locals para acesso nas páginas Astro/Actions
  locals.user = user;

  const isAuthRoute = pathname.startsWith(ROUTES.PAGES.AUTH.LOGIN) || pathname.startsWith(ROUTES.PAGES.AUTH.REGISTER);
  const isProtectedRoute = pathname.startsWith(ROUTES.PAGES.DASHBOARD.ROOT) || pathname.startsWith('/admin');

  // Redirecionamento se já autenticado e tentar acessar login/register
  if (user && isAuthRoute) {
    return redirect(ROUTES.PAGES.DASHBOARD.ROOT);
  }

  // Redirecionamento se não autenticado e tentar acessar dashboard
  if (!user && isProtectedRoute) {
    return redirect(ROUTES.PAGES.AUTH.LOGIN);
  }

  // Prosseguir com a requisição, injetando headers se houver usuário
  const response = await next();
  
  // Nota: No Astro, para injetar headers que serão lidos pela Rota de API NO MESMO REQUEST,
  // precisamos modificar o request antes de chamar next(), mas o middleware do Astro 
  // não permite modificar o objeto request diretamente de forma tão simples quanto o Next.js
  // em middlewares encadeados. No entanto, como usamos locals.user, as rotas de API
  // podem acessar diretamente o usuário via context.locals.user.
  
  return response;
});
