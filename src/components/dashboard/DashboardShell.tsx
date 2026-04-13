import { ReactNode, useState, useEffect } from "react";
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
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { ROUTES } from "@/constants/routes";

const navItems = [
  { href: ROUTES.PAGES.DASHBOARD.ROOT, label: "Painel de Controle", icon: LayoutDashboard },
  { href: ROUTES.PAGES.DASHBOARD.NEGOTIATIONS, label: "Negociações", icon: Building2 },
  { href: ROUTES.PAGES.DASHBOARD.CALENDAR, label: "Calendário", icon: Calendar },
  { href: ROUTES.PAGES.DASHBOARD.GENERATOR, label: "Nova Negociação", icon: WandSparkles },
  { href: ROUTES.PAGES.DASHBOARD.MEMBERS, label: "Diretores", icon: Users },
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

interface DashboardShellProps {
  children: ReactNode;
  currentPath: string;
  /** Dados do perfil já carregados no servidor (cor/logo sem esperar o cliente). */
  initialShellProfile?: UserProfile | null;
}

export function DashboardShell({ children, currentPath, initialShellProfile = null }: DashboardShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => initialShellProfile ?? null);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
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
        console.error('[DashboardShell] Erro ao buscar perfil:', err);
      }
    };

    if (!initialShellProfile) {
      void fetchProfile();
    }

    const handleUpdate = () => {
      void fetchProfile();
    };

    window.addEventListener('profile-updated', handleUpdate);
    return () => window.removeEventListener('profile-updated', handleUpdate);
  }, [initialShellProfile]);

  const SidebarContent = ({ collapsed = false, onToggleCollapse }: { collapsed?: boolean, onToggleCollapse?: () => void }) => {
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
        alert("Erro ao acessar o portal de faturamento.");
      } finally {
        setIsPortalLoading(false);
      }
    };

    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className={`px-6 py-6 border-b border-border-soft flex items-center justify-between ${collapsed ? 'justify-center px-2' : ''}`}>
          {!collapsed && (
            <div className="flex flex-col gap-1">
              <h2 className="text-sm font-bold tracking-tight text-white">Pacto Ágil</h2>
              <p className="text-[0.6rem] font-mono uppercase tracking-[0.14em] text-foreground/60">Workspace Sindical</p>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
          )}
          <div className="flex items-center gap-2">
            {onToggleCollapse && (
              <button 
                onClick={onToggleCollapse} 
                className="hidden lg:flex p-1.5 text-foreground/60 hover:text-accent bg-surface-dim hover:bg-accent/10 border border-border-soft hover:border-accent/30 rounded-lg transition-all shadow-sm"
              >
                {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            )}
            <button 
              onClick={toggleMobileMenu} 
              className="lg:hidden p-2 text-foreground/80 hover:bg-surface-dim rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Perfil do Usuário */}
        <div className={`px-4 py-4 border-b border-border-soft ${collapsed ? 'min-h-[80px]' : 'min-h-[120px]'}`}>
          {userProfile ? (
            <>
              <div className={`flex items-center gap-3 p-3 rounded-2xl bg-surface-dim/50 border border-border-soft ${collapsed ? 'justify-center' : ''}`}>
                <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/20 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-accent" />
                </div>
                {!collapsed && (
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate text-white">{userProfile.nomeCompleto}</p>
                    <p className="text-[0.65rem] text-foreground/50 truncate">{userProfile.email}</p>
                  </div>
                )}
              </div>
              {!collapsed && (
                <div className="flex items-center gap-2 mt-3 px-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span className="text-[0.6rem] font-mono uppercase tracking-[0.15em] text-accent truncate">
                    {userProfile.plano} &bull; {userProfile.empresaNome}
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="animate-pulse">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface-dim/30 border border-border-soft/50">
                <div className="w-10 h-10 rounded-xl bg-surface-dim shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-surface-dim rounded" />
                  <div className="h-3 w-1/2 bg-surface-dim/50 rounded" />
                </div>
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.href || (currentPath.startsWith(item.href) && item.href !== ROUTES.PAGES.DASHBOARD.ROOT);
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center ${collapsed ? 'justify-center px-0' : 'gap-3 px-4'} rounded-xl py-3 text-sm font-semibold hover-lift transition-all duration-200 no-underline ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-foreground/80 hover:bg-surface-dim"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </a>
            );
          })}
        </nav>

        <div className={`p-4 border-t border-border-soft space-y-3 ${collapsed ? 'px-2' : ''}`}>
          {!collapsed && userProfile?.logoUrl && (
            <div className="flex items-center justify-center p-2 mb-1 bg-surface-dim/30 rounded-xl border border-border-soft/50">
               <BrandLogo src={userProfile.logoUrl} imageClassName="h-6 w-auto grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all" />
            </div>
          )}
          
          <button
            onClick={handlePortal}
            disabled={isPortalLoading}
            className={`w-full inline-flex items-center justify-center ${collapsed ? 'gap-0 p-2.5' : 'gap-2 py-2.5'} rounded-xl bg-accent/10 border border-accent/20 text-sm font-semibold text-accent hover:bg-accent/20 transition-all disabled:opacity-50 cursor-pointer`}
          >
            {isPortalLoading ? (
              <Loader2 className="h-5 w-5 animate-spin shrink-0" />
            ) : (
              <CreditCard className="h-5 w-5 shrink-0" />
            )}
            {!collapsed && <span>Gerenciar Assinatura</span>}
          </button>

          <a
            href={ROUTES.PAGES.AUTH.SIGNOUT}
            className={`w-full inline-flex items-center justify-center ${collapsed ? 'gap-0 p-2.5' : 'gap-2 py-2.5'} rounded-xl bg-surface border border-border-soft text-sm font-semibold hover:bg-surface-dim transition-colors no-underline text-foreground`}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Sair</span>}
          </a>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen min-h-[100dvh] w-full overflow-x-hidden bg-background text-foreground flex">
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          ${userProfile?.corPrimaria ? `
            --accent: ${userProfile.corPrimaria}; 
            --primary: ${userProfile.corPrimaria};
          ` : ""}
        }
      `}} />
      
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex transition-all duration-300 ease-in-out border-r border-border-soft bg-surface/90 backdrop-blur-xl flex-col sticky top-0 h-screen z-30 ${isSidebarCollapsed ? 'w-24' : 'w-72'}`}>
        <SidebarContent collapsed={isSidebarCollapsed} onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
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
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-sm text-white">Pacto Ágil</span>
          </div>
          <button 
            onClick={toggleMobileMenu}
            className="p-2 text-foreground/80 hover:text-accent hover:bg-surface-dim rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        <main className="flex-1 p-3 sm:p-4 md:p-8 lg:p-10 w-full min-w-0">
          <div className="mx-auto w-full max-w-[1240px] h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
