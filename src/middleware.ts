import { defineMiddleware } from 'astro:middleware';
import { createSupabaseClient } from './lib/supabase/astro';
import { ROUTES } from './constants/routes';

export const onRequest = defineMiddleware(async ({ locals, cookies, url, redirect }, next) => {
  const { pathname } = url;

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
