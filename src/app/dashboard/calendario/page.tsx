"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import Link from "next/link";
import { useAuthToken } from "@/hooks/useAuthToken";
import { ROUTES } from "@/constants/routes";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Loader2,
  Sparkles,
  Upload,
  X,
  FileText
} from "lucide-react";

function CalendarioContent() {
  const [negotiations, setNegotiations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Estado para Modal IA
  const [showAIModal, setShowAIModal] = useState(false);
  const [scheduleText, setScheduleText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  
  const { getAuthHeaders } = useAuthToken();

  useEffect(() => {
    fetchNegotiations();
  }, []);

  const fetchNegotiations = async () => {
    try {
      setLoading(true);
      const authHeaders = await getAuthHeaders();
      const res = await fetch(ROUTES.API.NEGOTIATIONS, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setNegotiations(data);
      }
    } catch (err) {
      console.error("Erro ao buscar negociações:", err);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  
  const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: null, date: null });
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ day: i, date: dateString });
    }
    
    return days;
  }, [currentDate]);

  const negotiationsByDate = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    negotiations.forEach(n => {
      // Alguns registros podem não ter dataBase, ignoramos ou colocamos hoje
      if (!n.dataBase) return;
      const dateKey = new Date(n.dataBase).toISOString().split('T')[0];
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(n);
    });
    return grouped;
  }, [negotiations]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <section className="section-shell p-8 md:p-10 relative overflow-hidden group">
        <div className="absolute top-0 right-1/4 w-[30rem] h-[30rem] bg-accent/5 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-accent mb-4 px-3 py-1.5 rounded-full border border-accent/20 bg-accent/5 backdrop-blur-sm">
              <CalendarIcon className="h-4 w-4" />
              Cronograma
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1]">
              Calendário de <br className="hidden md:block"/>
              <span className="font-serif italic font-normal text-5xl md:text-6xl lg:text-7xl text-accent">datas-base.</span>
            </h1>
            <p className="mt-5 text-foreground/70 text-lg font-medium">
              Acompanhe as datas-base e antecipe suas negociações do mês.
            </p>
          </div>

          <div className="flex shrink-0">
            <button 
              onClick={() => setShowAIModal(true)}
              className="magnetic flex items-center justify-center gap-2 rounded-full bg-accent/10 border border-accent/20 text-accent px-6 py-4 text-sm font-bold hover:bg-accent hover:text-accent-foreground hover:shadow-[0_0_20px_rgba(var(--accent-color),_0.4)] transition-all group"
            >
              <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
              Upload Inteligente (IA)
            </button>
          </div>
        </div>
      </section>

      <section className="section-shell p-6 md:p-8">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-foreground/30">
            <Loader2 className="h-10 w-10 animate-spin mb-4" />
            <p className="font-medium">Carregando calendário...</p>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold font-serif text-accent flex items-center gap-3">
                <CalendarIcon className="w-6 h-6" />
                <span className="capitalize">{monthNames[currentDate.getMonth()]}</span> {currentDate.getFullYear()}
              </h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={prevMonth}
                  className="p-2 rounded-xl bg-surface hover:bg-surface-dim border border-border-soft transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-foreground/70" />
                </button>
                <button 
                  onClick={nextMonth}
                  className="p-2 rounded-xl bg-surface hover:bg-surface-dim border border-border-soft transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-foreground/70" />
                </button>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-border-soft bg-surface/30 overflow-hidden shadow-sm">
              <div className="grid grid-cols-7 border-b border-border-soft bg-surface/80">
                {daysOfWeek.map((day) => (
                  <div key={day} className="py-4 text-center text-[10px] font-black uppercase tracking-[0.2em] text-foreground/50">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 border-l border-t border-border-soft">
                {calendarDays.map((cell, idx) => {
                  const itemsToday = cell.date ? negotiationsByDate[cell.date] : [];
                  const isToday = cell.date === new Date().toISOString().split('T')[0];
                  
                  return (
                    <div 
                      key={idx} 
                      className={`min-h-[120px] p-2 border-r border-b border-border-soft/50 ${!cell.day ? 'bg-surface-dim/30' : 'bg-surface/10'} hover:bg-surface-dim/50 transition-colors flex flex-col overflow-hidden`}
                    >
                      {cell.day && (
                        <>
                          <div className="flex justify-end mb-2">
                            <div className={`text-xs font-bold flex items-center justify-center w-6 h-6 rounded-full ${isToday ? 'bg-accent text-accent-foreground shadow-md' : 'text-foreground/40'}`}>
                              {cell.day}
                            </div>
                          </div>
                          
                          <div className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
                            {itemsToday?.map((n) => (
                              <Link 
                                key={n.id} 
                                href={`${ROUTES.PAGES.DASHBOARD.GENERATOR}?id=${n.id}`}
                                className="block text-[10px] bg-accent/10 hover:bg-accent/20 border border-accent/20 text-accent font-medium px-2 py-1.5 rounded-lg truncate transition-colors"
                                title={n.nomeEmpresa}
                              >
                                {n.nomeEmpresa || "Nova Nego..."}
                              </Link>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* MODAL DE UPLOAD INTELIGENTE */}
      {showAIModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-surface border border-border-soft rounded-3xl shadow-2xl overflow-hidden shadow-accent/5">
            <div className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3 text-accent">
                  <div className="p-2 rounded-xl bg-accent/10">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground tracking-tight">Upload Inteligente</h3>
                </div>
                <button 
                  onClick={() => !isProcessing && setShowAIModal(false)}
                  className="p-2 rounded-full hover:bg-surface-dim transition-colors text-foreground/50 hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-foreground/70 leading-relaxed">
                  Cole abaixo os cronogramas (em texto, tabelas copiadas do Excel, relatórios em PDF) e a IA interpretará automaticamente e preencherá seu calendário.
                </p>

                <textarea
                  value={scheduleText}
                  onChange={(e) => setScheduleText(e.target.value)}
                  placeholder="Ex: Confederação Nacional dos Trabalhadores - Data Base: Março 2024..."
                  className="w-full h-40 p-4 rounded-2xl border border-border-soft bg-background/50 focus:bg-background resize-none focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all text-sm font-mono"
                  disabled={isProcessing}
                />

                {aiError && (
                  <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl">
                    {aiError}
                  </div>
                )}
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  onClick={() => setShowAIModal(false)}
                  disabled={isProcessing}
                  className="px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-surface-dim transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    if (!scheduleText.trim()) return;
                    setIsProcessing(true);
                    setAiError(null);
                    try {
                      const authHeaders = await getAuthHeaders();
                      const res = await fetch("/api/ai/calendar", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          ...authHeaders
                        },
                        body: JSON.stringify({ content: scheduleText })
                      });
                      
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error || "Erro ao processar");
                      
                      await fetchNegotiations(); // auto reload calendar
                      setShowAIModal(false);
                      setScheduleText("");
                    } catch (err: any) {
                      setAiError(err.message);
                    } finally {
                      setIsProcessing(false);
                    }
                  }}
                  disabled={isProcessing || !scheduleText.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold bg-accent text-accent-foreground hover:shadow-[0_0_15px_rgba(var(--accent-color),_0.3)] transition-all disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Extraindo...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      Processar Cronograma
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CalendarioPage() {
  return (
    <Suspense fallback={<div className="p-8 text-foreground/50 text-center font-medium animate-pulse">Carregando calendário...</div>}>
      <CalendarioContent />
    </Suspense>
  );
}
