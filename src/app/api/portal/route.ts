import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/billing/stripe';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // 1. Buscar se o usuário já tem um perfil com uma assinatura associada
    const perfil = await prisma.perfil.findUnique({
      where: { userId: user.id },
      include: { empresa: { include: { assinatura: true } } }
    });

    const stripeCustomerId = perfil?.empresa?.assinatura?.stripeCustomerId;

    if (!stripeCustomerId) {
       // Se não tiver assinatura, redireciona para o checkout
       return new NextResponse('No active subscription found', { status: 400 });
    }

    // 2. Criar a sessão do Portal do Stripe
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('[STRIPE_PORTAL_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
