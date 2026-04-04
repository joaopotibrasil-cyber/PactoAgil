import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripe } from '@/lib/billing/stripe';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

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
      .eq('userId', user.id)
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
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('[STRIPE_PORTAL_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
