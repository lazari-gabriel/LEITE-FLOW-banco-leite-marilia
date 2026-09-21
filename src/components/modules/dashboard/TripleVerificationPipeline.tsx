import React from 'react';
import { ShieldCheck, Check, ArrowRight } from 'lucide-react';
import { useApp } from '../../../hooks/useApp';

export const TripleVerificationPipeline: React.FC = () => {
  const { setCurrentView } = useApp();

  const nodes = [
    {
      badge: 'NÓ 1 · ORIGEM',
      title: 'Doadora & Coleta Domiciliar',
      description: 'Validação da aptidão médica, saneamento residencial, congelador < -10°C e etiquetagem primária imediata com código Code128.',
      checks: [
        'Triagem Sorológica Negativa (Go)',
        'Registro de data/hora da 1ª coleta',
        'Início do prazo de 15 dias (leite cru)'
      ],
      color: 'border-emerald-200 bg-emerald-50/40 text-emerald-900',
      badgeColor: 'bg-emerald-600 text-white'
    },
    {
      badge: 'NÓ 2 · PROCESSAMENTO',
      title: 'Recepção & Pasteurização BLH',
      description: 'Inspeção na chegada da van coletora no Hospital Materno Infantil, checagem de temperatura, teste de Acidez Dornic e crematócrito.',
      checks: [
        'Teste Crematócrito (Kcal/L)',
        'Acidez Dornic ≤ 8°D',
        'Validade pós-pasteurização: 6 meses'
      ],
      color: 'border-sky-200 bg-sky-50/40 text-sky-900',
      badgeColor: 'bg-sky-600 text-white'
    },
    {
      badge: 'NÓ 3 · DESTINO',
      title: 'Dispensação na UTI Neonatal',
      description: 'Reenvase anônimo com nova identidade por código hospitalar, vinculado ao leito e prontuário do recém-nascido prematuro.',
      checks: [
        'Anonimização da doadora (sigilo médico)',
        'Prescrição volumétrica médica personalizada',
        'Rastreabilidade reversa instantânea'
      ],
      color: 'border-indigo-200 bg-indigo-50/40 text-indigo-900',
      badgeColor: 'bg-indigo-600 text-white'
    }
  ];

  return (
    <div className="bg-white rounded-xl border border-blh-line p-5 sm:p-6 shadow-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-blh-line">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blh-primary" />
            <h2 className="text-base sm:text-lg font-serif font-bold text-blh-slate-900">
              Cadeia de Custódia Integrada — Tripla Verificação
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-blh-slate-600 mt-0.5">
            Nenhum frasco de leite materno avança de etapa sem validação rigorosa do nó anterior (Nó 1 → Nó 2 → Nó 3).
          </p>
        </div>
        <button
          onClick={() => setCurrentView('accountability')}
          className="text-xs font-bold text-blh-primary hover:text-blh-primary-dark inline-flex items-center gap-1.5 shrink-0 self-start sm:self-center transition-colors"
        >
          <span>Ver Auditoria Completa</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
        {nodes.map((node, index) => (
          <div
            key={index}
            className={`p-4 rounded-xl border flex flex-col justify-between transition-all hover:shadow-sm ${node.color}`}
          >
            <div>
              <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase mb-2.5 ${node.badgeColor}`}>
                {node.badge}
              </span>
              <h3 className="font-sans font-bold text-sm text-blh-slate-900 mb-1.5">
                {node.title}
              </h3>
              <p className="text-xs text-blh-slate-700 mb-4 leading-relaxed">
                {node.description}
              </p>
            </div>

            <ul className="space-y-1.5 pt-3 border-t border-black/10 text-xs text-blh-slate-800 font-medium">
              {node.checks.map((check, cIdx) => (
                <li key={cIdx} className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-white flex items-center justify-center text-emerald-700 shadow-xs shrink-0 ring-1 ring-emerald-200">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                  <span>{check}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};
