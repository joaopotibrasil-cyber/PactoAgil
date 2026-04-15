import { stripe } from '@/lib/billing/stripe';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { EmailService } from '@/lib/email/EmailService';
import { createAdminClient } from '@/lib/supabase/admin';

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

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret || !signature) {
    return new NextResponse('Webhook secret or signature missing', { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`[STRIPE_WEBHOOK_ERROR] ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const session = event.data.object as any;
  const supabase = createAdminClient();

  try {
    // ─── 1. Checkout Finalizado (Nova Assinatura) ────────────────────
    if (event.type === 'checkout.session.completed') {
      const subscriptionId = session.subscription as string;
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      const userId = session.metadata?.userId || subscription.metadata?.userId;
      const userEmail = session.customer_details?.email;

      if (!userId || !userEmail) {
        console.error('[STRIPE_WEBHOOK_ERROR] User ID or Email missing', { userId, userEmail });
        return new NextResponse('User ID or Email missing', { status: 400 });
      }

      const priceId = subscription.items.data[0].price.id;
      const tipoPlano = resolverTipoPlano(priceId);

      // Buscar perfil do usuário
      const { data: perfil } = await supabase
        .from('Perfil')
        .select('*')
        .eq('userId', userId)
        .single();

      if (perfil) {
        let empresaId = perfil.empresaId;

        // Se o perfil não tem empresa, criar uma
        if (!empresaId) {
          const { data: novaEmpresa, error: empError } = await supabase
            .from('Empresa')
            .insert({
              id: crypto.randomUUID(),
              nome: `Empresa de ${perfil.nomeCompleto || userEmail}`,
              atualizadoEm: new Date(),
            })
            .select('id')
            .single();

          if (empError) {
            console.error('[STRIPE_WEBHOOK] Erro ao criar empresa:', empError);
            return new NextResponse('Erro ao criar empresa', { status: 500 });
          }

          empresaId = novaEmpresa!.id;

          // Vincular perfil à nova empresa
          await supabase
            .from('Perfil')
            .update({ empresaId, atualizadoEm: new Date() })
            .eq('id', perfil.id);
        }

        // Upsert na tabela Assinatura
        const { data: assExistente } = await supabase
          .from('Assinatura')
          .select('id')
          .eq('empresaId', empresaId)
          .single();

        const dadosAssinatura = {
          stripeCustomerId: (subscription as any).customer as string,
          stripeSubscriptionId: subscription.id,
          tipoPlano,
          status: subscription.status,
          fimPeriodoAtual: new Date(((subscription as any).current_period_end || 0) * 1000),
          atualizadoEm: new Date(),
        };

        if (assExistente) {
          await supabase
            .from('Assinatura')
            .update(dadosAssinatura)
            .eq('id', assExistente.id);
        } else {
          await supabase
            .from('Assinatura')
            .insert({
              id: crypto.randomUUID(),
              empresaId,
              ...dadosAssinatura,
            });
        }

        console.log(`[STRIPE_WEBHOOK] ✅ Assinatura ${tipoPlano} ativada para userId: ${userId}`);

        // Envio do e-mail de ativação
        const { data: authData, error: authError } = await supabase.auth.admin.generateLink({
          type: 'magiclink',
          email: userEmail,
          options: {
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
          }
        });

        if (authError) {
          console.error('[STRIPE_WEBHOOK_AUTH_ERROR]', authError);
        } else if (authData?.properties?.action_link) {
          const nomeExibicao = perfil.nomeCompleto || userEmail.split('@')[0];

          await EmailService.sendActivationEmail(
            userEmail,
            nomeExibicao,
            authData.properties.action_link
          );

          console.log(`[STRIPE_WEBHOOK] 📧 Email de ativação enviado para: ${userEmail}`);
        }
      }
    }

    // ─── 2. Fatura Paga ──────────────────────────────────────────────
    if (event.type === 'invoice.paid') {
      const invoice = event.data.object as Stripe.Invoice;
      const stripeCustomerId = invoice.customer as string;

      const { data: assinatura } = await supabase
        .from('Assinatura')
        .select('id, empresaId')
        .eq('stripeCustomerId', stripeCustomerId)
        .single();

      if (assinatura) {
        await supabase
          .from('HistoricoPagamento')
          .insert({
            id: crypto.randomUUID(),
            empresaId: assinatura.empresaId,
            stripeInvoiceId: invoice.id,
            valor: invoice.amount_paid / 100,
            moeda: invoice.currency,
            status: 'paid',
            dataPagamento: new Date(),
            urlFaturaPDF: invoice.invoice_pdf,
            atualizadoEm: new Date(),
          });
      }
    }

    // ─── 3. Assinatura Atualizada ────────────────────────────────────
    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as any;
      await supabase
        .from('Assinatura')
        .update({
          status: subscription.status,
          fimPeriodoAtual: new Date((subscription.current_period_end || 0) * 1000),
          atualizadoEm: new Date(),
        })
        .eq('stripeSubscriptionId', subscription.id);
    }

    // ─── 4. Assinatura Cancelada ─────────────────────────────────────
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as any;
      await supabase
        .from('Assinatura')
        .update({
          status: 'canceled',
          atualizadoEm: new Date(),
        })
        .eq('stripeSubscriptionId', subscription.id);
    }

    return new NextResponse('Webhook processed', { status: 200 });
  } catch (error: any) {
    console.error('[STRIPE_WEBHOOK_DATABASE_ERROR]', error);
    return new NextResponse('Database Error', { status: 500 });
  }
}
