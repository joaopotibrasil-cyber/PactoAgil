import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  
  if (authResult instanceof NextResponse) {
    return authResult; // 401
  }

  const userId = authResult;

  try {
    const body = await request.json();
    const { razaoSocial, cnpj, funcionalidade, corPrimaria, logoUrl } = body;

    const supabase = await createClient();

    // 1. Buscar o perfil para confirmar a empresaId
    const { data: perfil, error: perfilError } = await supabase
      .from('Perfil')
      .select('empresaId, role')
      .eq('userId', userId)
      .single();

    if (perfilError || !perfil || !perfil.empresaId) {
      return NextResponse.json({ error: 'Perfil ou empresa não encontrados' }, { status: 404 });
    }

    // Apenas ADMIN pode atualizar dados da empresa
    if (perfil.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // 2. Atualizar dados da Empresa
    const updateData: any = {};
    if (razaoSocial !== undefined) updateData.nome = razaoSocial;
    if (cnpj !== undefined) updateData.cnpj = cnpj;
    if (funcionalidade !== undefined) updateData.funcionalidade = funcionalidade;
    if (corPrimaria !== undefined) updateData.corPrimaria = corPrimaria;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;

    const { error: updateError } = await supabase
      .from('Empresa')
      .update(updateData)
      .eq('id', perfil.empresaId);

    if (updateError) {
      console.error('[UPDATE_COMPANY_ERROR]', updateError);
      return NextResponse.json({ error: 'Erro ao atualizar dados da empresa' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[UPDATE_PROFILE_ERROR]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
