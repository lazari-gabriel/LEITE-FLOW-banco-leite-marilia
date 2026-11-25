import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Heart,
  Phone,
  ShieldCheck,
  Sparkles,
  Truck,
  ClipboardCheck,
  LogIn,
} from 'lucide-react';
import { motion } from 'motion/react';
import { MOTION_DURATION, MOTION_EASE } from '../../lib/motion';
import {
  BEST_TIME_LABELS,
  DonorInterestPublicPayload,
  DonorInterestPublicResponse,
  PREFERRED_CONTACT_LABELS,
} from '../../types/donorInterest';
import { InstitutionalLogo } from './InstitutionalLogo';
import { DonorInterestForm } from './DonorInterestForm';

export const DonorInterestPage: React.FC = () => {
  const [confirmation, setConfirmation] = useState<{
    response: DonorInterestPublicResponse;
    submitted: DonorInterestPublicPayload;
  } | null>(null);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1E242B] font-sans antialiased flex flex-col justify-between selection:bg-[#4A6B5D] selection:text-white relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-28 -right-24 w-96 h-96 rounded-full bg-[#EBF1EE] blur-3xl opacity-70"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -left-24 w-96 h-96 rounded-full bg-[#EFECE6] blur-3xl opacity-80"
      />

      {/* Header */}
      <header className="relative z-10 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between gap-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#4A6B5D] hover:text-[#3d594d] transition-colors px-3 py-1.5 rounded-lg hover:bg-[#EBF1EE]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao início</span>
        </Link>

        <Link to="/" aria-label="Início LEITFLOW">
          <InstitutionalLogo size="sm" />
        </Link>

        <Link
          to="/login"
          className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E242B]/80 hover:text-[#4A6B5D] px-3 py-1.5 rounded-full border border-[#EFECE6] bg-white transition-colors"
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>Acessar sistema</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {confirmation ? (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: MOTION_DURATION.medium, ease: MOTION_EASE.outExpo }}
            className="bg-white rounded-3xl p-7 sm:p-10 shadow-xl border border-[#EFECE6] text-center space-y-6 max-w-2xl mx-auto"
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-[#EBF1EE] text-[#4A6B5D] flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <span className="inline-block text-xs font-semibold uppercase tracking-widest text-[#4A6B5D] bg-[#EBF1EE] px-3 py-1 rounded-full">
                Interesse registrado com sucesso
              </span>
              <h1 className="font-display text-2xl sm:text-4xl font-semibold text-[#1E242B]">
                Obrigada pelo seu gesto, {confirmation.submitted.fullName.split(' ')[0]}!
              </h1>
              <p className="text-sm text-[#8C8275] max-w-xl mx-auto leading-relaxed">
                {confirmation.response.message}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#EFECE6] grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#8C8275] block">
                  Protocolo BLH
                </span>
                <strong className="font-mono text-base text-[#4A6B5D] mt-0.5 block">
                  {confirmation.response.protocol}
                </strong>
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#8C8275] block">
                  Canal escolhido
                </span>
                <strong className="text-sm text-[#1E242B] mt-0.5 block">
                  {PREFERRED_CONTACT_LABELS[confirmation.submitted.preferredContact]}
                </strong>
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#8C8275] block">
                  Melhor horário
                </span>
                <strong className="text-sm text-[#1E242B] mt-0.5 block">
                  {BEST_TIME_LABELS[confirmation.submitted.bestContactTime]}
                </strong>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#EBF1EE]/70 border border-[#4A6B5D]/20 text-xs text-[#1E242B]/80 leading-relaxed text-left flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#4A6B5D] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-[#1E242B]">Próximos passos oficiais:</p>
                <p>
                  Este envio registra seu interesse para contato. Nossa equipe de enfermagem entrará
                  em contato para tirar dúvidas, realizar o cadastro oficial e orientar a triagem
                  clínica e entrega gratuita dos frascos esterilizados.
                </p>
                <p className="pt-1 flex items-center gap-1.5 font-medium text-[#4A6B5D]">
                  <Phone className="w-3.5 h-3.5" />
                  <span>Dúvidas imediatas: (14) 3413-8696 · Disque Saúde 136</span>
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/"
                className="w-full sm:w-auto px-7 py-3 rounded-full bg-[#4A6B5D] text-white font-semibold text-sm hover:bg-[#3d594d] transition-all shadow-md"
              >
                Voltar à página inicial
              </Link>
              <button
                type="button"
                onClick={() => setConfirmation(null)}
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#EFECE6] text-[#1E242B] font-medium text-sm hover:bg-[#e4ded6] transition-colors"
              >
                Enviar outra solicitação
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: MOTION_DURATION.medium, ease: MOTION_EASE.outExpo }}
            className="space-y-6"
          >
            {/* Cabeçalho acolhedor */}
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EBF1EE] text-[#4A6B5D] text-xs font-semibold uppercase tracking-wide border border-[#4A6B5D]/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Banco de Leite Humano de Marília – SP</span>
              </div>
              <h1 className="font-display text-3xl sm:text-5xl font-normal text-[#1E242B] tracking-tight">
                Quero ser doadora de leite humano
              </h1>
              <p className="text-sm sm:text-base text-[#8C8275] leading-relaxed">
                Deixe seus dados de contato abaixo. Nossa equipe entrará em contato com você para
                esclarecer todas as dúvidas e iniciar o processo oficial com acolhimento e segurança.
              </p>
            </div>

            {/* Faixa de expectativas (3 passos) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  icon: Heart,
                  title: '1. Envie seu interesse',
                  desc: 'Preenchimento rápido, sem documentos ou dados clínicos nesta etapa.',
                },
                {
                  icon: ClipboardCheck,
                  title: '2. Contato da equipe BLH',
                  desc: 'Nossa enfermagem entra em contato no canal e horário escolhidos.',
                },
                {
                  icon: Truck,
                  title: '3. Frascos e coleta gratuita',
                  desc: 'Após a triagem oficial, levamos kits estéreis e coletamos na sua casa.',
                },
              ].map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.title}
                    className="bg-white/90 rounded-2xl p-4 border border-[#EFECE6] flex items-start gap-3 shadow-sm"
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#EBF1EE] text-[#4A6B5D] flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-xs text-[#1E242B]">{step.title}</h2>
                      <p className="text-[11px] text-[#8C8275] mt-0.5 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Card do Formulário */}
            <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-[#EFECE6]">
              <DonorInterestForm
                onSuccess={(response, submitted) => {
                  setConfirmation({ response, submitted });
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 px-4 text-center text-xs text-[#8C8275] space-y-1">
        <p>
          &copy; {new Date().getFullYear()} LEITFLOW — Apoio à gestão do Banco de Leite Humano de
          Marília – SP
        </p>
        <p className="text-[11px] text-[#8C8275]/90">
          Dúvidas sobre doação: (14) 3413-8696 · Disque Saúde 136 · Rua XV de Novembro, nº 50 —
          Marília – SP
        </p>
      </footer>
    </div>
  );
};
