import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  CircleCheck,
  Clock3,
  FileSpreadsheet,
  TriangleAlert,
  Plus,
} from "lucide-react";

const metrics = [
  {
    title: "Total",
    value: 26,
    icon: FileSpreadsheet,
    href: "/dashboard/negociacoes?filtro=total",
    tone: "text-info",
    bg: "bg-info/10",
  },
  {
    title: "Finalizadas",
    value: 14,
    icon: CircleCheck,
    href: "/dashboard/negociacoes?filtro=finalizadas",
    tone: "text-success",
    bg: "bg-success/10",
  },
  {
    title: "Em andamento",
    value: 9,
    icon: Clock3,
    href: "/dashboard/negociacoes?filtro=andamento",
    tone: "text-warning",
    bg: "bg-warning/10",
  },
  {
    title: "Atrasadas",
    value: 3,
    icon: TriangleAlert,
    href: "/dashboard/negociacoes?filtro=atrasadas",
    tone: "text-danger",
    bg: "bg-danger/10",
  },
];

const upcoming = [
  { entidade: "SINDMETAL x Acme", dataBase: "2026-05-01", faltam: 31 },
  { entidade: "SINTETEL x Plural", dataBase: "2026-05-15", faltam: 45 },
  { entidade: "SINDHOTEL x Brisas", dataBase: "2026-06-01", faltam: 62 },
  { entidade: "SINTAL x Rodonorte", dataBase: "2026-06-18", faltam: 79 },
  { entidade: "SINTRACON x Atlas", dataBase: "2026-07-02", faltam: 93 },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <section className="section-shell p-8 md:p-10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-accent mb-4 px-3 py-1.5 rounded-full border border-accent/20 bg-accent/5 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              Painel de controle estratégico
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1]">
              Visão geral de negociações <br className="hidden md:block" />
              <span className="font-serif italic font-normal text-5xl md:text-6xl lg:text-7xl text-accent"> 2026.</span>
            </h1>
            <p className="mt-5 text-foreground/70 max-w-2xl text-lg font-medium">
              Monitoramento consolidado de acordos, prazos e status para decidir rápido sem perder o rigor jurídico.
            </p>
          </div>

          <Link
            href="/dashboard/geradas"
            className="magnetic hover-lift inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-8 py-4 font-bold text-base whitespace-nowrap neo-ring shrink-0 w-full md:w-auto"
          >
            <Plus className="h-5 w-5" />
            Nova Negociação
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Link
              key={metric.title}
              href={metric.href}
              className="section-shell p-6 hover-lift magnetic relative overflow-hidden group transition-colors hover:border-accent/40"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-surface-dim opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <p className="text-[0.65rem] font-mono uppercase tracking-[0.18em] text-foreground/60 mb-1">{metric.title}</p>
                  <p className="text-5xl font-semibold tracking-tighter mt-1">{metric.value}</p>
                </div>
                <div className={`p-3 rounded-2xl ${metric.bg} border border-transparent group-hover:border-[color-mix(in_srgb,currentColor_20%,transparent)] transition-colors`}>
                  <Icon className={`h-6 w-6 ${metric.tone}`} />
                </div>
              </div>
            </Link>
          );
        })}
      </section>

      <section className="section-shell p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/20">
              <CalendarClock className="h-5 w-5 text-accent" />
            </div>
            <h2 className="text-2xl font-semibold">Próximas <span className="font-serif italic text-accent font-normal">datas-base</span></h2>
          </div>
          <Link href="/dashboard/negociacoes" className="text-sm font-medium hover:text-accent transition-colors hidden sm:flex items-center gap-1 group">
            Ver todas <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5">
          {upcoming.map((item, idx) => (
            <article 
              key={item.entidade} 
              className="group rounded-[1.75rem] border border-border-soft bg-surface hover:bg-surface-dim transition-colors p-5 hover-lift relative overflow-hidden"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
               <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <p className="text-[0.65rem] font-mono uppercase tracking-[0.15em] text-foreground/50 mb-3">{item.dataBase}</p>
              <h3 className="font-semibold text-lg leading-snug">{item.entidade}</h3>
              <p className="mt-4 text-sm font-medium flex items-center gap-1.5 text-foreground/60 group-hover:text-accent transition-colors">
                <Clock3 className="h-4 w-4" />
                Faltam {item.faltam} dias
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
