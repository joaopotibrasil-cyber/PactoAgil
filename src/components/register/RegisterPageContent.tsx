import { useState, useEffect } from "react";
import { actions } from "astro:actions";
import { Loader2, ArrowRight, ShieldCheck, Building2, User2, CheckCircle2, PlusCircle } from "lucide-react";
import { FullPageLoading } from "@/components/ui/FullPageLoading";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { formatCNPJ, formatEmail, formatTitleCase, formatCompanyName, formatPasswordSafe, formatTitleCase as formatFuncionalidade } from "@/lib/validation/schemas";
import { ROUTES } from "@/constants/routes";
import { useDebounce, useAsyncState } from "@/lib/hooks";

interface CompanySuggestion {
  id: string;
  nome: string;
  cnpj: string;
}

interface RegisterPageContentProps {
  planKey?: string;
}

export function RegisterPageContent({ planKey = "" }: RegisterPageContentProps) {
  // Estados para Busca Inteligente de Empresa
  const [email, setEmail] = useState("");
  const [suggestions, setSuggestions] = useState<CompanySuggestion[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CompanySuggestion | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [manualCompanyName, setManualCompanyName] = useState("");
  const [manualCnpj, setManualCnpj] = useState("");
  
  // Novos estados para Inputs Controlados
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [funcionalidade, setFuncionalidade] = useState("");

  // Hook de Debounce
  const debouncedEmail = useDebounce(email, 600);

  // Busca Inteligente com Debounce
  useEffect(() => {
    const searchCompany = async () => {
      if (debouncedEmail.includes("@")) {
        const domain = debouncedEmail.split("@")[1];
        const domainName = domain.split(".")[0];
        
        if (domainName.length > 2) {
          setIsSearching(true);
          try {
            const res = await fetch(`${ROUTES.API.COMPANIES.SEARCH}?q=${domainName}`);
            if (res.ok) {
              const data = await res.json();
              setSuggestions(data);
              if (data.length > 0) setShowSuggestions(true);
            } else {
              setSuggestions([]);
            }
          } catch (err) {
            console.error("Erro ao buscar empresas", err);
          } finally {
            setIsSearching(false);
          }
        }
      }
    };

    searchCompany();
  }, [debouncedEmail]);

  const handleSelectCompany = (company: CompanySuggestion) => {
    setSelectedCompany(company);
    setShowSuggestions(false);
  };

  const handleResetCompany = () => {
    setSelectedCompany(null);
    setSuggestions([]);
    setManualCompanyName("");
    setManualCnpj("");
  };

  // Lógica de Registro com Astro Actions
  const { state: registrationState, execute: runRegistration, isLoading } = useAsyncState(async (formData: FormData) => {
    const { data, error } = await actions.register(formData);
    if (error) throw new Error(error.message);
    return data;
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    if (selectedCompany) {
      formData.set("existingCompanyId", selectedCompany.id);
      formData.set("companyName", selectedCompany.nome);
      formData.set("cnpj", selectedCompany.cnpj);
    } else {
      formData.set("companyName", manualCompanyName);
      formData.set("cnpj", manualCnpj);
    }

    try {
      const result = await runRegistration(formData);
      if (result?.success && result.redirect) {
        window.location.href = result.redirect;
      }
    } catch (err) {
      console.error("Registration error:", err);
    }
  };

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="fixed top-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Header fixo */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-6 pointer-events-none">
        <BrandLogo href={ROUTES.PAGES.HOME} className="opacity-70 grayscale hover:grayscale-0 transition-all pointer-events-auto" />
        <a
          href={ROUTES.PAGES.HOME}
          className="text-[0.65rem] font-mono tracking-widest text-foreground/40 hover:text-accent flex items-center gap-2 group transition-all pointer-events-auto"
        >
          <ArrowRight className="w-3 h-3 rotate-180 group-hover:-translate-x-1 transition-transform" />
          VOLTAR PARA O INÍCIO
        </a>
      </header>

      {/* Formulário centralizado */}
      <div className="relative z-10 w-full flex items-center justify-center px-6 pt-32 pb-16">
        <div className="w-full max-w-md mx-auto p-8 rounded-[2rem] border border-border-soft bg-surface isolation-auto relative overflow-hidden neo-ring">
          <FullPageLoading show={isLoading} message="Processando seu registro..." />
          <div className="absolute inset-0 bg-gradient-radial from-accent/5 to-transparent pointer-events-none" />
          
          <div className="relative z-10 space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">Finalize seu cadastro</h1>
              <p className="text-sm text-foreground/60 leading-relaxed">
                Preencha os dados da sua entidade para ativar o plano <span className="text-accent font-medium">{planKey || "Selecionado"}</span>.
              </p>
            </div>

            {registrationState.status === 'error' && (
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium animate-in fade-in slide-in-from-top-1">
                {registrationState.error?.message}
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
                    value={fullName}
                    onChange={(e) => setFullName(formatTitleCase(e.target.value))}
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
                      onChange={(e) => setEmail(formatEmail(e.target.value))}
                      placeholder="exemplo@sindicato.org.br"
                      className="w-full bg-background/50 border border-border-soft rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/40 transition-all placeholder:text-foreground/25"
                    />
                    {isSearching && (
                      <Loader2 className="w-4 h-4 text-accent animate-spin absolute right-4 top-1/2 -translate-y-1/2" />
                    )}
                  </div>

                  {showSuggestions && suggestions.length > 0 && !selectedCompany && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-surface/95 backdrop-blur-xl border border-border-soft rounded-2xl p-2 z-50 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                      <p className="text-[0.65rem] font-mono text-foreground/40 uppercase tracking-widest px-3 py-1 mb-1">Empresas sugeridas:</p>
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
                    value={password}
                    onChange={(e) => setPassword(formatPasswordSafe(e.target.value))}
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
                    value={selectedCompany ? selectedCompany.nome : manualCompanyName}
                    onChange={(e) => setManualCompanyName(formatCompanyName(e.target.value))}
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
                      value={selectedCompany ? selectedCompany.cnpj : manualCnpj}
                      onChange={(e) => setManualCnpj(formatCNPJ(e.target.value))}
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
                      value={funcionalidade}
                      onChange={(e) => setFuncionalidade(formatFuncionalidade(e.target.value))}
                      placeholder="Atuação / Setor"
                      className="w-full bg-background/50 border border-border-soft rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/40 transition-all placeholder:text-foreground/25"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-accent text-accent-foreground font-semibold py-4 rounded-full flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none mt-4 shadow-lg shadow-accent/10"
              >
                {isLoading ? (
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
      </div>

      <footer className="relative z-10 pb-8 text-foreground/30 text-[0.7rem] font-mono tracking-widest uppercase">
        &copy; 2026 PACTO ÁGIL · TECNOLOGIA ESTRATÉGICA
      </footer>
    </main>
  );
}
