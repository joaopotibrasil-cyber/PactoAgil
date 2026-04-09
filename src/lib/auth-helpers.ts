import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import prisma from '@/lib/prisma'; // Importado para lookup de bypass

import { BYPASS_EMAILS } from '@/constants/auth';
import { headers } from 'next/headers';

/**
 * Decodifica um JWT sem verificar a assinatura (apenas para bypass de testes).
 */
function decodeJWTSafe(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload;
  } catch (err) {
    return null;
  }
}

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
    const bypassEmailHeader = headers?.get('x-bypass-email');

    // 2. Camada de BYPASS (Prioridade Máxima)
    if (userIdHeader === 'test-bypass-active' || bypassEmailHeader) {
      const email = bypassEmailHeader || '';
      if (BYPASS_EMAILS.includes(email)) {
        console.log(`[requireAuth][TEST-BYPASS] Sucesso: Bypass ativo para ${email}`);
        const profile = await prisma.perfil.findUnique({
          where: { email },
          select: { userId: true }
        });
        if (profile) return profile.userId;
      }
    }

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

    // =========================================================================
    // CAMADA DE BYPASS AUTOMÁTICO PARA TESTES (REMOVER EM PRODUÇÃO)
    // =========================================================================
    let bypassEmail = request instanceof NextRequest 
      ? request.headers.get('x-bypass-email') 
      : (request as Request).headers?.get?.('x-bypass-email');

    // Se no header não veio o email, tentamos extrair do token enviado
    if (!bypassEmail && token) {
      const payload = decodeJWTSafe(token);
      if (payload && payload.email) {
        bypassEmail = payload.email;
        console.log(`[requireAuth][TEST-BYPASS] Detectado email ${bypassEmail} dentro do token.`);
      }
    }

    if (bypassEmail && BYPASS_EMAILS.includes(bypassEmail)) {
      console.warn(`[requireAuth][TEST-BYPASS] ALERTA: Autenticação ignorada para: ${bypassEmail}`);
      try {
        const profile = await prisma.perfil.findUnique({
          where: { email: bypassEmail },
          select: { userId: true }
        });

        if (profile) {
          console.log(`[requireAuth][TEST-BYPASS] Sucesso: Acesso liberado para ${profile.userId}`);
          return profile.userId;
        }
      } catch (dbErr) {
        console.error('[requireAuth][TEST-BYPASS] Erro ao buscar perfil:', dbErr);
      }
    }
    // =========================================================================

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
    
    // 1. Verificar Headers do Middleware (x-user-id)
    const userIdHeader = headerList.get('x-user-id');
    const bypassEmail = headerList.get('x-bypass-email');

    // Se tiver header de bypass ativo
    if (userIdHeader === 'test-bypass-active' && bypassEmail) {
      if (BYPASS_EMAILS.includes(bypassEmail)) {
        const profile = await prisma.perfil.findUnique({
          where: { email: bypassEmail },
          select: { userId: true }
        });
        if (profile) return profile.userId;
      }
    }

    // Se tiver ID real no header
    if (userIdHeader && userIdHeader !== 'test-bypass-active') {
      return userIdHeader;
    }

    // 2. Fallback: Supabase Client (Cookies)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    return user?.id || null;
  } catch (err) {
    console.error('[getServerUser] Erro ao recuperar sessão no servidor:', err);
    return null;
  }
}


