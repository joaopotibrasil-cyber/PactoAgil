import { useEffect, useState } from "react";
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
import { ROUTES } from "@/constants/routes";
import { negotiationService, type Negotiation } from "@/services/negotiationService";

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

export function NegociacoesPageContent() {
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState("total");

  useEffect(() => {
    // Pegar filtro da URL se existir
    const params = new URLSearchParams(window.location.search);
    const filtroUrl = params.get("filtro");
    if (filtroUrl) setFiltro(filtroUrl);

    fetchNegotiations();
  }, []);

  const fetchNegotiations = async () => {
    try {
      setLoading(true);
      const data = await negotiationService.list();
      setNegotiations(data);
    } catch (err: any) {
      console.error("Erro ao buscar negociações:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta negociação?")) return;
    
    try {
      await negotiationService.delete(id);
      setNegotiations(negotiations.filter(n => n.id !== id));
    } catch (err: any) {
      console.error("Erro ao deletar:", err.message);
      alert("Não foi possível excluir a negociação.");
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
    <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <section className="section-shell p-4 sm:p-6 md:p-8 lg:p-10 relative overflow-hidden group">
        <div className="absolute top-0 right-1/4 w-[20rem] sm:w-[30rem] h-[20rem] sm:h-[30rem] bg-accent/5 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />

        <div className="flex flex-col gap-4 md:flex-row md:items-end justify-between relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-accent mb-3 sm:mb-4 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-accent/20 bg-accent/5 backdrop-blur-sm">
              <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Gestão de ACTs e CCTs
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1] text-white">
              Histórico de <br className="hidden md:block"/>
              <span className="font-serif italic font-normal text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-accent">negociações.</span>
            </h1>
            <p className="mt-3 sm:mt-5 text-foreground/70 text-sm sm:text-lg font-medium">
              Consulte rascunhos salvos e continue editando suas minutas inteligentes.
            </p>
          </div>

          <a
            href={ROUTES.PAGES.DASHBOARD.GENERATOR}
            className="magnetic hover-lift inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-5 sm:px-8 py-3 sm:py-4 font-bold text-xs sm:text-base neo-ring w-full md:w-auto shrink-0 no-underline"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
            Nova negociação
          </a>
        </div>
      </section>

      <section className="section-shell p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="flex flex-col gap-3 sm:gap-4 justify-between mb-6 sm:mb-8">
          <label className="relative w-full group-input">
            <Search className="h-4 w-4 sm:h-5 sm:w-5 absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-foreground/40 group-focus-within/input:text-accent transition-colors" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por empresa ou instrumento..."
              className="w-full rounded-[1.25rem] border border-border-soft bg-surface/50 py-3 sm:py-3.5 pl-10 sm:pl-12 pr-4 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all placeholder:text-foreground/40 text-white"
            />
          </label>
        </div>

        {loading ? (
          <div className="py-16 sm:py-20 flex flex-col items-center justify-center text-foreground/30">
            <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin mb-3 sm:mb-4" />
            <p className="font-medium text-sm sm:text-base">Buscando negociações...</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="overflow-x-auto rounded-[1.25rem] sm:rounded-[1.5rem] border border-border-soft bg-surface/30">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-surface/50">
                  <tr className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.15em] text-foreground/50 border-b border-border-soft whitespace-nowrap">
                    <th className="py-3 sm:py-4 px-3 sm:px-6 font-medium">Empresa / Título</th>
                    <th className="py-3 sm:py-4 px-3 sm:px-4 font-medium">Data-base</th>
                    <th className="py-3 sm:py-4 px-3 sm:px-4 font-medium">Instrumento</th>
                    <th className="py-3 sm:py-4 px-3 sm:px-4 font-medium">Status</th>
                    <th className="py-3 sm:py-4 px-3 sm:px-6 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-soft/50">
                  {filtered.map((item: any) => (
                    <tr key={item.id} className="hover:bg-surface-dim/30 transition-colors group whitespace-nowrap">
                      <td className="py-3 sm:py-4 px-3 sm:px-6">
                        <div className="inline-flex items-center gap-2 sm:gap-3">
                          <span className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-surface border border-border-soft inline-flex items-center justify-center group-hover:border-accent/40 transition-colors">
                            <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-foreground/70" />
                          </span>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-sm sm:text-base text-white truncate max-w-[150px] sm:max-w-none">{item.nomeEmpresa}</span>
                            <span className="text-[8px] sm:text-[10px] text-foreground/30 font-bold uppercase tracking-widest truncate">{item.titulo || "Sem título"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-4 font-mono text-foreground/80 text-xs sm:text-sm">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-accent/50" />
                          {item.dataBase ? new Date(item.dataBase).toLocaleDateString("pt-BR") : "--/--/----"}
                        </div>
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-4 font-medium text-white text-xs sm:text-sm">{item.instrumento}</td>
                      <td className="py-3 sm:py-4 px-3 sm:px-4">
                        <span className={`inline-flex rounded-full border px-2 sm:px-3 py-0.5 sm:py-1 text-[8px] sm:text-[10px] font-black uppercase tracking-wider ${statusStyles[item.status] || ''}`}>
                          {statusLabel[item.status] || item.status}
                        </span>
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                          <a
                            href={`${ROUTES.PAGES.DASHBOARD.GENERATOR}?id=${item.id}`}
                            className="inline-flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl bg-accent/10 text-accent hover:bg-accent hover:text-white px-2.5 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold transition-all no-underline"
                          >
                            <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            <span className="hidden sm:inline">Continuar</span>
                          </a>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-danger/5 text-danger/40 hover:text-danger hover:bg-danger/10 transition-all border border-transparent hover:border-danger/20"
                          >
                            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="py-12 sm:py-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-accent/10 border border-accent/20 mb-4 sm:mb-6">
              <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-accent/60" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2 text-white">Nenhuma negociação encontrada</h3>
            <p className="text-foreground/50 text-sm sm:text-base max-w-md mx-auto mb-4 sm:mb-6 px-4">
              Clique no botão abaixo para iniciar uma nova negociação coletiva com a IA.
            </p>
            <a
              href={ROUTES.PAGES.DASHBOARD.GENERATOR}
              className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 sm:px-6 py-2.5 sm:py-3 font-bold text-xs sm:text-sm hover-lift transition-all no-underline"
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Nova Negociação
            </a>
          </div>
        )}
      </section>
    </div>
  );
}
