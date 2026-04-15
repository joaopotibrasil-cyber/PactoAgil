import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import {
  ArrowRight,
  CalendarClock,
  FileSpreadsheet,
  Plus,
  ShieldCheck,
} from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.PAGES.AUTH.LOGIN);
  }

  // Buscar perfil com empresa e assinatura
  const { data: perfil } = await supabase
    .from("Perfil")
    .select(`
      *,
      empresa: Empresa (
        nome,
        assinatura: Assinatura (tipoPlano, status, fimPeriodoAtual)
      )
    `)
    .eq("userId", user.id)
    .single();

  const empresa = perfil?.empresa
    ? (Array.isArray(perfil.empresa) ? perfil.empresa[0] : perfil.empresa)
    : null;

  const assinatura = empresa?.assinatura
    ? (Array.isArray(empresa.assinatura) ? empresa.assinatura[0] : empresa.assinatura)
    : null;

  const tipoPlano = assinatura?.tipoPlano || "SEM PLANO";
  const statusPlano = assinatura?.status || "inactive";
  const nomeEmpresa = empresa?.nome || "Empresa não vinculada";
  const nomeUsuario = perfil?.nomeCompleto || user.email?.split("@")[0] || "Usuário";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      {/* Hero Section */}
      <section className="section-shell p-8 md:p-10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-accent mb-4 px-3 py-1.5 rounded-full border border-accent/20 bg-accent/5 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              Painel de controle estratégico
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1]">
              Bem-vindo, <br className="hidden md:block" />
              <span className="font-serif italic font-normal text-5xl md:text-6xl lg:text-7xl text-accent">{nomeUsuario}.</span>
            </h1>
            <p className="mt-5 text-foreground/70 max-w-2xl text-lg font-medium">
              {nomeEmpresa} &bull; Gestão inteligente de negociações coletivas.
            </p>
          </div>

          <Link
            href={ROUTES.PAGES.DASHBOARD.GENERATOR}
            className="magnetic hover-lift inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-8 py-4 font-bold text-base whitespace-nowrap neo-ring shrink-0 w-full md:w-auto"
          >
            <Plus className="h-5 w-5" />
            Nova Negociação
          </Link>
        </div>
      </section>

      {/* Status do Plano */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        <div className="section-shell p-6 relative overflow-hidden group transition-colors hover:border-accent/40">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent to-surface-dim opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-[0.65rem] font-mono uppercase tracking-[0.18em] text-foreground/60 mb-1">Plano Ativo</p>
              <p className="text-4xl font-semibold tracking-tighter mt-1">{tipoPlano}</p>
            </div>
            <div className="p-3 rounded-2xl bg-accent/10 border border-transparent group-hover:border-accent/20 transition-colors">
              <ShieldCheck className="h-6 w-6 text-accent" />
            </div>
          </div>
        </div>

        <div className="section-shell p-6 relative overflow-hidden group transition-colors hover:border-accent/40">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent to-surface-dim opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-[0.65rem] font-mono uppercase tracking-[0.18em] text-foreground/60 mb-1">Status</p>
              <p className="text-4xl font-semibold tracking-tighter mt-1 capitalize">
                {statusPlano === "active" ? "✅ Ativo" : statusPlano === "canceled" ? "❌ Cancelado" : "⏳ Pendente"}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-success/10 border border-transparent group-hover:border-success/20 transition-colors">
              <FileSpreadsheet className="h-6 w-6 text-success" />
            </div>
          </div>
        </div>

        <div className="section-shell p-6 relative overflow-hidden group transition-colors hover:border-accent/40">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent to-surface-dim opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-[0.65rem] font-mono uppercase tracking-[0.18em] text-foreground/60 mb-1">Próxima Renovação</p>
              <p className="text-3xl font-semibold tracking-tighter mt-1">
                {assinatura?.fimPeriodoAtual 
                  ? new Date(assinatura.fimPeriodoAtual).toLocaleDateString("pt-BR")
                  : "—"
                }
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-warning/10 border border-transparent group-hover:border-warning/20 transition-colors">
              <CalendarClock className="h-6 w-6 text-warning" />
            </div>
          </div>
        </div>
      </section>

      {/* Próximos Passos */}
      <section className="section-shell p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/20">
              <CalendarClock className="h-5 w-5 text-accent" />
            </div>
            <h2 className="text-2xl font-semibold">Comece <span className="font-serif italic text-accent font-normal">agora</span></h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Link 
            href={ROUTES.PAGES.DASHBOARD.NEGOTIATIONS}
            className="group rounded-[1.75rem] border border-border-soft bg-surface hover:bg-surface-dim transition-colors p-6 hover-lift relative overflow-hidden"
          >
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <h3 className="font-semibold text-lg mb-2">📋 Negociações</h3>
            <p className="text-sm text-foreground/60">Gerencie suas negociações coletivas e acompanhe prazos.</p>
            <p className="mt-4 text-sm font-medium flex items-center gap-1.5 text-foreground/60 group-hover:text-accent transition-colors">
              Acessar <ArrowRight className="h-4 w-4" />
            </p>
          </Link>

          <Link 
            href={ROUTES.PAGES.DASHBOARD.GENERATOR}
            className="group rounded-[1.75rem] border border-border-soft bg-surface hover:bg-surface-dim transition-colors p-6 hover-lift relative overflow-hidden"
          >
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <h3 className="font-semibold text-lg mb-2">🤖 Gerador IA</h3>
            <p className="text-sm text-foreground/60">Use inteligência artificial para gerar minutas e acordos.</p>
            <p className="mt-4 text-sm font-medium flex items-center gap-1.5 text-foreground/60 group-hover:text-accent transition-colors">
              Criar minuta <ArrowRight className="h-4 w-4" />
            </p>
          </Link>

          <Link 
            href={ROUTES.PAGES.DASHBOARD.CONFIG}
            className="group rounded-[1.75rem] border border-border-soft bg-surface hover:bg-surface-dim transition-colors p-6 hover-lift relative overflow-hidden"
          >
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <h3 className="font-semibold text-lg mb-2">⚙️ Configurações</h3>
            <p className="text-sm text-foreground/60">Gerencie sua equipe, perfil e preferências da empresa.</p>
            <p className="mt-4 text-sm font-medium flex items-center gap-1.5 text-foreground/60 group-hover:text-accent transition-colors">
              Configurar <ArrowRight className="h-4 w-4" />
            </p>
          </Link>
        </div>
      </section>
    </div>
  );
}
