import React from 'react';
import { MapPin, MessageCircle, Check, Navigation, Tag, AlertCircle, XCircle, Lock } from 'lucide-react';
import { RouteStop } from '../../../types/route';
import { useApp } from '../../../hooks/useApp';
import { Button } from '../../ui/Button';
import { buildGoogleMapsSingleStopUrl, buildWhatsAppUrl } from '../../../services/routeService';

interface StopCardProps {
  stop: RouteStop;
  onOpenColeta: () => void;
  onOpenSkip?: () => void;
}

export const StopCard: React.FC<StopCardProps> = ({ stop, onOpenColeta, onOpenSkip }) => {
  const { setSelectedBottleId, setCurrentView, handleArrivalAtStop, routeAssignment } = useApp();

  const handleNavigateToStop = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = buildGoogleMapsSingleStopUrl(stop.lat, stop.lng, stop.address);
    window.open(url, '_blank');
  };

  const handleViewLabel = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (stop.latestBottleId) {
      setSelectedBottleId(stop.latestBottleId);
      setCurrentView('etiquetas');
    }
  };

  const isRouteActive = routeAssignment?.status === 'active';
  const isRouteCompleted = routeAssignment?.status === 'completed';
  const isNext = stop.status === 'next';
  const isCompleted = stop.status === 'completed' || stop.collected;
  const isSkipped = stop.status === 'skipped' || stop.skipped;

  const handleCardClick = () => {
    if (!isRouteActive || isCompleted || isSkipped) return;
    handleArrivalAtStop(stop.donorId);
    onOpenColeta();
  };

  return (
    <div
      onClick={handleCardClick}
      className={`p-4 sm:p-5 rounded-xl border transition-all duration-150 ${
        isSkipped
          ? 'bg-rose-50/40 border-rose-200 opacity-80'
          : isCompleted
          ? 'bg-white border-emerald-200'
          : isNext
          ? 'bg-emerald-50/50 border-blh-primary shadow-sm ring-1 ring-blh-primary/30 cursor-pointer'
          : isRouteActive
          ? 'bg-white border-blh-line hover:border-blh-line-strong hover:shadow-sm cursor-pointer'
          : 'bg-white border-blh-line opacity-90'
      }`}
    >
      {/* Header do Card */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-blh-line/60">
        <div className="flex items-start gap-3 min-w-0">
          {/* Número e Estado da Parada */}
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center font-mono font-bold text-sm shrink-0 shadow-xs ${
              isCompleted
                ? 'bg-emerald-600 text-white'
                : isSkipped
                ? 'bg-rose-600 text-white'
                : isNext
                ? 'bg-blh-primary text-white ring-4 ring-emerald-100'
                : 'bg-blh-slate-200 text-blh-slate-800'
            }`}
          >
            {isCompleted ? (
              <Check className="w-4 h-4 stroke-[3]" />
            ) : isSkipped ? (
              <XCircle className="w-4 h-4" />
            ) : (
              stop.stopNumber
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-sans font-bold text-sm sm:text-base text-blh-slate-900 truncate">
                {stop.donorName}
              </h3>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  isCompleted
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : isSkipped
                    ? 'bg-rose-100 text-rose-900 border border-rose-300'
                    : isNext
                    ? 'bg-blue-100 text-blue-900 border border-blue-300'
                    : 'bg-blh-slate-100 text-blh-slate-700 border border-blh-slate-200'
                }`}
              >
                {isCompleted
                  ? '✓ Concluída'
                  : isSkipped
                  ? '✕ Não Realizada'
                  : isNext
                  ? '● Próxima'
                  : '○ Pendente'}
              </span>
            </div>

            <p className="text-xs text-blh-slate-600 mt-0.5">
              Bebê: <strong className="text-blh-slate-900">{stop.babyName}</strong> ({stop.babyAgeDays} dias) • Tel: <span className="font-mono">{stop.phone}</span>
            </p>
          </div>
        </div>

        {/* Botão de WhatsApp */}
        <a
          href={buildWhatsAppUrl(stop.donorName, stop.phone)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] rounded-lg bg-emerald-100/80 text-emerald-950 hover:bg-emerald-200/90 border border-emerald-300 text-xs font-bold transition-colors shrink-0 shadow-xs"
          title="Avisar mãe no WhatsApp"
        >
          <MessageCircle className="w-4 h-4 text-emerald-700 shrink-0" />
          <span className="hidden sm:inline">WhatsApp</span>
        </a>
      </div>

      {/* Endereço e Metadados */}
      <div className="py-2.5 text-xs text-blh-slate-700 space-y-1">
        <div className="flex items-center gap-1.5 text-blh-slate-900 font-semibold">
          <MapPin className="w-3.5 h-3.5 text-blh-slate-500 shrink-0" />
          <span className="truncate">{stop.address} — {stop.neighborhood}</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-blh-slate-600 flex-wrap">
          <span>Congelador: <strong className="text-blh-slate-800">{stop.equipment}</strong></span>
          <span>•</span>
          <span>Extração: <strong className="text-blh-slate-800">{stop.extraction}</strong></span>
          {stop.distanceFromPrevKm ? (
            <>
              <span>•</span>
              <span className="font-mono tabular-nums">Distância: <strong className="text-blh-slate-800">{stop.distanceFromPrevKm} km</strong></span>
            </>
          ) : null}
        </div>

        {isSkipped && stop.skipMotivo && (
          <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-900 text-[11px] mt-2 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>
              <strong>Motivo do não atendimento:</strong> {stop.skipMotivo}
            </span>
          </div>
        )}
      </div>

      {/* Ações da Parada */}
      <div className="pt-2.5 border-t border-blh-line/60 flex items-center justify-between gap-3 flex-wrap">
        {!isCompleted && !isSkipped ? (
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={handleNavigateToStop}
              leftIcon={<Navigation className="w-3.5 h-3.5 text-blh-primary" />}
            >
              Navegar
            </Button>

            {isRouteActive ? (
              <>
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleArrivalAtStop(stop.donorId);
                    onOpenColeta();
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  leftIcon={<Check className="w-4 h-4 stroke-[3]" />}
                >
                  CHEGUEI
                </Button>

                {onOpenSkip && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenSkip();
                    }}
                    className="text-rose-600 hover:bg-rose-50 border border-rose-200"
                    leftIcon={<XCircle className="w-3.5 h-3.5" />}
                  >
                    Não Feita
                  </Button>
                )}
              </>
            ) : isRouteCompleted ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                <Lock className="w-3.5 h-3.5" />
                Rota finalizada (somente leitura)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
                <Lock className="w-3.5 h-3.5" />
                Inicie a rota para liberar a coleta
              </span>
            )}
          </div>
        ) : isCompleted ? (
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
              <Check className="w-4 h-4 stroke-[3]" /> Coleta Registrada
            </span>

            <Button
              size="sm"
              variant="outline"
              onClick={handleViewLabel}
              leftIcon={<Tag className="w-3.5 h-3.5" />}
            >
              Ver Etiqueta
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-rose-700 font-bold flex items-center gap-1">
              <XCircle className="w-4 h-4" /> Parada Não Atendida
            </span>
            <span className="text-[11px] text-blh-slate-500">
              Permanecerá ativa para rotas futuras
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
