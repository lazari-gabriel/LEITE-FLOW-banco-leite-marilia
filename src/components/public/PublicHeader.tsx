import React, { useEffect, useState } from 'react';
import { Menu, X, LogIn, LayoutDashboard, Heart, Phone } from 'lucide-react';
import { InstitutionalLogo } from './InstitutionalLogo';

interface PublicHeaderProps {
  isAuthenticated: boolean;
  userName?: string;
  onAccessSystem: () => void;
  onBecomeDonor: () => void;
}

const NAV_LINKS = [
  { href: '#sobre-projeto', id: 'sobre-projeto', label: 'Sobre o LEITFLOW' },
  { href: '#como-funciona', id: 'como-funciona', label: 'Como Doar' },
  { href: '#requisitos', id: 'requisitos', label: 'Quem Pode Doar' },
  { href: '#plataforma', id: 'plataforma', label: 'A Plataforma' },
  { href: '#duvidas', id: 'duvidas', label: 'Dúvidas' },
];

export const PublicHeader: React.FC<PublicHeaderProps> = ({
  isAuthenticated,
  userName,
  onAccessSystem,
  onBecomeDonor,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY || 0;
      setScrolled(y > 20);

      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? Math.min(100, Math.max(0, (y / docHeight) * 100)) : 0);

      // Scroll-spy simples e determinístico por posição de viewport
      const viewportMarker = y + 140;
      let current = '';
      for (const item of NAV_LINKS) {
        const el = document.getElementById(item.id);
        if (el && el.offsetTop <= viewportMarker) {
          current = item.id;
        }
      }
      setActiveSection(current);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-xl border-b border-[#E5DFD6] shadow-[0_6px_28px_-14px_rgba(30,36,43,0.16)]'
          : 'bg-[#FAF9F6]/90 backdrop-blur-md border-b border-[#EFECE6]/90'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-[74px] flex items-center justify-between gap-4">
        {/* Marca institucional em alta definição */}
        <a
          href="#historia-leiteflow"
          aria-label="Início LEITFLOW — Banco de Leite Humano de Marília"
          className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4A6B5D] rounded-xl py-1 pr-2 transition-opacity hover:opacity-90 shrink-0"
        >
          <InstitutionalLogo size="md" showSubtitle />
        </a>

        {/* Navegação central em trilho flutuante com indicador da seção ativa */}
        <nav
          aria-label="Navegação institucional"
          className="hidden lg:flex items-center p-1 rounded-full bg-[#F3F0EA]/90 border border-[#E7E1D7] shadow-inner"
        >
          {NAV_LINKS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'location' : undefined}
                className={`px-3.5 xl:px-4 py-1.5 rounded-full text-[13px] transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-[#3B594C] font-semibold shadow-sm ring-1 ring-[#E7E1D7]/80'
                    : 'text-[#1E242B]/75 font-medium hover:text-[#1E242B] hover:bg-white/60'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Ações Desktop / Tablet */}
        <div className="hidden sm:flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onAccessSystem}
            title="Acesso restrito a profissionais autorizados do serviço"
            className="px-3.5 xl:px-4 py-2 rounded-full bg-white text-[#1E242B] font-semibold text-xs xl:text-[13px] border border-[#DFD9CF] hover:border-[#4A6B5D]/60 hover:bg-[#F3F7F5] hover:text-[#3B594C] transition-all flex items-center gap-1.5 shadow-sm"
          >
            {isAuthenticated ? (
              <>
                <LayoutDashboard className="w-3.5 h-3.5 text-[#4A6B5D]" />
                <span>{userName ? `Painel · ${userName.split(' ')[0]}` : 'Acessar Painel'}</span>
              </>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5 text-[#4A6B5D]" />
                <span>Acessar sistema</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onBecomeDonor}
            className="px-4 xl:px-5 py-2 rounded-full bg-[#4A6B5D] text-white font-semibold text-xs xl:text-[13px] hover:bg-[#3A574B] transition-all shadow-sm hover:shadow-md shadow-[#4A6B5D]/25 flex items-center gap-1.5 transform hover:-translate-y-0.5"
          >
            <Heart className="w-3.5 h-3.5 fill-white/25" />
            <span>Quero ser doadora</span>
          </button>

          {/* Menu hamburguer para tablets (sm até lg) onde a barra central fica oculta */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="lg:hidden p-2 rounded-full border border-[#E5DFD6] bg-white hover:bg-[#F4F1EC] text-[#1E242B] transition-colors"
            aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {/* Ações Mobile (< sm) */}
        <div className="flex sm:hidden items-center gap-2">
          <button
            type="button"
            onClick={onBecomeDonor}
            className="px-3.5 py-2 rounded-full bg-[#4A6B5D] text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Heart className="w-3.5 h-3.5 fill-white/25" />
            <span>Quero doar</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="p-2 rounded-full border border-[#E5DFD6] bg-white hover:bg-[#F4F1EC] text-[#1E242B] transition-colors"
            aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Barra sutil de progresso de leitura */}
      <div aria-hidden="true" className="h-[2px] w-full bg-transparent overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#4A6B5D] to-[#6E9483] transition-[width] duration-150 ease-out"
          style={{ width: `${scrollProgress}%`, opacity: scrolled ? 1 : 0 }}
        />
      </div>

      {/* Drawer Responsivo (Mobile e Tablet < lg) */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white/95 backdrop-blur-xl border-t border-[#EFECE6] shadow-xl animate-fadeIn">
          <nav
            aria-label="Navegação institucional móvel"
            className="max-w-7xl mx-auto flex flex-col px-4 sm:px-6 py-4 gap-1"
          >
            {NAV_LINKS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`py-2.5 px-3.5 rounded-xl text-sm transition-colors flex items-center justify-between ${
                    isActive
                      ? 'bg-[#EBF1EE] text-[#3B594C] font-semibold'
                      : 'text-[#1E242B] font-medium hover:bg-[#FAF9F6] hover:text-[#4A6B5D]'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#4A6B5D]" />}
                </a>
              );
            })}

            <div className="mt-3 pt-3 border-t border-[#EFECE6] flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onBecomeDonor();
                }}
                className="w-full sm:flex-1 py-3 rounded-xl bg-[#4A6B5D] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm hover:bg-[#3A574B] transition-colors"
              >
                <Heart className="w-4 h-4 fill-white/25" />
                <span>Quero ser doadora</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onAccessSystem();
                }}
                className="w-full sm:flex-1 py-2.5 rounded-xl bg-[#FAF9F6] text-[#1E242B] font-semibold text-sm border border-[#E5DFD6] flex items-center justify-center gap-2 hover:border-[#4A6B5D]/50 transition-colors"
              >
                {isAuthenticated ? (
                  <>
                    <LayoutDashboard className="w-4 h-4 text-[#4A6B5D]" />
                    <span>Acessar Meu Painel</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 text-[#4A6B5D]" />
                    <span>Acessar sistema</span>
                  </>
                )}
              </button>
            </div>

            <div className="pt-3 flex items-center justify-center gap-2 text-xs text-[#6E7781]">
              <Phone className="w-3.5 h-3.5 text-[#4A6B5D]" />
              <span>Banco de Leite de Marília: (14) 3413-8696 · Disque Saúde 136</span>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
