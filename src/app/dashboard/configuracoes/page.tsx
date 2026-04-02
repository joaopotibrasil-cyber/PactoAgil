"use client";

import type { ComponentType } from "react";
import { useState } from "react";
import { Building2, CreditCard, Palette, ShieldCheck, Users } from "lucide-react";

type Tab = "entidade" | "marca" | "usuarios" | "plano";

const tabs: Array<{ id: Tab; label: string; icon: ComponentType<{ className?: string }> }> = [
  { id: "entidade", label: "Dados da entidade", icon: Building2 },
  { id: "marca", label: "Marca visual", icon: Palette },
  { id: "usuarios", label: "Gestao de usuarios", icon: Users },
  { id: "plano", label: "Plano e assinatura", icon: CreditCard },
];

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState<Tab>("entidade");

  return (
    <div className="space-y-6">
      <section className="section-shell p-6 md:p-8">
        <p className="text-xs font-mono uppercase tracking-[0.16em] text-accent mb-3">Tela 5</p>
        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight">Configuracoes da plataforma</h1>
        <p className="mt-3 text-foreground/70 max-w-2xl">Administracao completa da conta, identidade da entidade e regras de acesso.</p>
      </section>

      <section className="section-shell p-4 md:p-5">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold magnetic ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface border border-border-soft"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      {activeTab === "entidade" ? (
        <section className="section-shell p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-[0.1em] text-foreground/65">Razao social</span>
            <input className="w-full rounded-xl border border-border-soft bg-surface px-4 py-2.5" defaultValue="Sindicato dos Trabalhadores XYZ" />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-[0.1em] text-foreground/65">CNPJ</span>
            <input className="w-full rounded-xl border border-border-soft bg-surface px-4 py-2.5" defaultValue="12.345.678/0001-00" />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-xs font-mono uppercase tracking-[0.1em] text-foreground/65">Endereco institucional</span>
            <input className="w-full rounded-xl border border-border-soft bg-surface px-4 py-2.5" defaultValue="Av. Principal, 1000 - Centro" />
          </label>
          <button className="md:col-span-2 justify-self-start rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold magnetic">
            Salvar dados da entidade
          </button>
        </section>
      ) : null}

      {activeTab === "marca" ? (
        <section className="section-shell p-6 md:p-8 space-y-4">
          <div className="rounded-2xl border border-dashed border-border-soft p-6 text-sm text-foreground/75">
            Upload de logotipo e configuracao de cores institucionais para PDF e portal dos usuarios.
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="rounded-full border border-border-soft bg-surface px-4 py-2 text-sm font-semibold">Enviar logotipo</button>
            <button className="rounded-full border border-border-soft bg-surface px-4 py-2 text-sm font-semibold">Definir cor primaria</button>
          </div>
        </section>
      ) : null}

      {activeTab === "usuarios" ? (
        <section className="section-shell p-6 md:p-8 space-y-5">
          <div className="rounded-2xl border border-border-soft bg-surface p-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold">renato@pactoagil.com</p>
              <p className="text-sm text-foreground/65">Administrador</p>
            </div>
            <span className="text-xs rounded-full border border-border-soft px-3 py-1">Ativo</span>
          </div>
          <div className="rounded-2xl border border-border-soft bg-surface p-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold">joao@entidade.org</p>
              <p className="text-sm text-foreground/65">Gestor sindical</p>
            </div>
            <span className="text-xs rounded-full border border-border-soft px-3 py-1">Ativo</span>
          </div>
          <button className="rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold magnetic">Convidar novo usuario</button>
        </section>
      ) : null}

      {activeTab === "plano" ? (
        <section className="section-shell p-6 md:p-8 space-y-6">
          <div className="rounded-2xl border border-border-soft bg-surface p-5">
            <p className="text-xs font-mono uppercase tracking-[0.1em] text-accent mb-2">Plano atual</p>
            <h2 className="text-2xl font-semibold">Plano Movimento</h2>
            <p className="mt-2 text-sm text-foreground/75">2 de 5 acordos utilizados neste mes · 2 de 3 usuarios ativos</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { nome: "Descoberta", uso: "1 acordo/mes", valor: "Gratis" },
              { nome: "Direcao", uso: "15 acordos/mes", valor: "R$ 299/mes" },
              { nome: "Lideranca", uso: "50 acordos/mes", valor: "R$ 599/mes" },
            ].map((plan) => (
              <article key={plan.nome} className="rounded-2xl border border-border-soft bg-surface p-4">
                <h3 className="text-lg font-semibold">{plan.nome}</h3>
                <p className="text-sm text-foreground/70 mt-1">{plan.uso}</p>
                <p className="text-xl font-semibold mt-4">{plan.valor}</p>
                <button className="mt-4 w-full rounded-full bg-accent text-accent-foreground px-4 py-2 text-sm font-semibold magnetic">Fazer upgrade</button>
              </article>
            ))}
          </div>

          <div className="rounded-2xl border border-border-soft bg-surface-dim p-4 text-sm inline-flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-success" />
            Integracao planejada com Mercado Pago (credenciais entram na fase de APIs).
          </div>
        </section>
      ) : null}
    </div>
  );
}
