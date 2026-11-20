import React from 'react';
import { CheckCircle2, AlertOctagon, Clock, ArrowRight, X } from 'lucide-react';
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
  const isApproved = evalResult.aptidao === 'Apta';
  const isPending = evalResult.aptidao === 'Pendente';

  return (
    <div
      className={`p-5 rounded-xl border shadow-md transition-all duration-300 animate-slideDown relative overflow-hidden ${
        isApproved
          ? 'bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white border-emerald-300 text-emerald-950'
          : isPending
          ? 'bg-gradient-to-r from-amber-50 via-yellow-50/50 to-white border-amber-300 text-amber-950'
          : 'bg-gradient-to-r from-rose-50 via-red-50/50 to-white border-rose-300 text-rose-950'
      }`}
    >
      <button
        onClick={onDismiss}
        className="absolute top-4 right-4 p-1.5 rounded-md text-blh-slate-400 hover:text-blh-slate-700 hover:bg-black/5 transition-colors"
        aria-label="Fechar resultado da triagem"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-4">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
            isApproved
              ? 'bg-emerald-600 text-white'
              : isPending
              ? 'bg-amber-600 text-white'
              : 'bg-rose-600 text-white'
          }`}
        >
          {isApproved ? (
            <CheckCircle2 className="w-7 h-7" />
          ) : isPending ? (
            <Clock className="w-7 h-7" />
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
                  : isPending
                  ? 'bg-amber-200 text-amber-900'
                  : 'bg-rose-200 text-rose-900'
              }`}
            >
              {isApproved
                ? 'APTA PARA DOAÇÃO'
                : isPending
                ? 'AGUARDANDO EXAMES'
                : 'INAPTA PARA DOAÇÃO'}
            </span>
            <span className="text-xs text-blh-slate-500">
              Protocolo Clínico ANVISA / BLH
            </span>
          </div>

          <h3 className="font-serif font-bold text-base sm:text-lg">
            {isApproved
              ? `Doadora ${donor.nome} apta para coleta domiciliar`
              : isPending
              ? `Doadora ${donor.nome} aguardando laudos sorológicos`
              : `Doadora ${donor.nome} inapta na triagem clínica`}
          </h3>

          <p className="text-xs sm:text-sm text-blh-slate-700 mt-1 leading-relaxed">
            {isApproved
              ? `Aprovada sem restrições clínicas. Liberada para a rota semanal da Zona ${donor.zona} de Marília. O kit de frascos esterilizados e toucas será entregue na 1ª visita da equipe de coleta.`
              : isPending
              ? `Cadastro salvo sem contraindicações clínicas, mas aguardando a confirmação dos exames sorológicos (1ª, 2ª e 3ª amostras) como Não Reagentes para liberação em rota.`
              : `Não liberada para a rota de coleta domiciliar. Critério clínico impeditivo: ${evalResult.reasons.join(' · ')}.`}
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
            ) : isPending ? (
              <span className="text-xs font-medium text-amber-900 bg-amber-100/80 px-2.5 py-1 rounded">
                Ação necessária: Edite o cadastro assim que os resultados sorológicos forem liberados.
              </span>
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
