import type { APIRoute } from "astro";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/astro-auth-helpers";
import { stripe } from "@/lib/billing/stripe";

const PLAN_PRICE_KEYS: Record<string, string | undefined> = {
  DESCOBERTA: import.meta.env.STRIPE_PRICE_DESCOBERTA,
  MOVIMENTO: import.meta.env.STRIPE_PRICE_MOVIMENTO,
  DIRECAO: import.meta.env.STRIPE_PRICE_DIRECAO,
  LIDERANCA: import.meta.env.STRIPE_PRICE_LIDERANCA,
};

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const authResult = await requireAuth(request, cookies);
  if (authResult instanceof Response) return authResult;

  try {
    const { planKey } = await request.json();
    const price = PLAN_PRICE_KEYS[String(planKey || "").toUpperCase()];

    if (!price) {
      return new Response(JSON.stringify({ error: "Plano inválido ou não configurado." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const perfil = await prisma.perfil.findUnique({
      where: { userId: authResult },
      include: { empresa: { include: { assinatura: true } } },
    });

    if (!perfil?.empresa) {
      return new Response(JSON.stringify({ error: "Empresa não encontrada para o usuário." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const customer = perfil.empresa.assinatura?.stripeCustomerId
      ? { customer: perfil.empresa.assinatura.stripeCustomerId }
      : { customer_email: perfil.email };

    const origin = new URL(request.url).origin;
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#pricing`,
      ...customer,
      metadata: {
        userId: authResult,
        empresaId: perfil.empresa.id,
        planKey: String(planKey).toUpperCase(),
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[CHECKOUT_ERROR]", error);
    return new Response(JSON.stringify({ error: "Erro ao iniciar checkout." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
