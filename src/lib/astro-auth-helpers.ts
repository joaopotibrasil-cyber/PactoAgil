import { createSupabaseClient } from './supabase/astro';
import type { AstroCookies } from 'astro';

/**
 * Extrai o userId do header injetado pelo middleware ou tokens.
 */
export function getUserIdFromRequest(request: Request): string | null {
  const userId = request.headers.get('x-user-id');

  if (!userId || userId === '' || userId === 'undefined' || userId === 'null') {
    return null;
  }

  return userId;
}

/**
 * Extrai o token Bearer do cabeçalho de autorização.
 */
function extractBearerToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  return authHeader.slice(7);
}

/**
 * Verifica autenticação para rotas de API do Astro.
 * Retorna o userId ou um objeto Response com erro 401/500.
 */
export async function requireAuth(request: Request, cookies: AstroCookies): Promise<string | Response> {
  try {
    // 1. Verificar Header injetado pelo middleware
    const userIdHeader = request.headers.get('x-user-id');
    if (userIdHeader && userIdHeader !== 'test-bypass-active' && userIdHeader !== 'undefined' && userIdHeader !== 'null') {
      return userIdHeader;
    }

    // 2. Fallback: Verificação via Supabase Auth (Cookies)
    const supabase = createSupabaseClient(cookies);
    const { data: { user }, error: sessionError } = await supabase.auth.getUser();

    if (user && !sessionError) {
      return user.id;
    }

    // 3. Fallback: Bearer Token (Authorization Header)
    let token = extractBearerToken(request);
    if (token) {
      token = token.trim();
      const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
      const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

      if (supabaseUrl && anonKey && token !== '' && token !== 'null') {
        try {
          const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'apikey': anonKey
            }
          });

          if (res.ok) {
            const tokenUser = await res.json();
            if (tokenUser && tokenUser.id) {
              return tokenUser.id;
            }
          }
        } catch (fetchErr) {
          console.error('[requireAuth][astro] Erro ao validar token bearer:', fetchErr);
        }
      }
    }

    // Falha na autenticação
    return new Response(
      JSON.stringify({ error: 'Não autorizado. Por favor, faça login novamente.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[requireAuth][astro] Erro crítico:', err);
    return new Response(
      JSON.stringify({ error: 'Erro interno de servidor ao validar acesso.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Helper para páginas Astro (.astro) recuperarem o usuário atual.
 */
export async function getServerUser(request: Request, cookies: AstroCookies): Promise<string | null> {
  try {
    // 1. Header do Middleware
    const userIdHeader = request.headers.get('x-user-id');
    if (userIdHeader && userIdHeader !== 'test-bypass-active' && userIdHeader !== 'undefined' && userIdHeader !== 'null') {
      return userIdHeader;
    }

    // 2. Supabase Auth
    const supabase = createSupabaseClient(cookies);
    const { data: { user } } = await supabase.auth.getUser();
    
    return user ? user.id : null;
  } catch (err) {
    console.error('[getServerUser][astro] Erro:', err);
    return null;
  }
}
