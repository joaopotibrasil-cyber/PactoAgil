"use client";

import { useState, useTransition, useRef } from "react";
import { UserPlus, X, Loader2, CheckCircle2, Mail, User2, AlertCircle } from "lucide-react";
import { inviteMemberAction } from "./actions";

interface InviteMemberButtonProps {
  disabled?: boolean;
  disabledReason?: string;
}

export function InviteMemberButton({ disabled, disabledReason }: InviteMemberButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ error?: string; success?: boolean } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setResult(null);

    startTransition(async () => {
      const res = await inviteMemberAction(formData);
      setResult(res);
      if (res?.success) {
        formRef.current?.reset();
        setTimeout(() => {
          setIsOpen(false);
          setResult(null);
        }, 2500);
      }
    });
  };

  return (
    <>
      {/* Botão Trigger */}
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

      {/* Modal Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}
        >
          <div className="w-full max-w-md bg-surface border border-border-soft rounded-[2rem] shadow-2xl p-8 animate-in zoom-in-95 duration-300 relative">
            {/* Glow Decorativo */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[0.6rem] font-mono tracking-widest uppercase mb-3">
                  <UserPlus className="w-3 h-3" /> Novo Colaborador
                </div>
                <h2 className="text-xl font-semibold text-white">Convidar para a Equipe</h2>
                <p className="text-sm text-foreground/50 mt-1">
                  Um e-mail de acesso será enviado ao colaborador.
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl hover:bg-surface-dim transition-colors text-foreground/40 hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Feedback */}
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

            {/* Formulário */}
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

            {/* Nota de Segurança */}
            <p className="mt-5 text-[0.65rem] text-foreground/30 text-center font-mono tracking-wider">
              CONVITE SEGURO • ACESSO RESTRITO À SUA ORGANIZAÇÃO
            </p>
          </div>
        </div>
      )}
    </>
  );
}
