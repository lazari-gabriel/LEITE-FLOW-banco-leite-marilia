import React from 'react';
import { MapPin, Phone, Building2, LogIn, LayoutDashboard, Heart, Mail, Clock } from 'lucide-react';
import { InstitutionalLogo } from './InstitutionalLogo';

interface PublicFooterProps {
  isAuthenticated: boolean;
  onAccessSystem: () => void;
  onBecomeDonor: () => void;
}

export const PublicFooter: React.FC<PublicFooterProps> = ({
  isAuthenticated,
  onAccessSystem,
  onBecomeDonor,
}) => {
  return (
    <footer className="bg-[#1E242B] text-white pt-12 sm:pt-16 pb-10 sm:pb-12 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 sm:gap-10 pb-10 border-b border-stone-800">
          {/* Identidade do Projeto */}
          <div className="md:col-span-4 space-y-4">
            <InstitutionalLogo variant="dark" size="md" />
            <p className="text-xs text-stone-400 leading-relaxed max-w-sm mt-3">
              <strong>LEITFLOW</strong> — Plataforma tecnológica desenvolvida para apoiar a gestão
              logística, o acompanhamento de doadoras e a rastreabilidade do Banco de Leite Humano
              de Marília – SP.
            </p>
          </div>

          {/* Referência de Atendimento BLH Marília */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="font-display text-sm font-semibold text-[#D4A373]">
              Banco de Leite Humano de Marília
            </h4>
            <ul className="space-y-2 text-xs text-stone-300">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#4A6B5D] flex-shrink-0 mt-0.5" />
                <span>Rua XV de Novembro, nº 50 — Marília – SP</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#4A6B5D] flex-shrink-0" />
                <span>(14) 3413-8696 · Disque Saúde 136</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#4A6B5D] flex-shrink-0" />
                <span>bancodeleite@marilia.sp.gov.br</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#4A6B5D] flex-shrink-0" />
                <span>Segunda a sexta-feira, das 7h30 às 17h</span>
              </li>
              <li className="flex items-start gap-2">
                <Building2 className="w-4 h-4 text-[#4A6B5D] flex-shrink-0 mt-0.5" />
                <span>Secretaria Municipal da Saúde de Marília · Referência RDC 171/2006 e LGPD</span>
              </li>
            </ul>
          </div>

          {/* Navegação separada: Doadoras vs Equipe */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="font-display text-sm font-semibold text-[#D4A373]">
              Para quem deseja doar
            </h4>
            <div className="flex flex-col space-y-2 text-xs text-stone-300">
              <a href="#sobre-projeto" className="hover:text-emerald-400 transition-colors">
                Sobre o LEITFLOW
              </a>
              <a href="#como-funciona" className="hover:text-emerald-400 transition-colors">
                Como funciona a doação
              </a>
              <a href="#requisitos" className="hover:text-emerald-400 transition-colors">
                Quem pode doar
              </a>
              <a href="#duvidas" className="hover:text-emerald-400 transition-colors">
                Perguntas frequentes
              </a>
              <button
                type="button"
                onClick={onBecomeDonor}
                className="inline-flex items-center gap-1.5 text-left font-semibold text-[#D4A373] hover:text-amber-200 transition-colors pt-1"
              >
                <Heart className="w-3.5 h-3.5" />
                <span>Quero ser doadora</span>
              </button>
            </div>
          </div>

          <div className="md:col-span-2 space-y-3">
            <h4 className="font-display text-sm font-semibold text-[#D4A373]">
              Para a equipe
            </h4>
            <div className="flex flex-col space-y-2 text-xs text-stone-300">
              <a href="#plataforma" className="hover:text-emerald-400 transition-colors">
                Recursos da plataforma
              </a>
              <a href="#coleta-marilia" className="hover:text-emerald-400 transition-colors">
                Regiões em Marília
              </a>
              <button
                type="button"
                onClick={onAccessSystem}
                className="inline-flex items-center gap-1.5 text-left font-semibold text-emerald-300 hover:text-emerald-200 transition-colors pt-1"
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
            &copy; {new Date().getFullYear()} LEITFLOW — Apoio à gestão do Banco de Leite Humano de
            Marília – SP.
          </span>
          <span className="text-[11px] text-stone-400">
            Área operacional restrita a profissionais credenciados · Conteúdo informativo não
            substitui avaliação clínica
          </span>
        </div>
      </div>
    </footer>
  );
};
