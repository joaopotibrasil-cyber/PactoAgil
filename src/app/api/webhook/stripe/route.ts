import { stripe } from '@/lib/billing/stripe';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { EmailService } from '@/lib/email/EmailService';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

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

  try {
    // 1. Checkout Finalizado (Nova Assinatura)
    if (event.type === 'checkout.session.completed') {
      const subscriptionId = session.subscription as string;
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      
      // Tenta pegar o userId dos metadados (da sessão ou da assinatura)
      const userId = session.metadata?.userId || subscription.metadata?.userId;
      const userEmail = session.customer_details?.email;

      if (!userId || !userEmail) {
        console.error('[STRIPE_WEBHOOK_ERROR] User ID or Email missing', { userId, userEmail });
        return new NextResponse('User ID or Email missing', { status: 400 });
      }

      const priceId = subscription.items.data[0].price.id;
      let tipoPlano = 'DESCOBERTA';
      
      if (priceId === process.env.STRIPE_PRICE_ID_MOVIMENTO) tipoPlano = 'MOVIMENTO';
      if (priceId === process.env.STRIPE_PRICE_ID_DIRECAO) tipoPlano = 'DIRECAO';
      if (priceId === process.env.STRIPE_PRICE_ID_LIDERANCA) tipoPlano = 'LIDERANCA';

      const perfil = await prisma.perfil.findUnique({
        where: { userId },
      });

      if (perfil) {
        let empresaId = perfil.empresaId;

        if (!empresaId) {
          const novaEmpresa = await prisma.empresa.create({
            data: {
              nome: `Empresa de ${perfil.nomeCompleto || userEmail}`,
              usuarios: { connect: { id: perfil.id } }
            }
          });
          empresaId = novaEmpresa.id;
        }

        await prisma.assinatura.upsert({
          where: { empresaId: empresaId! },
          create: {
            empresaId: empresaId!,
            stripeCustomerId: (subscription as any).customer as string,
            stripeSubscriptionId: subscription.id,
            tipoPlano: tipoPlano,
            status: subscription.status,
            fimPeriodoAtual: new Date(((subscription as any).current_period_end || 0) * 1000),
          },
          update: {
            stripeSubscriptionId: subscription.id,
            tipoPlano: tipoPlano,
            status: subscription.status,
            fimPeriodoAtual: new Date(((subscription as any).current_period_end || 0) * 1000),
          }
        });

        // 🚀 ENVIO DO E-MAIL DE ATIVAÇÃO PÓS-PAGAMENTO VIA EMAILSERVICE
        const supabase = createAdminClient();
        
        // Gera um link de confirmação de cadastro (SignUp) via Admin API
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
          
          console.log(`[STRIPE_WEBHOOK] Email de ativação (Premium Cyan) enviado para: ${userEmail}`);
        }
      }
    }

    // (O resto do webhook permanece igual para faturas e cancelamentos)
    if (event.type === 'invoice.paid') {
      const invoice = event.data.object as Stripe.Invoice;
      const stripeCustomerId = invoice.customer as string;

      const assinatura = await prisma.assinatura.findUnique({
        where: { stripeCustomerId },
        include: { empresa: true }
      });

      if (assinatura) {
        await (prisma as any).historicoPagamento.create({
          data: {
            empresaId: assinatura.empresaId,
            stripeInvoiceId: invoice.id,
            valor: invoice.amount_paid / 100,
            moeda: invoice.currency,
            status: 'paid',
            dataPagamento: new Date(),
            urlFaturaPDF: invoice.invoice_pdf,
          }
        });
      }
    }

    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as any;
      await prisma.assinatura.update({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          status: subscription.status,
          fimPeriodoAtual: new Date((subscription.current_period_end || 0) * 1000),
        }
      });
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as any;
      await prisma.assinatura.update({
        where: { stripeSubscriptionId: subscription.id },
        data: { status: 'canceled' }
      });
    }

    return new NextResponse('Webhook processed', { status: 200 });
  } catch (error: any) {
    console.error('[STRIPE_WEBHOOK_DATABASE_ERROR]', error);
    return new NextResponse('Database Error', { status: 500 });
  }
}
