import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/billing/stripe';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const planKeySchema = z.enum(['DESCOBERTA', 'MOVIMENTO', 'DIRECAO', 'LIDERANCA']);

async function createCheckoutSession(userId: string, email: string, planKey: string) {
  // Mapeamento seguro no servidor
  const priceIdMap: Record<string, string | undefined> = {
    'DESCOBERTA': process.env.STRIPE_PRICE_ID_DESCOBERTA,
    'MOVIMENTO': process.env.STRIPE_PRICE_ID_MOVIMENTO,
    'DIRECAO': process.env.STRIPE_PRICE_ID_DIRECAO,
    'LIDERANCA': process.env.STRIPE_PRICE_ID_LIDERANCA,
  };

  const priceId = priceIdMap[planKey];

  if (!priceId) {
    throw new Error('Invalid Plan Key');
  }

  // 1. Buscar ou criar perfil
  let perfil = await prisma.perfil.findUnique({
    where: { userId },
    include: { empresa: { include: { assinatura: true } } }
  });

  if (!perfil) {
    perfil = await prisma.perfil.create({
      data: {
        userId,
        email,
        nomeCompleto: email.split('@')[0],
      },
      include: { empresa: { include: { assinatura: true } } }
    });
  }

  // 2. Definir o Customer ID
  let stripeCustomerId = perfil.empresa?.assinatura?.stripeCustomerId;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email,
      name: perfil.nomeCompleto || undefined,
      metadata: { userId },
    });
    stripeCustomerId = customer.id;
  }

  // 3. Criar a sessão de Checkout
  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    subscription_data: {
      metadata: { userId },
    },
  });

  return session.url;
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Rate limiting por userId
    const rateLimitResult = rateLimit(`checkout:${user.id}`, RATE_LIMITS.checkout);
    if (!rateLimitResult.success) {
      return new NextResponse('Too many requests', { status: 429 });
    }

    const body = await req.json();
    const validation = planKeySchema.safeParse(body.planKey);

    if (!validation.success) {
      return new NextResponse('Invalid plan key', { status: 400 });
    }

    const url = await createCheckoutSession(user.id, user.email!, body.planKey);

    return NextResponse.json({ url });
  } catch (error: any) {
    console.error('[STRIPE_CHECKOUT_ERROR]', error);
    return new NextResponse(error.message || 'Internal Error', { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const planKeyParam = searchParams.get('planKey');

    if (!planKeyParam) {
      return redirect('/pricing');
    }

    // Validar plano
    const validation = planKeySchema.safeParse(planKeyParam);
    if (!validation.success) {
      return redirect('/pricing?error=invalid_plan');
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return redirect(`/login?plan=${planKeyParam}&mode=signup`);
    }

    // Rate limiting por userId
    const rateLimitResult = rateLimit(`checkout:${user.id}`, RATE_LIMITS.checkout);
    if (!rateLimitResult.success) {
      return redirect('/pricing?error=rate_limited');
    }

    const url = await createCheckoutSession(user.id, user.email!, planKeyParam);

    if (url) {
      return redirect(url);
    }

    return redirect('/pricing');
  } catch (error: any) {
    console.error('[STRIPE_CHECKOUT_GET_ERROR]', error);
    return redirect('/pricing?error=checkout_failed');
  }
}
