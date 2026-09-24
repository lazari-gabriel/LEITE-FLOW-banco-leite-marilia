import React, { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  X,
  Plus,
  Users,
  ClipboardList,
  ArrowUpDown,
  Play,
  Trash2,
  User,
  Truck,
  MapPin,
  CheckCircle2,
  Clock,
  Search,
  UserCheck,
  Lock,
  UserPlus,
  AlertTriangle,
  GripVertical,
  Route
} from 'lucide-react';
import { useApp } from '../../../hooks/useApp';
import { ZONE_BY_DAY } from '../../../constants/zones';
import { LEITE_FLOW } from '../../../constants/blh';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import { Donor } from '../../../types/donor';

type DispatcherTab = 'rota' | 'disponiveis';

interface RouteDispatcherProps {
  onNavigateToExecution?: () => void;
}

export const RouteDispatcher: React.FC<RouteDispatcherProps> = ({ onNavigateToExecution }) => {
  const {
    donors,
    selectedDay,
    routeAssignment,
    currentZoneStops,
    routeMetrics,
    addDonorToRoute,
    removeDonorFromRoute,
    reorderRouteStop,
    setDriverInfo,
    selectAllZoneDonors,
    clearRouteAssignment,
    activateRoute,
    optimizeCurrentRoute,
    setCurrentView
  } = useApp();

  const [activeTab, setActiveTab] = useState<DispatcherTab>('rota');
  const [searchAvailable, setSearchAvailable] = useState('');
  const [driverName, setDriverNameLocal] = useState(routeAssignment?.driverName || '');
  const [vehicleName, setVehicleNameLocal] = useState(routeAssignment?.vehicleName || '');

  const zoneConfig = ZONE_BY_DAY[selectedDay] || ZONE_BY_DAY['Segunda'];

  // Todas as doadoras aptas e ativas do sistema (permite exceções de outras zonas)
  const allAptActiveDonors = donors.filter(
    (d) => d.aptidao === 'Apta' && d.statusCadastro === 'ativa'
  );
  const assignedIds = routeAssignment?.donorIds || [];

  // Doadoras disponíveis (não atribuídas nesta rota)
  const availableDonors = allAptActiveDonors
    .filter((d) => !assignedIds.includes(d.id))
    .filter((d) => {
      if (!searchAvailable) return true;
      const q = searchAvailable.toLowerCase();
      return (
        d.nome.toLowerCase().includes(q) ||
        d.bairro.toLowerCase().includes(q) ||
        d.endereco.toLowerCase().includes(q) ||
        d.zona.toLowerCase().includes(q)
      );
    })
    // Prioriza as da zona do dia, depois as demais
    .sort((a, b) => {
      if (a.zona === zoneConfig.zona && b.zona !== zoneConfig.zona) return -1;
      if (b.zona === zoneConfig.zona && a.zona !== zoneConfig.zona) return 1;
      return a.nome.localeCompare(b.nome);
    });

  // Paradas na rota em ordem
  const routeStops = currentZoneStops;

  const handleDriverBlur = () => {
    setDriverInfo(driverName, vehicleName);
  };

  const canStartRoute = assignedIds.length > 0;
  const isCompleted = routeAssignment?.status === 'completed';
  const isActive = routeAssignment?.status === 'active';
  const isPlanning = !isActive && !isCompleted;

  // Drag and drop para reordenação manual das paradas
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!isPlanning) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (!isPlanning || draggedIndex === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (!isPlanning || draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    reorderRouteStop(draggedIndex, targetIndex);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header com Bento Grid de Frota */}
      <div className="bg-white rounded-2xl border border-blh-line shadow-card p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-blh-line">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-blh-primary bg-blh-primary-soft px-3 py-1 rounded-md border border-blh-primary/20">
                <Truck className="w-3.5 h-3.5 text-blh-primary" />
                Torre de Despacho &amp; Roteirização
              </span>
              {isCompleted ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-blue-900 bg-blue-100 px-3 py-1 rounded-md border border-blue-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" /> Rota Concluída
                </span>
              ) : isActive ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-950 bg-emerald-100 px-3 py-1 rounded-md border border-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Missão em Andamento
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-950 bg-amber-100 px-3 py-1 rounded-md border border-amber-300">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Planejamento / Expedição
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-blh-slate-900 tracking-tight">
              {isCompleted ? 'Missão Concluída' : isActive ? 'Rota em Campo' : 'Planejamento de Rota'} — Zona {zoneConfig.zona}
            </h1>
            <p className="text-xs sm:text-sm text-blh-slate-600 mt-1 max-w-2xl">
              {isCompleted
                ? 'Relatório oficial da rota de hoje arquivado com rastreabilidade total de frascos e coletas.'
                : isActive
                ? 'A van está em operação nas ruas de Marília. A lista de paradas está travada para segurança do trajeto.'
                : `Defina a tripulação da van, organize a sequência ideal de paradas da Zona ${zoneConfig.zona} e despache a rota.`}
            </p>
          </div>

          <div className="flex items-center gap-2.5 bg-blh-slate-50 p-3 rounded-xl border border-blh-line self-start lg:self-center shrink-0">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Truck className="w-5 h-5 text-emerald-700" />
            </div>
            <div className="text-xs">
              <div className="font-bold text-blh-slate-900 flex items-center gap-1.5">
                <span>Fiorino LF-2026</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-emerald-200 text-emerald-900 rounded font-bold">VAN 01</span>
              </div>
              <div className="text-[11px] text-blh-slate-500">Base: Hospital Materno Infantil</div>
            </div>
          </div>
        </div>

        {/* Bento Grid de Métricas de Frota */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-blh-slate-50/80 p-3.5 rounded-xl border border-blh-line flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blh-primary-soft text-blh-primary flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-blh-slate-500 uppercase tracking-wider block">Paradas na Rota</span>
              <span className="text-xl font-bold font-mono text-blh-primary tabular-nums">{assignedIds.length}</span>
            </div>
          </div>

          <div className="bg-blh-slate-50/80 p-3.5 rounded-xl border border-blh-line flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <Route className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-blh-slate-500 uppercase tracking-wider block">Distância Estimada</span>
              <span className="text-xl font-bold font-mono text-blh-slate-900 tabular-nums">{routeMetrics.distanceKm.toFixed(1)} <span className="text-xs font-normal text-blh-slate-500">km</span></span>
            </div>
          </div>

          <div className="bg-blh-slate-50/80 p-3.5 rounded-xl border border-blh-line flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-blh-slate-500 uppercase tracking-wider block">Tempo Previsto</span>
              <span className="text-xl font-bold font-mono text-blh-slate-900 tabular-nums">~{routeMetrics.estimatedMinutes} <span className="text-xs font-normal text-blh-slate-500">min</span></span>
            </div>
          </div>

          <div className="bg-blh-slate-50/80 p-3.5 rounded-xl border border-blh-line flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-blh-slate-500 uppercase tracking-wider block">Meta de Volume</span>
              <span className="text-xl font-bold font-mono text-emerald-800 tabular-nums">~{assignedIds.length * 150} <span className="text-xs font-normal text-blh-slate-500">mL</span></span>
            </div>
          </div>
        </div>

        {/* Atribuição da Tripulação Operacional */}
        <div className="p-4 rounded-xl bg-blh-slate-50/60 border border-blh-line">
          <div className="text-xs font-bold text-blh-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-2">
            <Users className="w-4 h-4 text-blh-primary" />
            Tripulação Escalada para a Rota
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-blh-slate-700 mb-1">
                Motorista / Condutor da Van
              </label>
              <input
                type="text"
                disabled={isActive}
                placeholder="Nome do motorista da van"
                value={driverName}
                onChange={(e) => setDriverNameLocal(e.target.value)}
                onBlur={handleDriverBlur}
                className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-blh-slate-300 focus:outline-none focus:ring-2 focus:ring-blh-primary/30 focus:border-blh-primary disabled:bg-blh-slate-100 disabled:cursor-not-allowed bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-blh-slate-700 mb-1">
                Pessoa que foi coletar (Coletor / Enfermagem)
              </label>
              <input
                type="text"
                disabled={isActive}
                placeholder="Nome da pessoa que foi coletar"
                value={vehicleName}
                onChange={(e) => setVehicleNameLocal(e.target.value)}
                onBlur={handleDriverBlur}
                className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg border border-blh-slate-300 focus:outline-none focus:ring-2 focus:ring-blh-primary/30 focus:border-blh-primary disabled:bg-blh-slate-100 disabled:cursor-not-allowed bg-white"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex flex-wrap gap-2.5">
          {isPlanning && canStartRoute && (
            <Button
              size="sm"
              onClick={() => {
                activateRoute();
                if (onNavigateToExecution) {
                  onNavigateToExecution();
                }
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
              leftIcon={<Play className="w-3.5 h-3.5 fill-white" />}
            >
              Iniciar Rota de Campo
            </Button>
          )}

          {isActive && onNavigateToExecution && (
            <Button
              size="sm"
              onClick={onNavigateToExecution}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
              leftIcon={<Play className="w-3.5 h-3.5 fill-white" />}
            >
              Ir para Executar Coletas
            </Button>
          )}

          {isPlanning && (
            <Button
              size="sm"
              variant="outline"
              onClick={optimizeCurrentRoute}
              leftIcon={<ArrowUpDown className="w-3.5 h-3.5 text-blh-primary" />}
              disabled={assignedIds.length < 2}
            >
              Melhorar Sequência
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => setCurrentView('mapa')}
            leftIcon={<MapPin className="w-3.5 h-3.5 text-blh-primary" />}
          >
            Ver no Mapa
          </Button>

          {isPlanning && routeAssignment && (
            <Button
              size="sm"
              variant="ghost"
              onClick={clearRouteAssignment}
              leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
              className="text-rose-600 hover:bg-rose-50"
            >
              Limpar Rota
            </Button>
          )}
        </div>
      </div>

      {/* Lock banner if active */}
      {isActive && (
        <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/80 text-emerald-950 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              <strong>Rota travada em andamento:</strong> A lista de paradas está fixada para a coleta de hoje.
            </span>
          </div>
          {onNavigateToExecution ? (
            <button
              onClick={onNavigateToExecution}
              className="text-[11px] font-bold text-emerald-800 underline hover:text-emerald-950"
            >
              Ir para Executar Coletas &rarr;
            </button>
          ) : (
            <span className="text-[11px] font-semibold text-emerald-800">
              Vá na aba "Executar Coletas" para realizar os atendimentos.
            </span>
          )}
        </div>
      )}

      {/* Completed banner */}
      {isCompleted && (
        <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/90 text-blue-950 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0" />
            <span>
              <strong>Rota Concluída e Arquivada:</strong> Todos os registros e etiquetas desta data estão salvos com rastreabilidade total.
            </span>
          </div>
          <span className="text-[11px] font-semibold text-blue-800">
            Somente Leitura
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-blh-slate-100 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveTab('rota')}
          className={`flex-1 flex items-center justify-center gap-2 text-sm font-semibold py-2.5 px-4 rounded-lg transition-all ${
            activeTab === 'rota'
              ? 'bg-white text-blh-primary shadow-sm'
              : 'text-blh-slate-600 hover:text-blh-slate-900'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Na Rota de Hoje
          {assignedIds.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-blh-primary text-white text-[10px] font-bold rounded-full">
              {assignedIds.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('disponiveis')}
          className={`flex-1 flex items-center justify-center gap-2 text-sm font-semibold py-2.5 px-4 rounded-lg transition-all ${
            activeTab === 'disponiveis'
              ? 'bg-white text-blh-primary shadow-sm'
              : 'text-blh-slate-600 hover:text-blh-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          Doadoras Disponíveis
          {availableDonors.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-blh-slate-400 text-white text-[10px] font-bold rounded-full">
              {availableDonors.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab: Na Rota de Hoje */}
      {activeTab === 'rota' && (
        <div className="bg-white rounded-xl border border-blh-line shadow-card overflow-hidden">
          {assignedIds.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="Nenhuma doadora na rota ainda"
                description="Vá em 'Doadoras Disponíveis' e adicione quem será visitada hoje."
                actionLabel="Ver Doadoras Disponíveis"
                onAction={() => setActiveTab('disponiveis')}
              />
            </div>
          ) : (
            <div className="p-4 sm:p-5 space-y-3">
              {/* Ponto de Partida: Hospital Materno Infantil */}
              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                    🏥
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">
                      Origem / Saída da Frota
                    </span>
                    <strong className="text-sm text-blh-slate-900">{LEITE_FLOW.hospitalName}</strong>
                    <span className="text-[11px] text-blh-slate-500 block">Embarque de caixas térmicas com gelo reciclável (≤ -10°C)</span>
                  </div>
                </div>
                <span className="font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-bold text-xs">08:00</span>
              </div>

              {/* Lista Conectada de Paradas */}
              <div className="relative border-l-2 border-dashed border-emerald-200 ml-4 pl-4 sm:pl-6 space-y-3.5 my-2">
                {routeStops.map((stop, index) => {
                  const donorObj = donors.find((d) => d.id === stop.donorId);
                  const isDifferentZone = donorObj && donorObj.zona !== zoneConfig.zona;

                  return (
                    <div
                      key={stop.donorId}
                      draggable={isPlanning}
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`relative p-3.5 sm:p-4 rounded-xl border transition-all ${
                        draggedIndex === index
                          ? 'opacity-40 bg-blh-slate-100 scale-[0.99] border-blh-line'
                          : dragOverIndex === index
                          ? 'border-t-2 border-blh-primary bg-blh-primary-soft/30'
                          : 'bg-white hover:bg-blh-slate-50/60 border-blh-line hover:border-blh-line-strong hover:shadow-xs'
                      } ${stop.collected || stop.skipped ? 'opacity-65 bg-blh-slate-50/40' : ''}`}
                    >
                      {/* Ponto indicador no timeline */}
                      <span className="absolute -left-[23px] sm:-left-[31px] top-4 w-3.5 h-3.5 rounded-full border-2 border-white bg-emerald-600 shadow-xs" />

                      <div className="flex items-center gap-3">
                        {/* Grip para arrastar */}
                        {isPlanning && (
                          <div
                            className="cursor-grab active:cursor-grabbing text-blh-slate-400 hover:text-blh-primary p-1 -ml-1 rounded shrink-0 transition-colors"
                            title="Arraste para reordenar esta parada"
                          >
                            <GripVertical className="w-4 h-4" />
                          </div>
                        )}

                        {/* Número da parada */}
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold font-mono tabular-nums shrink-0 shadow-xs ${
                            stop.collected
                              ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300'
                              : stop.skipped
                              ? 'bg-rose-100 text-rose-800 ring-1 ring-rose-300'
                              : stop.status === 'next'
                              ? 'bg-blh-primary text-white shadow-md'
                              : 'bg-blh-slate-100 text-blh-slate-800 border border-blh-slate-200'
                          }`}
                        >
                          {stop.collected ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                          ) : stop.skipped ? (
                            <X className="w-4 h-4 text-rose-700" />
                          ) : (
                            index + 1
                          )}
                        </div>

                        {/* Info da doadora */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-blh-slate-900 truncate">
                              {stop.donorName}
                            </span>
                            {isDifferentZone && (
                              <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 text-[10px] font-bold border border-purple-200">
                                Zona {donorObj.zona} (Exceção)
                              </span>
                            )}
                            {stop.status === 'next' && (
                              <span className="px-2 py-0.5 rounded-full bg-blh-primary-soft text-blh-primary text-[10px] font-extrabold uppercase tracking-wider">
                                Próxima
                              </span>
                            )}
                            {stop.collected && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                                Concluída
                              </span>
                            )}
                            {stop.skipped && (
                              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold uppercase tracking-wider">
                                Não Realizada
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-blh-slate-600 mt-0.5 flex-wrap">
                            <span className="truncate">{stop.neighborhood} — {stop.address}</span>
                            {stop.distanceFromPrevKm ? (
                              <span className="shrink-0 flex items-center gap-1 font-mono tabular-nums text-blh-slate-500 font-medium">
                                <Clock className="w-3 h-3 text-emerald-700" />
                                ~{stop.estimatedMinutesFromPrev}min ({stop.distanceFromPrevKm} km)
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {/* Controles de edição / reordenação / remoção (apenas em planejamento) */}
                        {isPlanning && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Reordenar */}
                            <button
                              type="button"
                              onClick={() => reorderRouteStop(index, Math.max(0, index - 1))}
                              disabled={index === 0}
                              className="w-8 h-8 rounded-lg border border-blh-slate-200 flex items-center justify-center text-blh-slate-700 hover:bg-blh-slate-100 hover:text-blh-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xs"
                              title="Mover para cima"
                              aria-label="Mover para cima"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => reorderRouteStop(index, Math.min(routeStops.length - 1, index + 1))}
                              disabled={index === routeStops.length - 1}
                              className="w-8 h-8 rounded-lg border border-blh-slate-200 flex items-center justify-center text-blh-slate-700 hover:bg-blh-slate-100 hover:text-blh-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xs"
                              title="Mover para baixo"
                              aria-label="Mover para baixo"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>

                            {/* Tirar só desta rota */}
                            <button
                              type="button"
                              onClick={() => removeDonorFromRoute(stop.donorId)}
                              className="w-8 h-8 rounded-lg border border-amber-300 bg-amber-50/50 flex items-center justify-center text-amber-800 hover:bg-amber-100 transition-all shadow-xs"
                              title="Tirar só desta rota (permanece ativa para futuras)"
                              aria-label="Tirar desta rota"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Ponto de Retorno: Hospital Materno Infantil */}
              <div className="p-3.5 rounded-xl border border-blh-slate-200 bg-blh-slate-50 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blh-slate-700 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                    🏥
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-blh-slate-600 tracking-wider block">
                      Destino / Desembarque no BLH
                    </span>
                    <strong className="text-sm text-blh-slate-900">{LEITE_FLOW.hospitalName}</strong>
                    <span className="text-[11px] text-blh-slate-500 block">Triagem, medição de temperatura das caixas e pasteurização</span>
                  </div>
                </div>
                <span className="font-mono text-blh-slate-700 bg-blh-slate-200 px-2 py-0.5 rounded font-bold text-xs">Retorno</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Doadoras Disponíveis */}
      {activeTab === 'disponiveis' && (
        <div className="bg-white rounded-xl border border-blh-line shadow-card">
          {/* Barra de busca + botão incluir todas da zona */}
          <div className="p-4 border-b border-blh-line flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-blh-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nome, bairro ou zona..."
                value={searchAvailable}
                onChange={(e) => setSearchAvailable(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-blh-slate-300 focus:outline-none focus:ring-2 focus:ring-blh-primary/30 focus:border-blh-primary"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentView('cadastro')}
                leftIcon={<UserPlus className="w-3.5 h-3.5" />}
              >
                Nova Doadora
              </Button>

              {isPlanning && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={selectAllZoneDonors}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Todas da Zona
                </Button>
              )}
            </div>
          </div>

          {availableDonors.length === 0 ? (
            <div className="p-6">
              {allAptActiveDonors.length === 0 ? (
                <EmptyState
                  title="Nenhuma doadora apta cadastrada no sistema"
                  description="Cadastre uma nova doadora para incluí-la na rota."
                  actionLabel="Cadastrar Doadora"
                  onAction={() => setCurrentView('cadastro')}
                />
              ) : (
                <EmptyState
                  title="Todas as doadoras já estão nesta rota!"
                  description="Vá para a aba 'Na Rota de Hoje' para ajustar a ordem."
                  actionLabel="Ver Rota"
                  onAction={() => setActiveTab('rota')}
                />
              )}
            </div>
          ) : (
            <div className="divide-y divide-blh-line max-h-[500px] overflow-y-auto">
              {availableDonors.map((donor) => {
                const diffTime = Math.abs(new Date().getTime() - new Date(donor.parto).getTime());
                const babyDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                const milkClass = babyDays <= 7 ? 'Colostro' : babyDays <= 14 ? 'Transição' : 'Maduro';
                const isCurrentZone = donor.zona === zoneConfig.zona;

                return (
                  <div
                    key={donor.id}
                    className="p-4 flex items-center gap-3 hover:bg-blh-slate-50/50 transition-colors"
                  >
                    {/* Avatar inicial */}
                    <div className="w-9 h-9 rounded-full bg-blh-primary-soft flex items-center justify-center text-blh-primary font-bold text-sm shrink-0">
                      {donor.nome.charAt(0)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-blh-slate-900 truncate">
                          {donor.nome}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isCurrentZone
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          Zona {donor.zona} {isCurrentZone ? '(Hoje)' : '(Exceção)'}
                        </span>
                      </div>
                      <div className="text-[11px] text-blh-slate-500 mt-0.5 flex items-center gap-2">
                        <span className="truncate">{donor.bairro} — {donor.endereco}</span>
                        <span className="shrink-0 px-1.5 py-0.5 rounded bg-blh-slate-100 text-blh-slate-600 font-medium">
                          {milkClass}
                        </span>
                      </div>
                    </div>

                    {/* Botão incluir (só se rascunho) */}
                    {isPlanning ? (
                      <button
                        type="button"
                        onClick={() => {
                          addDonorToRoute(donor.id);
                          setActiveTab('rota');
                        }}
                        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blh-primary-soft text-blh-primary text-xs font-bold hover:bg-blh-primary hover:text-white transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Incluir
                      </button>
                    ) : (
                      <span className="text-[11px] text-blh-slate-400 font-medium">Rota ativa</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Botão CTA: Iniciar Rota de Campo */}
      {canStartRoute && isPlanning && (
        <div className="sticky bottom-4">
          <Button
            size="lg"
            onClick={activateRoute}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base shadow-xl hover:shadow-2xl"
            leftIcon={<Play className="w-5 h-5 fill-white" />}
          >
            Iniciar Rota de Campo — {assignedIds.length} {assignedIds.length === 1 ? 'parada' : 'paradas'}
          </Button>
        </div>
      )}
    </div>
  );
};
