"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Features } from "./Features";
import { Philosophy } from "./Philosophy";
import { Protocol } from "./Protocol";
import { Pricing } from "./Pricing";
import { Footer } from "./Footer";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { ROUTES } from "@/constants/routes";

gsap.registerPlugin(ScrollTrigger);

export function LandingContent() {
  const heroRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".hero-in",
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, stagger: 0.1, duration: 1.2, ease: "power3.out", delay: 0.2 }
      );

      ScrollTrigger.create({
        trigger: heroRef.current,
        start: "top top-=100",
        onEnter: () => setIsScrolled(true),
        onLeaveBack: () => setIsScrolled(false),
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <main className="relative w-full overflow-x-hidden text-foreground selection:bg-accent selection:text-accent-foreground">
      <nav
        ref={navRef}
        className={`fixed top-5 left-1/2 -translate-x-1/2 z-[60] w-[min(1120px,92%)] rounded-full px-5 py-3 border transition-all duration-500 flex items-center justify-between group ${
          isScrolled ? "glass-panel border-border-soft" : "border-transparent backdrop-blur-sm bg-black/10"
        }`}
      >
        <BrandLogo 
          href={ROUTES.PAGES.HOME} 
          compact 
          className="shrink-0"
          imageClassName={`transition-all duration-500 ${
            isScrolled ? "invert-0" : "invert"
          } dark:invert`} 
        />
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold tracking-wide">
          <a href="#features" className={`hover-lift transition-all duration-300 ${isScrolled ? "text-foreground" : "text-white/90 drop-shadow-md hover:text-white"}`}>Funcionalidades</a>
          <a href="#manifesto" className={`hover-lift transition-all duration-300 ${isScrolled ? "text-foreground" : "text-white/90 drop-shadow-md hover:text-white"}`}>Manifesto</a>
          <a href="#protocol" className={`hover-lift transition-all duration-300 ${isScrolled ? "text-foreground" : "text-white/90 drop-shadow-md hover:text-white"}`}>Protocolo</a>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={ROUTES.PAGES.AUTH.LOGIN}
            className={`magnetic text-sm font-semibold transition-all duration-300 px-4 py-2 hidden sm:block ${
              isScrolled ? "text-foreground" : "text-white/90 drop-shadow-md hover:text-white"
            }`}
          >
            Acesso Cliente
          </a>
          <a
            href="#pricing"
            className="magnetic hover-lift inline-flex items-center gap-2 rounded-full bg-primary text-white px-6 py-2.5 font-bold text-sm shadow-xl shadow-primary/30 neo-ring"
          >
            Assinar
          </a>
        </div>
      </nav>

      <section
        ref={heroRef}
        className="relative min-h-[100dvh] overflow-hidden flex items-end justify-start pb-8"
        style={{
          backgroundImage:
            "linear-gradient(to top, var(--background) 0%, color-mix(in srgb, var(--primary) 60%, transparent) 40%, transparent 100%), url('/hero-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed"
        }}
      >
        <div className="absolute inset-0 bg-slate-950/40 mix-blend-multiply pointer-events-none" />

        <div className="relative z-10 mx-auto w-[min(1240px,92%)] pb-12 md:pb-20 lg:pb-24">
          <div className="max-w-4xl space-y-8">
            <div className="hero-in inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.26em] text-cyan-400 font-semibold px-4 py-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 backdrop-blur-md">
              <ShieldCheck className="w-4 h-4" />
              Inteligência Artificial Aplicada
            </div>
            
            <h1 className="hero-in text-5xl md:text-6xl lg:text-7xl leading-[1.05] font-bold tracking-tight text-white drop-shadow-sm">
              A gestão coletiva sindical atinge a
              <span className="font-serif italic font-normal text-6xl md:text-8xl lg:text-[140px] leading-[0.8] text-primary block mt-4 lg:-ml-2 mix-blend-screen drop-shadow-2xl">
                velocidade real.
              </span>
            </h1>
            
            <p className="hero-in max-w-2xl text-lg md:text-xl text-slate-200 opacity-90 font-medium leading-relaxed drop-shadow-sm">
              O Pacto Ágil centraliza a análise e criação de ACTs e CCTs com fluxos inteligentes baseados em jurisprudência. Uma plataforma construída para sindicatos de classe mundial.
            </p>
            
            <div className="hero-in pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <a
                href={ROUTES.PAGES.AUTH.LOGIN}
                className="magnetic hover-lift inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-8 py-4 font-bold text-base w-full sm:w-auto neo-ring"
              >
                Inicie uma Negociação
                <ArrowRight className="w-5 h-5" />
              </a>
              <a
                href="#protocol"
                className="hover-lift inline-flex items-center justify-center gap-2 rounded-full border border-border-soft px-8 py-4 font-semibold text-base w-full sm:w-auto bg-surface/30 backdrop-blur-sm"
              >
                Como funciona
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="relative z-20 bg-background pt-10">
        <Features />
        <Philosophy />
        <Protocol />
        <Pricing />
        <Footer />
      </div>
    </main>
  );
}
