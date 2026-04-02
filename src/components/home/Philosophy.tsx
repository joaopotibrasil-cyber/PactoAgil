"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function Philosophy() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".manifest-line",
        { y: 34, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 72%",
          },
        }
      );

      gsap.to(".manifesture", {
        yPercent: 12,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="manifesto" ref={sectionRef} className="relative py-30 md:py-36 overflow-hidden">
      <div className="absolute inset-0 bg-[#041024]" />
      <div
        className="manifesture absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1800&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#041024]/75 via-[#041024]/65 to-[#041024]/95" />

      <div className="relative z-10 mx-auto w-[min(1100px,92%)] text-[#e3ecff]">
        <p className="manifest-line text-xs font-mono uppercase tracking-[0.24em] text-accent mb-5">Manifesto</p>
        <p className="manifest-line text-xl md:text-2xl opacity-80 mb-6">
          A maioria da negociacao coletiva ainda opera em copia e cola, com baixa visibilidade de risco.
        </p>
        <h2 className="manifest-line text-4xl md:text-6xl leading-tight font-semibold max-w-4xl">
          Nos focamos em <span className="font-serif italic text-accent">decisao orientada por evidencia</span>,
          com clausulas rastreaveis, comparacao semantica e execucao em ritmo de operacao.
        </h2>
      </div>
    </section>
  );
}
