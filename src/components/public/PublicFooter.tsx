import React from 'react';
import { MapPin, Phone, Building2, LogIn, LayoutDashboard } from 'lucide-react';
import { InstitutionalLogo } from './InstitutionalLogo';
import { LEITE_FLOW } from '../../constants/blh';

interface PublicFooterProps {
  isAuthenticated: boolean;
  onAccessSystem: () => void;
}

export const PublicFooter: React.FC<PublicFooterProps> = ({
  isAuthenticated,
  onAccessSystem,
}) => {
  return (
    <footer className="bg-[#1E242B] text-white pt-12 sm:pt-16 pb-10 sm:pb-12 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-10 pb-10 border-b border-stone-800">
          <div className="md:col-span-5 space-y-4">
            <InstitutionalLogo variant="dark" size="md" />
            <p className="text-xs text-stone-400 leading-relaxed max-w-sm mt-3">
              Plataforma institucional de gestão logística, clínica e rastreabilidade do Banco de
              Leite Humano de Marília (HCFAMEMA / {LEITE_FLOW.hospitalName}).
            </p>
          </div>

          <div className="md:col-span-4 space-y-3">
            <h4 className="font-display text-sm font-semibold text-[#D4A373]">
              Banco de Leite Humano de Marília
            </h4>
            <ul className="space-y-2 text-xs text-stone-300">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#4A6B5D] flex-shrink-0 mt-0.5" />
                <span>{LEITE_FLOW.address}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#4A6B5D] flex-shrink-0" />
                <span>{LEITE_FLOW.phone} · BLH Marília (14) 3413-8696</span>
              </li>
              <li className="flex items-start gap-2">
                <Building2 className="w-4 h-4 text-[#4A6B5D] flex-shrink-0 mt-0.5" />
                <span>Vinculado ao HCFAMEMA · Conformidade ANVISA RDC 171/2006 &amp; LGPD</span>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h4 className="font-display text-sm font-semibold text-[#D4A373]">
              Acesso Profissional
            </h4>
            <div className="flex flex-col space-y-2.5 text-xs text-stone-300">
              <a href="#como-funciona" className="hover:text-emerald-400 transition-colors">
                Como Funciona
              </a>
              <a href="#coleta-marilia" className="hover:text-emerald-400 transition-colors">
                Rotas de Coleta em Marília
              </a>
              <a href="#requisitos" className="hover:text-emerald-400 transition-colors">
                Critérios de Doação
              </a>
              <button
                type="button"
                onClick={onAccessSystem}
                className="inline-flex items-center gap-2 text-left font-semibold text-emerald-300 hover:text-emerald-200 transition-colors pt-1"
              >
                {isAuthenticated ? (
                  <>
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>Acessar Meu Painel</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Acessar sistema</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <span>
            &copy; {new Date().getFullYear()} LEITFLOW — Banco de Leite Humano de Marília-SP. Todos
            os direitos reservados.
          </span>
          <span className="text-[11px] text-stone-400">
            Área operacional restrita a profissionais credenciados
          </span>
        </div>
      </div>
    </footer>
  );
};
