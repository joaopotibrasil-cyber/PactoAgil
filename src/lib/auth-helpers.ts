import { NextRequest, NextResponse } from 'next/server';

/**
 * Extrai o userId do header injetado pelo middleware.
 * 
 * O middleware do Supabase SSR autentica o usuário via cookie e,
 * após validação bem-sucedida, injeta `x-user-id` nos headers da request.
 * 
 * Isso é necessário porque em Vercel com @supabase/ssr, os Route Handlers
 * às vezes não conseguem ler os cookies de sessão diretamente.
 * 
 * @returns userId string se autenticado, null caso contrário
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
 * Verifica autenticação e retorna userId ou resposta 401.
 * Use em API routes: const result = requireAuth(request); if (result instanceof NextResponse) return result;
 */
export function requireAuth(request: NextRequest | Request): string | NextResponse {
  const userId = getUserIdFromRequest(request);
  
  if (!userId) {
    return NextResponse.json(
      { error: 'Não autorizado. Faça login novamente.' },
      { status: 401 }
    );
  }
  
  return userId;
}
