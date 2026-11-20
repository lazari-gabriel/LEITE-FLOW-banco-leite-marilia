import React from 'react';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { useApp } from '../../../hooks/useApp';
import { Bottle } from '../../../types/bottle';

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

  const nodes = [
    {
      badge: 'NÓ 1 · ORIGEM',
      title: 'Coleta Domiciliar & Triagem',
      mainMetric: `${inTriage}`,
      mainLabel: 'frasco(s) em triagem',
      details: [
        `${aptDonorsCount} doadora(s) apta(s) liberada(s)`,
        `${bottles.length} frasco(s) coletado(s) no total`,
      ],
      color: 'border-emerald-200 bg-emerald-50/40 text-emerald-900',
      badgeColor: 'bg-emerald-600 text-white',
    },
    {
      badge: 'NÓ 2 · LABORATÓRIO',
      title: 'Análise, Quarentena & Pasteurização',
      mainMetric: `${pasteurized}`,
      mainLabel: 'frasco(s) pasteurizado(s) p/ UTI',
      details: [
        `${inAnalysisOrQuarantine} em análise / quarentena`,
        `${discarded} descartado(s) por critério sanitário`,
      ],
      color: 'border-sky-200 bg-sky-50/40 text-sky-900',
      badgeColor: 'bg-sky-600 text-white',
    },
    {
      badge: 'NÓ 3 · DESTINO UTI',
      title: 'Dispensação Neonatal Anonimizada',
      mainMetric: `${dispensed.length}`,
      mainLabel: 'frasco(s) dispensado(s)',
      details: [
        `${dispensedMl} mL entregues aos recém-nascidos`,
        'Rastreabilidade reversa ativa (RDC 171/2006)',
      ],
      color: 'border-indigo-200 bg-indigo-50/40 text-indigo-900',
      badgeColor: 'bg-indigo-600 text-white',
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-blh-line p-5 sm:p-6 shadow-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-blh-line">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blh-primary" />
            <h2 className="text-base sm:text-lg font-serif font-bold text-blh-slate-900">
              Funil Vivo da Cadeia de Custódia (Nó 1 → Nó 2 → Nó 3)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-blh-slate-600 mt-0.5">
            Quantitativo real de frascos por etapa da tripla verificação hospitalar.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCurrentView('accountability')}
          className="text-xs font-bold text-blh-primary hover:text-blh-primary-dark inline-flex items-center gap-1.5 shrink-0 self-start sm:self-center transition-colors"
        >
          <span>Abrir Laboratório BLH</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
        {nodes.map((node, index) => (
          <div
            key={index}
            className={`p-4 sm:p-5 rounded-xl border flex flex-col justify-between ${node.color}`}
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
                  {node.mainMetric}
                </span>
                <span className="text-xs font-medium text-blh-slate-700">{node.mainLabel}</span>
              </div>
            </div>

            <ul className="space-y-1 pt-3 border-t border-black/10 text-xs text-blh-slate-800 font-medium">
              {node.details.map((detail, idx) => (
                <li key={idx}>• {detail}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};
