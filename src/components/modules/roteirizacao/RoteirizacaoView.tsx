import React, { useState } from 'react';
import { 
  MapPin, 
  Navigation, 
  CheckCircle2, 
  Truck, 
  Check,
  ClipboardList,
  Play,
  XCircle,
  AlertCircle,
  Flag,
  Lock
} from 'lucide-react';
import { useApp } from '../../../hooks/useApp';
import { ZONE_BY_DAY } from '../../../constants/zones';
import { WeekDaySelector } from './WeekDaySelector';
import { StopCard } from './StopCard';
import { ColetaModal } from './ColetaModal';
import { RouteDispatcher } from './RouteDispatcher';
import { SkipStopModal } from './SkipStopModal';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import { LEITE_FLOW } from '../../../constants/blh';
import { buildGoogleMapsSingleStopUrl } from '../../../services/routeService';

type MainTab = 'montar' | 'executar';

export const RoteirizacaoView: React.FC = () => {
  const { 
    selectedDay, 
    currentZoneStops, 
    nextStop, 
    setCurrentView,
    handleArrivalAtStop,
    routeAssignment,
    donors,
    skipStop,
    finishRoute,
    activateRoute
  } = useApp();

  const [activeTab, setActiveTab] = useState<MainTab>('montar');
  const [activeModalDonorId, setActiveModalDonorId] = useState<number | null>(null);
  const [activeSkipDonorId, setActiveSkipDonorId] = useState<number | null>(null);

  const zoneConfig = ZONE_BY_DAY[selectedDay] || ZONE_BY_DAY['Segunda'];
  const completedCount = currentZoneStops.filter((s) => s.collected).length;
  const skippedCount = currentZoneStops.filter((s) => s.skipped).length;
  const doneCount = completedCount + skippedCount;
  const totalStops = currentZoneStops.length;
  const progressPercent = totalStops > 0 
    ? Math.round((doneCount / totalStops) * 100) 
    : 0;

  const isAllCompleted = totalStops > 0 && doneCount === totalStops;
  const isRouteActive = routeAssignment?.status === 'active';
  const isRouteCompleted = routeAssignment?.status === 'completed';

  const activeDonor = activeModalDonorId 
    ? donors.find((d) => d.id === activeModalDonorId) 
    : null;

  const activeSkipDonor = activeSkipDonorId 
    ? donors.find((d) => d.id === activeSkipDonorId) 
    : null;

  const handleNavigateToStop = (stop: typeof currentZoneStops[0]) => {
    const url = buildGoogleMapsSingleStopUrl(stop.lat, stop.lng, stop.address);
    window.open(url, '_blank');
  };

  const handleArrivedAtNextStop = (stop: typeof currentZoneStops[0]) => {
    handleArrivalAtStop(stop.donorId);
    setActiveModalDonorId(stop.donorId);
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Seletor dos Dias da Semana */}
      <WeekDaySelector />

      {/* Tabs de Navegação */}
      <div className="flex gap-1 p-1 bg-blh-slate-100 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveTab('montar')}
          className={`flex-1 flex items-center justify-center gap-2 text-sm font-semibold py-2.5 px-4 rounded-lg transition-all ${
            activeTab === 'montar'
              ? 'bg-white text-blh-primary shadow-sm'
              : 'text-blh-slate-600 hover:text-blh-slate-900'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Montar Rota
          {routeAssignment && (
            <span className={`ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
              isRouteActive
                ? 'bg-emerald-500 text-white'
                : 'bg-blh-primary text-white'
            }`}>
              {isRouteActive ? 'Ativa' : routeAssignment.donorIds.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('executar')}
          className={`flex-1 flex items-center justify-center gap-2 text-sm font-semibold py-2.5 px-4 rounded-lg transition-all ${
            activeTab === 'executar'
              ? 'bg-white text-blh-primary shadow-sm'
              : 'text-blh-slate-600 hover:text-blh-slate-900'
          }`}
        >
          <Play className="w-4 h-4" />
          Executar Coletas
          {doneCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded-full">
              {doneCount}/{totalStops}
            </span>
          )}
        </button>
      </div>

      {/* ── Tab: MONTAR ROTA (RouteDispatcher) ── */}
      {activeTab === 'montar' && (
        <RouteDispatcher onNavigateToExecution={() => setActiveTab('executar')} />
      )}

      {/* ── Tab: EXECUTAR COLETAS ── */}
      {activeTab === 'executar' && (
        <div className="space-y-4">
          {/* Banner de rota não iniciada */}
          {!isRouteActive && !isRouteCompleted && totalStops > 0 && (
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Truck className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">
                    A rota de hoje ainda não foi iniciada
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Revise as doadoras na aba "Montar Rota" ou clique diretamente em <strong>"Iniciar Rota Agora"</strong> para liberar o registro das coletas.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveTab('montar')}
                  className="border-amber-300 text-amber-800 hover:bg-amber-100"
                >
                  Revisar Rota
                </Button>
                <Button
                  size="sm"
                  onClick={activateRoute}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  leftIcon={<Play className="w-3.5 h-3.5 fill-white" />}
                >
                  Iniciar Rota Agora
                </Button>
              </div>
            </div>
          )}

          {/* Banner de Rota Finalizada e Arquivada */}
          {isRouteCompleted && (
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/90 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-700 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-blue-950">
                    Rota do Dia Finalizada e Arquivada
                  </p>
                  <p className="text-xs text-blue-800 mt-0.5">
                    Modo somente leitura. Todas as coletas ({completedCount}) e justificativas ({skippedCount}) estão vinculadas ao histórico permanente do Banco de Leite.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 bg-blue-100 px-3 py-1 rounded-md shrink-0">
                Somente Leitura
              </span>
            </div>
          )}

          {/* Barra de Progresso com Ação de Finalizar */}
          {totalStops > 0 && (
            <div className="bg-white p-4 rounded-xl border border-blh-line shadow-sm space-y-2">
              <div className="flex flex-wrap items-center justify-between text-xs gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-blh-slate-800">
                    Progresso: {doneCount} de {totalStops} paradas atendidas
                  </span>
                  <span className="text-emerald-700 font-semibold text-[11px]">
                    ✓ {completedCount} coletadas
                  </span>
                  {skippedCount > 0 && (
                    <span className="text-rose-700 font-semibold text-[11px]">
                      ✕ {skippedCount} não realizadas
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-blh-primary">
                    {progressPercent}%
                  </span>

                  {/* Botão Finalizar Rota no Header de Progresso */}
                  {isRouteActive && (
                    <Button
                      size="sm"
                      disabled={!isAllCompleted}
                      onClick={finishRoute}
                      className={
                        isAllCompleted
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm'
                          : 'opacity-50 cursor-not-allowed bg-blh-slate-200 text-blh-slate-600'
                      }
                      leftIcon={<Flag className="w-3.5 h-3.5" />}
                      title={
                        isAllCompleted
                          ? 'Finalizar e arquivar rota de campo de hoje'
                          : `Ainda há ${totalStops - doneCount} parada(s) pendente(s)`
                      }
                    >
                      Finalizar Rota {isAllCompleted ? '✓' : `(${totalStops - doneCount} pend.)`}
                    </Button>
                  )}

                  {isRouteCompleted && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-100 text-blue-900 font-bold text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" />
                      Finalizada
                    </span>
                  )}
                </div>
              </div>
              <div className="w-full bg-blh-slate-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* CARD DESTAQUE: PRÓXIMA PARADA (HERO CARD) */}
          {nextStop && !isAllCompleted && isRouteActive && (
            <div className="p-5 sm:p-6 rounded-xl border-2 border-blh-primary bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white shadow-md relative overflow-hidden animate-slideDown">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="space-y-2 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-blh-primary text-white font-bold text-[10px] uppercase tracking-wider">
                      Próxima Parada
                    </span>
                    <span className="text-xs font-bold text-emerald-800">
                      Parada #{nextStop.stopNumber}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-lg sm:text-xl font-sans font-bold text-blh-slate-900 leading-tight truncate">
                      {nextStop.donorName}
                    </h2>
                    <p className="text-xs sm:text-sm text-blh-slate-700 mt-0.5">
                      📍 {nextStop.address} — {nextStop.neighborhood}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-blh-slate-600 pt-1 flex-wrap">
                    <span>
                      Distância: <strong>{nextStop.distanceFromPrevKm || 2.4} km</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Tempo est.: <strong>~{nextStop.estimatedMinutesFromPrev || 6} min</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Bebê: <strong>{nextStop.babyName}</strong> ({nextStop.babyAgeDays} dias)
                    </span>
                  </div>
                </div>

                {/* Ações Rápidas em Destaque */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => handleNavigateToStop(nextStop)}
                    leftIcon={<Navigation className="w-4 h-4 text-blh-primary" />}
                    className="bg-white hover:bg-blh-primary-soft border-blh-primary text-blh-primary font-bold"
                  >
                    Ir para Parada
                  </Button>

                  <Button
                    size="lg"
                    onClick={() => handleArrivedAtNextStop(nextStop)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base shadow-lg hover:shadow-xl px-6 py-3"
                    leftIcon={<Check className="w-5 h-5 stroke-[3]" />}
                  >
                    CHEGUEI
                  </Button>

                  <Button
                    size="md"
                    variant="ghost"
                    onClick={() => setActiveSkipDonorId(nextStop.donorId)}
                    className="text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-semibold"
                    leftIcon={<XCircle className="w-4 h-4 text-rose-500" />}
                  >
                    Não Feita
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Rota com todas as paradas resolvidas (ativa) */}
          {isAllCompleted && isRouteActive && (
            <div className="p-6 rounded-xl border-2 border-emerald-400 bg-emerald-50 text-emerald-950 text-center space-y-3 shadow-md animate-fadeIn">
              <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="font-sans font-bold text-lg text-emerald-900">
                Parabéns! Todas as Paradas de Hoje Foram Atendidas ✓
              </h2>
              <p className="text-xs sm:text-sm text-emerald-800 max-w-md mx-auto">
                {completedCount} coletas concluídas com sucesso e {skippedCount} baixas justificadas. Clique abaixo para finalizar o trajeto e arquivar como registro histórico.
              </p>
              <div className="pt-2 flex justify-center">
                <Button
                  size="lg"
                  onClick={finishRoute}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-base shadow-lg px-8 py-3.5"
                  leftIcon={<Flag className="w-5 h-5" />}
                >
                  Finalizar Rota Oficial do Dia
                </Button>
              </div>
            </div>
          )}

          {/* Rota Concluída e Arquivada */}
          {isRouteCompleted && (
            <div className="p-6 rounded-xl border border-blue-300 bg-blue-50 text-blue-950 text-center space-y-2 shadow-sm animate-fadeIn">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="font-sans font-bold text-lg text-blue-900">
                Rota Oficial Finalizada e Arquivada ✓
              </h2>
              <p className="text-xs sm:text-sm text-blue-800 max-w-md mx-auto">
                A rota da Zona {zoneConfig.zona} ({selectedDay}) está concluída. As {completedCount} coletas e {skippedCount} justificativas estão vinculadas com rastreabilidade total às doadoras e aos lotes do BLH.
              </p>
            </div>
          )}

          {/* Linha da Viagem: SAÍDA ➔ PARADAS ➔ RETORNO */}
          <div className="bg-white p-5 sm:p-6 rounded-xl border border-blh-line shadow-card space-y-4">
            <div className="border-b border-blh-line pb-3 flex items-center justify-between">
              <div>
                <h2 className="font-sans font-bold text-base text-blh-slate-900">
                  Sequência Operacional da Rota
                </h2>
                <p className="text-xs text-blh-slate-600">
                  Clique em qualquer parada para abrir o registro de coleta.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-blh-primary">
                  {totalStops} Paradas
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentView('mapa')}
                  leftIcon={<MapPin className="w-3.5 h-3.5 text-blh-primary" />}
                >
                  Ver no Mapa
                </Button>
              </div>
            </div>

            {totalStops === 0 ? (
              <EmptyState
                title={`Nenhuma doadora agendada para a Zona ${zoneConfig.zona}`}
                description="Monte a rota na aba 'Montar Rota' para adicionar paradas."
                actionLabel="Montar Rota"
                onAction={() => setActiveTab('montar')}
              />
            ) : (
              <div className="space-y-3 pt-2">
                {/* PONTO DE SAÍDA: HOSPITAL */}
                <div className="p-3.5 rounded-lg border border-blh-slate-200 bg-blh-slate-50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blh-primary-dark text-white flex items-center justify-center text-sm font-bold shrink-0">
                      🏥
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-blh-primary tracking-wider block">
                        Ponto de Partida
                      </span>
                      <strong className="text-sm text-blh-slate-900">{LEITE_FLOW.hospitalName}</strong>
                      <span className="text-xs text-blh-slate-500 block">Saída da van com caixas térmicas e kits</span>
                    </div>
                  </div>
                  <span className="font-mono text-emerald-700 font-bold text-xs">08:00</span>
                </div>

                {/* PARADAS DAS DOADORAS */}
                {currentZoneStops.map((stop) => (
                  <StopCard
                    key={stop.donorId}
                    stop={stop}
                    onOpenColeta={() => setActiveModalDonorId(stop.donorId)}
                    onOpenSkip={() => setActiveSkipDonorId(stop.donorId)}
                  />
                ))}

                {/* PONTO DE RETORNO: HOSPITAL */}
                <div className="p-3.5 rounded-lg border border-blh-slate-200 bg-blh-slate-50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blh-primary-dark text-white flex items-center justify-center text-sm font-bold shrink-0">
                      🏥
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-blh-primary tracking-wider block">
                        Ponto de Retorno
                      </span>
                      <strong className="text-sm text-blh-slate-900">{LEITE_FLOW.hospitalName}</strong>
                      <span className="text-xs text-blh-slate-500 block">Recepção, triagem física e pasteurização dos frascos</span>
                    </div>
                  </div>
                  <span className="font-mono text-blh-slate-600 font-bold text-xs">Retorno</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Registro de Coleta */}
      {activeDonor && (
        <ColetaModal
          donor={activeDonor}
          isOpen={true}
          onClose={() => setActiveModalDonorId(null)}
        />
      )}

      {/* Modal de Parada Não Realizada */}
      {activeSkipDonor && (
        <SkipStopModal
          isOpen={true}
          donor={activeSkipDonor}
          onClose={() => setActiveSkipDonorId(null)}
          onConfirm={(motivo) => {
            skipStop(activeSkipDonor.id, motivo);
            setActiveSkipDonorId(null);
          }}
        />
      )}
    </div>
  );
};
