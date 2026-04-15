import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { headers, cookies } from 'next/headers';
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
    // 1. Extração de Headers
    const headers = request instanceof NextRequest
      ? request.headers
      : request ? new Headers(request.headers) : null;

    const userIdHeader = headers?.get('x-user-id');

    // 3. Header de ID Real (injetado pelo middleware para sessões autênticas)
    if (userIdHeader && userIdHeader !== 'test-bypass-active') {
      return userIdHeader;
    }

    // 4. Fallback: Cookies (Supabase Client tradicional)
    const supabase = await createClient();
    const { data: { user }, error: sessionError } = await supabase.auth.getUser();

    if (user && !sessionError) {
      return user.id;
    }

    if (sessionError) {
      console.warn('[requireAuth][v3-fetch] Aviso: Falha ao recuperar usuário via cookie:', sessionError.message);
    }

    // 3. Terceira Camada: Bearer Token (Authorization Header Direto)
    // Essencial para requisições cross-origin ou quando o middleware Edge falha
    let token = extractBearerToken(request);
    
    if (token) {
      token = token.trim();
      if (token === 'null' || token === 'undefined' || token === '') {
        console.warn('[requireAuth][v3-fetch] Aviso: Token no header Authorization é inválido ou vazio.');
      } else {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !anonKey) {
          console.error('[requireAuth][v3-fetch] ERRO: Variáveis de ambiente do Supabase ausentes no servidor.');
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
                console.log('[requireAuth][v3-fetch] Sucesso: Identificado via Bearer Token validado manualmente.');
                return tokenUser.id;
              }
            } else {
              const errorData = await res.text();
              console.warn(`[requireAuth][v3-fetch] Falha: Token rejeitado pela API do Supabase (Status: ${res.status}).`, errorData);
            }
          } catch (fetchErr) {
            console.error('[requireAuth][v3-fetch] Exceção: Falha na comunicação com API do Supabase:', fetchErr);
          }
        }
      }
    } else {
       console.log('[requireAuth][v3-fetch] Info: Nenhum token Bearer encontrado nos headers.');
    }



    // Fallback Final: Todas as camadas falharam
    console.error('[requireAuth][v3-fetch] CRÍTICO: Todas as camadas de autenticação falharam (Header, Cookie, Bearer).');
    return NextResponse.json(
      { error: 'Não autorizado. Por favor, faça login novamente.' },
      { status: 401 }
    );
  } catch (err) {
    console.error('[requireAuth][v3-fetch] Erro interno crítico no processo de autenticação:', err);
    return NextResponse.json(
      { error: 'Erro interno de servidor ao validar acesso.' },
      { status: 500 }
    );
  }
}

/**
 * Helper para Server Components que verifica autenticação via Headers (Middleware) ou Session.
 * Retorna o userId ou null se não autenticado.
 */
export async function getServerUser(): Promise<string | null> {
  try {
    const headerList = await headers();
    const cookieStore = await cookies();
    
    // 1. Verificar Headers do Middleware
    const userIdHeader = headerList.get('x-user-id');

    // LOGICA DE SESSÃO REAL
    if (userIdHeader && userIdHeader !== 'test-bypass-active') {
      return userIdHeader;
    }

    // Fallback: Supabase Client (Cookies tradicionais)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      console.log(`[getServerUser] Sessão Supabase Detectada: ${user.id}`);
      return user.id;
    }

    console.warn('[getServerUser] Nenhuma sessão encontrada.');
    return null;
  } catch (err) {
    console.error('[getServerUser] Erro fatal ao recuperar sessão:', err);
    return null;
  }
}



