import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/token
 * Retorna o access_token da sessão atual lido via cookies do servidor.
 * Usado pelo cliente para obter um token válido que possa ser passado
 * como Bearer para outros endpoints de API.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Nota: getUser() valida o JWT via getUser mas não retorna o token raw.
    // Usamos getSession() aqui pois estamos no lado do servidor onde os cookies
    // HTTP-only são acessíveis.
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 });
    }

    return NextResponse.json({
      access_token: session.access_token,
      user_id: user.id,
    });
  } catch (err) {
    console.error('[AUTH_TOKEN_ERROR]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
