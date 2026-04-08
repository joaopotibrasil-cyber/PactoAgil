import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { ROUTES } from '@/constants/routes'

export async function updateSession(request: NextRequest) {
  // Copia os headers para modificar sem afetar a request original
  const requestHeaders = new Headers(request.headers)

  // SEGURANÇA: Sempre remove qualquer x-user-id vindo de fora
  // para evitar spoofing. O middleware vai reescrever com o valor correto.
  requestHeaders.delete('x-user-id')
  requestHeaders.delete('x-user-email')

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
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
          cookiesToSet.forEach(({ name, value }) => requestHeaders.set(`cookie`, request.headers.get('cookie') || ''))
          supabaseResponse = NextResponse.next({
            request: { headers: requestHeaders },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Isso vai ATUALIZAR a sessão caso o token esteja expirado
  const {
    data: { user },
  } = await supabase.auth.getUser()

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

  // ✅ SOLUÇÃO DEFINITIVA: Injeta o userId nos headers da request
  // Isso permite que API routes identifiquem o usuário sem precisar
  // fazer autenticação via cookie novamente (o que falha em Vercel).
  if (user) {
    supabaseResponse.headers.set('x-user-id', user.id)
    supabaseResponse.headers.set('x-user-email', user.email || '')

    // Também propaga via request headers para o route handler
    const newHeaders = new Headers(supabaseResponse.headers)
    newHeaders.set('x-user-id', user.id)
    newHeaders.set('x-user-email', user.email || '')
    
    const finalResponse = NextResponse.next({
      request: {
        headers: (() => {
          const h = new Headers(requestHeaders)
          h.set('x-user-id', user.id)
          h.set('x-user-email', user.email || '')
          return h
        })(),
      },
    })

    // Copia todos os cookies do supabaseResponse para o finalResponse
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      finalResponse.cookies.set(cookie.name, cookie.value, {
        httpOnly: cookie.httpOnly,
        secure: cookie.secure,
        sameSite: cookie.sameSite as 'lax' | 'strict' | 'none' | undefined,
        path: cookie.path,
        maxAge: cookie.maxAge,
      })
    })

    return finalResponse
  }

  return supabaseResponse
}
