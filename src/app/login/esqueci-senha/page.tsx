'use client';

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Loader2, ArrowRight } from "lucide-react";
import { formatEmail } from "@/lib/validation/schemas";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        // Redireciona para um link no seu app que vai solicitar a nova senha
        redirectTo: `${window.location.origin}/resetar-senha`,
      });

      if (resetError) throw resetError;

      setSuccess(true);
    } catch (err: any) {
      console.error('Erro ao solicitar reset:', err);
      setError(err.message || 'Ocorreu um erro ao tentar enviar o e-mail.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-lg section-shell p-8 md:p-10 border border-border-soft bg-surface/40 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 blur-[50px] -z-10" />
        
        <p className="text-xs font-mono uppercase tracking-[0.16em] text-accent mb-3">
          Recuperação de acesso
        </p>
        <h1 className="text-3xl font-semibold mb-3 text-foreground tracking-tight">
          Esqueci minha senha
        </h1>

        {success ? (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <p className="text-sm text-foreground/72 mb-6">
              As instruções de recuperação foram enviadas para <strong className="text-white">{email}</strong>. 
              Por favor, verifique sua caixa de entrada e spam.
            </p>
            <Link 
              href="/login" 
              className="w-full flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-4 text-sm font-bold magnetic hover-lift transition-all"
            >
              Voltar ao login
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-foreground/72 mb-8 leading-relaxed">
              Insira o e-mail corporativo cadastrado na plataforma para receber um link de redefinição de senha segura.
            </p>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm animate-in fade-in slide-in-from-top-2">
                {error}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-6">
              <label className="block group">
                <span className="block text-sm font-medium text-foreground/80 mb-2 group-focus-within:text-accent transition-colors">
                  E-mail corporativo
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(formatEmail(e.target.value))}
                  placeholder="voce@sindicato.org.br"
                  className="w-full rounded-[1.25rem] border border-border-soft bg-background/50 px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all placeholder:text-foreground/30"
                  disabled={loading}
                />
              </label>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-4 text-sm font-bold magnetic hover-lift neo-ring disabled:opacity-50 disabled:pointer-events-none transition-all mt-4"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5 mr-2" />
                    Enviando...
                  </>
                ) : (
                  <>
                    Solicitar redefinição
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <Link 
                href="/login" 
                className="inline-flex text-sm font-semibold text-foreground/60 hover:text-accent transition-colors"
              >
                Voltar ao login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
