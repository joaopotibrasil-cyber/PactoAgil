import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Extrai o userId do header injetado pelo middleware.
 */
export function getUserIdFromRequest(request: NextRequest | Request): string | null {
  const headers = request instanceof NextRequest
    ? request.headers
    : new Headers(request.headers);

  const userId = headers.get('x-user-id');

  if (!userId || userId === '' || userId === 'undefined' || userId === 'null') {
    return null;
  }

  return userId;
}

/**
 * Extrai o token Bearer do cabeçalho de autorização.
 */
function extractBearerToken(request?: NextRequest | Request): string | null {
  if (!request) return null;

  const headers = request instanceof NextRequest
    ? request.headers
    : new Headers(request.headers);

  const authHeader = headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  return authHeader.slice(7);
}

/**
 * Verifica autenticação via Headers do Middleware, Cookies ou Header Authorization.
 * Ordem de prioridade:
 * 1. Headers injetados pelo middleware (x-user-id) - mais confiável em Edge/Vercel
 * 2. Cookies via Supabase Client
 * 3. Bearer Token no header Authorization
 *
 * Uso em API routes: const result = await requireAuth(request); if (result instanceof NextResponse) return result;
 */
export async function requireAuth(request?: NextRequest | Request): Promise<string | NextResponse> {
  try {
    // 1. Primeiro tentar via headers injetados pelo middleware (mais confiável em Edge)
    const userIdFromHeader = request ? getUserIdFromRequest(request) : null;
    if (userIdFromHeader) {
      console.log('[requireAuth] Autenticado via header x-user-id:', userIdFromHeader);
      return userIdFromHeader;
    }

    // 2. Tentar via Cookies (padrão Supabase)
    const supabase = await createClient();
    const { data: { user }, error: sessionError } = await supabase.auth.getUser();

    if (user && !sessionError) {
      console.log('[requireAuth] Autenticado via cookie:', user.id);
      return user.id;
    }

    if (sessionError) {
      console.warn('[requireAuth] Sessão via cookie falhou:', sessionError.message);
    }

    // 3. Fallback: Tentar via Header Authorization (Bearer Token)
    let token = extractBearerToken(request);
    
    if (token) {
      token = token.trim();
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !anonKey || token === 'null' || token === 'undefined' || token === '') {
        console.warn('[requireAuth] Token inválido ou variáveis do Supabase não configuradas no servidor.');
      } else {
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
              console.log('[requireAuth] Autenticado via Bearer Token (Fetch):', tokenUser.id);
              return tokenUser.id;
            }
          } else {
            const errorData = await res.text();
            console.warn(`[requireAuth] Falha ao chamar GET /user. Status: ${res.status}`, errorData);
          }
        } catch (fetchErr) {
          console.error('[requireAuth] Exceção durante validação de Bearer via API:', fetchErr);
        }
      }
    }

    // Se todos falharem
    console.error('[requireAuth] Todas as tentativas de autenticação falharam');
    return NextResponse.json(
      { error: 'Não autorizado. Faça login novamente.' },
      { status: 401 }
    );
  } catch (err) {
    console.error('[requireAuth] Erro crítico ao validar autenticação:', err);
    return NextResponse.json(
      { error: 'Erro de autenticação interna.' },
      { status: 500 }
    );
  }
}


