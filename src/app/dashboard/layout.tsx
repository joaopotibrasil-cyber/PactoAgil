"use client";

import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  WandSparkles,
  Settings,
  LogOut,
  Menu,
  X,
  CreditCard,
  Loader2,
  Users,
  User,
  ShieldCheck,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { ROUTES } from "@/constants/routes";


const navItems = [
  { href: ROUTES.PAGES.DASHBOARD.ROOT, label: "Painel de Controle", icon: LayoutDashboard },
  { href: ROUTES.PAGES.DASHBOARD.NEGOTIATIONS, label: "Negociações", icon: Building2 },
  { href: ROUTES.PAGES.DASHBOARD.GENERATOR, label: "Gerador Inteligente", icon: WandSparkles },
  { href: ROUTES.PAGES.DASHBOARD.MEMBERS, label: "Minha Equipe", icon: Users },
  { href: ROUTES.PAGES.DASHBOARD.CONFIG, label: "Configurações", icon: Settings },
];

interface UserProfile {
  nomeCompleto: string;
  email: string;
  role: string;
  empresaNome: string;
  plano: string;
  logoUrl?: string;
  corPrimaria?: string;
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Usa a API route server-side para buscar o perfil
        // evitando queries diretas do client SDK que falham com 400
        // quando os cookies HTTP-only não estão acessíveis no browser
        const res = await fetch(ROUTES.API.PROFILE.ROOT, { credentials: 'include' });
        if (!res.ok) return;

        const data = await res.json();
        setUserProfile({
          nomeCompleto: data.nomeCompleto,
          email: data.email,
          role: data.role,
          empresaNome: data.empresaNome,
          plano: data.plano,
          logoUrl: data.logoUrl || undefined,
          corPrimaria: data.corPrimaria || undefined,
        });
      } catch (err) {
        console.error('[DashboardLayout] Erro ao buscar perfil:', err);
      }
    };

    fetchProfile();
  }, []);

  const SidebarContent = () => {
    const [isPortalLoading, setIsPortalLoading] = useState(false);

    const handlePortal = async () => {
      try {
        setIsPortalLoading(true);
        const response = await fetch(ROUTES.API.PORTAL, { 
          method: "POST",
          credentials: "include",
        });
        
        if (response.status === 401) {
          window.location.href = ROUTES.PAGES.AUTH.LOGIN;
          return;
        }
        
        if (response.status === 400) {
          alert("Nenhuma assinatura ativa encontrada. Complete o checkout primeiro.");
          return;
        }

        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error("URL do portal não encontrada");
        }
      } catch (error) {
        console.error(error);
        alert("Erro ao acessar o portal de faturamento. Verifique sua conexão ou tente novamente mais tarde.");
      } finally {
        setIsPortalLoading(false);
      }
    };

    return (
      <>
        <div className="px-6 py-6 border-b border-border-soft flex items-center justify-between">
          <div>
            <BrandLogo href={ROUTES.PAGES.DASHBOARD.ROOT} src={userProfile?.logoUrl} />
            <p className="mt-3 text-xs font-mono uppercase tracking-[0.14em] text-foreground/60">Workspace Sindical</p>
          </div>
          <button 
            onClick={toggleMobileMenu} 
            className="lg:hidden p-2 text-foreground/80 hover:bg-surface-dim rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Perfil do Usuário */}
        {userProfile && (
          <div className="px-4 py-4 border-b border-border-soft">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface-dim/50 border border-border-soft">
              <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/20 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-accent" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{userProfile.nomeCompleto}</p>
                <p className="text-[0.65rem] text-foreground/50 truncate">{userProfile.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 px-1">
              <ShieldCheck className="w-3.5 h-3.5 text-accent shrink-0" />
              <span className="text-[0.6rem] font-mono uppercase tracking-[0.15em] text-accent truncate">
                {userProfile.plano} &bull; {userProfile.empresaNome}
              </span>
            </div>
          </div>
        )}

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold hover-lift transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-foreground/80 hover:bg-surface-dim"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border-soft space-y-3">
          <button
            onClick={handlePortal}
            disabled={isPortalLoading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-accent/10 border border-accent/20 py-2.5 text-sm font-semibold text-accent hover:bg-accent/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isPortalLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            Gerenciar Assinatura
          </button>

          <Link
            href={ROUTES.PAGES.AUTH.SIGNOUT}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-surface border border-border-soft py-2.5 text-sm font-semibold hover:bg-surface-dim transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Link>
        </div>
      </>
    );
  };

  return (
    <div 
      className="min-h-screen bg-background text-foreground flex"
    >
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          ${userProfile?.corPrimaria ? `
            --accent: ${userProfile.corPrimaria}; 
            --primary: ${userProfile.corPrimaria};
          ` : ""}
        }
      `}} />
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 border-r border-border-soft bg-surface/90 backdrop-blur-xl flex-col sticky top-0 h-screen z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Mobile Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 w-72 bg-surface/95 backdrop-blur-xl border-r border-border-soft flex flex-col z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent />
      </aside>

      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden px-4 py-4 border-b border-border-soft bg-surface/90 backdrop-blur-xl sticky top-0 z-20 flex items-center justify-between">
          <BrandLogo compact href={ROUTES.PAGES.DASHBOARD.ROOT} src={userProfile?.logoUrl} />
          <button 
            onClick={toggleMobileMenu}
            className="p-2 text-foreground/80 hover:text-accent hover:bg-surface-dim rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        <main className="flex-1 p-4 md:p-8 lg:p-10">
          <div className="mx-auto w-[min(1240px,100%)] h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
