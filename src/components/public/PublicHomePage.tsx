import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  Truck,
  ShieldCheck,
  MapPin,
  Phone,
  User,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  FileText,
  Building2,
  Droplet,
  Clock,
  LogIn,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth, getDefaultRouteForRole } from '../../context/AuthContext';
import { LEITE_FLOW } from '../../constants/blh';
import { ZONAS_SEMANA } from '../../constants/zones';
import { PublicHeader } from './PublicHeader';
import { BottleExplodedScroll } from './BottleExplodedScroll';
import { ImpactCalculator } from './ImpactCalculator';
import { InstitutionalFaq } from './InstitutionalFaq';
import { PublicFooter } from './PublicFooter';

const WORKFLOW_STEPS = [
  {
    num: '01',
    icon: User,
    title: 'Triagem Clínica & Sorologias',
    desc: 'A equipe de enfermagem valida histórico clínico e exames do pré-natal ou pós-parto com protocolo Go/No-Go.',
  },
  {
    num: '02',
    icon: Heart,
    title: 'Entrega de Kits Estéreis',
    desc: 'Frascos de vidro esterilizados com tampa plástica são entregues na residência com controle patrimonial de retorno.',
  },
  {
    num: '03',
    icon: Droplet,
    title: 'Coleta & Cadeia de Frio',
    desc: 'Rotas semanais organizadas por zona em Marília com conferência de temperatura e etiquetas Code 128 + QR Code.',
  },
  {
    num: '04',
    icon: Truck,
    title: 'Pasteurização & UTI Neonatal',
    desc: 'Controle de acidez Dornic, crematócrito, microbiologia e rastreabilidade completa até a dispensação na UTI.',
  },
];

const HEALTH_CRITERIA = [
  {
    icon: CheckCircle2,
    title: 'Amamentação Saudável',
    desc: 'Estar amamentando o próprio filho com boa produção e apresentar excedente de leite materno de forma confortável.',
  },
  {
    icon: ShieldCheck,
    title: 'Hábitos Saudáveis',
    desc: 'Não fazer uso de medicamentos incompatíveis com a amamentação, não consumir bebidas alcoólicas e não ser fumante.',
  },
  {
    icon: FileText,
    title: 'Exames Atualizados',
    desc: 'Apresentar cartão de gestante ou laudos sorológicos recentes (HIV, Sífilis, Hepatite B/C) avaliados pelo BLH.',
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

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1E242B] font-sans antialiased selection:bg-[#4A6B5D] selection:text-white">
      <PublicHeader
        isAuthenticated={isAuthenticated}
        userName={user?.name}
        onAccessSystem={handleAccessSystem}
      />

      {/* 3D CINEMATIC SCROLL-VIDEO HERO */}
      <BottleExplodedScroll
        isAuthenticated={isAuthenticated}
        onAccessSystem={handleAccessSystem}
      />

      {/* INSTITUTIONAL HERO SECTION */}
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
            {/* Hero Text */}
            <div className="lg:col-span-7 flex flex-col items-start space-y-5 sm:space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EBF1EE] text-[#4A6B5D] text-xs font-semibold tracking-wide uppercase border border-[#4A6B5D]/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Gestão Logística, Clínica e Rastreabilidade · Marília-SP</span>
              </div>

              <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl font-normal leading-[1.15] text-[#1E242B] tracking-tight">
                Seu excedente de leite é o{' '}
                <span className="italic font-light underline decoration-[#D4A373] decoration-2 underline-offset-4">
                  recomeço
                </span>{' '}
                de uma vida recém-nascida.
              </h2>

              <p className="text-base sm:text-lg text-[#1E242B]/75 leading-relaxed max-w-2xl">
                O <strong>LEITFLOW</strong> integra a gestão operacional do{' '}
                <strong>Banco de Leite Humano de Marília</strong> (HCFAMEMA /{' '}
                {LEITE_FLOW.hospitalName}), conectando triagem clínica, coleta domiciliar gratuita
                em frascos esterilizados, processamento laboratorial e dispensação segura à UTI
                Neonatal.
              </p>

              {/* Primary CTA: Acessar sistema */}
              <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleAccessSystem}
                  className="px-8 py-4 rounded-full bg-[#4A6B5D] text-white font-medium text-base hover:bg-[#3d594d] transition-all shadow-lg shadow-[#4A6B5D]/25 flex items-center justify-center gap-3 transform hover:-translate-y-0.5"
                >
                  {isAuthenticated ? (
                    <>
                      <LayoutDashboard className="w-5 h-5" />
                      <span>Acessar Meu Painel</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      <span>Acessar sistema</span>
                    </>
                  )}
                </button>

                <a
                  href="#como-funciona"
                  className="px-6 py-4 rounded-full bg-[#EFECE6] text-[#1E242B] font-medium text-base hover:bg-[#e4ded6] transition-all flex items-center justify-center gap-2 border border-[#8C8275]/20"
                >
                  <span>Entenda o Passo a Passo</span>
                  <ChevronRight className="w-4 h-4 text-[#8C8275]" />
                </a>
              </div>

              <div className="pt-4 border-t border-[#EFECE6] w-full grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#8C8275]">
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-[#4A6B5D] flex-shrink-0" />
                  <span>
                    <strong>Unidade Marília:</strong> {LEITE_FLOW.address}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-[#4A6B5D] flex-shrink-0" />
                  <span>
                    <strong>Atendimento BLH:</strong> (14) 3413-8696 · {LEITE_FLOW.phone}
                  </span>
                </div>
              </div>
            </div>

            {/* Hero Impact Card */}
            <div className="lg:col-span-5">
              <div className="relative bg-[#EFECE6] rounded-3xl p-5 sm:p-8 border border-[#8C8275]/20 shadow-xl overflow-hidden">
                <div
                  aria-hidden="true"
                  className="absolute -top-12 -right-12 w-40 h-40 bg-[#4A6B5D]/10 rounded-full blur-xl pointer-events-none"
                />
                <div className="flex flex-col items-center text-center p-5 sm:p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-[#FAF9F6] shadow-sm">
                  <div className="w-20 sm:w-24 h-20 sm:h-24 rounded-full bg-[#EBF1EE] p-3 flex items-center justify-center shadow-inner mb-4">
                    <Droplet className="w-10 sm:w-12 h-10 sm:h-12 text-[#4A6B5D] fill-[#4A6B5D]/20 animate-pulse" />
                  </div>
                  <span className="font-display text-xl sm:text-2xl font-semibold text-[#1E242B]">
                    1 Litro de Leite Materno
                  </span>
                  <p className="text-xs text-[#8C8275] uppercase tracking-widest mt-1">
                    Pode alimentar até
                  </p>
                  <div className="my-2">
                    <span className="font-display text-4xl sm:text-5xl font-bold text-[#4A6B5D]">
                      10 Bebês
                    </span>
                  </div>
                  <p className="text-xs text-[#1E242B]/80 max-w-xs">
                    Prematuros na UTI Neonatal do HCFAMEMA por até 24 horas.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-white/60 p-3.5 rounded-xl border border-white/80 text-center">
                    <span className="block text-xl font-bold text-[#1E242B]">100%</span>
                    <span className="text-[11px] text-[#8C8275]">Gratuito em Casa</span>
                  </div>
                  <div className="bg-white/60 p-3.5 rounded-xl border border-white/80 text-center">
                    <span className="block text-xl font-bold text-[#4A6B5D]">5 Zonas</span>
                    <span className="text-[11px] text-[#8C8275]">Atendidas em Marília</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-[#8C8275]/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 text-[11px] text-[#8C8275]">
                  <span>Padrão Sanitário</span>
                  <span className="font-semibold text-[#1E242B]">
                    ANVISA RDC 171/2006 · HCFAMEMA
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EDUCATIONAL IMPACT CALCULATOR */}
      <ImpactCalculator />

      {/* HOW IT WORKS */}
      <section id="como-funciona" className="py-14 sm:py-20 bg-[#FAF9F6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#4A6B5D]">
              Fluxo Integrado de Rastreabilidade
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-normal text-[#1E242B] mt-1">
              Como funciona a coleta e o processamento
            </h2>
            <p className="text-sm sm:text-base text-[#8C8275] mt-3">
              Da triagem da doadora à dispensação para a UTI Neonatal, cada frasco é monitorado
              pelo LEITFLOW.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {WORKFLOW_STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className="bg-white p-5 sm:p-6 rounded-2xl border border-[#EFECE6] shadow-sm hover:shadow-md transition-all flex flex-col group"
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
                  <p className="text-xs text-[#8C8275] leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* MARILIA 5 ZONES (ALIGNED WITH OFFICIAL SYSTEM ZONAS_SEMANA) */}
      <section
        id="coleta-marilia"
        className="py-12 sm:py-16 bg-[#EFECE6] border-y border-[#8C8275]/20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 items-center">
            <div className="lg:col-span-5 space-y-4">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#4A6B5D]">
                Logística de Coleta
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-normal text-[#1E242B]">
                Atendimento em todas as 5 zonas de Marília-SP
              </h2>
              <p className="text-sm text-[#1E242B]/80 leading-relaxed">
                A frota refrigerada do Banco de Leite percorre semanalmente as rotas urbanas e
                rurais do município para recolher os frascos congelados em cadeia de frio
                monitorada.
              </p>
              <div className="p-4 rounded-2xl bg-white/70 border border-white text-xs text-[#1E242B] space-y-2">
                <div className="font-semibold text-[#4A6B5D] flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  <span>Sede: {LEITE_FLOW.hospitalName}</span>
                </div>
                <p className="text-[#8C8275]">{LEITE_FLOW.address}</p>
                <p className="text-[#8C8275]">
                  Informações para novas doadoras: (14) 3413-8696 · {LEITE_FLOW.phone}
                </p>
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#EBF1EE] text-[#4A6B5D]">
                        Rota Ativa
                      </span>
                    </div>
                    <p className="text-xs text-[#8C8275] mb-3">{item.desc}</p>
                  </div>
                  <div className="pt-2 border-t border-[#EFECE6] flex items-center gap-1.5 text-[11px] font-medium text-[#4A6B5D]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{item.dia}-feira</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CLINICAL CRITERIA / REQUIREMENTS */}
      <section id="requisitos" className="py-14 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#4A6B5D]">
              Critérios de Saúde
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-normal text-[#1E242B] mt-1">
              Quem pode ser uma doadora?
            </h2>
            <p className="text-sm text-[#8C8275] mt-2">
              A doação é segura para a mãe e para o bebê. Confira os critérios oficiais da ANVISA e
              do Ministério da Saúde.
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
                  <p className="text-xs text-[#8C8275] leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <InstitutionalFaq />

      {/* FOOTER */}
      <PublicFooter
        isAuthenticated={isAuthenticated}
        onAccessSystem={handleAccessSystem}
      />
    </div>
  );
};
