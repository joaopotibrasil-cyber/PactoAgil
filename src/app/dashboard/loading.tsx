import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="h-[calc(100vh-160px)] w-full flex flex-col items-center justify-center gap-4 animate-in fade-in duration-500">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-2 border-accent/10 border-t-accent animate-spin" />
        <Loader2 className="w-6 h-6 text-accent animate-pulse absolute inset-0 m-auto" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <p className="text-sm font-medium text-foreground/80 tracking-tight">Carregando painel...</p>
        <p className="text-[0.65rem] text-foreground/40 font-mono uppercase tracking-widest">Preparando seu workspace</p>
      </div>
    </div>
  );
}
