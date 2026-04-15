import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import prisma from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/me
 * Endpoint que retorna informações consolidadas sobre o usuário ativo,
 * seu perfil no banco de dados e os dados da sua empresa vinculada.
 * Muito útil para controles de acesso (RBAC) e exibição de perfil no frontend.
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Verifica sessão no Supabase e extrai o userId e a session atual
    const result = await requireAuth(request);
    
    if (result instanceof NextResponse) {
      return result; // Propaga erro 401 se não estiver logado
    }
    
    const userId = result;

    // Recupera a sessão inteira se o client precisar do token cru (RAW JWT) extraído do header/cookie
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    // 2. Busca o Perfil e as informações da Empresa associada usando o Prisma
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

    // 3. Monta e retorna o Payload consolidado
    return NextResponse.json({
      authenticated: true,
      user: {
        id: perfil.userId,
        perfilId: perfil.id,
        email: perfil.email,
        nomeCompleto: perfil.nomeCompleto,
        role: perfil.role,
        avatarUrl: perfil.avatarUrl,
      },
      empresa: perfil.empresa ? {
        id: perfil.empresa.id,
        nome: perfil.empresa.nome,
        cnpj: perfil.empresa.cnpj,
        assinaturaStatus: perfil.empresa.assinatura?.status || 'INATIVA',
        tipoPlano: perfil.empresa.assinatura?.tipoPlano || 'FREE',
      } : null,
      // Passar o token cru só para os casos onde frontends externos precisem consumir serviços (opcional)
      session: {
        access_token: session?.access_token || null,
        expires_at: session?.expires_at || null
      }
    });

  } catch (error: any) {
    console.error('[API /me] Erro ao buscar dados do usuário:', error.message);
    return NextResponse.json(
      { error: 'Erro interno no servidor ao consolidar perfil.' },
      { status: 500 }
    );
  }
}
