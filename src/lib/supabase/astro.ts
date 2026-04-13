import { createServerClient } from '@supabase/ssr'
import type { AstroCookies } from 'astro'

export function createSupabaseClient(cookies: AstroCookies) {
  return createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL!,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookies.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          cookies.set(name, value, options)
        },
        remove(name: string, options: Record<string, unknown>) {
          cookies.delete(name, options)
        },
      },
    }
  )
}

/**
 * Alias para createSupabaseClient — usado nas páginas .astro
 * Uso: const client = supabase(Astro.cookies)
 */
export const supabase = createSupabaseClient
