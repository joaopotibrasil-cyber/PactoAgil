import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { createClient } from '@/lib/supabase/server';

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
  const authResult = await requireAuth();
  
  if (authResult instanceof NextResponse) {
    return authResult; // 401
  }

  const userId = authResult;

  try {
    const supabase = await createClient();

    // 1. Buscar perfil do usuário logado
    const { data: perfil, error: perfilError } = await supabase
      .from('Perfil')
      .select('nomeCompleto, email, role, empresaId, avatarUrl')
      .eq('userId', userId)
      .single();

    if (perfilError || !perfil) {
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

    // Initialize objects
    let empresaData = null;
    let assinaturaData = null;
    let membrosData: any[] = [];

    // 2. Se tiver empresa, buscar detalhes e membros
    if (perfil.empresaId) {
      // Buscar dados da Empresa
      const { data: empresa } = await supabase
        .from('Empresa')
        .select('*')
        .eq('id', perfil.empresaId)
        .single();

      if (empresa) {
        empresaData = {
          id: empresa.id,
          nome: empresa.nome,
          cnpj: empresa.cnpj,
          funcionalidade: empresa.funcionalidade,
          logoUrl: empresa.logoUrl,
          corPrimaria: empresa.corPrimaria,
        };
      }

      // Buscar Assinatura
      const { data: assinatura } = await supabase
        .from('Assinatura')
        .select('*')
        .eq('empresaId', perfil.empresaId)
        .single();

      if (assinatura) {
        assinaturaData = {
          tipoPlano: assinatura.tipoPlano,
          status: assinatura.status,
          fimPeriodoAtual: assinatura.fimPeriodoAtual,
        };
      }

      // Buscar Membros da Equipe (outros perfis na mesma empresa)
      const { data: membros } = await supabase
        .from('Perfil')
        .select('id, nomeCompleto, email, role, avatarUrl')
        .eq('empresaId', perfil.empresaId);

      if (membros) {
        membrosData = membros;
      }
    }

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

