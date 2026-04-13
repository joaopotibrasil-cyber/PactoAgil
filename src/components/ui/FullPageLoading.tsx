"use client";

import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { BrandLogo } from "./BrandLogo";

interface FullPageLoadingProps {
  show: boolean;
  message?: string;
}

const MESSAGES = [
  "Autenticando acesso seguro...",
  "Sincronizando seu ambiente...",
  "Preparando seu painel estratégico...",
  "Quase pronto...",
];

export function FullPageLoading({ show, message }: FullPageLoadingProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    if (!show) return;
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [show]);

  if (!show) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/80 backdrop-blur-xl transition-all duration-500"
      style={{ opacity: 1 }} // Explicitly setting opacity to avoid issues with missing animation plugins
    >
      {/* Decorative background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[40rem] h-[40rem] bg-accent/10 rounded-full blur-[120px] -translate-y-1/2" />
        <div className="absolute bottom-0 left-1/4 w-[40rem] h-[40rem] bg-primary/10 rounded-full blur-[120px] translate-y-1/2" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className="relative">
          {/* Outer spinning ring using standard Tailwind animation */}
          <div className="w-24 h-24 rounded-full border-t-2 border-r-2 border-accent border-l-2 border-l-transparent border-b-2 border-b-transparent animate-spin" />
          
          {/* Inner content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-pulse">
              <BrandLogo className="w-10 h-10 grayscale opacity-40" />
            </div>
          </div>

          {/* Loader icon */}
          <div className="absolute -bottom-2 -right-2 bg-background p-1.5 rounded-full border border-border-soft shadow-xl">
            <Loader2 className="w-5 h-5 animate-spin text-accent" />
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <p className="text-foreground font-medium tracking-tight h-6 text-center">
            {message || MESSAGES[currentMessageIndex]}
          </p>
          
          <div className="flex gap-1.5 mt-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1 h-1 rounded-full bg-accent animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Subtle noise pattern overlay */}
      <div className="bg-noise absolute inset-0 mix-blend-overlay opacity-[0.03]" />
    </div>
  );
}
