"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

export default function CheckoutSuccessPage() {
  useEffect(() => {
    // Efeito de confete premium ao carregar
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-accent/10 via-background to-background">
      <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-700">
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

        <p className="text-xs text-foreground/40 pt-8 border-t border-border-soft">
          Um recibo foi enviado para o seu e-mail. Em caso de dúvidas, contate nosso suporte premium.
        </p>
      </div>
    </div>
  );
}
