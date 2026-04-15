"use client";

import { useMemo, useState, useRef, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { useAsyncStates } from "@/lib/hooks";
import React from 'react';
import { useAuthToken } from "@/hooks/useAuthToken";
import { ROUTES } from "@/constants/routes";


// Importações estáticas para evitar "Unexpected token export" no agrupamento cliente
import * as mammoth from "mammoth";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from "docx";

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

function GeradorContent() {
  const searchParams = useSearchParams();
  const [scenario, setScenario] = useState<ScenarioKey | null>(null);
  const [categories, setCategories] = useState<string[]>(initialCategories);
  const [newCategory, setNewCategory] = useState("");
  const [openClause, setOpenClause] = useState<{ label: string; text: string } | null>(null);
  const [draftContent, setDraftContent] = useState("");
  const [extractedFields, setExtractedFields] = useState<ExtractedField[]>([]);
  const [negotiationId, setNegotiationId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<ExtractedField | null>(null);
  const [documentTitle, setDocumentTitle] = useState("Nova Negociação");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { getAuthHeaders } = useAuthToken();


  const { states, execute, isLoading: isAnyLoading } = useAsyncStates({
    load: async (id: string) => {
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`${ROUTES.API.NEGOTIATIONS}?id=${id}`, {
        headers: authHeaders
      });

      if (!res.ok) throw new Error("Erro ao carregar");
      const data = await res.json();
      setNegotiationId(data.id);
      setScenario("empresa");
      setExtractedFields(data.clausulas || []);
      setDraftContent(data.minuta || "");
      return data;
    },
    analyze: async (content: string) => {
      if (!content) return;
      const authHeaders = await getAuthHeaders();

      const response = await fetch(ROUTES.API.AI.ANALYZE, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...authHeaders
        },
        body: JSON.stringify({ documentContent: content, scenario }),
      });

      const data = await response.json();
      if (data.fields) {
        setExtractedFields(data.fields.map((f: any) => ({ 
          ...f, 
          selected: true, 
          confidence: Math.random() * 0.2 + 0.8 
        })));
      }
      return data;
    },
    generate: async () => {
      const authHeaders = await getAuthHeaders();

      const response = await fetch(ROUTES.API.AI.GENERATE, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...authHeaders
        },

        body: JSON.stringify({
          scenario,
          categories,
          fields: extractedFields.filter((f) => f.selected),
          documentContent: draftContent,
        }),
      });
      const data = await response.json();
      if (data.text) setDraftContent(data.text);
      if (data.error) throw new Error(data.error);
      return data;
    },
    save: async () => {
      const authHeaders = await getAuthHeaders();

      const response = await fetch(ROUTES.API.NEGOTIATIONS, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...authHeaders
        },

        body: JSON.stringify({
          id: negotiationId,
          titulo: documentTitle || "Nova Negociação",
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
      return data;
    },
    import: async (file: File) => {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      
      setDraftContent(result.value);
      
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
      
      execute('analyze', result.value);
      return result;
    },
    export: async () => {
      const lines = draftText.split("\n");
      const paragraphs: any[] = [];

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
          paragraphs.push(new Paragraph({ spacing: { after: 100 } }));
          continue;
        }

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
        } else if (/^Cláusula\s+\d/i.test(trimmed)) {
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
                ...(body ? [new TextRun({ text: body, size: 24, font: "Calibri" })] : []),
              ],
            })
          );
        } else {
          paragraphs.push(
            new Paragraph({
              spacing: { after: 80 },
              children: [
                new TextRun({ text: trimmed, size: 24, font: "Calibri" }),
              ],
            })
          );
        }
      }

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
      const safeTitle = (documentTitle || "minuta").toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      a.href = url;
      a.download = `${safeTitle}-${new Date().toISOString().split("T")[0]}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  });

  // --- CARREGAR NEGOCIAÇÃO POR ID ---
  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      execute('load', id);
    }
  }, [searchParams, execute]);

  // Memoização das categorias agrupadas
  const groupedFields = useMemo(() => {
    const groups: Record<string, ExtractedField[]> = {};
    extractedFields.forEach(f => {
      const cat = f.category || "Outros";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(f);
    });
    return groups;
  }, [extractedFields]);

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

    await execute('import', file);
  }

  // --- EXPORT DOCX ---
  async function handleExportDocx() {
    if (!draftText || draftText === "Selecione um cenário para começar a gerar a minuta.") {
      alert("Nenhum conteúdo para exportar. Gere ou importe uma minuta primeiro.");
      return;
    }

    await execute('export');
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
              onClick={() => execute('save')}
              disabled={states.save.status === 'loading'}
              className="magnetic hover-lift inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 hover:bg-accent/20 px-6 py-3.5 text-sm font-bold text-accent backdrop-blur-sm transition-all disabled:opacity-50"
            >
              {states.save.status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {states.save.status === 'loading' ? "Salvando..." : negotiationId ? "Atualizar" : "Salvar Progresso"}
            </button>
            <button 
              onClick={handleImportDocx}
              disabled={states.import.status === 'loading'}
              className="magnetic hover-lift inline-flex items-center gap-2 rounded-full border border-border-soft bg-surface/50 hover:bg-surface px-6 py-3.5 text-sm font-bold backdrop-blur-sm transition-colors disabled:opacity-50"
            >
              {states.import.status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {states.import.status === 'loading' ? "Importando..." : "Importar DOCX"}
            </button>
            <button 
              onClick={handleExportDocx}
              disabled={states.export.status === 'loading'}
              className="magnetic hover-lift inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3.5 text-sm font-bold neo-ring disabled:opacity-50"
            >
              {states.export.status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {states.export.status === 'loading' ? "Gerando..." : "Exportar DOCX"}
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] 2xl:grid-cols-[0.8fr_1.2fr] gap-6 min-h-[68vh]">
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

          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6 flex-1 min-h-0 overflow-hidden">
            {/* Categorias */}
            <div className="rounded-[2rem] border border-border-soft bg-surface/40 p-6 flex flex-col shadow-sm backdrop-blur-sm">
              <div className="flex items-center justify-between mb-5 px-1">
                <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-foreground/40">Estrutura</h3>
                <span className="text-[10px] font-bold text-foreground/30">{categories.length} Seções</span>
              </div>
              <div className="space-y-3 overflow-y-auto pr-2 flex-1 custom-scrollbar min-h-0">
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
              <div className="mt-auto pt-6 border-t border-border-soft/30 flex gap-2">
                <input
                  value={newCategory}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => setNewCategory(event.target.value)}
                  placeholder="Novo item..."
                  className="flex-1 rounded-xl border border-border-soft bg-background/40 px-4 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all placeholder:text-foreground/20"
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && addCategory()}
                />
                <button 
                  onClick={addCategory} 
                  className="rounded-xl bg-accent/10 border border-accent/20 hover:bg-accent/20 text-accent p-2.5 transition-all hover-lift shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Campos Extraídos */}
            <div className="rounded-[2rem] border border-border-soft bg-surface/40 p-6 flex flex-col shadow-sm backdrop-blur-sm">
              <div className="flex items-center justify-between mb-5 px-1">
                <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-foreground/40">Dados Analisados</h3>
                <div className="flex items-center gap-4">
                  {extractedFields.length > 0 && states.analyze.status !== 'loading' && (
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
                  {states.analyze.status === 'loading' ? (
                    <span className="flex items-center gap-2 text-[10px] font-bold text-accent animate-pulse bg-accent/10 px-2.5 py-1 rounded-full border border-accent/20">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      IA PROCESSANDO
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-foreground/30">{extractedFields.length} Itens</span>
                  )}
                </div>
              </div>
              <div className="space-y-12 overflow-y-auto pr-2 flex-1 custom-scrollbar min-h-0">
                {extractedFields.length > 0 ? (
                  Object.entries(groupedFields).map(([category, fields]) => (
                    <div key={category} className="space-y-4">
                      {/* Categoria Header */}
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-3 mb-4 sticky top-0 bg-surface/90 backdrop-blur-md py-3 z-20 border-b border-border-soft/20"
                        >
                          <div className="h-5 w-1.5 rounded-full bg-accent shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)]" />
                          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground/70">{category}</span>
                        </motion.div>

                      {fields.map((field) => (
                        <motion.div
                          key={field.key}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <MemoizedFieldItem 
                            field={field} 
                            onViewOriginal={(f: ExtractedField) => setOpenClause({ label: f.label, text: f.clause })}
                            onEdit={(f: ExtractedField) => setEditingField(f)}
                            onToggle={(key: string) => {
                              setExtractedFields(prev => prev.map(f => 
                                f.key === key ? { ...f, selected: !f.selected } : f
                              ));
                            }}
                          />
                        </motion.div>
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
            onClick={() => execute('generate')}
            disabled={states.generate.status === 'loading'}
            className="mt-6 w-full rounded-2xl bg-accent text-accent-foreground px-6 py-4 font-bold inline-flex items-center justify-center gap-2 magnetic shadow-lg shadow-accent/20 disabled:opacity-50"
          >
            {states.generate.status === 'loading' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
            {states.generate.status === 'loading' ? "Processando com IA..." : "Processar Respostas & Gerar Minuta"}
          </button>
        </article>

        {/* Minuta Viva */}
        <article className="section-shell p-6 md:p-8 min-h-[66vh] flex flex-col">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-4 border-b border-border-soft/50 gap-4">
            <h2 className="text-2xl font-semibold inline-flex items-center gap-3 w-full md:w-auto flex-1">
              <div className="p-2.5 rounded-xl bg-surface-dim border border-border-soft shrink-0">
                <FileText className="h-5 w-5 text-foreground/80" />
              </div>
              <input 
                type="text" 
                value={documentTitle} 
                onChange={(e) => setDocumentTitle(e.target.value)}
                placeholder="Título do Documento"
                className="bg-transparent border-none font-semibold focus:outline-none focus:ring-0 w-full text-xl md:text-2xl placeholder:opacity-40"
              />
            </h2>
            {draftContent && (
              <span className="text-[0.65rem] font-mono uppercase font-bold tracking-[0.15em] text-accent flex items-center gap-2 rounded-full px-3 py-1 bg-accent/10 border border-accent/20">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                Conteúdo carregado
              </span>
            )}
          </div>

          <textarea
            className="flex-1 rounded-[2rem] border border-border-soft bg-background/50 p-12 md:p-16 text-base md:text-lg leading-[2] overflow-y-auto minuta-content shadow-inner selection:bg-accent/30 resize-none focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all custom-scrollbar outline-none"
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
                  href={ROUTES.PAGES.DASHBOARD.ROOT}
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
      {/* Modal Edit Field */}
      {editingField ? (
        <div className="fixed inset-0 z-[80] bg-background/80 backdrop-blur-md p-4 flex items-center justify-center animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-[2rem] border border-accent/20 bg-surface p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex flex-col">
                <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-1">Ajuste de Parâmetro</p>
                <h3 className="text-xl font-bold">{editingField.label}</h3>
              </div>
              <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/20">
                <Edit3 className="h-5 w-5 text-accent" />
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground/40 ml-1">VALOR ATUAL</label>
                <textarea
                  className="w-full rounded-2xl border border-border-soft bg-background/50 p-6 text-base font-medium leading-relaxed focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all resize-none min-h-[140px]"
                  value={editingField.value}
                  onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setEditingField(null)}
                  className="flex-1 rounded-xl border border-border-soft bg-surface-dim hover:bg-border-soft transition-colors py-4 font-bold text-foreground/60"
                >
                  CANCELAR
                </button>
                <button
                  onClick={() => {
                    setExtractedFields(prev => prev.map(f => f.key === editingField.key ? editingField : f));
                    setEditingField(null);
                  }}
                  className="flex-1 rounded-xl bg-accent text-accent-foreground py-4 font-bold shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  SALVAR ALTERAÇÃO
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function GeradorPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    }>
      <GeradorContent />
    </Suspense>
  );
}

// --- COMPONENTES MEMOIZADOS ---
const MemoizedFieldItem = React.memo(({ 
  field, 
  onToggle, 
  onViewOriginal, 
  onEdit 
}: { 
  field: ExtractedField; 
  onToggle: (key: string) => void;
  onViewOriginal: (field: ExtractedField) => void;
  onEdit: (field: ExtractedField) => void;
}) => {
  return (
    <div 
      className={`group relative rounded-[1.25rem] border transition-all duration-300 p-4 shadow-sm overflow-hidden
        ${field.selected 
          ? 'border-accent/40 bg-accent/5 ring-1 ring-accent/10 border-l-4 border-l-accent' 
          : 'border-border-soft bg-background/20 opacity-60 hover:opacity-100 hover:scale-[1.01]'
        }`}
    >
      <div className="flex items-center gap-4 relative z-10">
        <button
          onClick={() => onToggle(field.key)}
          className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all shrink-0
            ${field.selected 
              ? 'bg-accent border-accent text-accent-foreground shadow-sm shadow-accent/20' 
              : 'bg-background/40 border-border-soft hover:border-accent/50'
            }`}
        >
          {field.selected && <CheckCircle2 size={12} strokeWidth={4} />}
        </button>
        
        <div className="flex-1 min-w-0">
           <div className="flex items-center justify-between gap-4">
             <div className="flex flex-col min-w-0 flex-1">
               <span className="text-[9px] font-black uppercase tracking-[0.15em] text-accent/60 mb-0.5 truncate">{field.label}</span>
               <div className="flex items-center gap-3">
                 <h4 className="font-bold text-sm leading-tight text-foreground truncate">{field.value}</h4>
                 {field.confidence && (
                   <span className="px-1.5 py-0.5 rounded-md bg-surface-dim border border-border-soft text-[8px] font-black text-foreground/30 shrink-0">
                      {Math.round(field.confidence * 100)}%
                   </span>
                 )}
               </div>
             </div>
             <div className="flex items-center gap-3 shrink-0">
                <span className={`text-[8px] font-black uppercase tracking-widest rounded-full px-2 py-0.5 border whitespace-nowrap shadow-sm
                  ${field.status.includes('Crítica') ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                    field.status.includes('Novo') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    field.status.includes('Moderada') ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    'bg-blue-500/10 text-blue-400 border-blue-500/20'}
                `}>
                  {field.status}
                </span>
                
                {/* Botões de Ação Rápidos */}
                <div className="flex items-center gap-1 opacity-10 md:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onViewOriginal(field); }}
                    className="p-1.5 rounded-lg text-foreground/20 hover:text-accent hover:bg-accent/10 transition-all"
                    title="Ver original"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onEdit(field); }}
                    className="p-1.5 rounded-lg text-foreground/20 hover:text-accent hover:bg-accent/10 transition-all"
                    title="Editar dado"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
});

MemoizedFieldItem.displayName = "MemoizedFieldItem";
