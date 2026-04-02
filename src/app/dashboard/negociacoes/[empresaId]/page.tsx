"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, FileClock, FileText, History } from "lucide-react";

const history = [
  { nome: "ACT 2025", tipo: "ACT", versao: "v3", status: "Assinado", data: "2025-05-04" },
  { nome: "ACT 2026 - proposta empresa", tipo: "ACT", versao: "v1", status: "Em revisao", data: "2026-03-19" },
  { nome: "Termo aditivo vale-alimentacao", tipo: "Aditivo", versao: "v2", status: "Em revisao", data: "2026-03-28" },
];

export default function EmpresaDetalhePage() {
  const params = useParams<{ empresaId: string }>();
  const empresaId = params?.empresaId ?? "empresa";

  const companyName = useMemo(() => {
    return empresaId
      .split("-")
      .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
      .join(" ");
  }, [empresaId]);

  return (
    <div className="space-y-7">
      <section className="section-shell p-6 md:p-8">
        <Link href="/dashboard/negociacoes" className="inline-flex items-center gap-2 text-sm font-semibold hover:text-accent mb-4">
          <ArrowLeft className="h-4 w-4" />
          Voltar para negociacoes
        </Link>

        <p className="text-xs font-mono uppercase tracking-[0.16em] text-accent mb-3">Perfil da empresa</p>
        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight">{companyName}</h1>
        <p className="mt-3 text-foreground/70 max-w-2xl">
          Historico completo de instrumentos, versoes e eventos para rastrear o ciclo de vida da negociacao.
        </p>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <article className="section-shell p-5">
          <div className="inline-flex items-center gap-2 text-sm font-semibold">
            <FileText className="h-4 w-4 text-info" />
            Total de documentos
          </div>
          <p className="text-4xl font-semibold mt-4">18</p>
        </article>

        <article className="section-shell p-5">
          <div className="inline-flex items-center gap-2 text-sm font-semibold">
            <FileClock className="h-4 w-4 text-warning" />
            Em revisao
          </div>
          <p className="text-4xl font-semibold mt-4">3</p>
        </article>

        <article className="section-shell p-5">
          <div className="inline-flex items-center gap-2 text-sm font-semibold">
            <History className="h-4 w-4 text-success" />
            Ultima atualizacao
          </div>
          <p className="text-2xl font-semibold mt-4">2026-03-28</p>
        </article>
      </section>

      <section className="section-shell p-6 md:p-8">
        <h2 className="text-2xl font-semibold mb-4">Historico de instrumentos</h2>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="text-left text-xs font-mono uppercase tracking-[0.12em] text-foreground/55 border-b border-border-soft">
                <th className="py-3">Documento</th>
                <th className="py-3">Tipo</th>
                <th className="py-3">Versao</th>
                <th className="py-3">Status</th>
                <th className="py-3">Data</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={`${item.nome}-${item.versao}`} className="border-b border-border-soft/70">
                  <td className="py-3.5 font-semibold">{item.nome}</td>
                  <td className="py-3.5">{item.tipo}</td>
                  <td className="py-3.5 font-mono">{item.versao}</td>
                  <td className="py-3.5">
                    <span className="inline-flex rounded-full border border-border-soft px-3 py-1 text-xs font-semibold bg-surface">
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3.5 font-mono">{item.data}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

