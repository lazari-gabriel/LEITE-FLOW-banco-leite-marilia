import React from 'react';
import { CheckCircle2, AlertOctagon, ArrowRight, X } from 'lucide-react';
import { Donor, GoNoGoVerdict } from '../../../types/donor';
import { useApp } from '../../../hooks/useApp';

interface GoNoGoVerdictBannerProps {
  verdict: {
    donor: Donor;
    verdict: GoNoGoVerdict;
  } | null;
  onDismiss: () => void;
}

export const GoNoGoVerdictBanner: React.FC<GoNoGoVerdictBannerProps> = ({
  verdict,
  onDismiss
}) => {
  const { navigateToDonorRoute } = useApp();
  if (!verdict) return null;

  const { donor, verdict: evalResult } = verdict;
  const isApproved = evalResult.approved;

  return (
    <div
      className={`p-5 rounded-xl border shadow-md transition-all duration-300 animate-slideDown relative overflow-hidden ${
        isApproved
          ? 'bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white border-emerald-300 text-emerald-950'
          : 'bg-gradient-to-r from-rose-50 via-red-50/50 to-white border-rose-300 text-rose-950'
      }`}
    >
      <button
        onClick={onDismiss}
        className="absolute top-4 right-4 p-1.5 rounded-md text-blh-slate-400 hover:text-blh-slate-700 hover:bg-black/5 transition-colors"
        aria-label="Fechar veredito"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-4">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
            isApproved
              ? 'bg-emerald-600 text-white'
              : 'bg-rose-600 text-white'
          }`}
        >
          {isApproved ? (
            <CheckCircle2 className="w-7 h-7" />
          ) : (
            <AlertOctagon className="w-7 h-7" />
          )}
        </div>

        <div className="flex-1 pr-6">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded tracking-wider ${
                isApproved
                  ? 'bg-emerald-200 text-emerald-900'
                  : 'bg-rose-200 text-rose-900'
              }`}
            >
              {isApproved ? 'VEREDITO: GO — APROVADA' : 'VEREDITO: NO-GO — BLOQUEADA'}
            </span>
            <span className="text-xs text-blh-slate-500">
              Protocolo de Segurança ANVISA / BLH
            </span>
          </div>

          <h3 className="font-serif font-bold text-base sm:text-lg">
            {isApproved
              ? `Doadora ${donor.nome} Apta para Coleta Domiciliar!`
              : `Doadora ${donor.nome} Reprovada na Triagem de Segurança`}
          </h3>

          <p className="text-xs sm:text-sm text-blh-slate-700 mt-1 leading-relaxed">
            {isApproved
              ? `Aprovada sem restrições sanitárias. Liberada para a rota semanal da Zona ${donor.zona} de Marília. O kit de frascos esterilizados e toucas será entregue na 1ª visita da van coletora.`
              : `Bloqueada do ingresso na rota de coleta domiciliar. Motivo técnico impeditivo: ${evalResult.reasons.join(' · ')}.`}
          </p>

          <div className="mt-3.5 flex items-center gap-3">
            {isApproved ? (
              <button
                onClick={() => navigateToDonorRoute(donor.zona, donor.id)}
                className="text-xs font-semibold px-3 py-1.5 rounded-md bg-emerald-700 text-white hover:bg-emerald-800 transition-colors inline-flex items-center gap-1.5 shadow-sm"
              >
                <span>Ver Parada na Rota da Zona {donor.zona}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="text-xs font-medium text-rose-800 bg-rose-100/80 px-2.5 py-1 rounded">
                Encaminhamento sugerido: Notificação ao serviço social ou unidade de saúde da gestante.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
