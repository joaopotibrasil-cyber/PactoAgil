"use client";

import Link from "next/link";
import { useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Building2, Filter, Plus, Search } from "lucide-react";

type Status = "finalizadas" | "andamento" | "atrasadas" | "total";

const records = [
  {
    id: "acme-metal",
    empresa: "Acme Metalurgica",
    dataBase: "2026-05-01",
    status: "andamento" as const,
    instrumento: "ACT 2026",
  },
  {
    id: "plural-telecom",
    empresa: "Plural Telecom",
    dataBase: "2026-04-15",
    status: "finalizadas" as const,
    instrumento: "CCT 2026",
  },
  {
    id: "atlas-log",
    empresa: "Atlas Logistica",
    dataBase: "2026-04-10",
    status: "atrasadas" as const,
    instrumento: "ACT 2026",
  },
  {
    id: "brisas-hotel",
    empresa: "Brisas Hotelaria",
    dataBase: "2026-06-01",
    status: "andamento" as const,
    instrumento: "CCT 2026",
  },
];

const statusLabel: Record<Exclude<Status, "total">, string> = {
  andamento: "Em andamento",
  finalizadas: "Finalizada",
  atrasadas: "Atrasada",
};

const statusStyles = {
  andamento: "bg-warning/10 text-warning border-warning/20",
  finalizadas: "bg-success/10 text-success border-success/20",
  atrasadas: "bg-danger/10 text-danger border-danger/20"
};

function NegociacoesContent() {
  const searchParams = useSearchParams();
  const filtro = (searchParams.get("filtro") ?? "total") as Status;

  const filtered = useMemo(() => {
    if (filtro === "total") return records;
    return records.filter((item) => item.status === filtro);
  }, [filtro]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <section className="section-shell p-8 md:p-10 relative overflow-hidden group">
        <div className="absolute top-0 right-1/4 w-[30rem] h-[30rem] bg-accent/5 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-accent mb-4 px-3 py-1.5 rounded-full border border-accent/20 bg-accent/5 backdrop-blur-sm">
              Portfólio Ativo
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1]">
              Negociações por <br className="hidden md:block"/>
              <span className="font-serif italic font-normal text-5xl md:text-6xl lg:text-7xl text-accent">empresa.</span>
            </h1>
            <p className="mt-5 text-foreground/70 text-lg font-medium">
              Filtro ativo: <strong className="text-foreground capitalize">{filtro}</strong>
            </p>
          </div>

          <Link
            href="/dashboard/geradas"
            className="magnetic hover-lift inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-8 py-4 font-bold text-base neo-ring w-full md:w-auto shrink-0"
          >
            <Plus className="h-5 w-5" />
            Nova negociação
          </Link>
        </div>
      </section>

      <section className="section-shell p-8">
        <div className="flex flex-col lg:flex-row gap-4 justify-between mb-8">
          <label className="relative w-full lg:max-w-md group/input">
            <Search className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 group-focus-within/input:text-accent transition-colors" />
            <input
              type="search"
              placeholder="Buscar empresa, CNPJ ou instrumento..."
              className="w-full rounded-[1.25rem] border border-border-soft bg-surface/50 py-3.5 pl-12 pr-4 text-base focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all placeholder:text-foreground/40"
            />
          </label>
          <button className="hover-lift magnetic inline-flex items-center justify-center gap-2 rounded-[1.25rem] border border-border-soft px-6 py-3.5 text-sm font-bold bg-surface hover:bg-surface-dim transition-colors">
            <Filter className="h-4 w-4" />
            Filtros avançados
          </button>
        </div>

        <div className="overflow-x-auto rounded-[1.5rem] border border-border-soft bg-surface/30">
          <table className="w-full min-w-[800px] text-sm text-left">
            <thead className="bg-surface/50">
              <tr className="text-xs font-mono uppercase tracking-[0.15em] text-foreground/50 border-b border-border-soft">
                <th className="py-4 px-6 font-medium">Empresa</th>
                <th className="py-4 font-medium">Data-base</th>
                <th className="py-4 font-medium">Instrumento</th>
                <th className="py-4 font-medium">Status</th>
                <th className="py-4 px-6 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft/50">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-surface-dim/30 transition-colors group">
                  <td className="py-4 px-6">
                    <div className="inline-flex items-center gap-3">
                      <span className="h-10 w-10 rounded-xl bg-surface border border-border-soft inline-flex items-center justify-center group-hover:border-accent/40 transition-colors">
                        <Building2 className="h-4 w-4 text-foreground/70" />
                      </span>
                      <span className="font-semibold text-base">{item.empresa}</span>
                    </div>
                  </td>
                  <td className="py-4 font-mono text-foreground/80">{item.dataBase}</td>
                  <td className="py-4 font-medium">{item.instrumento}</td>
                  <td className="py-4">
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${statusStyles[item.status]}`}>
                      {statusLabel[item.status]}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Link
                      href={`/dashboard/negociacoes/${item.id}`}
                      className="inline-flex rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground px-5 py-2.5 text-xs font-bold transition-all magnetic"
                    >
                      Ver detalhes
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
             <div className="py-12 text-center text-foreground/50 font-medium">
               Nenhuma negociação encontrada para o filtro atual.
             </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function NegociacoesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-foreground/50 text-center font-medium animate-pulse">Carregando carteira de negociações...</div>}>
      <NegociacoesContent />
    </Suspense>
  );
}

