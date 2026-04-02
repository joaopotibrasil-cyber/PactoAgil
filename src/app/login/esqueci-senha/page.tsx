import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg section-shell p-8 md:p-10">
        <p className="text-xs font-mono uppercase tracking-[0.16em] text-accent mb-3">Recuperacao de acesso</p>
        <h1 className="text-3xl font-semibold mb-3">Esqueci minha senha</h1>
        <p className="text-sm text-foreground/72 mb-6">
          Fluxo de envio por e-mail sera conectado quando as APIs forem configuradas. Por enquanto, registre o e-mail de teste abaixo.
        </p>

        <form className="space-y-4">
          <input
            type="email"
            placeholder="voce@entidade.org"
            className="w-full rounded-xl border border-border-soft bg-surface px-4 py-3 text-sm"
          />
          <button
            type="button"
            className="w-full rounded-full bg-primary text-primary-foreground px-4 py-3 text-sm font-semibold magnetic"
          >
            Solicitar redefinicao
          </button>
        </form>

        <Link href="/login" className="inline-flex mt-4 text-sm font-semibold text-accent hover:underline">
          Voltar ao login
        </Link>
      </div>
    </div>
  );
}

