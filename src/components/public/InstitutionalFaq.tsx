import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQ_ITEMS = [
  {
    q: 'Doar leite vai fazer faltar leite para o meu próprio bebê?',
    a: 'Não. Quanto mais a mama é estimulada e esvaziada, mais leite o corpo produz. A doação retira apenas o volume excedente que o bebê não mamou.',
  },
  {
    q: 'Preciso pagar pelos frascos de vidro esterilizados?',
    a: 'Não. O Banco de Leite Humano de Marília fornece gratuitamente todos os frascos de vidro com tampa plástica esterilizados e realiza o controle de retorno em cada visita.',
  },
  {
    q: 'Por quanto tempo posso guardar o leite no congelador antes da coleta?',
    a: 'Conforme a RDC 171/2006 da ANVISA, o leite materno cru pode permanecer congelado por até 15 dias a partir da data da primeira ordenha. As rotas do BLH percorrem as 5 zonas de Marília semanalmente.',
  },
  {
    q: 'Como é feita a higienização antes da ordenha?',
    a: 'Lave as mãos e antebraços até os cotovelos com água e sabão neutro, seque em toalha limpa e utilize touca e máscara. Nas mamas, higienize apenas com água limpa. O BLH orienta cada etapa na triagem inicial.',
  },
];

export const InstitutionalFaq: React.FC = () => {
  const [faqOpen, setFaqOpen] = useState<number | null>(0);

  return (
    <section id="duvidas" className="py-14 sm:py-20 bg-[#FAF9F6] border-t border-[#EFECE6]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-12">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#4A6B5D]">
            Esclarecimentos
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-normal text-[#1E242B] mt-1">
            Perguntas Frequentes
          </h2>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {FAQ_ITEMS.map((faq, idx) => {
            const isOpen = faqOpen === idx;
            return (
              <div
                key={faq.q}
                className="bg-white rounded-2xl border border-[#EFECE6] overflow-hidden"
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setFaqOpen(isOpen ? null : idx)}
                  className="w-full px-5 sm:px-6 py-4 sm:py-5 text-left flex justify-between items-center gap-4 hover:bg-[#FAF9F6] transition-colors"
                >
                  <span className="font-display font-medium text-sm sm:text-base text-[#1E242B]">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-[#8C8275] flex-shrink-0 transition-transform ${
                      isOpen ? 'rotate-180 text-[#4A6B5D]' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 sm:px-6 pb-4 sm:pb-5 text-sm text-[#8C8275] leading-relaxed border-t border-[#EFECE6] pt-3 sm:pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
