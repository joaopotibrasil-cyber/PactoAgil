import { createClient } from './supabase/server';
import type { AstroCookies } from 'astro';

/**
 * Extrai o userId do header injetado pelo middleware.
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
function extractBearerToken(request?: Request): string | null {
  if (!request) return null;

  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  return authHeader.slice(7);
}

/**
 * Verifica autenticação via Headers do Middleware, Cookies ou Header Authorization.
 * Compatível com Astro.
 */
export async function requireAuth(request: Request, cookies: AstroCookies): Promise<string | Response> {
  try {
    const userIdHeader = request.headers.get('x-user-id');

    // 1. Header injetado pelo middleware
    if (userIdHeader && userIdHeader !== 'test-bypass-active' && userIdHeader !== 'undefined' && userIdHeader !== 'null') {
      return userIdHeader;
    }

    // 2. Cookies via Supabase Client
    const supabase = await createClient(cookies);
    const { data: { user }, error: sessionError } = await supabase.auth.getUser();

    if (user && !sessionError) {
      return user.id;
    }

    // 3. Bearer Token
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
          console.error('[requireAuth][legacy] Erro na validação direta:', fetchErr);
        }
      }
    }

    return new Response(
      JSON.stringify({ error: 'Não autorizado. Por favor, faça login novamente.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[requireAuth][legacy] Erro interno:', err);
    return new Response(
      JSON.stringify({ error: 'Erro interno de servidor ao validar acesso.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Helper para recuperar o usuário atual no servidor Astro.
 */
export async function getServerUser(request: Request, cookies: AstroCookies): Promise<string | null> {
  try {
    const userIdHeader = request.headers.get('x-user-id');

    if (userIdHeader && userIdHeader !== 'test-bypass-active' && userIdHeader !== 'undefined' && userIdHeader !== 'null') {
      return userIdHeader;
    }

    const supabase = await createClient(cookies);
    const { data: { user } } = await supabase.auth.getUser();
    
    return user ? user.id : null;
  } catch (err) {
    console.error('[getServerUser][legacy] Erro:', err);
    return null;
  }
}
