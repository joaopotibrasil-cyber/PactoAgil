"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ArrowRight, Sparkles, Loader2 } from "lucide-react";

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<"verifying" | "active" | "error">("verifying");
  const [plano, setPlano] = useState("");

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(`/api/checkout/verify?session_id=${sessionId}`, {
          credentials: "include",
        });
        const data = await res.json();

        if (data.status === "active") {
          setStatus("active");
          setPlano(data.tipoPlano || "");

          // Confetti apenas quando confirmado
          try {
            const confetti = (await import("canvas-confetti")).default;
            const duration = 3 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
            const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

            const interval = setInterval(() => {
              const timeLeft = animationEnd - Date.now();
              if (timeLeft <= 0) return clearInterval(interval);
              const particleCount = 50 * (timeLeft / duration);
              confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
              confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
            }, 250);
          } catch { /* confetti não é crítico */ }
        } else if (data.status === "pending") {
          // Tentar novamente em 3 segundos
          setTimeout(verify, 3000);
        } else {
          setStatus("error");
        }
      } catch {
        setStatus("error");
      }
    };

    verify();
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-accent/10 via-background to-background">
      <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-700">
        
        {status === "verifying" && (
          <>
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-accent blur-3xl opacity-20 animate-pulse" />
              <div className="relative bg-surface border border-border-soft rounded-full p-6 neo-ring">
                <Loader2 className="w-16 h-16 text-accent animate-spin" />
              </div>
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-bold tracking-tight text-white">
                Ativando sua assinatura...
              </h1>
              <p className="text-foreground/70 text-lg leading-relaxed">
                Estamos confirmando seu pagamento com o Stripe. Isso leva apenas alguns segundos.
              </p>
            </div>
          </>
        )}

        {status === "active" && (
          <>
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-accent blur-3xl opacity-20 animate-pulse" />
              <div className="relative bg-surface border border-border-soft rounded-full p-6 neo-ring">
                <CheckCircle2 className="w-16 h-16 text-accent" />
              </div>
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-bold tracking-tight text-white">
                Assinatura Confirmada!
              </h1>
              {plano && (
                <p className="text-accent font-mono text-sm uppercase tracking-widest">
                  Plano {plano} ativado
                </p>
              )}
              <p className="text-foreground/70 text-lg leading-relaxed">
                Seja bem-vindo ao próximo nível da gestão sindical. Sua conta foi atualizada e todos os recursos do seu plano já estão liberados.
              </p>
            </div>
            <div className="grid gap-4">
              <Link
                href="/dashboard"
                className="group relative flex items-center justify-center gap-2 bg-primary text-primary-foreground py-4 rounded-2xl font-bold text-lg hover-lift transition-all neo-ring"
              >
                Acessar Painel de Controle
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <div className="flex items-center justify-center gap-2 text-sm font-mono text-accent uppercase tracking-widest">
                <Sparkles className="w-4 h-4" />
                Pacto Ágil SaaS
              </div>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="space-y-3">
              <h1 className="text-3xl font-bold tracking-tight text-white">
                Algo deu errado
              </h1>
              <p className="text-foreground/70 text-lg leading-relaxed">
                Não conseguimos verificar sua assinatura. Tente acessar o painel — se o pagamento foi processado, sua conta será ativada automaticamente.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground py-4 px-8 rounded-2xl font-bold text-lg hover-lift transition-all"
            >
              Ir para o Painel
              <ArrowRight className="w-5 h-5" />
            </Link>
          </>
        )}

        <p className="text-xs text-foreground/40 pt-8 border-t border-border-soft">
          Um recibo foi enviado para o seu e-mail. Em caso de dúvidas, contate nosso suporte premium.
        </p>
      </div>
    </div>
  );
}
