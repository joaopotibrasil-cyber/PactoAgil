"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { login } from "./actions";
import { syncUserSession } from "@/lib/auth-sync";
import { formatEmail, formatPasswordSafe } from "@/lib/validation/schemas";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { ROUTES } from "@/constants/routes";
import { ArrowRight, Lock, CreditCard, Loader2 } from "lucide-react";
import { FullPageLoading } from "@/components/ui/FullPageLoading";


function LoginContent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const plan = searchParams.get("plan");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    console.log("[Login] Botão clicado, iniciando handleSubmit...");
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    const formData = new FormData(e.currentTarget);
    // Identificar qual botão foi clicado (Next.js/React standard)
    const submitter = (e.nativeEvent as any).submitter as HTMLButtonElement;
    const action = submitter?.value || (formData.get("submitAction") as string);
    
    console.log("[Login] Ação detectada:", action);
    let result;

    try {
      if (action === "login") {
        console.log("[Login] Chamando server action login...");
        result = await login(formData);
        console.log("[Login] Resposta do server action:", result);
      }

      if (result?.error) {
        setError(result.error);
        setLoading(false);
      } else if (result?.success) {
        console.log("[Login] Sucesso no login, iniciando syncUserSession...");
        // Sincroniza sessão globalmente antes de redirecionar
        const syncResult = await syncUserSession();
        console.log("[Login] Resultado do syncUserSession:", syncResult);
        
        console.log("[Login] Redirecionando para dashboard...");
        router.push(ROUTES.PAGES.DASHBOARD.ROOT);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error("[Login] Erro crítico no cliente:", err);
      setError("Ocorreu um erro inesperado. Tente novamente.");
      setLoading(false);
    }
  }

  console.log("[Login] Renderizando conteúdo, loading:", loading);

  return (
    <div className="min-h-screen bg-background flex text-foreground overflow-hidden">
      <FullPageLoading show={loading} />
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[40rem] h-[40rem] bg-accent/5 rounded-full blur-[100px] -translate-y-1/2" />
        <div className="absolute bottom-0 left-1/4 w-[40rem] h-[40rem] bg-primary/5 rounded-full blur-[100px] translate-y-1/2" />
      </div>

      <div className="flex-1 flex items-center justify-center p-6 relative z-10 animate-in fade-in zoom-in-95 duration-700 ease-out">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 rounded-[2.5rem] bg-surface/40 backdrop-blur-2xl border border-border-soft overflow-hidden shadow-2xl">
          
          <aside className="relative p-10 md:p-14 flex flex-col justify-between overflow-hidden">
            <div
              className="absolute inset-0 z-0"
              style={{
                backgroundImage:
                  "linear-gradient(165deg, rgba(2, 12, 30, 0.8), rgba(2, 12, 30, 0.98)), url('/hero-bg.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            
            <div className="relative z-10 flex items-center justify-between">
              <BrandLogo href={ROUTES.PAGES.HOME} />
              <Link href={ROUTES.PAGES.HOME} className="text-[0.6rem] font-mono tracking-widest text-white/40 hover:text-accent flex items-center gap-2 group transition-all lg:hidden">
                <ArrowRight className="w-3 h-3 rotate-180 group-hover:-translate-x-1 transition-transform" /> VOLTAR
              </Link>
            </div>

            <div className="relative z-10 mt-16 lg:mt-32">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent/20 bg-accent/10 backdrop-blur-sm text-accent text-xs font-mono tracking-widest uppercase mb-6">
                <Lock className="w-3.5 h-3.5" />
                Acesso Restrito
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-5xl font-semibold leading-[1.15] text-white">
                O futuro da <br />
                <span className="font-serif italic font-normal text-accent text-5xl md:text-6xl">negociação sindical.</span>
              </h1>
              <p className="mt-6 text-base text-white/70 max-w-md leading-relaxed">
                Plataforma inteligente para ACT e CCT. Centralize o histórico de cláusulas, gere minutas com IA e reduza drasticamente o retrabalho na sua entidade.
              </p>
            </div>
            
            <div className="relative z-10 mt-16 text-xs font-mono text-white/40 uppercase tracking-widest">
              © {new Date().getFullYear()} Pacto Ágil
            </div>
          </aside>

          <main className="p-10 md:p-14 lg:p-16 flex flex-col justify-center bg-surface/80">
            <div className="mb-10">
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm animate-in fade-in slide-in-from-top-2">
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 text-sm animate-in fade-in slide-in-from-top-2">
                  {success}
                </div>
              )}
              <h2 className="text-3xl font-semibold text-foreground tracking-tight">
                {plan ? "Finalize seu cadastro" : "Bem-vindo"}
              </h2>
              <p className="mt-2 text-foreground/60 leading-relaxed">
                {plan 
                  ? `Para ativar o plano ${plan.charAt(0) + plan.slice(1).toLowerCase()} e garantir a segurança jurídica da sua entidade, precisamos primeiro autenticar seu acesso.`
                  : "Insira suas credenciais para acessar o painel estratégico da sua entidade."}
              </p>
              
              {plan && (
                <div className="mt-4 p-3 rounded-lg bg-accent/10 border border-accent/20 flex items-center gap-2 text-accent text-xs font-medium animate-pulse">
                  <CreditCard className="w-4 h-4" />
                  Pronto para ativar sua assinatura Premium
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <input type="hidden" name="plan" value={plan || ""} />
              <div className="space-y-5">
                <label className="block group">
                  <span className="block text-sm font-medium text-foreground/80 mb-2 group-focus-within:text-accent transition-colors">
                    E-mail corporativo
                  </span>
                  <input
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(formatEmail(e.target.value))}
                    placeholder="voce@sindicato.org.br"
                    className="w-full rounded-[1.25rem] border border-border-soft bg-background/50 px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all placeholder:text-foreground/30"
                  />
                </label>

                <label className="block group">
                  <div className="flex justify-between items-center mb-2">
                    <span className="block text-sm font-medium text-foreground/80 group-focus-within:text-accent transition-colors">
                      Senha
                    </span>
                    <Link href={ROUTES.PAGES.AUTH.FORGOT_PASSWORD} className="text-xs text-accent font-semibold hover:underline transition-all">
                      Esqueci minha senha
                    </Link>
                  </div>
                  <input
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(formatPasswordSafe(e.target.value))}
                    placeholder="••••••••"
                    className="w-full rounded-[1.25rem] border border-border-soft bg-background/50 px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all placeholder:text-foreground/30 font-mono tracking-widest"
                  />
                </label>
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <button
                  type="submit"
                  name="submitAction"
                  value="login"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-4 text-sm font-bold magnetic hover-lift neo-ring disabled:opacity-50 disabled:pointer-events-none transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Autenticando...
                    </>
                  ) : (
                    <>
                      Entrar na plataforma
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                
                <Link
                  href={`${ROUTES.PAGES.AUTH.REGISTER}${plan ? `?plan=${plan}` : ""}`}
                  className="w-full flex items-center justify-center gap-2 rounded-full bg-surface border border-border-soft text-foreground px-6 py-4 text-sm font-bold magnetic hover:bg-surface-dim hover-lift transition-all"
                >
                  Criar nova conta corporativa
                </Link>
              </div>
            </form>
          </main>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
