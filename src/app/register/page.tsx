"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState, useEffect, useCallback } from "react";
import { registerAction } from "./actions";
import { Loader2, ArrowRight, ShieldCheck, Building2, User2, Search, CheckCircle2, PlusCircle } from "lucide-react";
import Link from "next/link";
import { BrandLogo } from "@/components/ui/BrandLogo";

interface CompanySuggestion {
  id: string;
  nome: string;
  cnpj: string;
}

function RegisterForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const planKey = searchParams.get("plan") || "";
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para Busca Inteligente de Empresa
  const [email, setEmail] = useState("");
  const [suggestions, setSuggestions] = useState<CompanySuggestion[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CompanySuggestion | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Extrair domínio para sugerir busca
  useEffect(() => {
    const searchCompany = async () => {
      if (email.includes("@")) {
        const domain = email.split("@")[1];
        const domainName = domain.split(".")[0];
        
        if (domainName.length > 2) {
          setIsSearching(true);
          try {
            const res = await fetch(`/api/companies/search?q=${domainName}`);
            const data = await res.json();
            setSuggestions(data);
            if (data.length > 0) setShowSuggestions(true);
          } catch (err) {
            console.error("Erro ao buscar empresas", err);
          } finally {
            setIsSearching(false);
          }
        }
      }
    };

    const timer = setTimeout(searchCompany, 600);
    return () => clearTimeout(timer);
  }, [email]);

  const handleSelectCompany = (company: CompanySuggestion) => {
    setSelectedCompany(company);
    setShowSuggestions(false);
  };

  const handleResetCompany = () => {
    setSelectedCompany(null);
    setSuggestions([]);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    if (selectedCompany) {
      formData.set("existingCompanyId", selectedCompany.id);
      formData.set("companyName", selectedCompany.nome);
      formData.set("cnpj", selectedCompany.cnpj);
    }
    
    const result = await registerAction(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 rounded-[2rem] border border-border-soft bg-surface isolation-auto relative overflow-hidden neo-ring">
      <div className="absolute inset-0 bg-gradient-radial from-accent/5 to-transparent pointer-events-none" />
      
      <div className="relative z-10 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">Finalize seu cadastro</h1>
          <p className="text-sm text-foreground/60 leading-relaxed">
            Preencha os dados da sua entidade para ativar o plano <span className="text-accent font-medium">{planKey || "Selecionado"}</span>.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium animate-in fade-in slide-in-from-top-1">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <input type="hidden" name="planKey" value={planKey} />
          
          <div className="space-y-4">
            <p className="text-xs font-mono uppercase tracking-widest text-accent/80 flex items-center gap-2">
              <User2 className="w-3 h-3" /> Dados do Administrador
            </p>
            
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/70 ml-1" htmlFor="fullName">Nome Completo</label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                placeholder="Seu nome"
                className="w-full bg-background/50 border border-border-soft rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/40 transition-all placeholder:text-foreground/25"
              />
            </div>

            <div className="space-y-1.5 relative">
              <label className="text-xs font-medium text-foreground/70 ml-1" htmlFor="email">E-mail Corporativo</label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@sindicato.org.br"
                  className="w-full bg-background/50 border border-border-soft rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/40 transition-all placeholder:text-foreground/25"
                />
                {isSearching && (
                  <Loader2 className="w-4 h-4 text-accent animate-spin absolute right-4 top-1/2 -translate-y-1/2" />
                )}
              </div>

              {/* Sugestões de Empresa Dinâmicas */}
              {showSuggestions && suggestions.length > 0 && !selectedCompany && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-surface/95 backdrop-blur-xl border border-border-soft rounded-2xl p-2 z-50 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                  <p className="text-[0.65rem] font-mono text-foreground/40 uppercase tracking-widest px-3 py-1 mb-1">Empresas sugeridas para seu domínio:</p>
                  {suggestions.map((comp) => (
                    <button
                      key={comp.id}
                      type="button"
                      onClick={() => handleSelectCompany(comp)}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-accent/10 hover:text-accent transition-all flex items-center justify-between group"
                    >
                      <div>
                        <p className="text-sm font-medium">{comp.nome}</p>
                        <p className="text-xs text-foreground/40">{comp.cnpj}</p>
                      </div>
                      <CheckCircle2 className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                  <button 
                    type="button"
                    onClick={() => setShowSuggestions(false)}
                    className="w-full text-center py-2 mt-1 text-[0.7rem] text-foreground/30 hover:text-foreground/60 transition-colors border-t border-white/5"
                  >
                    Nenhuma destas / Criar Nova
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/70 ml-1" htmlFor="password">Senha</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="w-full bg-background/50 border border-border-soft rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/40 transition-all placeholder:text-foreground/25"
              />
            </div>
          </div>

          <div className="pt-4 space-y-4 border-t border-border-soft/50">
            <div className="flex items-center justify-between">
              <p className="text-xs font-mono uppercase tracking-widest text-accent/80 flex items-center gap-2">
                <Building2 className="w-3 h-3" /> Dados da Entidade
              </p>
              {selectedCompany && (
                <button 
                  type="button"
                  onClick={handleResetCompany}
                  className="text-[0.65rem] font-mono text-accent hover:underline flex items-center gap-1"
                >
                  <PlusCircle className="w-3 h-3" /> Alterar para Nova
                </button>
              )}
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/70 ml-1" htmlFor="companyName">Nome da Empresa/Sindicato</label>
              <input
                id="companyName"
                name="companyName"
                type="text"
                required
                disabled={!!selectedCompany}
                value={selectedCompany?.nome || ""}
                onChange={() => {}} // Campo controlado ou desativado
                placeholder="Razão Social ou Nome Fantasia"
                className={`w-full bg-background/50 border border-border-soft rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/40 transition-all placeholder:text-foreground/25 ${selectedCompany ? 'opacity-70 cursor-not-allowed bg-accent/5' : ''}`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground/70 ml-1" htmlFor="cnpj">CNPJ</label>
                <input
                  id="cnpj"
                  name="cnpj"
                  type="text"
                  required
                  disabled={!!selectedCompany}
                  value={selectedCompany?.cnpj || ""}
                  onChange={() => {}}
                  placeholder="00.000.000/0000-00"
                  className={`w-full bg-background/50 border border-border-soft rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/40 transition-all placeholder:text-foreground/25 ${selectedCompany ? 'opacity-70 cursor-not-allowed bg-accent/5' : ''}`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground/70 ml-1" htmlFor="funcionalidade">Funcionalidade</label>
                <input
                  id="funcionalidade"
                  name="funcionalidade"
                  type="text"
                  required
                  placeholder="Atuação / Setor"
                  className="w-full bg-background/50 border border-border-soft rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/40 transition-all placeholder:text-foreground/25"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-accent-foreground font-semibold py-4 rounded-full flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none mt-4 shadow-lg shadow-accent/10"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                Confirmar Registro e Pagar <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="text-center">
            <p className="text-xs text-foreground/45 flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4 text-success/70" /> Onboarding seguro via SSL & Criptografia B2B.
            </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="fixed top-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Header fixo — FORA do card */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-6">
        <BrandLogo href="/" className="opacity-70 grayscale hover:grayscale-0 transition-all" />
        <Link
          href="/"
          className="text-[0.65rem] font-mono tracking-widest text-foreground/40 hover:text-accent flex items-center gap-2 group transition-all"
        >
          <ArrowRight className="w-3 h-3 rotate-180 group-hover:-translate-x-1 transition-transform" />
          VOLTAR PARA O INÍCIO
        </Link>
      </header>

      {/* Formulário centralizado */}
      <div className="relative z-10 w-full flex items-center justify-center px-6 pt-24 pb-16">
        <Suspense fallback={
          <div className="flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-accent" />
          </div>
        }>
          <RegisterForm />
        </Suspense>
      </div>

      <footer className="relative z-10 pb-8 text-foreground/30 text-[0.7rem] font-mono tracking-widest uppercase">
        &copy; 2026 PACTO ÁGIL · TECNOLOGIA ESTRATÉGICA
      </footer>
    </main>
  );
}
