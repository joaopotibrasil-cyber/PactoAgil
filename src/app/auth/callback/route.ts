import { NextResponse } from 'next/server'
// O Supabase tem um utilitário para trocar o código pela sessão no roteamento do Next.js
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Se o "next" estiver presente, use-o como a URL de redirecionamento final
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host') // Carregado por proxies do Cloudflare/Vercel
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      if (isLocalEnv) {
        // No desenvolvimento, podemos usar o origin diretamente
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // Falha: Redirecionar para uma página de erro ou login
  return NextResponse.redirect(`${origin}/login?error=O link de autenticação expirou ou é inválido.`)
}
