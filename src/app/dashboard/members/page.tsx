import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Users, Shield, Mail, BadgeCheck, Zap, Info } from "lucide-react";
import { InviteMemberButton } from "./InviteMemberButton";

const PLAN_LIMITS = {
  "DESCOBERTA": 2,
  "MOVIMENTO": 3,
  "DIRECAO": 7,
  "LIDERANCA": 10,
  "GRATIS": 2,
} as const;

const PLAN_NAMES: Record<string, string> = {
  "DESCOBERTA": "Descoberta",
  "MOVIMENTO": "Movimento",
  "DIRECAO": "Direção",
  "LIDERANCA": "Liderança",
  "GRATIS": "Grátis",
};

type Perfil = {
  id: string;
  nomeCompleto: string | null;
  email: string;
  role: string;
};

export default async function MembersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const perfil = await prisma.perfil.findUnique({
    where: { userId: user.id },
    include: {
      empresa: {
        include: {
          assinatura: true,
          usuarios: true
        }
      }
    }
  });

  if (!perfil || !perfil.empresa) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8 bg-surface/40 backdrop-blur-xl rounded-[2.5rem] border border-border-soft">
        <Users className="w-16 h-16 text-accent opacity-20 mb-6" />
        <h1 className="text-2xl font-semibold mb-2">Empresa não encontrada</h1>
        <p className="text-foreground/60 max-w-sm">
          Você ainda não está vinculado a uma organização corporativa ativa. 
          Entre em contato com o administrador da sua entidade.
        </p>
      </div>
    );
  }

  const empresa = perfil.empresa;
  const currentMembers = empresa.usuarios.length;
  const planKey = (empresa.assinatura?.tipoPlano || "GRATIS").toUpperCase() as keyof typeof PLAN_LIMITS;
  const limit = PLAN_LIMITS[planKey] || 2;
  const isLimitReached = currentMembers >= limit;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[0.65rem] font-mono tracking-widest uppercase mb-4">
            <Users className="w-3 h-3" /> Gestão de Equipe B2B
          </div>
          <h1 className="text-4xl font-semibold tracking-tight">Colaboradores</h1>
          <p className="mt-2 text-foreground/60 max-w-xl">
            Gerencie o acesso dos advogados e negociadores da sua organização <strong className="text-accent">{empresa.nome}</strong>.
          </p>
        </div>

        <InviteMemberButton
          disabled={isLimitReached}
          disabledReason={`Limite do plano atingido (${limit} usuários). Faça upgrade para convidar mais.`}
        />
      </div>

      {/* Usage Indicator */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-surface/40 border border-border-soft backdrop-blur-xl group hover:border-accent/40 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono text-foreground/60 tracking-wider uppercase">Ocupação do Plano</span>
            <BadgeCheck className="w-4 h-4 text-accent opacity-40 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-semibold">{currentMembers}</span>
            <span className="text-foreground/40 font-mono">/ {limit} usuários</span>
          </div>
          <div className="mt-4 h-1.5 w-full bg-background rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ease-out ${isLimitReached ? 'bg-red-500' : 'bg-accent'}`}
              style={{ width: `${(currentMembers / limit) * 100}%` }}
            />
          </div>
          {isLimitReached && (
            <p className="mt-3 text-[0.7rem] text-red-100 flex items-center gap-1.5 font-medium bg-red-500/20 px-2 py-1 rounded-md">
              <Zap className="w-3 h-3" /> Limite do plano atingido. Faça upgrade para adicionar mais.
            </p>
          )}
        </div>

        <div className="p-6 rounded-3xl bg-surface/40 border border-border-soft backdrop-blur-xl col-span-1 md:col-span-2">
           <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-accent/10 border border-accent/20">
                <Info className="w-5 h-5 text-accent" />
              </div>
              <div className="space-y-1">
                 <h3 className="text-sm font-semibold text-white">Sobre os assentos da sua entidade</h3>
                 <p className="text-[0.8rem] text-foreground/60 leading-relaxed max-w-lg">
                   O plano <strong className="text-accent">{PLAN_NAMES[planKey] || planKey}</strong> permite até {limit} membros simultâneos. 
                   Administradores podem cancelar acessos a qualquer momento para liberar novos assentos e gerenciar as faturas via Portal de Pagamentos.
                 </p>
              </div>
           </div>
        </div>
      </div>

      {/* Members List */}
      <div className="rounded-[2.5rem] bg-surface/40 border border-border-soft backdrop-blur-2xl overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-border-soft bg-surface/20 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Membros Ativos</h2>
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-background/50 border border-border-soft text-xs text-foreground/60">
              <Shield className="w-3.5 h-3.5" /> Controle de Acesso Ativo
            </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs uppercase tracking-widest text-foreground/40 font-mono">
                <th className="px-8 py-5 font-medium border-b border-border-soft">Colaborador</th>
                <th className="px-8 py-5 font-medium border-b border-border-soft">E-mail</th>
                <th className="px-8 py-5 font-medium border-b border-border-soft">Função</th>
                <th className="px-8 py-5 font-medium border-b border-border-soft text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft">
              {(empresa.usuarios as Perfil[]).map((m) => (
                <tr key={m.id} className="group hover:bg-surface-dim transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center text-accent text-sm font-bold border border-accent/20">
                        {m.nomeCompleto ? m.nomeCompleto.charAt(0).toUpperCase() : "?"}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{m.nomeCompleto}</div>
                        <div className="text-[0.6rem] text-foreground/40 font-mono uppercase tracking-widest">Workspace Member</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-sm text-foreground/80">
                      <Mail className="w-4 h-4 opacity-30" />
                      <span>{m.email}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                     <span className={`text-[0.65rem] font-mono font-bold px-2 py-1 rounded-md border ${
                       m.role === 'ADMIN' ? 'bg-accent/10 border-accent/20 text-accent' : 'bg-surface border-border-soft text-foreground/40'
                     }`}>
                        {m.role}
                     </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="text-[0.65rem] font-mono font-bold tracking-widest text-foreground/40 hover:text-red-400 transition-colors uppercase">
                      Desativar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="flex items-center justify-center py-10 opacity-20 filter grayscale">
         <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border-soft" />
         <span className="mx-8 text-[0.6rem] font-mono tracking-[0.4em] uppercase">Pacto Ágil Enterprise</span>
         <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border-soft" />
      </div>
    </div>
  );
}
