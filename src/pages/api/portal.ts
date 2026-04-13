import type { APIRoute } from "astro";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/astro-auth-helpers";
import { stripe } from "@/lib/billing/stripe";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const authResult = await requireAuth(request, cookies);
  if (authResult instanceof Response) return authResult;

  try {
    const perfil = await prisma.perfil.findUnique({
      where: { userId: authResult },
      include: { empresa: { include: { assinatura: true } } },
    });

    const customerId = perfil?.empresa?.assinatura?.stripeCustomerId;
    if (!customerId) {
      return new Response(JSON.stringify({ error: "Nenhuma assinatura ativa encontrada." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${new URL(request.url).origin}/dashboard/configuracoes`,
    });

    return new Response(JSON.stringify({ url: portalSession.url }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[PORTAL_ERROR]", error);
    return new Response(JSON.stringify({ error: "Erro ao abrir portal de assinatura." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
