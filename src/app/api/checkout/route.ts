import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth-helpers';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { stripe } from '@/lib/billing/stripe';
import { NextRequest, NextResponse } from 'next/server';

import { redirect } from 'next/navigation';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { z } from 'zod';
import { ROUTES } from '@/constants/routes';

export const dynamic = 'force-dynamic';

const planKeySchema = z.enum(['DESCOBERTA', 'MOVIMENTO', 'DIRECAO', 'LIDERANCA']);

async function createCheckoutSession(userId: string, email: string, planKey: string) {
  const supabaseAdmin = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Mapeamento seguro no servidor — alterna entre teste e produção automaticamente
  const isDev = process.env.NODE_ENV === 'development';
  const priceIdMap: Record<string, string | undefined> = {
    'DESCOBERTA': isDev ? process.env.STRIPE_TEST_PRICE_ID_DESCOBERTA : process.env.STRIPE_PRICE_ID_DESCOBERTA,
    'MOVIMENTO': isDev ? process.env.STRIPE_TEST_PRICE_ID_MOVIMENTO : process.env.STRIPE_PRICE_ID_MOVIMENTO,
    'DIRECAO': isDev ? process.env.STRIPE_TEST_PRICE_ID_DIRECAO : process.env.STRIPE_PRICE_ID_DIRECAO,
    'LIDERANCA': isDev ? process.env.STRIPE_TEST_PRICE_ID_LIDERANCA : process.env.STRIPE_PRICE_ID_LIDERANCA,
  };

  const priceId = priceIdMap[planKey];

  if (!priceId) {
    throw new Error('Invalid Plan Key');
  }

  // 1. Buscar ou criar perfil
  let perfil;
  const { data: perfilData, error: perfilError } = await supabaseAdmin
    .from('Perfil')
    .select(`
      *,
      empresa: Empresa (
        assinatura: Assinatura (*)
      )
    `)
    .eq('userId', userId)
    .single();

  if (perfilError || !perfilData) {
    const { data: newPerfil, error: createError } = await supabaseAdmin
      .from('Perfil')
      .insert({
        id: crypto.randomUUID(),
        userId,
        email,
        nomeCompleto: email.split('@')[0],
        role: 'ADMIN',
        atualizadoEm: new Date(),
      })
      .select('*')
      .single();

    if (createError) throw new Error('Falha ao criar o perfil na inicialização do checkout: ' + createError.message);
    perfil = newPerfil;
  } else {
    perfil = perfilData;
  }

  // 2. Definir o Customer ID
  let stripeCustomerId = null;
  if (perfil?.empresa) {
    const empresaInfo = Array.isArray(perfil.empresa) ? perfil.empresa[0] : perfil.empresa;
    if (empresaInfo?.assinatura) {
      const assInfo = Array.isArray(empresaInfo.assinatura) ? empresaInfo.assinatura[0] : empresaInfo.assinatura;
      stripeCustomerId = assInfo?.stripeCustomerId;
    }
  }

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
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}${ROUTES.PAGES.CHECKOUT.SUCCESS}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}${ROUTES.PAGES.PRICING}`,
    subscription_data: {
      metadata: { userId },
    },
  });

  return session.url;
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const userId = authResult;

    // Rate limiting por userId
    const rateLimitResult = rateLimit(`checkout:${userId}`, RATE_LIMITS.checkout);
    if (!rateLimitResult.success) {
      return new NextResponse('Too many requests', { status: 429 });
    }

    const body = await req.json();
    const validation = planKeySchema.safeParse(body.planKey);

    if (!validation.success) {
      return new NextResponse('Invalid plan key', { status: 400 });
    }

    // Obter o email do usuário do header (injetado pelo middleware)
    const email = req.headers.get('x-user-email') || '';

    const url = await createCheckoutSession(userId, email, body.planKey);


    return NextResponse.json({ url });
  } catch (error: any) {
    console.error('[STRIPE_CHECKOUT_ERROR]', error);
    return new NextResponse(error.message || 'Internal Error', { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const planKeyParam = searchParams.get('planKey');

    if (!planKeyParam) {
      return redirect(ROUTES.PAGES.PRICING);
    }

    // Validar plano
    const validation = planKeySchema.safeParse(planKeyParam);
    if (!validation.success) {
      return redirect(`${ROUTES.PAGES.PRICING}?error=invalid_plan`);
    }

    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      // Se não estiver logado, redireciona para login (comportamento original do GET)
      return redirect(`${ROUTES.PAGES.AUTH.LOGIN}?plan=${planKeyParam}&mode=signup`);
    }
    const userId = authResult;
    const email = req.headers.get('x-user-email') || '';

    // Rate limiting por userId
    const rateLimitResult = rateLimit(`checkout:${userId}`, RATE_LIMITS.checkout);
    if (!rateLimitResult.success) {
      return redirect(`${ROUTES.PAGES.PRICING}?error=rate_limited`);
    }

    const url = await createCheckoutSession(userId, email, planKeyParam);


    if (url) {
      return redirect(url);
    }

    return redirect(ROUTES.PAGES.PRICING);
  } catch (error: any) {
    console.error('[STRIPE_CHECKOUT_GET_ERROR]', error);
    return redirect(`${ROUTES.PAGES.PRICING}?error=checkout_failed`);
  }
}
