import React, { useState } from 'react';
import { Menu, X, LogIn, LayoutDashboard } from 'lucide-react';
import { InstitutionalLogo } from './InstitutionalLogo';

interface PublicHeaderProps {
  isAuthenticated: boolean;
  userName?: string;
  onAccessSystem: () => void;
}

const NAV_LINKS = [
  { href: '#como-funciona', label: 'Como Funciona' },
  { href: '#coleta-marilia', label: 'Coleta em Marília' },
  { href: '#requisitos', label: 'Quem Pode Doar' },
  { href: '#calculadora', label: 'Impacto' },
  { href: '#duvidas', label: 'Dúvidas' },
];

export const PublicHeader: React.FC<PublicHeaderProps> = ({
  isAuthenticated,
  userName,
  onAccessSystem,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-[#EFECE6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
        <a
          href="#historia-leiteflow"
          aria-label="Início LEITFLOW"
          className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4A6B5D] rounded-lg"
        >
          <InstitutionalLogo size="md" />
        </a>

        {/* Desktop Nav */}
        <nav
          aria-label="Navegação institucional"
          className="hidden lg:flex items-center gap-6 xl:gap-8 text-sm font-medium text-[#1E242B]/80"
        >
          {NAV_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="hover:text-[#4A6B5D] transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={onAccessSystem}
              className="px-5 py-2.5 rounded-full bg-[#4A6B5D] text-white font-semibold text-sm hover:bg-[#3d594d] transition-all shadow-md shadow-[#4A6B5D]/20 flex items-center gap-2 transform hover:-translate-y-0.5"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>{userName ? `Painel · ${userName.split(' ')[0]}` : 'Acessar Painel'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onAccessSystem}
              className="px-5 py-2.5 rounded-full bg-[#4A6B5D] text-white font-semibold text-sm hover:bg-[#3d594d] transition-all shadow-md shadow-[#4A6B5D]/20 flex items-center gap-2 transform hover:-translate-y-0.5"
            >
              <LogIn className="w-4 h-4" />
              <span>Acessar sistema</span>
            </button>
          )}
        </div>

        {/* Mobile Actions */}
        <div className="flex sm:hidden items-center gap-2">
          <button
            type="button"
            onClick={onAccessSystem}
            className="px-3.5 py-2 rounded-full bg-[#4A6B5D] text-white font-semibold text-xs flex items-center gap-1.5 shadow-md"
          >
            {isAuthenticated ? (
              <>
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Painel</span>
              </>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5" />
                <span>Acessar</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="p-2 rounded-xl hover:bg-[#EFECE6] text-[#1E242B] transition-colors"
            aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-white border-t border-[#EFECE6] shadow-lg animate-fadeIn">
          <nav aria-label="Navegação institucional móvel" className="flex flex-col px-4 py-3 gap-1">
            {NAV_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="py-3 px-2 text-sm font-medium text-[#1E242B] hover:text-[#4A6B5D] border-b border-[#EFECE6] last:border-0 transition-colors"
              >
                {item.label}
              </a>
            ))}
            <div className="pt-3 pb-1">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onAccessSystem();
                }}
                className="w-full py-3 rounded-xl bg-[#4A6B5D] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm"
              >
                {isAuthenticated ? (
                  <>
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Acessar Meu Painel</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Acessar sistema</span>
                  </>
                )}
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
