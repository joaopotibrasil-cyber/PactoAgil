import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { ROUTES } from '@/constants/routes'

import { BYPASS_EMAILS } from '@/constants/auth'

export async function updateSession(request: NextRequest) {
  // Clonar headers para modificar
  const requestHeaders = new Headers(request.headers)

  let supabaseResponse = NextResponse.next({
    request: {
      ...request,
      headers: requestHeaders,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
            requestHeaders.set(name, value)
          })

          supabaseResponse = NextResponse.next({
            request: {
              ...request,
              headers: requestHeaders,
            },
          })

          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 1. Tenta obter o usuário via Cookies (padrão Supabase)
  let {
    data: { user },
  } = await supabase.auth.getUser()

  // 2. Fallback: Se não houver usuário via cookie, tenta via Bearer Token (Authorization header)
  // Isso resolve instabilidades de sessão no Edge runtime da Vercel
  if (!user) {
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim()
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (supabaseUrl && anonKey && token && token !== 'null' && token !== 'undefined') {
        try {
          // Validação direta via API REST do Supabase (mais confiável no Edge)
          const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'apikey': anonKey
            }
          })

          if (res.ok) {
            const tokenUser = await res.json()
            if (tokenUser && tokenUser.id) {
              user = tokenUser
              console.log('[Middleware] Autenticado via Bearer Token fallback:', user?.id)
            }
          }
        } catch (err) {
          console.error('[Middleware] Erro ao validar Bearer Token:', err)
        }
      }
    }
  }

  // 2.5 Camada de Bypass Automático para Testes
  // Se ainda não houver usuário, tenta extrair do token Bearer sem validar assinatura
  if (!user) {
    const authHeader = request.headers.get('authorization')
    // 2. Lógica de BYPASS para Testes
    const url = new URL(request.url);
    const emailParam = url.searchParams.get('email');
    
    let bypassEmail = request.headers.get('x-bypass-email') || 
                     request.cookies.get('pacto-bypass-email')?.value ||
                     emailParam;

    // Tentar extrair do token se houver (fallback)
    if (!bypassEmail && authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload && payload.email) {
          bypassEmail = payload.email;
        }
      } catch (e) { /* ignore */ }
    }
    
    if (bypassEmail && BYPASS_EMAILS.includes(bypassEmail)) {
      console.warn(`[Middleware][TEST-BYPASS] Acesso automático liberado para: ${bypassEmail}`);
      requestHeaders.set('x-user-id', 'test-bypass-active');
      requestHeaders.set('x-user-email', bypassEmail);
      requestHeaders.set('x-bypass-email', bypassEmail);

      supabaseResponse = NextResponse.next({
        request: {
          ...request,
          headers: requestHeaders,
        },
      });

      // Persistir o e-mail de bypass em um cookie para que chamadas subsequentes do cliente (fetch) 
      // também sejam identificadas pelo middleware.
      supabaseResponse.cookies.set('pacto-bypass-email', bypassEmail, {
        path: '/',
        maxAge: 60 * 60 * 24, // 1 dia
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
      
      user = { id: 'test-bypass-active', email: bypassEmail } as any;
    }
  }

  // 3. Injeta headers personalizados para as API routes e atualiza a resposta
  if (user) {
    requestHeaders.set('x-user-id', user.id)
    requestHeaders.set('x-user-email', user.email || '')

    // Recria a resposta com os novos headers injetados
    supabaseResponse = NextResponse.next({
      request: {
        ...request,
        headers: requestHeaders,
      },
    })
    
    // Essencial: Repassar os cookies de volta na resposta
    // (Isso mantém a sessão de cookies ativa)
  }

  const isAuthRoute = request.nextUrl.pathname.startsWith(ROUTES.PAGES.AUTH.LOGIN)
  const isProtectedRoute =
    request.nextUrl.pathname.startsWith(ROUTES.PAGES.DASHBOARD.ROOT) ||
    request.nextUrl.pathname.startsWith('/admin')

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = ROUTES.PAGES.DASHBOARD.ROOT
    return NextResponse.redirect(url)
  }

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = ROUTES.PAGES.AUTH.LOGIN
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
