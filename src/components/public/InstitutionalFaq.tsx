import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQ_ITEMS = [
  {
    q: 'Quem pode demonstrar interesse em ser doadora?',
    a: 'Toda mulher saudável que está amamentando pode manifestar interesse pelo formulário do site. A confirmação final de aptidão é sempre feita pela equipe do Banco de Leite após o contato e a avaliação dos exames e critérios sanitários.',
  },
  {
    q: 'O que acontece depois que envio o formulário "Quero ser doadora"?',
    a: 'Você recebe um número de protocolo e sua solicitação fica registrada na fila de atendimento do Banco de Leite. O envio não aprova nem agenda a coleta automaticamente: a equipe entra em contato pelo canal e horário escolhidos para tirar dúvidas e combinar os próximos passos.',
  },
  {
    q: 'Como funciona o primeiro contato e a avaliação oficial?',
    a: 'No primeiro contato, profissionais do Banco de Leite explicam todo o processo, verificam se há interesse em prosseguir e orientam sobre o cadastro oficial e os exames de pré-natal ou pós-parto exigidos pelas normas sanitárias.',
  },
  {
    q: 'Doar leite pode fazer faltar leite para o meu próprio bebê?',
    a: 'Não. Segundo a Rede Brasileira de Bancos de Leite Humano (rBLH-BR), a produção de leite responde ao estímulo: quanto mais a mama é esvaziada de forma adequada, mais leite o organismo produz. Doa-se apenas o volume que sobra após amamentar o próprio filho.',
  },
  {
    q: 'Como funciona a coleta e os frascos para armazenamento?',
    a: 'O leite destinado à doação deve ser armazenado em frascos de vidro com tampa plástica devidamente higienizados e esterilizados. A forma de fornecimento dos frascos e a entrega ou coleta domiciliar são combinadas diretamente com a equipe do Banco de Leite de Marília.',
  },
  {
    q: 'Por quanto tempo o leite pode ficar congelado em casa antes de ir ao Banco de Leite?',
    a: 'A Rede Brasileira de Bancos de Leite Humano (rBLH-BR / Ministério da Saúde) orienta manter o leite cru congelado por até 10 dias em casa (a partir da data da primeira ordenha), garantindo margem segura para transporte e pasteurização dentro do limite sanitário de 15 dias previsto na RDC ANVISA nº 171/2006. Siga sempre o prazo informado pela equipe local.',
  },
  {
    q: 'Como meus dados pessoais são protegidos?',
    a: 'O formulário público solicita apenas informações básicas de contato e região, sem dados clínicos sensíveis. O acesso é restrito a profissionais autorizados do serviço, com registro de consentimento e conformidade com a LGPD (Lei nº 13.709/2018).',
  },
  {
    q: 'Como obter mais informações ou tirar dúvidas específicas de saúde?',
    a: 'Dúvidas sobre amamentação, uso de medicamentos ou condições clínicas individuais devem sempre ser esclarecidas diretamente com os profissionais do Banco de Leite Humano de Marília — telefone (14) 3413-8696 — ou pelo Disque Saúde (136). As informações desta página têm caráter educativo e não substituem avaliação profissional.',
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
          <h2 className="font-display text-2xl sm:text-4xl font-normal text-[#1E242B] mt-1">
            Perguntas frequentes
          </h2>
          <p className="text-sm text-[#8C8275] mt-2">
            Principais dúvidas sobre a manifestação de interesse, a doação de leite humano e a
            proteção dos seus dados.
          </p>
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
