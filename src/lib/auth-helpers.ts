import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Extrai o userId do header injetado pelo middleware.
 * Mantido para casos legados temporários, mas não recomendado para Vercel Edge.
 */
export function getUserIdFromRequest(request: NextRequest | Request): string | null {
  const userId = (request as NextRequest).headers?.get('x-user-id') 
    ?? new Headers((request as Request).headers).get('x-user-id');
  
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
    : new Headers((request as Request).headers);
    
  const authHeader = headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  
  return authHeader.slice(7);
}

/**
 * Verifica autenticação via Cookies ou Header Authorization.
 * Muito mais robusto em produção (Vercel) pois suporta fallback para tokens manuais.
 * 
 * Uso em API routes: const result = await requireAuth(request); if (result instanceof NextResponse) return result;
 */
export async function requireAuth(request?: NextRequest | Request): Promise<string | NextResponse> {
  try {
    // 1. Tentar via Cookies (padrão Supabase)
    const supabase = await createClient();
    const { data: { user }, error: sessionError } = await supabase.auth.getUser();
    
    if (user && !sessionError) {
      return user.id;
    }

    if (sessionError) {
      console.warn('[requireAuth] Sessão via cookie falhou:', sessionError.message);
    }

    // 2. Fallback: Tentar via Header Authorization (Bearer Token)
    const token = extractBearerToken(request);
    
    if (token) {
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!serviceKey) {
        console.error('[requireAuth] CRÍTICO: SUPABASE_SERVICE_ROLE_KEY não configurada no servidor.');
      } else {
        const adminClient = createAdminClient();
        const { data: { user: tokenUser }, error: tokenError } = await adminClient.auth.getUser(token);
        
        if (tokenUser && !tokenError) {
          console.log('[requireAuth] Autenticação via Bearer Token bem-sucedida para:', tokenUser.id);
          return tokenUser.id;
        }
        
        if (tokenError) {
          console.warn('[requireAuth] Falha ao validar Bearer Token:', tokenError.message);
        }
      }
    } else {
      console.warn('[requireAuth] Nenhum token encontrado no cabeçalho Authorization.');
    }
    
    // Se ambos falharem
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


