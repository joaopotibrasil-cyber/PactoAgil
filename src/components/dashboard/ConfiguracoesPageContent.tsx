"use client";

import type { ComponentType } from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { Building2, CreditCard, Palette, ShieldCheck, Users, Loader2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ROUTES } from "@/constants/routes";
import { syncUserSession } from "@/lib/auth-sync";

type Tab = "entidade" | "marca" | "usuarios" | "plano";

const tabs: Array<{ id: Tab; label: string; icon: ComponentType<{ className?: string }> }> = [
  { id: "entidade", label: "Dados da entidade", icon: Building2 },
  { id: "marca", label: "Marca visual", icon: Palette },
  { id: "usuarios", label: "Gestão de usuários", icon: Users },
  { id: "plano", label: "Plano e assinatura", icon: CreditCard },
];

const PLAN_INFO: Record<string, { nome: string; acordos: string; valor: string; usuarios: number }> = {
  DESCOBERTA: { nome: "Descoberta", acordos: "1 acordo/mês", valor: "Grátis", usuarios: 2 },
  MOVIMENTO:  { nome: "Movimento",  acordos: "5 acordos/mês", valor: "R$ 149/mês", usuarios: 3 },
  DIRECAO:    { nome: "Direção",    acordos: "15 acordos/mês", valor: "R$ 349/mês", usuarios: 7 },
  LIDERANCA:  { nome: "Liderança",  acordos: "50 acordos/mês", valor: "R$ 599/mês", usuarios: 10 },
};

interface ProfileData {
  nomeCompleto: string;
  email: string;
  role: string;
  empresaId: string;
  empresa: {
    nome: string;
    cnpj: string;
    funcionalidade: string;
    logoUrl?: string;
    corPrimaria?: string;
  };
  assinatura: {
    tipoPlano: string;
    status: string;
    fimPeriodoAtual: string;
  } | null;
  membros: Array<{ id: string; nomeCompleto: string; email: string; role: string }>;
}

export function ConfiguracoesPageContent() {
  const [activeTab, setActiveTab] = useState<Tab>("entidade");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [razaoSocial, setRazaoSocial] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [endereco, setEndereco] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [corPrimaria, setCorPrimaria] = useState("#006fee");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch(ROUTES.API.PROFILE.ROOT);
      if (res.status === 401) {
        window.location.href = ROUTES.PAGES.AUTH.LOGIN;
        return;
      }

      const data = await res.json();
      if (!data.perfil) return;

      const profileData: ProfileData = {
        nomeCompleto: data.perfil.nomeCompleto || "Usuário",
        email: data.perfil.email || "",
        role: data.perfil.role || "USER",
        empresaId: data.empresa?.id || "",
        empresa: {
          nome: data.empresa?.nome || "",
          cnpj: data.empresa?.cnpj || "",
          funcionalidade: data.empresa?.funcionalidade || "",
          logoUrl: data.empresa?.logoUrl || null,
          corPrimaria: data.empresa?.corPrimaria || "#006fee",
        },
        assinatura: data.assinatura || null,
        membros: data.membros || [],
      };

      setProfile(profileData);
      setRazaoSocial(profileData.empresa.nome);
      setCnpj(profileData.empresa.cnpj);
      setEndereco(profileData.empresa.funcionalidade);
      setLogoUrl(profileData.empresa.logoUrl || null);
      setCorPrimaria(profileData.empresa.corPrimaria || "#006fee");
    } catch (err) {
      console.error("[Configurações] Erro ao buscar perfil:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleSaveEntidade = async () => {
    if (!profile) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(ROUTES.API.PROFILE.UPDATE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ razaoSocial, cnpj, funcionalidade: endereco }),
      });

      if (!res.ok) throw new Error("Erro ao salvar");

      await syncUserSession(true);
      window.dispatchEvent(new CustomEvent('profile-updated'));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar dados da entidade.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setSaving(true);
    try {
      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.empresaId}-${Math.random()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('branding')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('branding')
        .getPublicUrl(filePath);

      const res = await fetch(ROUTES.API.PROFILE.UPDATE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoUrl: publicUrl }),
      });

      if (!res.ok) throw new Error("Erro ao registrar logo");

      await syncUserSession(true);
      window.dispatchEvent(new CustomEvent('profile-updated'));
      setLogoUrl(publicUrl);
      setProfile(prev => prev ? { ...prev, empresa: { ...prev.empresa, logoUrl: publicUrl } } : prev);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      console.error(err);
      alert("Erro ao enviar logotipo: " + (err.message || "Erro desconhecido"));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMarca = async () => {
    if (!profile) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(ROUTES.API.PROFILE.UPDATE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ corPrimaria }),
      });

      if (!res.ok) throw new Error("Erro ao salvar marca");

      await syncUserSession(true);
      window.dispatchEvent(new CustomEvent('profile-updated'));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      console.error(err);
      alert("Erro ao salvar marca visual.");
    } finally {
      setSaving(false);
    }
  };

  const handlePortal = async () => {
    try {
      const res = await fetch(ROUTES.API.PORTAL, { method: "POST" });
      if (res.status === 401) { window.location.href = ROUTES.PAGES.AUTH.LOGIN; return; }
      if (res.status === 400) { alert("Nenhuma assinatura ativa."); return; }
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch { alert("Erro ao acessar portal."); }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <section className="section-shell p-8 h-48 bg-surface/20 border-border-soft flex flex-col justify-end gap-4">
          <div className="w-32 h-6 bg-surface-dim rounded-full" />
          <div className="w-1/2 h-12 bg-surface-dim rounded-2xl" />
        </section>
        <section className="section-shell p-4 h-20 bg-surface/20 border-border-soft flex gap-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="w-32 h-10 bg-surface-dim rounded-full" />
          ))}
        </section>
        <section className="section-shell p-8 h-96 bg-surface/20 border-border-soft" />
      </div>
    );
  }

  const planoAtual = profile?.assinatura?.tipoPlano || "SEM PLANO";
  const planoInfo = PLAN_INFO[planoAtual];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <section className="section-shell p-6 md:p-8">
        <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-accent mb-3 px-3 py-1.5 rounded-full border border-accent/20 bg-accent/5">
          Administração
        </div>
        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight">Configurações da plataforma</h1>
        <p className="mt-3 text-foreground/70 max-w-2xl">Administração completa da conta, identidade da entidade e regras de acesso.</p>
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

      {/* Tab: Dados da Entidade */}
      {activeTab === "entidade" && (
        <section className="section-shell p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-[0.1em] text-foreground/65">Razão social</span>
            <input
              className="w-full rounded-xl border border-border-soft bg-surface px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
              value={razaoSocial}
              onChange={(e) => setRazaoSocial(e.target.value)}
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-[0.1em] text-foreground/65">CNPJ</span>
            <input
              className="w-full rounded-xl border border-border-soft bg-surface px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
            />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-xs font-mono uppercase tracking-[0.1em] text-foreground/65">Funcionalidade / Área de atuação</span>
            <input
              className="w-full rounded-xl border border-border-soft bg-surface px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
            />
          </label>
          <button
            onClick={handleSaveEntidade}
            disabled={saving}
            className="md:col-span-2 justify-self-start rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold magnetic inline-flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
            {saved ? "Salvo com sucesso!" : "Salvar dados da entidade"}
          </button>
        </section>
      )}

      {/* Tab: Marca Visual */}
      {activeTab === "marca" && (
        <section className="section-shell p-6 md:p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Logotipo */}
            <div className="space-y-4">
              <h3 className="text-sm font-mono uppercase tracking-[0.1em] text-foreground/65">Logotipo da Entidade</h3>
              <div className="relative group aspect-video rounded-2xl border-2 border-dashed border-border-soft bg-surface-dim/30 flex items-center justify-center overflow-hidden transition-all hover:border-accent/40">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="max-h-[80%] max-w-[80%] object-contain px-4" />
                ) : (
                  <div className="text-center p-6">
                    <p className="text-xs text-foreground/50">Nenhum logotipo enviado</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white text-black px-4 py-2 rounded-full text-xs font-bold hover:scale-105 transition-transform"
                  >
                    {logoUrl ? "Alterar logo" : "Selecionar arquivo"}
                  </button>
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleLogoUpload}
              />
              <p className="text-[10px] text-foreground/40 text-center">Recomendado: PNG ou SVG com fundo transparente.</p>
            </div>

            {/* Cores */}
            <div className="space-y-4">
              <h3 className="text-sm font-mono uppercase tracking-[0.1em] text-foreground/65">Identidade Cromática</h3>
              <div className="p-6 rounded-2xl border border-border-soft bg-surface space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Cor Primária</p>
                    <p className="text-xs text-foreground/50">Usada em botões e destaques do PDF.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-foreground/60">{corPrimaria.toUpperCase()}</span>
                    <input
                      type="color"
                      value={corPrimaria}
                      onChange={(e) => setCorPrimaria(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-border-soft">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-foreground/40 mb-3">Preview de componentes</p>
                  <div className="flex gap-2">
                    <div style={{ backgroundColor: corPrimaria }} className="h-8 w-24 rounded-full" />
                    <div style={{ borderColor: corPrimaria, color: corPrimaria }} className="h-8 w-24 rounded-full border flex items-center justify-center text-[10px] font-bold">OUTLINE</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-between items-center border-t border-border-soft">
            <p className="text-xs text-foreground/50 max-w-md">As alterações de marca são aplicadas globalmente nos portais de consulta e nas minutas geradas pela IA.</p>
            <button
              onClick={handleSaveMarca}
              disabled={saving}
              className="rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold magnetic inline-flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
              {saved ? "Marca salva!" : "Salvar configurações visuais"}
            </button>
          </div>
        </section>
      )}

      {/* Tab: Gestão de Usuários */}
      {activeTab === "usuarios" && (
        <section className="section-shell p-6 md:p-8 space-y-5">
          {profile?.membros && profile.membros.length > 0 ? (
            profile.membros.map((m) => (
              <div key={m.id} className="rounded-2xl border border-border-soft bg-surface p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold">{m.nomeCompleto || m.email}</p>
                  <p className="text-sm text-foreground/65">{m.role === "ADMIN" ? "Administrador" : "Membro"}</p>
                </div>
                <span className="text-xs rounded-full border border-border-soft px-3 py-1">Ativo</span>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-foreground/50">
              Nenhum membro encontrado.
            </div>
          )}
          <a
            href={ROUTES.PAGES.DASHBOARD.MEMBERS}
            className="inline-block rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold magnetic"
          >
            Gerenciar membros
          </a>
        </section>
      )}

      {/* Tab: Plano e Assinatura */}
      {activeTab === "plano" && (
        <section className="section-shell p-6 md:p-8 space-y-6">
          <div className="rounded-2xl border border-border-soft bg-surface p-5">
            <p className="text-xs font-mono uppercase tracking-[0.1em] text-accent mb-2">Plano atual</p>
            <h2 className="text-2xl font-semibold">
              {planoInfo ? `Plano ${planoInfo.nome}` : planoAtual}
            </h2>
            <p className="mt-2 text-sm text-foreground/75">
              {planoInfo ? `${planoInfo.acordos} · ${profile?.membros.length || 0} de ${planoInfo.usuarios} usuários ativos` : "Sem assinatura ativa"}
            </p>
            {profile?.assinatura?.status === "active" && (
              <p className="mt-1 text-xs text-foreground/50">
                Próxima renovação: {new Date(profile.assinatura.fimPeriodoAtual).toLocaleDateString("pt-BR")}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Object.entries(PLAN_INFO).map(([key, plan]) => {
              const isCurrent = key === planoAtual;
              const planKeys = Object.keys(PLAN_INFO);
              return (
                <article key={key} className={`rounded-2xl border p-4 transition-all ${
                  isCurrent
                    ? "border-accent bg-accent/5"
                    : "border-border-soft bg-surface hover:border-accent/30"
                }`}>
                  <h3 className="text-lg font-semibold">{plan.nome}</h3>
                  <p className="text-sm text-foreground/70 mt-1">{plan.acordos}</p>
                  <p className="text-sm text-foreground/70">{plan.usuarios} usuários</p>
                  <p className="text-xl font-semibold mt-4">{plan.valor}</p>
                  {isCurrent ? (
                    <span className="mt-4 w-full inline-flex items-center justify-center rounded-full bg-accent/20 text-accent px-4 py-2 text-sm font-semibold">
                      Plano atual
                    </span>
                  ) : (
                    <button
                      onClick={handlePortal}
                      className="mt-4 w-full rounded-full bg-accent text-accent-foreground px-4 py-2 text-sm font-semibold magnetic hover:opacity-90 transition-opacity"
                    >
                      {planKeys.indexOf(key) > planKeys.indexOf(planoAtual) ? "Fazer upgrade" : "Alterar plano"}
                    </button>
                  )}
                </article>
              );
            })}
          </div>

          <div className="rounded-2xl border border-border-soft bg-surface-dim p-4 text-sm inline-flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-success" />
            Pagamentos processados com segurança via Stripe.
          </div>
        </section>
      )}
    </div>
  );
}
