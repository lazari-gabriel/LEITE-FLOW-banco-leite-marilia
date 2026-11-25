import React from 'react';
import { ShieldPlus, Heart, Droplets } from 'lucide-react';

const IMPORTANCE_CARDS = [
  {
    icon: ShieldPlus,
    title: 'Proteção imunológica única',
    desc: 'O leite humano contém anticorpos e nutrientes que favorecem o desenvolvimento e auxiliam na proteção de recém-nascidos prematuros ou de baixo peso contra infecções.',
  },
  {
    icon: Heart,
    title: 'Apoio em unidades neonatais',
    desc: 'Quando a mãe ainda não consegue amamentar o próprio bebê internado, o leite humano pasteurizado e prescrito por equipe médica ou de nutrição é uma alternativa segura e gratuita pelo SUS.',
  },
  {
    icon: Droplets,
    title: 'Qualquer quantidade importa',
    desc: 'Para um recém-nascido prematuro, volumes a partir de 1 mL por mamada já fazem diferença. Doar o leite que sobra após amamentar seu bebê ajuda diversas famílias.',
  },
];

export const DonationImportanceSection: React.FC = () => {
  return (
    <section
      id="importancia"
      className="py-14 sm:py-20 bg-[#FAF9F6] border-b border-[#EFECE6]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#4A6B5D]">
            Saúde neonatal
          </span>
          <h2 className="font-display text-2xl sm:text-4xl font-normal text-[#1E242B] mt-1">
            Por que doar leite humano é tão importante?
          </h2>
          <p className="text-sm sm:text-base text-[#8C8275] mt-3 leading-relaxed">
            Segundo o Ministério da Saúde e a Rede Brasileira de Bancos de Leite Humano (rBLH-BR),
            o leite humano doado é um recurso terapêutico insubstituível para bebês prematuros e de
            baixo peso. No Brasil, a comercialização é proibida por lei: toda doação é solidária e
            gratuita.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {IMPORTANCE_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="bg-white p-6 sm:p-7 rounded-3xl border border-[#EFECE6] shadow-sm space-y-4"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#EBF1EE] text-[#4A6B5D] flex items-center justify-center">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-display text-lg font-semibold text-[#1E242B]">
                  {card.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#8C8275] leading-relaxed">{card.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
