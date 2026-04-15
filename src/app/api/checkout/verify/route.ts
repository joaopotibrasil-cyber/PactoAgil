import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripe } from '@/lib/billing/stripe';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';


export const dynamic = 'force-dynamic';

/**
 * Resolve o tipo de plano a partir do priceId recebido,
 * verificando tanto as variáveis de teste quanto de produção.
 */
function resolverTipoPlano(priceId: string): string {
  const isDev = process.env.NODE_ENV === 'development';

  const mapTest: Record<string, string> = {
    [process.env.STRIPE_TEST_PRICE_ID_DESCOBERTA || '']: 'DESCOBERTA',
    [process.env.STRIPE_TEST_PRICE_ID_MOVIMENTO || '']: 'MOVIMENTO',
    [process.env.STRIPE_TEST_PRICE_ID_DIRECAO || '']: 'DIRECAO',
    [process.env.STRIPE_TEST_PRICE_ID_LIDERANCA || '']: 'LIDERANCA',
  };

  const mapLive: Record<string, string> = {
    [process.env.STRIPE_PRICE_ID_DESCOBERTA || '']: 'DESCOBERTA',
    [process.env.STRIPE_PRICE_ID_MOVIMENTO || '']: 'MOVIMENTO',
    [process.env.STRIPE_PRICE_ID_DIRECAO || '']: 'DIRECAO',
    [process.env.STRIPE_PRICE_ID_LIDERANCA || '']: 'LIDERANCA',
  };

  const map = isDev ? mapTest : mapLive;
  return map[priceId] || 'DESCOBERTA';
}

/**
 * GET /api/checkout/verify?session_id=xxx
 * 
 * Após o Stripe redirecionar o usuário de volta, esta rota:
 * 1. Verifica a sessão de checkout no Stripe
 * 2. Cria/atualiza a Assinatura no banco de dados
 * 3. Retorna o status da assinatura
 * 
 * Isso substitui o webhook localmente, onde o Stripe não consegue
 * enviar notificações para o localhost.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'session_id é obrigatório' }, { status: 400 });
    }

    // Verificar autenticação
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const userIdMiddleware = authResult;


    // Buscar sessão no Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    });

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ 
        status: 'pending',
        message: 'Pagamento ainda não confirmado' 
      });
    }

    const subscription = session.subscription as any;
    if (!subscription) {
      return NextResponse.json({ error: 'Assinatura não encontrada na sessão' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();
    const userId = session.metadata?.userId || userIdMiddleware;

    const priceId = subscription.items.data[0].price.id;
    const tipoPlano = resolverTipoPlano(priceId);

    // Buscar perfil
    const { data: perfil } = await supabaseAdmin
      .from('Perfil')
      .select('*')
      .eq('userId', userId)
      .single();

    if (!perfil) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    let empresaId = perfil.empresaId;

    if (!empresaId) {
      // Criar empresa se não existir
      const { data: novaEmpresa, error: empError } = await supabaseAdmin
        .from('Empresa')
        .insert({
          id: crypto.randomUUID(),
          nome: `Empresa de ${perfil.nomeCompleto || perfil.email}`,
          atualizadoEm: new Date(),
        })
        .select('id')
        .single();

      if (empError) {
        console.error('[CHECKOUT_VERIFY] Erro ao criar empresa:', empError);
        return NextResponse.json({ error: 'Erro ao criar empresa' }, { status: 500 });
      }

      empresaId = novaEmpresa!.id;

      await supabaseAdmin
        .from('Perfil')
        .update({ empresaId, atualizadoEm: new Date() })
        .eq('id', perfil.id);
    }

    const dadosAssinatura = {
      stripeCustomerId: subscription.customer as string,
      stripeSubscriptionId: subscription.id,
      tipoPlano,
      status: subscription.status,
      fimPeriodoAtual: new Date((subscription.current_period_end || 0) * 1000),
      atualizadoEm: new Date(),
    };

    // Usar upsert para evitar race condition (check-then-write)
    await supabaseAdmin
      .from('Assinatura')
      .upsert({
        empresaId,
        ...dadosAssinatura,
      }, {
        onConflict: 'empresaId',
        ignoreDuplicates: false,
      });

    console.log(`[CHECKOUT_VERIFY] ✅ Assinatura ${tipoPlano} ativada para userId: ${userId}`);

    return NextResponse.json({
      status: 'active',
      tipoPlano,
      message: `Plano ${tipoPlano} ativado com sucesso!`,
    });

  } catch (error: any) {
    console.error('[CHECKOUT_VERIFY_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
