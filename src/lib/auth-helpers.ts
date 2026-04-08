import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
 * Verifica autenticação lendo cookies via Supabase Server Client.
 * Muito mais robusto em produção (Vercel) pois não depende de headers 
 * injetados por Middleware que podem ser descartados.
 * 
 * Uso em API routes: const result = await requireAuth(request); if (result instanceof NextResponse) return result;
 */
export async function requireAuth(request?: NextRequest | Request): Promise<string | NextResponse> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json(
        { error: 'Não autorizado. Faça login novamente.' },
        { status: 401 }
      );
    }
    
    return user.id;
  } catch (err) {
    console.error('[requireAuth] Erro ao validar token:', err);
    return NextResponse.json(
      { error: 'Erro de autenticação interna.' },
      { status: 500 }
    );
  }
}
