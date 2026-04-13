import { createServerClient } from '@supabase/ssr'
import type { AstroCookies } from 'astro'

/**
 * Cliente Supabase para uso no Servidor (Astro).
 * Deve ser chamado passando Astro.cookies ou o objeto cookies do contexto da API/Middleware.
 * 
 * Exemplo em rota de API: const client = await createClient(Astro.cookies)
 */
export async function createClient(cookieStore: AstroCookies) {
  return createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL!,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          try {
            cookieStore.set(name, value, options)
          } catch {
            // Em alguns contextos (como renderização estática) o set de cookies pode falhar.
          }
        },
        remove(name: string, options: Record<string, unknown>) {
          try {
            cookieStore.delete(name, options)
          } catch {
            // Ignore em contextos onde escrita de cookie não está disponível.
          }
        },
      },
    }
  )
}
