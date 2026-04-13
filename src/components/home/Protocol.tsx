"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    id: "01",
    title: "Ingestao e OCR",
    body: "Upload de PDF ou DOCX, leitura de clausulas, extracao de contexto e classificacao automatica por categoria.",
    visual: "rings" as const,
  },
  {
    id: "02",
    title: "Analise comparativa",
    body: "O motor semantico cruza proposta atual com historico da entidade e sinaliza mudancas criticas, moderadas ou removidas.",
    visual: "scan" as const,
  },
  {
    id: "03",
    title: "Minuta pronta para mesa",
    body: "A proposta final e redigida em tempo real, com rastreabilidade da origem de cada clausula e historico consolidado.",
    visual: "wave" as const,
  },
];

function StepVisual({ step, className = "" }: { step: (typeof steps)[number]; className?: string }) {
  const base = `rounded-[1.2rem] overflow-hidden ${className}`;
  if (step.visual === "rings") {
    return (
      <div className={`relative w-full min-h-[200px] sm:min-h-[240px] lg:min-h-0 h-full flex items-center justify-center bg-slate-950 ${base}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[120%] max-w-none aspect-square rounded-full border border-primary/10 absolute animate-[spin_10s_linear_infinite]" />
          <div className="w-[90%] aspect-square rounded-full border border-primary/20 absolute animate-[spin_15s_linear_infinite_reverse]" />
          <div className="w-[60%] aspect-square rounded-full border border-primary/30 absolute animate-[pulse_3s_ease-in-out_infinite]" />
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary/20 blur-[50px]" />
        <div className="relative z-10 drop-shadow-lg">
          <img
            src="/logo-pacto-agil-new.png"
            alt="Logo Pacto Ágil"
            width={180}
            height={60}
            className="object-contain invert dark:invert max-w-[min(180px,70vw)] h-auto"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent pointer-events-none" />
      </div>
    );
  }
  if (step.visual === "scan") {
    return (
      <div className={`relative w-full min-h-[200px] sm:min-h-[260px] lg:min-h-0 h-full ${base}`}>
        <img
          src="/step-02.png"
          alt={step.title}
          className="absolute inset-0 w-full h-full object-cover brightness-90 z-0"
        />
        <div className="absolute inset-0 z-10 bg-accent/10 mix-blend-overlay pointer-events-none" />
      </div>
    );
  }
  return (
    <div className={`relative w-full min-h-[200px] sm:min-h-[260px] lg:min-h-0 h-full ${base}`}>
      <img
        src="/step-03.png"
        alt={step.title}
        className="absolute inset-0 w-full h-full object-cover brightness-95 z-0"
      />
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-background/30 to-transparent pointer-events-none" />
    </div>
  );
}

export function Protocol() {
  const wrapperRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    if (!mq.matches) return;

    const ctx = gsap.context(() => {
      const cards = cardsRef.current.filter(Boolean) as HTMLDivElement[];
      if (!cards.length) return;

      gsap.set(cards, { yPercent: (i) => (i === 0 ? 0 : 110) });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: "top top+=48",
          end: "+=2100",
          scrub: true,
          pin: true,
        },
      });

      for (let i = 1; i < cards.length; i += 1) {
        tl.to(
          cards[i - 1],
          {
            scale: 0.9,
            opacity: 0.5,
            filter: "blur(20px)",
            duration: 1,
            ease: "power2.inOut",
          },
          i
        ).to(
          cards[i],
          {
            yPercent: 0,
            duration: 1,
            ease: "power2.inOut",
          },
          i
        );
      }
    }, wrapperRef);

    return () => ctx.revert();
  }, []);

  const sectionWidth = "mx-auto w-[min(1200px,calc(100%-1.5rem))] sm:w-[min(1200px,92%)]";

  return (
    <section id="protocol" className="py-20 sm:py-28 md:py-32 overflow-x-hidden">
      <div className={`${sectionWidth} mb-8 px-0`}>
        <p className="text-xs font-mono uppercase tracking-[0.24em] text-accent mb-4">Protocolo</p>
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-semibold tracking-tight max-w-4xl">
          Arquivo tatico de negociacao em tres etapas encadeadas.
        </h2>
      </div>

      <div className={`${sectionWidth} lg:hidden space-y-6`}>
        {steps.map((step) => (
          <article
            key={step.id}
            className="rounded-2xl md:rounded-[2.2rem] border border-border-soft bg-surface p-6 md:p-8 shadow-[0_26px_70px_rgba(4,18,43,0.26)]"
          >
            <div className="grid grid-cols-1 gap-6">
              <div>
                <p className="text-xs font-mono uppercase tracking-[0.24em] text-accent mb-4">Passo {step.id}</p>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight mb-4">{step.title}</h3>
                <p className="text-base md:text-lg text-foreground/78 max-w-xl">{step.body}</p>
              </div>
              <div className="rounded-[1.6rem] border border-border-soft bg-surface-dim p-4 sm:p-5 flex items-center justify-center min-h-0">
                <StepVisual step={step} className="w-full" />
              </div>
            </div>
          </article>
        ))}
      </div>

      <section ref={wrapperRef} className={`hidden lg:block relative h-[82vh] ${sectionWidth}`}>
        {steps.map((step, index) => (
          <div
            key={step.id}
            ref={(node) => {
              cardsRef.current[index] = node;
            }}
            className="absolute inset-0 rounded-[2.2rem] border border-border-soft bg-surface p-8 md:p-12 shadow-[0_26px_70px_rgba(4,18,43,0.26)]"
          >
            <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <p className="text-xs font-mono uppercase tracking-[0.24em] text-accent mb-5">Passo {step.id}</p>
                <h3 className="text-3xl md:text-5xl font-semibold tracking-tight mb-5">{step.title}</h3>
                <p className="text-base md:text-lg text-foreground/78 max-w-xl">{step.body}</p>
              </div>

              <div className="rounded-[1.6rem] border border-border-soft bg-surface-dim p-5 flex items-center justify-center overflow-hidden min-h-0">
                <StepVisual step={step} className="h-full w-full" />
              </div>
            </div>
          </div>
        ))}
      </section>
    </section>
  );
}
