import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 animate-in fade-in duration-700">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-accent/10 border-t-accent animate-spin" />
        <Loader2 className="w-8 h-8 text-accent animate-pulse absolute inset-0 m-auto" />
      </div>
      <div className="space-y-2 text-center">
        <h2 className="text-xl font-semibold tracking-tight text-foreground/90">Pacto Ágil</h2>
        <p className="text-sm text-foreground/50 font-mono uppercase tracking-[0.2em]">Iniciando camada de segurança</p>
      </div>
    </div>
  );
}
