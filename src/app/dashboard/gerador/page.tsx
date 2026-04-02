"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Bot,
  FileText,
  Sparkles,
  Upload,
  Download,
  Eye,
  Plus,
  X,
  Layers
} from "lucide-react";

type ScenarioKey = "empresa" | "sindicato" | "zero" | "aditivo";

const scenarios: Record<ScenarioKey, { title: string; description: string }> = {
  empresa: {
    title: "Analisar proposta da empresa",
    description: "Upload da proposta patronal, OCR e comparação semântica com o último acordo.",
  },
  sindicato: {
    title: "Criar proposta do sindicato",
    description: "Pré-preenche a partir do último ACT/CCT e acelera a revisão por categoria.",
  },
  zero: {
    title: "Criar acordo do zero",
    description: "Parte de um template padrão para montar uma minuta completa com IA.",
  },
  aditivo: {
    title: "Criar termo aditivo",
    description: "Abre um acordo assinado e gera aditivo vinculado mantendo histórico.",
  },
};

const initialCategories = [
  "Dados gerais",
  "Salariais",
  "Benefícios",
  "Jornada",
  "Estabilidade",
  "Férias",
  "Rescisórias",
  "PLR",
];

const fields = [
  {
    key: "reajuste",
    label: "Reajuste salarial",
    value: "8.2%",
    status: "Alteração moderada",
    clause:
      "Cláusula 3ª - Fica concedido reajuste de 8.2% sobre o piso vigente, com efeito a partir de 01/05/2026.",
  },
  {
    key: "plano",
    label: "Plano de saúde",
    value: "Migração para Hapvida",
    status: "Alteração crítica",
    clause:
      "Cláusula 11ª - O convênio atual Unimed será substituído por Hapvida sem redução de cobertura assistencial.",
  },
  {
    key: "jornada",
    label: "Jornada semanal",
    value: "44h mantidas",
    status: "Sem alteração",
    clause:
      "Cláusula 5ª - Mantém-se jornada de 44 horas semanais, com banco de horas mediante acordo prévio.",
  },
];

export default function GeradorPage() {
  const [scenario, setScenario] = useState<ScenarioKey | null>(null);
  const [categories, setCategories] = useState<string[]>(initialCategories);
  const [newCategory, setNewCategory] = useState("");
  const [openClause, setOpenClause] = useState<{ label: string; text: string } | null>(null);

  function moveCategory(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= categories.length) return;
    const next = [...categories];
    [next[index], next[target]] = [next[target], next[index]];
    setCategories(next);
  }

  function addCategory() {
    const cleaned = newCategory.trim();
    if (!cleaned) return;
    setCategories((prev) => [...prev, cleaned]);
    setNewCategory("");
  }

  const draftText = useMemo(() => {
    const scenarioTitle = scenario ? scenarios[scenario].title : "Cenário ainda não selecionado";
    return [
      "MINUTA DE ACORDO COLETIVO DE TRABALHO",
      `Fluxo ativo: ${scenarioTitle}`,
      "",
      "Cláusula 1ª - Reajuste salarial de 8.2% a partir da data-base.",
      "Cláusula 2ª - Plano de saúde com migração assistida para nova operadora.",
      "Cláusula 3ª - Manutenção da jornada e regras de banco de horas.",
      "",
      "Documento dinâmico: cada alteração no quiz atualiza esta minuta.",
    ].join("\n");
  }, [scenario]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <section className="section-shell p-8 md:p-10 relative overflow-hidden group">
        <div className="absolute top-1/2 left-1/4 w-[30rem] h-[30rem] bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row justify-between gap-6 relative z-10 lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-accent mb-4 px-3 py-1.5 rounded-full border border-accent/20 bg-accent/5 backdrop-blur-sm">
              <Layers className="h-4 w-4" />
              Coração da Ferramenta
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1]">
              Gerador e analisador <br className="hidden md:block"/>
              <span className="font-serif italic font-normal text-5xl md:text-6xl lg:text-7xl text-accent">inteligente.</span>
            </h1>
            <p className="mt-5 text-foreground/70 text-lg font-medium max-w-2xl">
              Workflow lado-a-lado: parâmetros definidos pela IA à esquerda e redação final atualizada em tempo real à direita.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button className="magnetic hover-lift inline-flex items-center gap-2 rounded-full border border-border-soft bg-surface/50 hover:bg-surface px-6 py-3.5 text-sm font-bold backdrop-blur-sm transition-colors">
              <Upload className="h-4 w-4" />
              Importar DOCX
            </button>
            <button className="magnetic hover-lift inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3.5 text-sm font-bold neo-ring">
              <Download className="h-4 w-4" />
              Exportar DOCX
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-5 min-h-[68vh]">
        <article className="section-shell p-6 md:p-8 flex flex-col min-h-[66vh] bg-surface/40 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-border-soft/50">
            <h2 className="text-2xl font-semibold inline-flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/20">
                <Bot className="h-5 w-5 text-accent" />
              </div>
              Quiz inteligente
            </h2>
            <button
              type="button"
              onClick={() => setScenario(null)}
              className="text-xs font-bold rounded-full border border-border-soft hover:bg-surface-dim transition-colors px-4 py-2 hover-lift magnetic"
            >
              Trocar cenário
            </button>
          </div>

          {scenario ? (
            <p className="rounded-[1.25rem] bg-accent/5 border border-accent/20 p-5 text-sm leading-relaxed mb-6 shadow-inner">
              <strong className="text-accent text-base block mb-1">{scenarios[scenario].title}</strong>
              <span className="text-foreground/80">{scenarios[scenario].description}</span>
            </p>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1.3fr] gap-5 flex-1">
            {/* Categorias */}
            <div className="rounded-[1.5rem] border border-border-soft bg-surface/60 p-5 flex flex-col">
              <h3 className="text-xs font-mono uppercase tracking-[0.1em] text-foreground/50 mb-4 px-1">Ordem da Minuta</h3>
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-2 flex-1 scrollbar-thin scrollbar-thumb-border-soft scrollbar-track-transparent">
                {categories.map((category, index) => (
                  <div key={`${category}-${index}`} className="group rounded-[1rem] border border-border-soft bg-background hover:bg-surface-dim transition-colors px-4 py-3 text-sm flex items-center gap-3 shadow-sm">
                    <span className="flex-1 font-medium">{category}</span>
                    <button onClick={() => moveCategory(index, -1)} className="p-1.5 rounded-lg text-foreground/40 hover:text-foreground hover:bg-surface transition-colors" aria-label="Subir categoria">
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button onClick={() => moveCategory(index, 1)} className="p-1.5 rounded-lg text-foreground/40 hover:text-foreground hover:bg-surface transition-colors" aria-label="Descer categoria">
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-2 pt-4 border-t border-border-soft/50">
                <input
                  value={newCategory}
                  onChange={(event) => setNewCategory(event.target.value)}
                  placeholder="Nova categoria"
                  className="flex-1 rounded-[1rem] border border-border-soft bg-surface px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
                  onKeyDown={e => e.key === 'Enter' && addCategory()}
                />
                <button onClick={addCategory} className="rounded-[1rem] bg-primary text-primary-foreground px-4 py-2.5 text-sm font-bold magnetic flex items-center justify-center shrink-0">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Campos Extraídos */}
            <div className="rounded-[1.5rem] border border-border-soft bg-surface/60 p-5 flex flex-col">
              <h3 className="text-xs font-mono uppercase tracking-[0.1em] text-foreground/50 mb-4 px-1">Itens Extraídos</h3>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2 flex-1 scrollbar-thin scrollbar-thumb-border-soft scrollbar-track-transparent">
                {fields.map((field) => (
                  <div key={field.key} className="rounded-[1.25rem] border border-border-soft bg-background p-4 shadow-sm hover:border-accent/30 transition-colors">
                    <p className="text-[0.65rem] font-mono uppercase tracking-[0.1em] text-accent/80 mb-1">{field.label}</p>
                    <p className="font-semibold text-base mb-3 leading-snug">{field.value}</p>
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border-soft/50">
                      <span className="text-[10px] font-bold uppercase tracking-wider rounded-full bg-surface-dim border border-border-soft px-2.5 py-1 text-foreground/70">
                        {field.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => setOpenClause({ label: field.label, text: field.clause })}
                        className="text-xs font-bold inline-flex items-center gap-1.5 text-foreground/60 hover:text-accent transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Original
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button className="mt-6 w-full rounded-2xl bg-accent text-accent-foreground px-6 py-4 font-bold inline-flex items-center justify-center gap-2 magnetic shadow-lg shadow-accent/20">
            <Sparkles className="h-5 w-5" />
            Processar Respostas & Gerar Minuta
          </button>
        </article>

        {/* Minuta Viva */}
        <article className="section-shell p-6 md:p-8 min-h-[66vh] flex flex-col">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-border-soft/50">
            <h2 className="text-2xl font-semibold inline-flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-surface-dim border border-border-soft">
                <FileText className="h-5 w-5 text-foreground/80" />
              </div>
              Minuta Draft
            </h2>
            <span className="text-[0.65rem] font-mono uppercase font-bold tracking-[0.15em] text-accent flex items-center gap-2 rounded-full px-3 py-1 bg-accent/10 border border-accent/20">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              Sincronizado
            </span>
          </div>

          <pre className="flex-1 rounded-[1.5rem] border border-border-soft bg-background p-6 md:p-8 text-sm md:text-base leading-[1.8] whitespace-pre-wrap overflow-y-auto font-sans shadow-inner selection:bg-accent/30">
            {draftText}
          </pre>
        </article>
      </section>

      {/* Modal Seleção de Cenário */}
      {!scenario ? (
        <div className="fixed inset-0 z-[75] bg-background/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-4xl section-shell p-8 md:p-12 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-accent/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            
            <div className="relative z-10 text-center mb-10">
              <h2 className="text-3xl md:text-5xl font-semibold mb-4 tracking-tight">Defina a sua <span className="font-serif italic font-normal text-accent">estratégia.</span></h2>
              <p className="text-lg text-foreground/70 max-w-xl mx-auto">
                Selecione qual fluxo intelectual de geração será iniciado agora. A IA montará a interface sob medida.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
              {(Object.keys(scenarios) as ScenarioKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setScenario(key)}
                  className="group text-left rounded-[1.75rem] border border-border-soft bg-surface p-6 hover:border-accent hover:bg-surface-dim transition-all magnetic relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative z-10">
                    <h3 className="font-bold text-xl mb-2 flex items-center justify-between">
                      {scenarios[key].title}
                      <ArrowRight className="h-4 w-4 text-foreground/30 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                    </h3>
                    <p className="text-sm font-medium text-foreground/60 leading-relaxed">{scenarios[key].description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Modal View Original Clause */}
      {openClause ? (
        <div className="fixed inset-0 z-[80] bg-background/80 backdrop-blur-md p-4 flex items-center justify-center animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-[2rem] border border-border-soft bg-surface p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between gap-4 mb-6 pb-4 border-b border-border-soft/50">
              <div>
                 <p className="text-xs font-mono uppercase tracking-[0.1em] text-accent mb-1">Referência Origem</p>
                 <h3 className="text-xl font-bold font-serif">{openClause.label}</h3>
              </div>
              <button 
                onClick={() => setOpenClause(null)} 
                className="rounded-full bg-surface-dim hover:bg-border-soft transition-colors p-2 text-foreground/60 hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-base font-medium text-foreground/85 leading-[1.8] bg-background p-6 rounded-[1.25rem] border border-border-soft">
              {openClause.text}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

