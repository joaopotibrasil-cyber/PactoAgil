"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
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
  Layers,
  Loader2,
  Zap,
  History,
  FilePlus,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpDown,
  Edit3,
  Trash2,
  Save,
  Check,
} from "lucide-react";

type ScenarioKey = "empresa" | "sindicato" | "zero" | "aditivo";

const scenarios: Record<ScenarioKey, { title: string; description: string; icon: any; color: string; badge?: string }> = {
  empresa: {
    title: "Analisar proposta da empresa",
    description: "Upload da proposta patronal, OCR e comparação semântica com o último acordo.",
    icon: Search,
    color: "accent",
  },
  sindicato: {
    title: "Criar proposta do sindicato",
    description: "Pré-preenche a partir do último ACT/CCT e acelera a revisão por categoria.",
    icon: Zap,
    color: "emerald-400",
    badge: "Recomendado",
  },
  zero: {
    title: "Criar acordo do zero",
    description: "Parte de um template padrão para montar uma minuta completa com IA.",
    icon: FilePlus,
    color: "blue-400",
  },
  aditivo: {
    title: "Criar termo aditivo",
    description: "Abre um acordo assinado e gera aditivo vinculado mantendo histórico.",
    icon: History,
    color: "amber-400",
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

interface ExtractedField {
  key: string;
  label: string;
  value: string;
  status: string;
  clause: string;
  category?: string;
  confidence?: number;
  selected?: boolean;
}

export default function GeradorPage() {
  const searchParams = useSearchParams();
  const [scenario, setScenario] = useState<ScenarioKey | null>(null);
  const [categories, setCategories] = useState<string[]>(initialCategories);
  const [newCategory, setNewCategory] = useState("");
  const [openClause, setOpenClause] = useState<{ label: string; text: string } | null>(null);
  const [draftContent, setDraftContent] = useState("");
  const [extractedFields, setExtractedFields] = useState<ExtractedField[]>([]);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [negotiationId, setNegotiationId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- CARREGAR NEGOCIAÇÃO POR ID ---
  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      loadNegotiation(id);
    }
  }, [searchParams]);

  async function loadNegotiation(id: string) {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/negotiations?id=${id}`);
      if (res.ok) {
        const data = await res.json();
        setNegotiationId(data.id);
        setScenario("empresa"); // Default para abrir o quiz
        setExtractedFields(data.clausulas || []);
        setDraftContent(data.minuta || "");
      }
    } catch (err) {
      console.error("[Gerador] Erro ao carregar negociação:", err);
    } finally {
      setIsLoading(false);
    }
  }

  // --- ANALISAR COM IA ---
  async function handleAnalyze(content: string) {
    if (!content) return;
    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentContent: content, scenario }),
      });

      const data = await response.json();

      if (data.fields && data.fields.length > 0) {
        setExtractedFields(data.fields.map((f: any) => ({ 
          ...f, 
          selected: true, 
          confidence: Math.random() * 0.2 + 0.8 // Simulação de confiança alta da IA
        })));
      }
    } catch (err) {
      console.error("[Gerador] Erro na análise IA:", err);
    } finally {
      setIsAnalyzing(false);
    }
  }

  // --- GERAR MINUTA COM IA ---
  async function handleGenerate() {
    if (!scenario) {
      alert("Selecione um cenário primeiro.");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario,
          categories,
          fields: extractedFields.filter((f) => f.selected),
          documentContent: draftContent,
        }),
      });

      const data = await response.json();

      if (data.text) {
        setDraftContent(data.text);
      } else if (data.error) {
        alert(data.error);
      }
    } catch (err) {
      console.error("[Gerador] Erro na geração IA:", err);
      alert("Ocorreu um erro ao gerar a minuta com IA.");
    } finally {
      setIsGenerating(false);
    }
  }

  // --- SALVAR NO BANCO ---
  async function handleSave() {
    if (!draftContent && extractedFields.length === 0) {
      alert("Nada para salvar ainda. Importe ou gere uma minuta.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/negotiations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: negotiationId,
          titulo: "Negociação - " + new Date().toLocaleDateString("pt-BR"),
          clausulas: extractedFields,
          minuta: draftContent,
          status: "RASCUNHO",
          instrumento: "ACT/CCT",
        }),
      });

      if (!response.ok) throw new Error("Erro ao salvar");
      const data = await response.json();
      setNegotiationId(data.id);
      alert(negotiationId ? "Negociação atualizada com sucesso!" : "Negociação salva com sucesso!");
    } catch (err) {
      console.error("[Gerador] Erro ao salvar:", err);
      alert("Erro ao salvar negociação no banco.");
    } finally {
      setIsSaving(false);
    }
  }

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
    setCategories((prev: string[]) => [...prev, cleaned]);
    setNewCategory("");
  }

  const draftText = useMemo(() => {
    if (draftContent) return draftContent;
    
    if (!scenario) return "Selecione um cenário para começar a gerar a minuta.";
    
    const scenarioTitle = scenarios[scenario].title;
    return [
      "MINUTA DE ACORDO COLETIVO DE TRABALHO",
      `Fluxo ativo: ${scenarioTitle}`,
      "",
      "As cláusulas serão geradas automaticamente após o processamento com IA.",
      "Configure as categorias à esquerda e clique em \"Processar Respostas & Gerar Minuta\".",
      "",
      "O gerador analisará o cenário selecionado e criará as cláusulas",
      "adequadas para cada categoria definida na ordem da minuta.",
    ].join("\n");
  }, [scenario, draftContent]);

  // --- IMPORT DOCX ---
  async function handleImportDocx() {
    fileInputRef.current?.click();
  }

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".docx")) {
      alert("Por favor, selecione um arquivo .docx");
      return;
    }

    setImporting(true);
    try {
      const mammoth = await import("mammoth");
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.default.extractRawText({ arrayBuffer });
      
      setDraftContent(result.value);
      
      // Tentar extrair cláusulas do texto
      const clauseRegex = /Cláusula\s+(\d+[ªºa]?)\s*[-–—:]\s*([\s\S]+?)(?=Cláusula\s+\d|$)/gi;
      const fields: ExtractedField[] = [];
      let match;
      while ((match = clauseRegex.exec(result.value)) !== null) {
        const num = match[1];
        const text = match[2].trim().substring(0, 200);
        fields.push({
          key: `clause-${num}`,
          label: `Cláusula ${num}`,
          value: text.substring(0, 60) + (text.length > 60 ? "..." : ""),
          status: "Importado",
          clause: match[0].trim(),
        });
      }
      
      if (fields.length > 0) {
        setExtractedFields(fields.map(f => ({ ...f, selected: true, confidence: 0.9 })));
      }
      
      // Chamar análise IA em background para campos mais precisos
      handleAnalyze(result.value);

      alert(`Documento "${file.name}" importado com sucesso! ${fields.length} cláusula(s) detectada(s).`);
    } catch (err) {
      console.error("[Gerador] Erro ao importar DOCX:", err);
      alert("Erro ao importar o documento. Verifique se é um arquivo .docx válido.");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // --- EXPORT DOCX ---
  async function handleExportDocx() {
    if (!draftText || draftText === "Selecione um cenário para começar a gerar a minuta.") {
      alert("Nenhum conteúdo para exportar. Gere ou importe uma minuta primeiro.");
      return;
    }

    setExporting(true);
    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } = await import("docx");

      const lines = draftText.split("\n");
      const paragraphs: any[] = [];

      // Header
      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: "PACTO ÁGIL",
              bold: true,
              size: 20,
              color: "666666",
              font: "Calibri",
            }),
          ],
        })
      );

      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          border: {
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
          },
          children: [
            new TextRun({
              text: "Sistema de Gestão de Negociações Coletivas",
              size: 18,
              color: "999999",
              font: "Calibri",
            }),
          ],
        })
      );

      for (const line of lines) {
        const trimmed = line.trim();

        if (!trimmed) {
          paragraphs.push(new Paragraph({ spacing: { after: 100 } }));
          continue;
        }

        // Detectar título
        if (trimmed.startsWith("MINUTA") || trimmed.startsWith("ACORDO") || trimmed.startsWith("CONVENÇÃO")) {
          paragraphs.push(
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: { before: 300, after: 200 },
              children: [
                new TextRun({
                  text: trimmed,
                  bold: true,
                  size: 28,
                  font: "Calibri",
                }),
              ],
            })
          );
        }
        // Detectar cláusula
        else if (/^Cláusula\s+\d/i.test(trimmed)) {
          const dashIdx = trimmed.indexOf("-");
          const title = dashIdx > 0 ? trimmed.substring(0, dashIdx).trim() : trimmed;
          const body = dashIdx > 0 ? trimmed.substring(dashIdx + 1).trim() : "";

          paragraphs.push(
            new Paragraph({
              spacing: { before: 240, after: 120 },
              children: [
                new TextRun({
                  text: title + (body ? " - " : ""),
                  bold: true,
                  size: 24,
                  font: "Calibri",
                }),
                ...(body
                  ? [
                      new TextRun({
                        text: body,
                        size: 24,
                        font: "Calibri",
                      }),
                    ]
                  : []),
              ],
            })
          );
        } else {
          paragraphs.push(
            new Paragraph({
              spacing: { after: 80 },
              children: [
                new TextRun({
                  text: trimmed,
                  size: 24,
                  font: "Calibri",
                }),
              ],
            })
          );
        }
      }

      // Rodapé
      paragraphs.push(
        new Paragraph({
          spacing: { before: 600 },
          border: {
            top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
          },
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: `Gerado por Pacto Ágil em ${new Date().toLocaleDateString("pt-BR")}`,
              size: 16,
              color: "AAAAAA",
              font: "Calibri",
            }),
          ],
        })
      );

      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
              },
            },
            children: paragraphs,
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `minuta-pacto-agil-${new Date().toISOString().split("T")[0]}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[Gerador] Erro ao exportar DOCX:", err);
      alert("Erro ao gerar o documento DOCX.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".docx"
        className="hidden"
        onChange={onFileSelected}
      />

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
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="magnetic hover-lift inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 hover:bg-accent/20 px-6 py-3.5 text-sm font-bold text-accent backdrop-blur-sm transition-all disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSaving ? "Salvando..." : negotiationId ? "Atualizar" : "Salvar Progresso"}
            </button>
            <button 
              onClick={handleImportDocx}
              disabled={importing}
              className="magnetic hover-lift inline-flex items-center gap-2 rounded-full border border-border-soft bg-surface/50 hover:bg-surface px-6 py-3.5 text-sm font-bold backdrop-blur-sm transition-colors disabled:opacity-50"
            >
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {importing ? "Importando..." : "Importar DOCX"}
            </button>
            <button 
              onClick={handleExportDocx}
              disabled={exporting}
              className="magnetic hover-lift inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3.5 text-sm font-bold neo-ring disabled:opacity-50"
            >
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {exporting ? "Gerando..." : "Exportar DOCX"}
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
              onClick={() => { setScenario(null); setExtractedFields([]); setDraftContent(""); }}
              className="text-xs font-bold rounded-full border border-border-soft hover:bg-surface-dim transition-colors px-4 py-2 hover-lift magnetic inline-flex items-center gap-2"
            >
              <ArrowLeft className="h-3 w-3" />
              Trocar cenário
            </button>
          </div>

          {scenario ? (
            <div className="relative group/scenario rounded-[2rem] bg-gradient-to-br from-accent/10 via-surface-dim/40 to-transparent border border-accent/20 p-6 mb-8 shadow-lg backdrop-blur-md overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/scenario:opacity-20 transition-opacity">
                 <Bot className="h-16 w-16 text-accent" />
              </div>
              <div className="relative z-10">
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent/60 mb-2 block">Fluxo Intelectual</span>
                <h3 className="text-2xl font-serif italic text-accent mb-2">{scenarios[scenario].title}</h3>
                <p className="text-sm text-foreground/70 max-w-lg leading-relaxed">{scenarios[scenario].description}</p>
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1.3fr] gap-5 flex-1">
            {/* Categorias */}
            <div className="rounded-[2rem] border border-border-soft bg-surface/40 p-6 flex flex-col shadow-sm backdrop-blur-sm">
              <div className="flex items-center justify-between mb-5 px-1">
                <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-foreground/40">Estrutura</h3>
                <span className="text-[10px] font-bold text-foreground/30">{categories.length} Seções</span>
              </div>
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-3 flex-1 custom-scrollbar">
                {categories.map((category: string, index: number) => (
                  <div key={`${category}-${index}`} className="group flex items-center gap-3 rounded-2xl border border-border-soft bg-background/50 hover:bg-surface-dim hover:border-accent/30 transition-all px-4 py-3 shadow-sm relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent/20 group-hover:bg-accent transition-colors" />
                    <div className="flex flex-col gap-0.5 flex-1 pl-1">
                       <span className="text-[13px] font-bold tracking-tight text-foreground/80">{category}</span>
                       <span className="text-[9px] text-foreground/30 font-black uppercase tracking-widest">Seção {index + 1}</span>
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => moveCategory(index, -1)} className="p-1.5 rounded-lg text-foreground/40 hover:text-accent hover:bg-accent/10 transition-colors">
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => moveCategory(index, 1)} className="p-1.5 rounded-lg text-foreground/40 hover:text-accent hover:bg-accent/10 transition-colors">
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button 
                        onClick={() => setCategories(categories.filter((_, i) => i !== index))}
                        className="p-1.5 rounded-lg text-foreground/20 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex gap-2 pt-5 border-t border-border-soft/30">
                <input
                  value={newCategory}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => setNewCategory(event.target.value)}
                  placeholder="Adicionar cláusula..."
                  className="flex-1 rounded-xl border border-border-soft bg-background/80 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all placeholder:text-foreground/20"
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && addCategory()}
                />
                <button onClick={addCategory} className="rounded-xl bg-surface border border-border-soft hover:border-accent/40 text-foreground px-4 py-3 transition-all hover-lift">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Campos Extraídos */}
            <div className="rounded-[2rem] border border-border-soft bg-surface/40 p-6 flex flex-col shadow-sm backdrop-blur-sm">
              <div className="flex items-center justify-between mb-5 px-1">
                <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-foreground/40">Dados Analisados</h3>
                <div className="flex items-center gap-4">
                  {extractedFields.length > 0 && !isAnalyzing && (
                    <div className="flex items-center gap-2">
                       <button 
                         onClick={() => setExtractedFields(extractedFields.map(f => ({ ...f, selected: true })))}
                         className="text-[9px] font-black uppercase tracking-widest text-accent hover:underline"
                       >
                         Tudo
                       </button>
                       <span className="text-foreground/10">|</span>
                       <button 
                         onClick={() => setExtractedFields(extractedFields.map(f => ({ ...f, selected: false })))}
                         className="text-[9px] font-black uppercase tracking-widest text-foreground/40 hover:text-foreground"
                       >
                         Nenhum
                       </button>
                    </div>
                  )}
                  {isAnalyzing ? (
                    <span className="flex items-center gap-2 text-[10px] font-bold text-accent animate-pulse bg-accent/10 px-2.5 py-1 rounded-full border border-accent/20">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      IA PROCESSANDO
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-foreground/30">{extractedFields.length} Itens</span>
                  )}
                </div>
              </div>
              <div className="space-y-12 max-h-[460px] overflow-y-auto pr-3 flex-1 custom-scrollbar">
                {extractedFields.length > 0 ? (
                  Array.from(new Set(extractedFields.map(f => f.category || "Outros"))).map((category) => (
                    <div key={category} className="space-y-4">
                      {/* Categoria Header */}
                      <div className="flex items-center gap-3 mb-4 sticky top-0 bg-surface/90 backdrop-blur-md py-2 z-20">
                        <div className="h-5 w-1.5 rounded-full bg-accent shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)]" />
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground/70">{category}</span>
                      </div>

                      {extractedFields
                        .filter(f => (f.category || "Outros") === category)
                        .map((field) => (
                          <div 
                            key={field.key} 
                            className={`group relative rounded-2xl border transition-all duration-300 p-5 shadow-sm overflow-hidden
                              ${field.selected 
                                ? 'border-accent/40 bg-accent/5 ring-1 ring-accent/20' 
                                : 'border-border-soft bg-background/20 opacity-60 hover:opacity-100'
                              }`}
                          >
                            {/* Background Detail */}
                            <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none">
                               <Bot size={100} />
                            </div>

                            <div className="flex items-start gap-4 mb-3 relative z-10">
                              <button
                                onClick={() => {
                                  setExtractedFields(extractedFields.map(f => 
                                    f.key === field.key ? { ...f, selected: !f.selected } : f
                                  ));
                                }}
                                className={`mt-1 h-5 w-5 rounded-md border flex items-center justify-center transition-all
                                  ${field.selected 
                                    ? 'bg-accent border-accent text-accent-foreground shadow-sm shadow-accent/20' 
                                    : 'bg-background/40 border-border-soft hover:border-accent/50'
                                  }`}
                              >
                                {field.selected && <CheckCircle2 size={12} strokeWidth={4} />}
                              </button>
                              
                              <div className="flex-1">
                                 <div className="flex items-start justify-between gap-4 mb-1.5">
                                   <div className="flex flex-col">
                                     <span className="text-[10px] font-black uppercase tracking-widest text-accent/60 mb-0.5">{field.label}</span>
                                     <div className="flex items-baseline gap-2">
                                       <h4 className="font-bold text-[15px] leading-tight text-foreground transition-colors">{field.value}</h4>
                                       {field.confidence && (
                                         <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-surface-dim border border-border-soft text-[9px] font-bold text-foreground/40">
                                            {Math.round(field.confidence * 100)}%
                                         </div>
                                       )}
                                     </div>
                                   </div>
                                   <span className={`text-[8px] font-black uppercase tracking-widest rounded-full px-2.5 py-1 border whitespace-nowrap shadow-sm
                                      ${field.status.includes('Crítica') ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                                        field.status.includes('Novo') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                        field.status.includes('Moderada') ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                        'bg-blue-500/10 text-blue-400 border-blue-500/20'}
                                   `}>
                                     {field.status}
                                   </span>
                                 </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between pt-4 border-t border-border-soft/20 mt-3 relative z-10">
                              <button
                                type="button"
                                className="text-[10px] font-bold inline-flex items-center gap-1.5 text-foreground/30 hover:text-accent transition-all group/btn"
                              >
                                <Edit3 className="h-3 w-3 group-hover/btn:scale-110 transition-transform" />
                                EDITAR DADO
                              </button>

                              <p className="text-[9px] text-foreground/20 font-medium italic">Extraído do documento automaticamente</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="p-4 rounded-2xl bg-surface-dim/50 border border-border-soft mb-4">
                      <FileText className="h-8 w-8 text-foreground/20" />
                    </div>
                    <p className="text-sm text-foreground/40 font-medium">Nenhum item extraído ainda</p>
                    <p className="text-xs text-foreground/30 mt-1 max-w-[200px]">Importe um DOCX ou processe com IA para extrair cláusulas</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="mt-6 w-full rounded-2xl bg-accent text-accent-foreground px-6 py-4 font-bold inline-flex items-center justify-center gap-2 magnetic shadow-lg shadow-accent/20 disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
            {isGenerating ? "Processando com IA..." : "Processar Respostas & Gerar Minuta"}
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
            {draftContent && (
              <span className="text-[0.65rem] font-mono uppercase font-bold tracking-[0.15em] text-accent flex items-center gap-2 rounded-full px-3 py-1 bg-accent/10 border border-accent/20">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                Conteúdo carregado
              </span>
            )}
          </div>

          <textarea
            className="flex-1 rounded-[1.5rem] border border-border-soft bg-background p-6 md:p-8 text-sm md:text-base leading-[1.8] overflow-y-auto font-sans shadow-inner selection:bg-accent/30 resize-none focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
            value={draftContent}
            onChange={(e) => setDraftContent(e.target.value)}
            placeholder="O conteúdo da minuta aparecerá aqui..."
          />
        </article>
      </section>

      {/* Modal Seleção de Cenário */}
      {!scenario ? (
        <div className="fixed inset-0 z-[75] bg-background/60 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-500">
          <div className="w-full max-w-5xl section-shell p-1 md:p-1 shadow-2xl relative overflow-hidden bg-gradient-to-b from-border-soft to-transparent">
            <div className="bg-surface/90 backdrop-blur-xl rounded-[2.4rem] p-10 md:p-16 relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-[40rem] h-[40rem] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-[30rem] h-[30rem] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
              
              <div className="relative z-20 flex justify-start mb-4">
                <Link 
                  href="/dashboard"
                  className="group inline-flex items-center gap-2 text-xs font-bold text-foreground/40 hover:text-accent transition-colors"
                >
                  <div className="p-2 rounded-full bg-surface-dim border border-border-soft group-hover:border-accent/40 group-hover:bg-accent/5 transition-all">
                    <ArrowLeft size={16} />
                  </div>
                  VOLTAR AO DASHBOARD
                </Link>
              </div>

              <div className="relative z-10 text-center mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-accent/20 bg-accent/5 text-accent text-[10px] font-black uppercase tracking-[0.3em] mb-6 animate-in slide-in-from-top-4 duration-700">
                   Workflow Intelectual
                </div>
                <h2 className="text-4xl md:text-6xl font-semibold mb-6 tracking-tighter leading-tight font-serif italic">
                  Defina o <span className="text-accent not-italic font-sans font-bold">ponto de partida.</span>
                </h2>
                <p className="text-xl text-foreground/50 max-w-2xl mx-auto font-medium">
                  A inteligência artificial irá orquestrar as ferramentas e o modelo de linguagem ideal com base na sua escolha estratégica.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                {(Object.keys(scenarios) as ScenarioKey[]).map((key, index) => {
                  const SvgIcon = scenarios[key].icon;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setScenario(key)}
                      className="group flex flex-col items-start p-8 rounded-[2.5rem] border border-border-soft bg-surface/50 hover:border-accent/40 hover:bg-surface transition-all magnetic shadow-sm relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="absolute top-0 right-0 p-8 transform translate-x-4 -translate-y-4 opacity-5 group-hover:opacity-10 group-hover:translate-x-0 group-hover:-translate-y-2 transition-all duration-500">
                         <SvgIcon size={120} />
                      </div>
                      
                      {scenarios[key].badge && (
                        <div className="absolute top-6 right-8 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest">
                           <Sparkles size={10} />
                           {scenarios[key].badge}
                        </div>
                      )}

                      <div className={`p-4 rounded-2xl bg-${scenarios[key].color === 'accent' ? 'accent' : scenarios[key].color}/10 border border-${scenarios[key].color === 'accent' ? 'accent' : scenarios[key].color}/20 mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg`}>
                        <SvgIcon className={scenarios[key].color === 'accent' ? 'text-accent' : `text-${scenarios[key].color}`} size={28} />
                      </div>

                      <h3 className="text-2xl font-bold mb-3 flex items-center justify-between w-full group-hover:text-accent transition-colors">
                        {scenarios[key].title}
                        <ArrowRight className="h-5 w-5 text-foreground/20 group-hover:text-accent group-hover:translate-x-2 transition-all duration-500" />
                      </h3>
                      <p className="text-base text-foreground/40 font-medium leading-relaxed max-w-[90%]">
                        {scenarios[key].description}
                      </p>
                    </button>
                  );
                })}
              </div>
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
