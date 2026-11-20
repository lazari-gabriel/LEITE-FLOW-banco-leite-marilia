import React from 'react';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../../../hooks/useApp';
import { Bottle } from '../../../types/bottle';
import { AnimatedCounter, ScrollReveal, StaggerContainer, StaggerItem } from '../../motion';
import { MOTION_DURATION, MOTION_EASE, MOTION_SPRING, MOTION_VIEWPORT } from '../../../lib/motion';

interface TripleVerificationPipelineProps {
  bottles: Bottle[];
  aptDonorsCount: number;
}

export const TripleVerificationPipeline: React.FC<TripleVerificationPipelineProps> = ({
  bottles,
  aptDonorsCount,
}) => {
  const { setCurrentView } = useApp();

  const inTriage = bottles.filter((b) => b.statusPast === 'Em Triagem').length;
  const inAnalysisOrQuarantine = bottles.filter(
    (b) => b.statusPast === 'Em Análise' || b.statusPast === 'Em Quarentena'
  ).length;
  const pasteurized = bottles.filter((b) => b.statusPast === 'Pasteurizado').length;
  const discarded = bottles.filter((b) => b.statusPast === 'Descartado').length;
  const dispensed = bottles.filter((b) => b.statusPast === 'Dispensado');
  const dispensedMl = dispensed.reduce((acc, b) => acc + b.volume, 0);

  const total = bottles.length;
  const segments = [
    { label: 'Triagem', count: inTriage, color: 'bg-emerald-500' },
    { label: 'Análise / Quarentena', count: inAnalysisOrQuarantine, color: 'bg-amber-500' },
    { label: 'Pasteurizado', count: pasteurized, color: 'bg-sky-600' },
    { label: 'Dispensado UTI', count: dispensed.length, color: 'bg-indigo-600' },
    { label: 'Descartado', count: discarded, color: 'bg-rose-500' },
  ];

  const nodes = [
    {
      badge: 'ETAPA 1 · COLETA E TRIAGEM',
      title: 'Coleta Domiciliar e Triagem',
      mainMetric: inTriage,
      mainLabel: inTriage === 1 ? 'frasco em triagem' : 'frascos em triagem',
      details: [
        aptDonorsCount === 1
          ? '1 doadora apta liberada'
          : `${aptDonorsCount} doadoras aptas liberadas`,
        bottles.length === 1
          ? '1 frasco coletado no total'
          : `${bottles.length} frascos coletados no total`,
      ],
      color: 'border-emerald-200 bg-emerald-50/40 text-emerald-900 hover:border-emerald-300',
      badgeColor: 'bg-emerald-600 text-white',
    },
    {
      badge: 'ETAPA 2 · LABORATÓRIO',
      title: 'Análise, Quarentena e Pasteurização',
      mainMetric: pasteurized,
      mainLabel:
        pasteurized === 1
          ? 'frasco pasteurizado para UTI'
          : 'frascos pasteurizados para UTI',
      details: [
        `${inAnalysisOrQuarantine} em análise / quarentena`,
        discarded === 1
          ? '1 descartado por critério sanitário'
          : `${discarded} descartados por critério sanitário`,
      ],
      color: 'border-sky-200 bg-sky-50/40 text-sky-900 hover:border-sky-300',
      badgeColor: 'bg-sky-600 text-white',
    },
    {
      badge: 'ETAPA 3 · UTI NEONATAL',
      title: 'Dispensação Neonatal Protegida',
      mainMetric: dispensed.length,
      mainLabel: dispensed.length === 1 ? 'frasco dispensado' : 'frascos dispensados',
      details: [
        `${dispensedMl} mL entregues aos recém-nascidos`,
        'Rastreabilidade ativa conforme RDC 171/2006',
      ],
      color: 'border-indigo-200 bg-indigo-50/40 text-indigo-900 hover:border-indigo-300',
      badgeColor: 'bg-indigo-600 text-white',
    },
  ];

  return (
    <ScrollReveal>
      <div className="bg-white rounded-xl border border-blh-line p-5 sm:p-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-blh-line">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blh-primary" />
              <h2 className="text-base sm:text-lg font-serif font-bold text-blh-slate-900">
                Fluxo de Rastreabilidade do Leite Humano
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-blh-slate-600 mt-0.5">
              Acompanhamento dos frascos desde a coleta domiciliar até a dispensação na UTI Neonatal.
            </p>
          </div>
          <motion.button
            type="button"
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.97 }}
            transition={MOTION_SPRING.tap}
            onClick={() => setCurrentView('accountability')}
            className="text-xs font-bold text-blh-primary hover:text-blh-primary-dark inline-flex items-center gap-1.5 shrink-0 self-start sm:self-center transition-colors group"
          >
            <span>Abrir Laboratório BLH</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </motion.button>
        </div>

        {/* Barra Segmentada Animada de Progresso do Fluxo de Frascos */}
        {total > 0 && (
          <div className="mt-4 space-y-2">
            <div className="w-full h-2.5 rounded-full bg-blh-slate-100 overflow-hidden flex gap-0.5">
              {segments
                .filter((s) => s.count > 0)
                .map((seg, idx) => {
                  const widthPct = (seg.count / total) * 100;
                  return (
                    <motion.div
                      key={seg.label}
                      className={`h-full first:rounded-l-full last:rounded-r-full ${seg.color}`}
                      initial={{ width: '0%' }}
                      whileInView={{ width: `${widthPct}%` }}
                      viewport={MOTION_VIEWPORT}
                      transition={{
                        duration: MOTION_DURATION.chart,
                        delay: idx * 0.08,
                        ease: MOTION_EASE.outExpo,
                      }}
                      title={`${seg.label}: ${seg.count} frasco(s)`}
                    />
                  );
                })}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-blh-slate-600">
              {segments.map((seg) => (
                <span key={seg.label} className="inline-flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${seg.color}`} />
                  <span>{seg.label}:</span>
                  <strong className="font-mono text-blh-slate-900">{seg.count}</strong>
                </span>
              ))}
            </div>
          </div>
        )}

        <StaggerContainer
          triggerOnScroll
          staggerDelay={0.07}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5"
        >
          {nodes.map((node, index) => (
            <StaggerItem key={index}>
              <motion.div
                whileHover={{ y: -3 }}
                transition={MOTION_SPRING.gentle}
                className={`p-4 sm:p-5 rounded-xl border flex flex-col justify-between h-full transition-[border-color,box-shadow] duration-200 hover:shadow-elevation ${node.color}`}
              >
                <div>
                  <span
                    className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase mb-2.5 ${node.badgeColor}`}
                  >
                    {node.badge}
                  </span>
                  <h3 className="font-sans font-bold text-sm text-blh-slate-900 mb-2">
                    {node.title}
                  </h3>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-3xl font-mono font-extrabold text-blh-slate-950 tabular-nums">
                      <AnimatedCounter value={node.mainMetric} />
                    </span>
                    <span className="text-xs font-medium text-blh-slate-700">{node.mainLabel}</span>
                  </div>
                </div>

                <ul className="space-y-1 pt-3 border-t border-black/10 text-xs text-blh-slate-800 font-medium">
                  {node.details.map((detail, idx) => (
                    <li key={idx}>• {detail}</li>
                  ))}
                </ul>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </ScrollReveal>
  );
};
