import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/token
 * Retorna confirmação de autenticação e o userId.
 * O token real (JWT) agora é gerenciado via middleware + x-user-id header.
 */
export async function GET(request: NextRequest) {
  const result = await requireAuth(request);
  
  if (result instanceof NextResponse) {
    return result; // 401
  }
  
  const userId = result;

  return NextResponse.json({
    authenticated: true,
    user_id: userId,
    // Retornamos um "token" simbólico para o hook useAuthToken funcionar
    // O token real é apenas o userId criptografado como referência
    access_token: `user_${userId}`,
  });
}
