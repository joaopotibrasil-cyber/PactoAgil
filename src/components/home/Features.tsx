"use client";


import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CheckCircle2 } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const stackItems = [
  "Reajuste salarial com simulacao de impacto",
  "Beneficios e cobertura com alerta juridico",
  "Clausulas sensiveis com historico comparado",
];

const feedLines = [
  "[09:07] OCR consolidado em 2.1s | 84 clausulas detectadas",
  "[09:08] Divergencia critica em PLR e adicional noturno",
  "[09:09] Minuta atualizada com 7 ajustes de linguagem",
  "[09:10] Matriz de risco enviada para revisao da equipe",
];

const weekDays = ["S", "T", "Q", "Q", "S", "S", "D"];

export function Features() {
  const containerRef = useRef<HTMLElement>(null);
  const [stack, setStack] = useState(stackItems);
  const [feedTick, setFeedTick] = useState(0);
  const [cursorStep, setCursorStep] = useState(0);

  useEffect(() => {
    const rotateTimer = setInterval(() => {
      setStack((current) => {
        const next = [...current];
        const last = next.pop();
        if (last) next.unshift(last);
        return next;
      });
    }, 3000);

    return () => clearInterval(rotateTimer);
  }, []);

  useEffect(() => {
    const feedTimer = setInterval(() => setFeedTick((prev) => prev + 1), 38);
    return () => clearInterval(feedTimer);
  }, []);

  useEffect(() => {
    const moveTimer = setInterval(() => {
      setCursorStep((prev) => (prev + 1) % (weekDays.length + 2));
    }, 1200);

    return () => clearInterval(moveTimer);
  }, []);

  const typedFeed = useMemo(() => {
    const pauseChars = 24;
    let remaining = feedTick;
    let line = 0;

    while (true) {
      const frame = feedLines[line]!.length + pauseChars;
      if (remaining < frame) break;
      remaining -= frame;
      line = (line + 1) % feedLines.length;
    }

    const charCount = Math.min(remaining, feedLines[line]!.length);
    return feedLines[line]!.slice(0, charCount);
  }, [feedTick]);

  const activeDay = useMemo(() => Math.min(cursorStep, weekDays.length - 1), [cursorStep]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".feature-in",
        { opacity: 0, y: 44 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.15,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 72%",
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="features" ref={containerRef} className="relative py-20 sm:py-28 md:py-32 overflow-x-hidden">
      <div className="mx-auto w-[min(1200px,calc(100%-1.5rem))] sm:w-[min(1200px,92%)] section-shell p-5 sm:p-7 md:p-10 lg:p-12">
        <div className="mb-11">
          <p className="text-xs font-mono uppercase tracking-[0.24em] text-accent mb-4">Features</p>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight max-w-4xl">
            Tres micro-interfaces que reduzem trabalho manual e aceleram cada rodada de negociacao.
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <article className="feature-in group relative rounded-[2rem] border border-border-soft bg-surface p-6 shadow-lg overflow-hidden h-full flex flex-col">
            <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none">
              <img 
                src="/step-01.png" 
                alt="Background" 
                className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-1000" 
              />
            </div>
            <div className="relative z-10 flex flex-col h-full">
              <h3 className="text-lg font-semibold mb-1">Diagnostic Shuffler</h3>
              <p className="text-sm text-foreground/70 mb-5">Reordena prioridades criticas para abrir a mesa com foco no que tem maior risco.</p>
              <div className="relative h-52 mt-auto">
                {stack.map((item, index) => (
                  <div
                    key={item}
                    className="absolute inset-x-0 rounded-2xl border border-border-soft bg-surface-dim/90 backdrop-blur-sm p-4 text-sm font-medium"
                    style={{
                      transform: `translateY(${index * 16}px) scale(${1 - index * 0.05})`,
                      opacity: 1 - index * 0.18,
                      zIndex: 20 - index,
                      transition: "all 380ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                    }}
                  >
                    <p>{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <article className="feature-in rounded-[2rem] border border-border-soft bg-surface p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Telemetry Typewriter</h3>
              <span className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-accent">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" /> Live Feed
              </span>
            </div>
            <p className="text-sm text-foreground/70 mb-5">Log em tempo real para revisao juridica, financeira e sindical na mesma tela.</p>
            <div className="rounded-2xl bg-[#04122b] text-[#8bc4ff] font-mono text-xs p-4 min-h-28 border border-[#113264]">
              {typedFeed}
              <span className="animate-pulse text-accent">|</span>
            </div>
          </article>

          <article className="feature-in rounded-[2rem] border border-border-soft bg-surface p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-1">Cursor Protocol Scheduler</h3>
            <p className="text-sm text-foreground/70 mb-5">Agenda de data-base com ativacao visual e registro imediato da equipe.</p>

            <div className="rounded-2xl border border-border-soft p-4 bg-surface-dim overflow-hidden">
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-4 min-w-0">
                {weekDays.map((day, index) => (
                  <div
                    key={`${day}-${index}`}
                    className={`h-11 rounded-xl text-center text-xs font-mono flex items-center justify-center border ${
                      activeDay === index ? "bg-accent text-accent-foreground border-accent" : "border-border-soft"
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-foreground/70">
                  <CheckCircle2 className="h-4 w-4 text-success" /> Data-base monitorada
                </div>
                <button className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold magnetic">
                  Save
                </button>
              </div>

              <div className="relative mt-3 h-4 w-full min-w-0">
                <div
                  className="absolute top-0 h-4 w-4 rounded-full bg-accent"
                  style={{
                    left: `${((Math.min(cursorStep, weekDays.length - 1) + 0.5) / 7) * 100}%`,
                    transform: `translateX(-50%) scale(${cursorStep > weekDays.length - 1 ? 0.95 : 1})`,
                    transition: "left 320ms cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 320ms cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                  }}
                />
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
