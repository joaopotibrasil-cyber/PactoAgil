"use client";

import { Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const plans = [
  {
    key: "DESCOBERTA",
    name: "Descoberta",
    price: "Grátis",
    subtitle: "Validação inicial",
    users: "2 usuários",
    limit: "1 acordo por mês",
    features: ["Painel principal", "Upload e leitura de documentos", "Histórico do mês corrente"],
    cta: "Começar grátis",
    featured: false,
  },
  {
    key: "MOVIMENTO",
    name: "Movimento",
    price: "R$ 149",
    subtitle: "Operação enxuta",
    users: "3 usuarios",
    limit: "5 acordos por mês",
    features: ["Comparação semântica", "Gerador de minuta", "Alertas de data-base"],
    cta: "Assinar Movimento",
    featured: false,
  },
  {
    key: "DIRECAO",
    name: "Direção",
    price: "R$ 299",
    subtitle: "Plano mais contratado",
    users: "7 usuários",
    limit: "15 acordos por mês",
    features: ["Painel estratégico avançado", "Fluxo de aditivo", "Suporte prioritário comercial"],
    cta: "Assinar Direção",
    featured: true,
  },
  {
    key: "LIDERANCA",
    name: "Liderança",
    price: "R$ 599",
    subtitle: "Escala nacional",
    users: "10 usuários",
    limit: "50 acordos por mês",
    features: ["Gestão multi-entidade", "Relatórios executivos", "Suporte prioritário estendido"],
    cta: "Falar com consultor",
    featured: false,
  },
];

export function Pricing() {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const handleCheckout = async (planKey: string) => {
    try {
      setLoading(planKey);
      
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // Redireciona para o formulário de registro completo se não estiver logado
        router.push(`/register?plan=${planKey}`);
        return;
      }

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planKey }),
      });

      if (!response.ok) {
        throw new Error("Erro ao iniciar assinatura");
      }

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error(error);
      alert("Houve um erro ao processar seu pedido. Tente novamente.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <section id="pricing" className="py-28 md:py-32">
      <div className="mx-auto w-[min(1200px,92%)] section-shell p-7 md:p-10 lg:p-12">
        <p className="text-xs font-mono uppercase tracking-[0.24em] text-accent mb-4">Planos</p>
        <h2 className="text-3xl md:text-5xl font-semibold tracking-tight max-w-4xl mb-10 text-white">
          Controle de acesso por nivel com espaco para sua equipe crescer sem perder governanca.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`rounded-[2rem] border p-6 flex flex-col gap-5 ${
                plan.featured
                  ? "bg-primary text-primary-foreground border-primary neo-ring scale-[1.02]"
                  : "bg-surface border-border-soft"
              }`}
            >
              <div>
                <p className={`text-xs font-mono uppercase tracking-[0.18em] ${plan.featured ? "text-accent" : "text-foreground/65"}`}>
                  {plan.subtitle}
                </p>
                <h3 className="text-2xl font-semibold mt-2">{plan.name}</h3>
                <p className="text-3xl font-semibold mt-4">{plan.price}<span className="text-sm font-normal opacity-75">/mes</span></p>
                <p className="text-sm mt-2 opacity-80">{plan.limit} · {plan.users}</p>
              </div>

              <ul className="space-y-3 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
                    <Check className={`h-4 w-4 mt-0.5 ${plan.featured ? "text-accent" : "text-success"}`} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCheckout(plan.key)}
                disabled={loading !== null}
                className={`magnetic hover-lift text-center rounded-full px-4 py-2.5 font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  plan.featured
                    ? "bg-accent text-accent-foreground"
                    : "bg-primary text-primary-foreground"
                } disabled:opacity-50`}
              >
                {loading === plan.key ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  plan.cta
                )}
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
