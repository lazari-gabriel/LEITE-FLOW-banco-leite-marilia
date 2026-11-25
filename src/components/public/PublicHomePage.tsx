import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  Truck,
  ShieldCheck,
  MapPin,
  Phone,
  ClipboardList,
  PhoneCall,
  Stethoscope,
  PackageCheck,
  Sparkles,
  CheckCircle2,
  FileText,
  Building2,
  Droplet,
  Clock,
  ChevronRight,
  FlaskConical,
} from 'lucide-react';
import { useAuth, getDefaultRouteForRole } from '../../context/AuthContext';
import { ZONAS_SEMANA } from '../../constants/zones';
import { PublicHeader } from './PublicHeader';
import { BottleExplodedScroll } from './BottleExplodedScroll';
import { AboutProjectSection } from './AboutProjectSection';
import { DonationImportanceSection } from './DonationImportanceSection';
import { ImpactCalculator } from './ImpactCalculator';
import { PlatformFeaturesSection } from './PlatformFeaturesSection';
import { BecomeDonorCtaSection } from './BecomeDonorCtaSection';
import { InstitutionalFaq } from './InstitutionalFaq';
import { PublicFooter } from './PublicFooter';

const DONATION_STEPS = [
  {
    num: '01',
    icon: ClipboardList,
    title: 'Manifestação de interesse',
    desc: 'Você preenche o formulário "Quero ser doadora" com seus dados de contato e bairro, sem necessidade de enviar exames ou informações clínicas nesta etapa.',
  },
  {
    num: '02',
    icon: PhoneCall,
    title: 'Primeiro contato da equipe',
    desc: 'Profissionais do Banco de Leite entram em contato pelo canal e horário escolhidos para tirar dúvidas e explicar o funcionamento do serviço.',
  },
  {
    num: '03',
    icon: Stethoscope,
    title: 'Cadastro oficial e avaliação',
    desc: 'Caso deseje prosseguir, a equipe realiza o cadastro oficial e avalia o histórico de saúde e os exames do pré-natal ou pós-parto conforme protocolos sanitários.',
  },
  {
    num: '04',
    icon: PackageCheck,
    title: 'Orientações de armazenamento',
    desc: 'A doadora recebe orientações detalhadas de higienização, ordenha e conservação segura do leite, além dos frascos adequados conforme a rotina do serviço.',
  },
  {
    num: '05',
    icon: Truck,
    title: 'Entrega ou coleta agendada',
    desc: 'O leite congelado é encaminhado ao Banco de Leite conforme a logística combinada com a equipe (entrega na unidade ou coleta domiciliar nas regiões atendidas).',
  },
  {
    num: '06',
    icon: FlaskConical,
    title: 'Processamento e destinação',
    desc: 'No Banco de Leite, o leite passa por análises de qualidade, pasteurização e controle microbiológico antes de ser liberado mediante prescrição para recém-nascidos.',
  },
];

const HEALTH_CRITERIA = [
  {
    icon: CheckCircle2,
    title: 'Mulher saudável em amamentação',
    desc: 'Estar amamentando e possuir leite além da necessidade do próprio bebê. Mesmo pequenos volumes contribuem para a nutrição de recém-nascidos.',
  },
  {
    icon: ShieldCheck,
    title: 'Cuidados com hábitos e medicações',
    desc: 'Não fumar, não consumir bebidas alcoólicas ou substâncias ilícitas e não utilizar medicamentos contraindicados para a amamentação.',
  },
  {
    icon: FileText,
    title: 'Avaliação clínica e exames',
    desc: 'Apresentar exames do pré-natal ou pós-parto para análise da equipe do Banco de Leite. A confirmação final de aptidão é sempre realizada por profissionais de saúde.',
  },
];

export const PublicHomePage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const handleAccessSystem = () => {
    if (isAuthenticated && user) {
      navigate(getDefaultRouteForRole(user.role));
    } else {
      navigate('/login');
    }
  };

  const handleBecomeDonor = () => {
    navigate('/quero-doar');
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1E242B] font-sans antialiased selection:bg-[#4A6B5D] selection:text-white">
      <PublicHeader
        isAuthenticated={isAuthenticated}
        userName={user?.name}
        onAccessSystem={handleAccessSystem}
        onBecomeDonor={handleBecomeDonor}
      />

      {/* 1. PALCO 3D INTERATIVO + 4 PILARES */}
      <BottleExplodedScroll
        isAuthenticated={isAuthenticated}
        onAccessSystem={handleAccessSystem}
        onBecomeDonor={handleBecomeDonor}
      />

      {/* 2. HERO INSTITUCIONAL */}
      <section className="relative overflow-hidden pt-10 pb-16 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28 border-b border-[#EFECE6]">
        <div
          aria-hidden="true"
          className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-[#EBF1EE] rounded-full blur-3xl opacity-60 pointer-events-none -z-10 translate-x-1/3 -translate-y-1/3"
        />
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 w-56 sm:w-80 h-56 sm:h-80 bg-[#EFECE6] rounded-full blur-3xl opacity-70 pointer-events-none -z-10 -translate-x-1/3 translate-y-1/3"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Texto Principal */}
            <div className="lg:col-span-7 flex flex-col items-start space-y-5 sm:space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EBF1EE] text-[#4A6B5D] text-xs font-semibold tracking-wide uppercase border border-[#4A6B5D]/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Plataforma de apoio ao Banco de Leite Humano · Marília – SP</span>
              </div>

              <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl font-normal leading-[1.15] text-[#1E242B] tracking-tight">
                Doação de leite humano com{' '}
                <span className="italic font-light underline decoration-[#D4A373] decoration-2 underline-offset-4">
                  acolhimento
                </span>
                , organização e segurança.
              </h2>

              <p className="text-base sm:text-lg text-[#1E242B]/75 leading-relaxed max-w-2xl">
                O <strong>LEITFLOW</strong> apoia a gestão logística, o acompanhamento de doadoras e
                a rastreabilidade de frascos do <strong>Banco de Leite Humano de Marília</strong> —
                conectando o gesto solidário de quem doa ao cuidado técnico prestado pelos
                profissionais de saúde.
              </p>

              {/* CTAs: Quero ser doadora + Como funciona */}
              <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleBecomeDonor}
                  className="px-8 py-4 rounded-full bg-[#4A6B5D] text-white font-semibold text-base hover:bg-[#3d594d] transition-all shadow-lg shadow-[#4A6B5D]/25 flex items-center justify-center gap-3 transform hover:-translate-y-0.5"
                >
                  <Heart className="w-5 h-5 fill-white/25" />
                  <span>Quero ser doadora</span>
                </button>

                <a
                  href="#como-funciona"
                  className="px-6 py-4 rounded-full bg-[#EFECE6] text-[#1E242B] font-medium text-base hover:bg-[#e4ded6] transition-all flex items-center justify-center gap-2 border border-[#8C8275]/20"
                >
                  <span>Como funciona a doação</span>
                  <ChevronRight className="w-4 h-4 text-[#8C8275]" />
                </a>
              </div>

              <div className="pt-4 border-t border-[#EFECE6] w-full grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#8C8275]">
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-[#4A6B5D] flex-shrink-0" />
                  <span>
                    <strong>BLH Marília:</strong> Rua XV de Novembro, nº 50
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-[#4A6B5D] flex-shrink-0" />
                  <span>
                    <strong>Atendimento:</strong> (14) 3413-8696 · Seg a sex, 7h30–17h
                  </span>
                </div>
              </div>
            </div>

            {/* Card de Referência Neonatal (Embasado na rBLH-BR / MS) */}
            <div className="lg:col-span-5">
              <div className="relative bg-[#EFECE6] rounded-3xl p-5 sm:p-8 border border-[#8C8275]/20 shadow-xl overflow-hidden">
                <div
                  aria-hidden="true"
                  className="absolute -top-12 -right-12 w-40 h-40 bg-[#4A6B5D]/10 rounded-full blur-xl pointer-events-none"
                />
                <div className="flex flex-col items-center text-center p-5 sm:p-6 bg-white/85 backdrop-blur-sm rounded-2xl border border-[#FAF9F6] shadow-sm">
                  <div className="w-20 sm:w-24 h-20 sm:h-24 rounded-full bg-[#EBF1EE] p-3 flex items-center justify-center shadow-inner mb-4">
                    <Droplet className="w-10 sm:w-12 h-10 sm:h-12 text-[#4A6B5D] fill-[#4A6B5D]/20" />
                  </div>
                  <span className="font-display text-xl sm:text-2xl font-semibold text-[#1E242B]">
                    1 litro de leite humano
                  </span>
                  <p className="text-xs text-[#8C8275] uppercase tracking-widest mt-1">
                    Pode alimentar
                  </p>
                  <div className="my-2">
                    <span className="font-display text-3xl sm:text-4xl font-bold text-[#4A6B5D]">
                      Até 10 bebês
                    </span>
                  </div>
                  <p className="text-xs text-[#1E242B]/80 max-w-xs leading-relaxed">
                    Segundo o Ministério da Saúde e a rBLH-BR, 1 litro de leite doado pode atender
                    até 10 recém-nascidos prematuros ou de baixo peso por dia, conforme prescrição
                    clínica.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-white/70 p-3.5 rounded-xl border border-white/80 text-center">
                    <span className="block text-lg font-bold text-[#1E242B]">Gratuito</span>
                    <span className="text-[11px] text-[#8C8275]">Doação e atendimento (SUS)</span>
                  </div>
                  <div className="bg-white/70 p-3.5 rounded-xl border border-white/80 text-center">
                    <span className="block text-lg font-bold text-[#4A6B5D]">RDC 171/2006</span>
                    <span className="text-[11px] text-[#8C8275]">Referência sanitária ANVISA</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-[#8C8275]/15 flex items-center justify-between gap-2 text-[11px] text-[#8C8275]">
                  <span>Proteção de dados</span>
                  <span className="font-semibold text-[#1E242B]">LGPD · Lei nº 13.709/2018</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SOBRE O PROJETO LEITFLOW */}
      <AboutProjectSection />

      {/* 4. IMPORTÂNCIA DA DOAÇÃO DE LEITE HUMANO */}
      <DonationImportanceSection />

      {/* 5. COMO FUNCIONA A DOAÇÃO (6 PASSOS HUMANOS) */}
      <section id="como-funciona" className="py-14 sm:py-20 bg-white border-b border-[#EFECE6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#4A6B5D]">
              Passo a passo para doar
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-normal text-[#1E242B] mt-1">
              Como funciona o processo de doação
            </h2>
            <p className="text-sm sm:text-base text-[#8C8275] mt-3 leading-relaxed">
              Todo o acompanhamento é gratuito e conduzido pela equipe do Banco de Leite Humano, com
              orientações claras em cada fase.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {DONATION_STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className="bg-[#FAF9F6] p-5 sm:p-6 rounded-2xl border border-[#EFECE6] shadow-sm hover:shadow-md transition-all flex flex-col group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-display text-3xl font-bold text-[#4A6B5D]/30 group-hover:text-[#4A6B5D] transition-colors">
                      {step.num}
                    </span>
                    <div className="w-10 h-10 rounded-full bg-[#EBF1EE] flex items-center justify-center text-[#4A6B5D]">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="font-display text-lg font-semibold text-[#1E242B] mb-2">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#8C8275] leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. QUEM PODE DOAR */}
      <section id="requisitos" className="py-14 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#4A6B5D]">
              Orientações iniciais
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-normal text-[#1E242B] mt-1">
              Quem pode demonstrar interesse em doar?
            </h2>
            <p className="text-sm text-[#8C8275] mt-2 leading-relaxed">
              De acordo com o Ministério da Saúde e a Rede Brasileira de Bancos de Leite Humano
              (rBLH-BR), toda mulher saudável que está amamentando pode se candidatar à doação.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {HEALTH_CRITERIA.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="bg-[#FAF9F6] p-6 sm:p-7 rounded-3xl border border-[#EFECE6]"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#EBF1EE] text-[#4A6B5D] flex items-center justify-center mb-5">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-[#1E242B] mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#8C8275] leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. REFERÊNCIA EDUCATIVA (SIMULADOR COERENTE) */}
      <ImpactCalculator />

      {/* 8. FUNCIONALIDADES DA PLATAFORMA LEITFLOW */}
      <PlatformFeaturesSection />

      {/* 9. PLANEJAMENTO REGIONAL EM MARÍLIA */}
      <section
        id="coleta-marilia"
        className="py-12 sm:py-16 bg-[#EFECE6] border-y border-[#8C8275]/20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 items-center">
            <div className="lg:col-span-5 space-y-4">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#4A6B5D]">
                Organização regional
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-normal text-[#1E242B]">
                Planejamento de rotas por região em Marília
              </h2>
              <p className="text-sm text-[#1E242B]/80 leading-relaxed">
                Para facilitar a rotina das doadoras cadastradas, o sistema organiza o planejamento
                de atendimentos por regiões do município. A disponibilidade de coleta domiciliar, os
                dias de visita e os horários são confirmados diretamente pela equipe do Banco de
                Leite após o cadastro oficial.
              </p>
              <div className="p-4 rounded-2xl bg-white/80 border border-white text-xs text-[#1E242B] space-y-1.5">
                <div className="font-semibold text-[#4A6B5D] flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  <span>Banco de Leite Humano de Marília</span>
                </div>
                <p className="text-[#8C8275]">Rua XV de Novembro, nº 50 — Marília – SP</p>
                <p className="text-[#8C8275]">
                  Telefone: (14) 3413-8696 · Segunda a sexta-feira, das 7h30 às 17h
                </p>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ZONAS_SEMANA.map((item) => (
                  <div
                    key={item.zona}
                    className="bg-white p-4 sm:p-5 rounded-2xl border border-white shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm text-[#1E242B]">
                          Zona {item.zona}
                        </span>
                        <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#EBF1EE] text-[#4A6B5D]">
                          Região mapeada
                        </span>
                      </div>
                      <p className="text-xs text-[#8C8275] mb-3">{item.desc}</p>
                    </div>
                    <div className="pt-2 border-t border-[#EFECE6] flex items-center gap-1.5 text-[11px] font-medium text-[#4A6B5D]">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Referência: {item.dia}-feira*</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-[#8C8275] px-1">
                *Cronograma de referência sujeito à programação semanal e disponibilidade da equipe
                do Banco de Leite Humano de Marília.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 10. CONVITE EMPÁTICO QUERO SER DOADORA */}
      <BecomeDonorCtaSection onBecomeDonor={handleBecomeDonor} />

      {/* 11. PERGUNTAS FREQUENTES */}
      <InstitutionalFaq />

      {/* 12. RODAPÉ INSTITUCIONAL */}
      <PublicFooter
        isAuthenticated={isAuthenticated}
        onAccessSystem={handleAccessSystem}
        onBecomeDonor={handleBecomeDonor}
      />
    </div>
  );
};
