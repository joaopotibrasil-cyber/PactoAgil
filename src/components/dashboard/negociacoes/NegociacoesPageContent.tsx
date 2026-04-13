"use client";

import { useState } from "react";
import { ROUTES } from "@/constants/routes";
import { 
  Building2, 
  Plus, 
  Search, 
  FileText, 
  Trash2, 
  ExternalLink,
  Loader2,
  Calendar,
  Layers
} from "lucide-react";

const statusLabel: Record<string, string> = {
  RASCUNHO: "Rascunho",
  ANDAMENTO: "Em andamento",
  FINALIZADA: "Finalizada",
  ATRASADA: "Atrasada",
};

const statusStyles: Record<string, string> = {
  RASCUNHO: "bg-surface-dim text-foreground/60 border-border-soft",
  ANDAMENTO: "bg-warning/10 text-warning border-warning/20",
  FINALIZADA: "bg-success/10 text-success border-success/20",
  ATRASADA: "bg-danger/10 text-danger border-danger/20"
};

interface NegociacoesPageContentProps {
  initialNegotiations: any[];
}

export default function NegociacoesPageContent({ initialNegotiations }: NegociacoesPageContentProps) {
  const [negotiations, setNegotiations] = useState<any[]>(initialNegotiations);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filtro] = useState("total");

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta negociação?")) return;
    
    try {
      setLoading(true);
      const res = await fetch(`${ROUTES.API.NEGOTIATIONS}?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setNegotiations(negotiations.filter(n => n.id !== id));
      }
    } catch (err) {
      console.error("Erro ao deletar:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = negotiations.filter(item => {
    const matchesSearch = 
      item.nomeEmpresa?.toLowerCase().includes(search.toLowerCase()) ||
      item.instrumento?.toLowerCase().includes(search.toLowerCase());
    
    const matchesFilter = filtro === "total" || item.status === filtro;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <section className="section-shell p-8 md:p-10 relative overflow-hidden group">
        <div className="absolute top-0 right-1/4 w-[30rem] h-[30rem] bg-accent/5 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-accent mb-4 px-3 py-1.5 rounded-full border border-accent/20 bg-accent/5 backdrop-blur-sm">
              <Layers className="h-4 w-4" />
              Gestão de ACTs e CCTs
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1]">
              Histórico de <br className="hidden md:block"/>
              <span className="font-serif italic font-normal text-5xl md:text-6xl lg:text-7xl text-accent">negociações.</span>
            </h1>
            <p className="mt-5 text-foreground/70 text-lg font-medium">
              Consulte rascunhos salvos e continue editando suas minutas inteligentes.
            </p>
          </div>

          <a
            href={ROUTES.PAGES.DASHBOARD.GENERATOR}
            className="magnetic hover-lift inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-8 py-4 font-bold text-base neo-ring w-full md:w-auto shrink-0 no-underline"
          >
            <Plus className="h-5 w-5" />
            Nova negociação
          </a>
        </div>
      </section>

      <section className="section-shell p-8">
        <div className="flex flex-col lg:flex-row gap-4 justify-between mb-8">
          <label className="relative w-full lg:max-w-md group/input">
            <Search className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 group-focus-within/input:text-accent transition-colors" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por empresa ou instrumento..."
              className="w-full rounded-[1.25rem] border border-border-soft bg-surface/50 py-3.5 pl-12 pr-4 text-base focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all placeholder:text-foreground/40 text-foreground"
            />
          </label>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-foreground/30">
            <Loader2 className="h-10 w-10 animate-spin mb-4" />
            <p className="font-medium">Buscando negociações...</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="overflow-x-auto rounded-[1.5rem] border border-border-soft bg-surface/30">
            <table className="w-full min-w-[800px] text-sm text-left">
              <thead className="bg-surface/50">
                <tr className="text-xs font-mono uppercase tracking-[0.15em] text-foreground/50 border-b border-border-soft">
                  <th className="py-4 px-6 font-medium">Empresa / Título</th>
                  <th className="py-4 font-medium">Data-base</th>
                  <th className="py-4 font-medium">Instrumento</th>
                  <th className="py-4 font-medium">Status</th>
                  <th className="py-4 px-6 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft/50">
                {filtered.map((item: any) => (
                  <tr key={item.id} className="hover:bg-surface-dim/30 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="inline-flex items-center gap-3">
                        <span className="h-10 w-10 rounded-xl bg-surface border border-border-soft inline-flex items-center justify-center group-hover:border-accent/40 transition-colors">
                          <Building2 className="h-4 w-4 text-foreground/70" />
                        </span>
                        <div className="flex flex-col">
                          <span className="font-semibold text-base text-foreground">{item.nomeEmpresa}</span>
                          <span className="text-[10px] text-foreground/30 font-bold uppercase tracking-widest">{item.titulo || "Sem título"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 font-mono text-foreground/80">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-accent/50" />
                        {item.dataBase ? new Date(item.dataBase).toLocaleDateString("pt-BR") : "--/--/----"}
                      </div>
                    </td>
                    <td className="py-4 font-medium text-foreground">{item.instrumento}</td>
                    <td className="py-4">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider ${statusStyles[item.status] || ''}`}>
                        {statusLabel[item.status] || item.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`${ROUTES.PAGES.DASHBOARD.GENERATOR}?id=${item.id}`}
                          className="inline-flex items-center gap-2 rounded-xl bg-accent/10 text-accent hover:bg-accent hover:text-white px-4 py-2 text-xs font-bold transition-all no-underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Continuar
                        </a>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 rounded-xl bg-danger/5 text-danger/40 hover:text-danger hover:bg-danger/10 transition-all border border-transparent hover:border-danger/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-accent/10 border border-accent/20 mb-6">
              <FileText className="w-10 h-10 text-accent/60" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-foreground">Nenhuma negociação encontrada</h3>
            <p className="text-foreground/50 text-base max-w-md mx-auto mb-6">
              Clique no botão abaixo para iniciar uma nova negociação coletiva com a IA.
            </p>
            <a
              href={ROUTES.PAGES.DASHBOARD.GENERATOR}
              className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 font-bold text-sm hover-lift transition-all no-underline"
            >
              <Plus className="h-4 w-4" />
              Nova Negociação
            </a>
          </div>
        )}
      </section>
    </div>
  );
}
