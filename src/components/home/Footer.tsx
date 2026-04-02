import { BrandLogo } from "@/components/ui/BrandLogo";

export function Footer() {
  return (
<footer className="w-full pt-20 px-0">
      <div className="w-full bg-[#041024] text-[#d8e6ff] border-t border-[#0f2e5f] p-8 md:p-16 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-[#2b93ff]/50 to-transparent" />
        
        <div className="mx-auto max-w-[1400px]">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="md:col-span-2">
              <BrandLogo className="brightness-110 mb-6" />
              <p className="mt-4 text-base text-[#b5caef] max-w-md leading-relaxed">
                Negociações coletivas com inteligência, agilidade e máxima segurança jurídica. 
                A evolução do pacto social na era da inteligência artificial.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-6 uppercase tracking-widest text-white/90">Navegação</h4>
              <ul className="space-y-3 text-sm text-[#b5caef]">
                <li><a href="#features" className="hover:text-white transition-colors duration-200">Funcionalidades</a></li>
                <li><a href="#protocol" className="hover:text-white transition-colors duration-200">Protocolo de Segurança</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors duration-200">Planos de Assinatura</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-6 uppercase tracking-widest text-white/90">Jurídico</h4>
              <ul className="space-y-3 text-sm text-[#b5caef]">
                <li><a href="#" className="hover:text-white transition-colors duration-200">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Política de Privacidade</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">Canal de Suporte</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row gap-6 md:items-center md:justify-between text-[11px] text-[#9fb8df] font-mono uppercase tracking-[0.2em]">
            <div className="inline-flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#44ffb0]/80 shadow-[0_0_10px_rgba(68,255,176,0.3)] animate-pulse" />
              Sistemas Online & Monitorados
            </div>
            <div className="opacity-80">© {new Date().getFullYear()} Pacto Ágil SaaS • Crafted for Excellence</div>
          </div>
        </div>
      </div>
    </footer>
  );
}
