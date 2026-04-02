"use client";

import { ReactNode, useState } from "react";
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
  Users
} from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";

const navItems = [
  { href: "/dashboard", label: "Painel de Controle", icon: LayoutDashboard },
  { href: "/dashboard/negociacoes", label: "Negociações", icon: Building2 },
  { href: "/dashboard/gerador", label: "Gerador Inteligente", icon: WandSparkles },
  { href: "/dashboard/members", label: "Minha Equipe", icon: Users },
  { href: "/dashboard/configuracoes", label: "Configurações", icon: Settings },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const SidebarContent = () => {
    const [isPortalLoading, setIsPortalLoading] = useState(false);

    const handlePortal = async () => {
      try {
        setIsPortalLoading(true);
        const response = await fetch("/api/portal", { method: "POST" });
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
            <BrandLogo href="/dashboard" />
            <p className="mt-3 text-xs font-mono uppercase tracking-[0.14em] text-foreground/60">Workspace Sindical</p>
          </div>
          <button 
            onClick={toggleMobileMenu} 
            className="lg:hidden p-2 text-foreground/80 hover:bg-surface-dim rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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
            href="/auth/signout"
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
    <div className="min-h-screen bg-background text-foreground flex">
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
          <BrandLogo compact href="/dashboard" />
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
