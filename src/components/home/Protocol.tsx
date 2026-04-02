"use client";

import Image from "next/image";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    id: "01",
    title: "Ingestao e OCR",
    body: "Upload de PDF ou DOCX, leitura de clausulas, extracao de contexto e classificacao automatica por categoria.",
    visual: "rings",
  },
  {
    id: "02",
    title: "Analise comparativa",
    body: "O motor semantico cruza proposta atual com historico da entidade e sinaliza mudancas criticas, moderadas ou removidas.",
    visual: "scan",
  },
  {
    id: "03",
    title: "Minuta pronta para mesa",
    body: "A proposta final e redigida em tempo real, com rastreabilidade da origem de cada clausula e historico consolidado.",
    visual: "wave",
  },
];

export function Protocol() {
  const wrapperRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
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

  return (
    <section id="protocol" className="py-28 md:py-32">
      <div className="mx-auto w-[min(1200px,92%)] mb-8">
        <p className="text-xs font-mono uppercase tracking-[0.24em] text-accent mb-4">Protocolo</p>
        <h2 className="text-3xl md:text-5xl font-semibold tracking-tight max-w-4xl">
          Arquivo tatico de negociacao em tres etapas encadeadas.
        </h2>
      </div>

      <section ref={wrapperRef} className="relative h-[82vh] mx-auto w-[min(1200px,92%)]">
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

              <div className="rounded-[1.6rem] border border-border-soft bg-surface-dim p-5 flex items-center justify-center overflow-hidden">
                {step.visual === "rings" ? (
                  <div className="relative w-full h-full">
                    <Image 
                      src="/step-01.png" 
                      alt={step.title} 
                      fill 
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover rounded-[1.2rem] brightness-90 contrast-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
                  </div>
                ) : null}

                {step.visual === "scan" ? (
                  <div className="relative w-full h-full">
                    <Image 
                      src="/step-02.png" 
                      alt={step.title} 
                      fill 
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover rounded-[1.2rem] brightness-90 hover:brightness-100 transition-all duration-500"
                    />
                     <div className="absolute inset-0 bg-accent/10 mix-blend-overlay" />
                  </div>
                ) : null}

                {step.visual === "wave" ? (
                  <div className="relative w-full h-full flex items-center justify-center bg-surface-dim overflow-hidden">
                    <svg viewBox="0 0 380 220" className="w-full h-full opacity-40">
                      <path
                        d="M10 120 L70 120 L94 72 L122 172 L150 98 L176 120 L214 120 L248 84 L278 146 L314 120 L370 120"
                        fill="none"
                        stroke="var(--accent)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        style={{
                          strokeDasharray: 18,
                          animation: "dash-flow 2.1s linear infinite",
                        }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-mono text-accent/60 uppercase tracking-widest">
                      Digital Draft Generation
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </section>
    </section>
  );
}
