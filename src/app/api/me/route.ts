import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/me
 * Retorna as informações completas do usuário ativo (nome, role, plano da empresa e accessToken).
 * É projetado para ser chamado após o login e consumido por clientes externos ou frontends.
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Extrai Token de Bearer se fornecido externamente (ex. por webhook ou frontend API)
    const authHeader = request.headers.get('authorization');
    let userId: string | null = null;
    let fallbackToken: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      fallbackToken = authHeader.substring(7);
      const adminClient = createAdminClient();
      const { data: { user }, error } = await adminClient.auth.getUser(fallbackToken);
      if (!error && user) {
        userId = user.id;
      }
    }

    // 2. Se não veio via Auth Header, tentamos ler a sessão do cookie
    const supabase = await createClient();
    if (!userId) {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user) {
        userId = user.id;
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Não autorizado. Token inválido ou sessão inexistente.' },
        { status: 401 }
      );
    }

    // Pega a sessão principal extraída, se existir, para passar no access_token final
    const { data: sessionData } = await supabase.auth.getSession();
    const finalToken = fallbackToken || sessionData?.session?.access_token || null;

    // 3. Busca o Perfil e as informações da Empresa associada
    const perfil = await prisma.perfil.findUnique({
      where: { userId },
      include: {
        empresa: {
          select: {
            id: true,
            nome: true,
            cnpj: true,
            assinatura: {
              select: { status: true, tipoPlano: true }
            }
          }
        }
      }
    });

    if (!perfil) {
      return NextResponse.json(
        { error: 'Perfil não encontrado na base de dados.' },
        { status: 404 }
      );
    }

    // 4. Retorna a assinatura correta de campos exigida
    return NextResponse.json({
      name: perfil.nomeCompleto,
      role: perfil.role,
      company: perfil.empresa ? perfil.empresa.nome : null,
      plan: perfil.empresa?.assinatura?.tipoPlano || 'FREE',
      access_token: finalToken
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });

  } catch (error: any) {
    console.error('[API /api/me] Erro ao buscar dados:', error.message);
    return NextResponse.json(
      { error: 'Erro interno no servidor ao processar o perfil.' },
      { status: 500 }
    );
  }
}

/**
 * Handle OPTIONS for CORS requests preflight
 */
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}
