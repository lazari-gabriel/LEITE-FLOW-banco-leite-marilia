import React from 'react';
import {
  HeartHandshake,
  UserCheck,
  Route,
  Barcode,
  FlaskConical,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

const IMPLEMENTED_MODULES = [
  {
    icon: HeartHandshake,
    title: 'Captação digital de interessadas',
    desc: 'Recebimento de manifestações de interesse pelo site com consentimento LGPD, fila interna de atendimento, registro de contatos e conversão integrada ao cadastro oficial.',
  },
  {
    icon: UserCheck,
    title: 'Gestão de doadoras e triagem clínica',
    desc: 'Cadastro com validação de Cartão SUS e CPF, controle de duplicidade, acompanhamento de sorologias em padrão seguro (pendente até confirmação) e critérios da RDC 171/2006.',
  },
  {
    icon: Route,
    title: 'Roteirização e controle de coletas',
    desc: 'Organização de rotas por região, otimização de percurso, visualização em mapa interativo e registro de coletas recorrentes com múltiplos frascos por visita.',
  },
  {
    icon: Barcode,
    title: 'Etiquetagem e rastreabilidade',
    desc: 'Geração de etiquetas com código de barras Code 128, QR Code sem exposição de dados pessoais e formato térmico, acompanhando cada frasco da origem ao destino.',
  },
  {
    icon: FlaskConical,
    title: 'Processamento laboratorial e estoque',
    desc: 'Registro de acidez Dornic, crematócrito, controle microbiológico, liberação de pasteurização, dispensação para unidades neonatais e controle de frascos de vidro.',
  },
  {
    icon: ShieldCheck,
    title: 'Painel operacional, perfis e auditoria',
    desc: 'Indicadores reais de acompanhamento, controle de acesso por perfil (administração, coordenação, coleta externa e laboratório), proteção LGPD e trilha de auditoria.',
  },
];

const PLANNED_EVOLUTIONS = [
  'Notificações automatizadas futuras por WhatsApp ou e-mail para lembretes de coleta e acompanhamento.',
  'Exportação ampliada de relatórios gerenciais periódicos para consolidação de indicadores da rede.',
];

export const PlatformFeaturesSection: React.FC = () => {
  return (
    <section
      id="plataforma"
      className="py-14 sm:py-20 bg-white border-t border-[#EFECE6]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#4A6B5D]">
            Módulos do sistema
          </span>
          <h2 className="font-display text-2xl sm:text-4xl font-normal text-[#1E242B] mt-1">
            Recursos disponíveis na plataforma LEITFLOW
          </h2>
          <p className="text-sm sm:text-base text-[#8C8275] mt-3 leading-relaxed">
            Desenvolvida para apoiar cada perfil da equipe técnica com segurança, rastreabilidade e
            controle de acesso.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {IMPLEMENTED_MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.title}
                className="bg-[#FAF9F6] p-6 rounded-2xl border border-[#EFECE6] hover:border-[#4A6B5D]/30 transition-all flex flex-col gap-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-[#EBF1EE] text-[#4A6B5D] flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#EBF1EE] text-[#4A6B5D]">
                    Disponível
                  </span>
                </div>
                <h3 className="font-display text-lg font-semibold text-[#1E242B]">{mod.title}</h3>
                <p className="text-xs sm:text-sm text-[#8C8275] leading-relaxed">{mod.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Transparência: evoluções planejadas claramente separadas */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#FAF9F6] border border-dashed border-[#8C8275]/35 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#4A6B5D]">
              <Sparkles className="w-3.5 h-3.5" />
              Evoluções planejadas para próximas fases
            </span>
            <ul className="space-y-1 text-xs sm:text-sm text-[#8C8275] list-disc pl-5">
              {PLANNED_EVOLUTIONS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <span className="text-[11px] font-medium text-[#8C8275] bg-white px-3.5 py-2 rounded-xl border border-[#EFECE6] shrink-0">
            Área operacional restrita à equipe credenciada
          </span>
        </div>
      </div>
    </section>
  );
};
