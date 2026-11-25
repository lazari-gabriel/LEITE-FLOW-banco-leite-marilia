import React from 'react';
import { Heart, ShieldCheck, Clock, ArrowRight } from 'lucide-react';

interface BecomeDonorCtaSectionProps {
  onBecomeDonor: () => void;
}

export const BecomeDonorCtaSection: React.FC<BecomeDonorCtaSectionProps> = ({
  onBecomeDonor,
}) => {
  return (
    <section className="py-14 sm:py-20 bg-white border-t border-[#EFECE6]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-[#EBF1EE] border border-[#4A6B5D]/20 p-7 sm:p-12 text-center space-y-6 shadow-sm">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/50 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -left-20 w-64 h-64 rounded-full bg-[#4A6B5D]/10 blur-3xl"
          />

          <div className="relative z-10 max-w-2xl mx-auto space-y-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-[#4A6B5D]">
              <Heart className="w-3.5 h-3.5 fill-[#4A6B5D]/20" />
              Manifeste seu interesse
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-normal text-[#1E242B] leading-tight">
              Está amamentando e gostaria de ajudar?
            </h2>
            <p className="text-sm sm:text-base text-[#1E242B]/80 leading-relaxed">
              Preencher o formulário leva menos de dois minutos e não exige envio de exames neste
              momento. Você informa seus dados de contato e nossa equipe retorna com calma para
              tirar dúvidas e orientar cada etapa.
            </p>
          </div>

          <div className="relative z-10 flex flex-col items-center gap-4">
            <button
              type="button"
              onClick={onBecomeDonor}
              className="px-8 py-4 rounded-full bg-[#4A6B5D] text-white font-semibold text-base hover:bg-[#3d594d] transition-all shadow-lg shadow-[#4A6B5D]/25 inline-flex items-center gap-2.5 transform hover:-translate-y-0.5"
            >
              <Heart className="w-5 h-5 fill-white/25" />
              <span>Quero ser doadora</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[#1E242B]/70">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#4A6B5D]" />
                Atendimento gratuito
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#4A6B5D]" />
                Dados protegidos conforme a LGPD
              </span>
              <span>Avaliação clínica conduzida pela equipe do BLH</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
