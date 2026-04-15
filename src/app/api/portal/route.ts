import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripe } from '@/lib/billing/stripe';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { ROUTES } from '@/constants/routes';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const userId = authResult;


    const supabaseAdmin = createAdminClient();

    // 1. Buscar perfil → empresa → assinatura
    const { data: perfil } = await supabaseAdmin
      .from('Perfil')
      .select(`
        *,
        empresa: Empresa (
          assinatura: Assinatura (*)
        )
      `)
      .eq('userId', userId)
      .single();


    let stripeCustomerId: string | null = null;
    if (perfil?.empresa) {
      const empresaInfo = Array.isArray(perfil.empresa) ? perfil.empresa[0] : perfil.empresa;
      if (empresaInfo?.assinatura) {
        const assInfo = Array.isArray(empresaInfo.assinatura) ? empresaInfo.assinatura[0] : empresaInfo.assinatura;
        stripeCustomerId = assInfo?.stripeCustomerId || null;
      }
    }

    if (!stripeCustomerId) {
      return new NextResponse('No active subscription found', { status: 400 });
    }

    // 2. Criar a sessão do Portal do Stripe
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}${ROUTES.PAGES.DASHBOARD.ROOT}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('[STRIPE_PORTAL_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
