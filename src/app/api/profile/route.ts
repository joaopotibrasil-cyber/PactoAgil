import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/profile
 * Retorna os dados do perfil do usuário autenticado (server-side).
 * Resolve o problema de RLS bloqueando queries diretas do client SDK
 * quando o token não está disponível no browser.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Buscar perfil com dados básicos
    const { data: perfil, error: perfilError } = await supabase
      .from('Perfil')
      .select('nomeCompleto, email, role, empresaId')
      .eq('userId', user.id)
      .single();

    if (perfilError || !perfil) {
      // Se não tem perfil, retorna dados mínimos do auth
      return NextResponse.json({
        nomeCompleto: user.email?.split('@')[0] || 'Usuário',
        email: user.email || '',
        role: 'USER',
        empresaNome: 'Sem empresa',
        plano: 'SEM PLANO',
        logoUrl: null,
        corPrimaria: null,
      });
    }

    let empresaNome = 'Sem empresa';
    let logoUrl: string | null = null;
    let corPrimaria: string | null = null;
    let tipoPlano = 'SEM PLANO';

    if (perfil.empresaId) {
      // Buscar empresa
      const { data: empresa } = await supabase
        .from('Empresa')
        .select('nome, logoUrl, corPrimaria')
        .eq('id', perfil.empresaId)
        .single();

      if (empresa) {
        empresaNome = empresa.nome || 'Sem empresa';
        logoUrl = empresa.logoUrl || null;
        corPrimaria = empresa.corPrimaria || null;
      }

      // Buscar assinatura separadamente
      const { data: assinatura } = await supabase
        .from('Assinatura')
        .select('tipoPlano')
        .eq('empresaId', perfil.empresaId)
        .single();

      if (assinatura) {
        tipoPlano = assinatura.tipoPlano || 'SEM PLANO';
      }
    }

    return NextResponse.json({
      nomeCompleto: perfil.nomeCompleto || user.email?.split('@')[0] || 'Usuário',
      email: perfil.email || user.email || '',
      role: perfil.role || 'USER',
      empresaNome,
      plano: tipoPlano,
      logoUrl,
      corPrimaria,
    });
  } catch (err) {
    console.error('[PROFILE_ERROR]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
