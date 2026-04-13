import { useState, useRef } from "react";
import { Users, Shield, Mail, BadgeCheck, Zap, Info, UserPlus, X, Loader2, CheckCircle2, User2, AlertCircle } from "lucide-react";

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

interface Member {
  id: string;
  nomeCompleto: string | null;
  email: string;
  role: string;
}

interface MembersPageContentProps {
  membros: Member[];
  empresaNome: string;
  planKey: string;
  limit: number;
  currentMembers: number;
  isLimitReached: boolean;
}

function InviteMemberButton({ disabled, disabledReason }: { disabled?: boolean; disabledReason?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [result, setResult] = useState<{ error?: string; success?: boolean } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setResult(null);
    setIsPending(true);

    try {
      const res = await fetch('/api/members/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.get('email'),
          name: formData.get('name'),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ success: true });
        formRef.current?.reset();
        setTimeout(() => {
          setIsOpen(false);
          setResult(null);
          // Reload para atualizar a lista de membros
          window.location.reload();
        }, 2500);
      } else {
        setResult({ error: data.error || 'Erro ao enviar convite.' });
      }
    } catch (err: any) {
      setResult({ error: err.message || 'Erro de conexão.' });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        title={disabled ? disabledReason : undefined}
        className={`flex items-center gap-2 px-6 py-3.5 rounded-full font-bold text-sm transition-all shadow-xl ${
          disabled
            ? "bg-surface text-foreground/30 border border-border-soft cursor-not-allowed"
            : "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 hover-lift"
        }`}
      >
        <UserPlus className="w-4 h-4" />
        Convidar Membro
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}
        >
          <div className="w-full max-w-md bg-surface border border-border-soft rounded-[2rem] shadow-2xl p-8 animate-in zoom-in-95 duration-300 relative">
            <div className="absolute top-0 right-0 w-48 h-48 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[0.6rem] font-mono tracking-widest uppercase mb-3">
                  <UserPlus className="w-3 h-3" /> Novo Colaborador
                </div>
                <h2 className="text-xl font-semibold text-white">Convidar para a Equipe</h2>
                <p className="text-sm text-foreground/50 mt-1">Um e-mail de acesso será enviado ao colaborador.</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl hover:bg-surface-dim transition-colors text-foreground/40 hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {result?.error && (
              <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {result.error}
              </div>
            )}
            {result?.success && (
              <div className="mb-4 p-3.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                Convite enviado com sucesso! O colaborador receberá um e-mail de acesso.
              </div>
            )}

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground/60 ml-1 flex items-center gap-1.5">
                  <User2 className="w-3 h-3" /> Nome do Colaborador
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="Ex: Maria Silva"
                  className="w-full bg-background/60 border border-border-soft rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all placeholder:text-foreground/25"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground/60 ml-1 flex items-center gap-1.5">
                  <Mail className="w-3 h-3" /> E-mail Corporativo
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="colaborador@entidade.org.br"
                  className="w-full bg-background/60 border border-border-soft rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all placeholder:text-foreground/25"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 py-3.5 rounded-full border border-border-soft text-sm font-semibold text-foreground/60 hover:bg-surface-dim transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-3.5 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Enviar Convite
                    </>
                  )}
                </button>
              </div>
            </form>

            <p className="mt-5 text-[0.65rem] text-foreground/30 text-center font-mono tracking-wider">
              CONVITE SEGURO • ACESSO RESTRITO À SUA ORGANIZAÇÃO
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export function MembersPageContent({
  membros,
  empresaNome,
  planKey,
  limit,
  currentMembers,
  isLimitReached,
}: MembersPageContentProps) {
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
            Gerencie o acesso dos advogados e negociadores da sua organização <strong className="text-accent">{empresaNome}</strong>.
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
              style={{ width: `${Math.min((currentMembers / limit) * 100, 100)}%` }}
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

        {membros && membros.length > 0 ? (
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
                {membros.map((m) => (
                  <tr key={m.id} className="group hover:bg-surface-dim transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center text-accent text-sm font-bold border border-accent/20">
                          {m.nomeCompleto ? m.nomeCompleto.charAt(0).toUpperCase() : "?"}
                        </div>
                        <div>
                          <div className="font-semibold text-white">{m.nomeCompleto || "Sem nome"}</div>
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
        ) : (
          <div className="py-12 text-center text-foreground/50 font-medium">
            Nenhum membro cadastrado nesta empresa.
          </div>
        )}
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
