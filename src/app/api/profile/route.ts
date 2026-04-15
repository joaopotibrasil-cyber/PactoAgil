import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/profile
 * Retorna os dados do perfil do usuário autenticado.
 * 
 * A autenticação é feita via x-user-id header injetado pelo middleware.
 * O server Supabase client é usado apenas para queries de dados (com a anon key
 * que tem acesso às tabelas via RLS baseada no user_id do middleware).
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  
  if (authResult instanceof NextResponse) {
    return authResult; // 401
  }

  const userId = authResult;

  try {
    // 1. Buscar perfil do usuário logado usando Prisma
    const perfil = await prisma.perfil.findUnique({
      where: { userId: userId },
      include: {
        empresa: {
          include: {
            assinatura: true,
            usuarios: {
              select: {
                id: true,
                nomeCompleto: true,
                email: true,
                role: true,
                avatarUrl: true
              }
            }
          }
        }
      }
    });

    if (!perfil) {
      console.warn(`[API /api/profile] Perfil não encontrado para o userId: ${userId}`);
      return NextResponse.json({
        nomeCompleto: 'Usuário',
        email: request.headers.get('x-user-email') || '',
        role: 'USER',
        empresaNome: 'Sem empresa',
        plano: 'SEM PLANO',
        logoUrl: null,
        corPrimaria: null,
      });
    }

    // Traduzir para o formato esperado pelo frontend
    const empresaData = perfil.empresa ? {
      id: perfil.empresa.id,
      nome: perfil.empresa.nome,
      cnpj: perfil.empresa.cnpj,
      funcionalidade: perfil.empresa.funcionalidade,
      logoUrl: perfil.empresa.logoUrl,
      corPrimaria: perfil.empresa.corPrimaria,
    } : null;

    const assinaturaData = perfil.empresa?.assinatura ? {
      tipoPlano: perfil.empresa.assinatura.tipoPlano,
      status: perfil.empresa.assinatura.status,
      fimPeriodoAtual: perfil.empresa.assinatura.fimPeriodoAtual,
    } : null;

    const membrosData = perfil.empresa?.usuarios || [];

    return NextResponse.json({
      perfil: {
        nomeCompleto: perfil.nomeCompleto,
        email: perfil.email,
        role: perfil.role,
        avatarUrl: perfil.avatarUrl,
      },
      empresa: empresaData,
      assinatura: assinaturaData,
      membros: membrosData,
      // Helper fields (backwards compatibility)
      nomeCompleto: perfil.nomeCompleto || 'Usuário',
      email: perfil.email || request.headers.get('x-user-email') || '',
      role: perfil.role || 'USER',
      empresaNome: empresaData?.nome || 'Sem empresa',
      plano: assinaturaData?.tipoPlano || 'SEM PLANO',
      logoUrl: empresaData?.logoUrl || null,
      corPrimaria: empresaData?.corPrimaria || null,
    });

  } catch (err) {
    console.error('[PROFILE_ERROR]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

