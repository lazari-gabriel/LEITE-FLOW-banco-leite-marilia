import React from 'react';
import { ShieldCheck, Layers, HeartHandshake, Stethoscope } from 'lucide-react';

const PROJECT_PILLARS = [
  {
    icon: Layers,
    title: 'Processos integrados em um só lugar',
    desc: 'Reúne captação, cadastro de doadoras, planejamento de coletas, laboratório e estoque em um fluxo contínuo, reduzindo registros manuais e retrabalho.',
  },
  {
    icon: ShieldCheck,
    title: 'Rastreabilidade e conformidade',
    desc: 'Permite acompanhar o histórico de cada frasco desde a coleta até a dispensação, apoiando o atendimento às diretrizes da RDC ANVISA nº 171/2006 e da LGPD.',
  },
  {
    icon: HeartHandshake,
    title: 'Mais tempo para o acolhimento humano',
    desc: 'Ao organizar a rotina operacional e logística, a plataforma contribui para que a equipe dedique mais atenção às mães doadoras e às famílias.',
  },
];

export const AboutProjectSection: React.FC = () => {
  return (
    <section
      id="sobre-projeto"
      className="py-14 sm:py-20 bg-white border-b border-[#EFECE6]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          <div className="lg:col-span-6 space-y-5">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#4A6B5D]">
              Tecnologia aplicada à saúde pública
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-normal text-[#1E242B] leading-tight">
              O que é o LEITFLOW e por que ele existe
            </h2>
            <p className="text-sm sm:text-base text-[#1E242B]/80 leading-relaxed">
              A rotina de um Banco de Leite Humano envolve etapas delicadas que exigem organização
              constante: acolher novas interessadas, acompanhar exames sorológicos, planejar visitas
              de coleta, zelar pela cadeia de frio, registrar análises laboratoriais e manter a
              rastreabilidade de cada frasco até o destino final.
            </p>
            <p className="text-sm sm:text-base text-[#1E242B]/80 leading-relaxed">
              O <strong>LEITFLOW</strong> é uma plataforma tecnológica desenvolvida para apoiar a
              equipe do Banco de Leite Humano de Marília na condução dessas rotinas com mais
              clareza, segurança e transparência — conectando organização operacional ao compromisso
              com a saúde neonatal.
            </p>

            <div className="p-4 rounded-2xl bg-[#EBF1EE]/75 border border-[#4A6B5D]/20 flex items-start gap-3 text-xs text-[#1E242B]/85 leading-relaxed">
              <Stethoscope className="w-5 h-5 text-[#4A6B5D] shrink-0 mt-0.5" />
              <span>
                <strong>Ferramenta de apoio, nunca substituição:</strong> todas as decisões
                clínicas, triagens de doadoras, orientações de amamentação e liberações sanitárias
                permanecem sob responsabilidade exclusiva dos profissionais de saúde do serviço.
              </span>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-4">
            {PROJECT_PILLARS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="bg-[#FAF9F6] p-5 sm:p-6 rounded-2xl border border-[#EFECE6] flex items-start gap-4"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#EBF1EE] text-[#4A6B5D] flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-[#1E242B]">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#8C8275] mt-1 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
