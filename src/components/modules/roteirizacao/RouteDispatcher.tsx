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
  Edit3,
  UserX,
  Lock,
  UserPlus,
  AlertTriangle,
  GripVertical
} from 'lucide-react';
import { useApp } from '../../../hooks/useApp';
import { ZONE_BY_DAY } from '../../../constants/zones';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import { Modal } from '../../ui/Modal';
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
    setCurrentView,
    deleteDonor,
    startEditDonor
  } = useApp();

  const [activeTab, setActiveTab] = useState<DispatcherTab>('rota');
  const [searchAvailable, setSearchAvailable] = useState('');
  const [driverName, setDriverNameLocal] = useState(routeAssignment?.driverName || '');
  const [vehicleName, setVehicleNameLocal] = useState(routeAssignment?.vehicleName || '');
  
  // Modal de inativação rápida
  const [inactivatingDonor, setInactivatingDonor] = useState<Donor | null>(null);

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

  const handleConfirmInactivate = () => {
    if (inactivatingDonor) {
      deleteDonor(inactivatingDonor.id);
      removeDonorFromRoute(inactivatingDonor.id);
      setInactivatingDonor(null);
    }
  };

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
      {/* Header */}
      <div className="bg-white rounded-xl border border-blh-line shadow-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-blh-primary bg-blh-primary-soft px-2.5 py-1 rounded-md">
                Despacho de Rota
              </span>
              {isCompleted ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-800 bg-blue-100 px-2.5 py-1 rounded-md">
                  <CheckCircle2 className="w-3 h-3 text-blue-700" /> Rota Concluída (Arquivada)
                </span>
              ) : isActive ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-md">
                  <Lock className="w-3 h-3" /> Em Andamento
                </span>
              ) : (
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-1 rounded-md">
                  Rascunho (Planejamento)
                </span>
              )}
            </div>
            <h2 className="text-lg font-sans font-bold text-blh-slate-900">
              {isCompleted ? 'Rota Concluída' : isActive ? 'Rota em Andamento' : 'Montando Rota'} — Zona {zoneConfig.zona}
            </h2>
            <p className="text-xs text-blh-slate-600 mt-0.5">
              {isCompleted
                ? 'Esta rota foi concluída e arquivada com sucesso. Modo somente leitura com rastreabilidade total.'
                : isActive
                ? 'A lista de paradas está travada durante a execução da coleta.'
                : 'Defina quem vai na rota, ajuste a ordem e confirme os dados antes de iniciar.'}
            </p>
          </div>

          {/* Resumo rápido */}
          <div className="flex items-center gap-4 text-xs shrink-0">
            <div className="text-center">
              <div className="font-bold font-mono tabular-nums text-2xl text-blh-primary">{assignedIds.length}</div>
              <div className="text-blh-slate-600 font-medium">paradas</div>
            </div>
            <div className="text-center">
              <div className="font-bold font-mono tabular-nums text-2xl text-blh-slate-800">{routeMetrics.distanceKm.toFixed(1)}</div>
              <div className="text-blh-slate-600 font-medium">km est.</div>
            </div>
            <div className="text-center">
              <div className="font-bold font-mono tabular-nums text-2xl text-blh-slate-800">{routeMetrics.estimatedMinutes}</div>
              <div className="text-blh-slate-600 font-medium">min est.</div>
            </div>
          </div>
        </div>

        {/* Driver / Vehicle fields */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-blh-slate-600 mb-1">
              <User className="inline w-3.5 h-3.5 mr-1 text-blh-primary" />
              Coletor / Motorista
            </label>
            <input
              type="text"
              disabled={isActive}
              placeholder="Nome do coletor responsável"
              value={driverName}
              onChange={(e) => setDriverNameLocal(e.target.value)}
              onBlur={handleDriverBlur}
              className="w-full text-sm px-3 py-2 rounded-lg border border-blh-slate-300 focus:outline-none focus:ring-2 focus:ring-blh-primary/30 focus:border-blh-primary disabled:bg-blh-slate-100 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-blh-slate-600 mb-1">
              <Truck className="inline w-3.5 h-3.5 mr-1 text-blh-primary" />
              Veículo / Van
            </label>
            <input
              type="text"
              disabled={isActive}
              placeholder="Ex: Van BLH — ABC-1234"
              value={vehicleName}
              onChange={(e) => setVehicleNameLocal(e.target.value)}
              onBlur={handleDriverBlur}
              className="w-full text-sm px-3 py-2 rounded-lg border border-blh-slate-300 focus:outline-none focus:ring-2 focus:ring-blh-primary/30 focus:border-blh-primary disabled:bg-blh-slate-100 disabled:cursor-not-allowed"
            />
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
        <div className="bg-white rounded-xl border border-blh-line shadow-card">
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
            <div className="divide-y divide-blh-line">
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
                    className={`p-4 flex items-center gap-3 transition-all ${
                      draggedIndex === index
                        ? 'opacity-40 bg-blh-slate-100 scale-[0.99]'
                        : dragOverIndex === index
                        ? 'border-t-2 border-blh-primary bg-blh-primary-soft/30'
                        : 'hover:bg-blh-slate-50/50'
                    } ${stop.collected || stop.skipped ? 'opacity-60' : ''}`}
                  >
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
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold font-mono tabular-nums shrink-0 shadow-xs ${
                        stop.collected
                          ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300'
                          : stop.skipped
                          ? 'bg-rose-100 text-rose-800 ring-1 ring-rose-300'
                          : stop.status === 'next'
                          ? 'bg-blh-primary text-white shadow-md'
                          : 'bg-blh-slate-200 text-blh-slate-700'
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
                      <div className="flex items-center gap-3 text-xs text-blh-slate-600 mt-0.5">
                        <span className="truncate">{stop.neighborhood} — {stop.address}</span>
                        {stop.distanceFromPrevKm ? (
                          <span className="shrink-0 flex items-center gap-1 font-mono tabular-nums text-blh-slate-500 font-medium">
                            <Clock className="w-3 h-3" />
                            ~{stop.estimatedMinutesFromPrev}min
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
                          className="w-9 h-9 min-h-[38px] min-w-[38px] rounded-lg border border-blh-slate-300 flex items-center justify-center text-blh-slate-700 hover:bg-blh-slate-100 hover:text-blh-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xs"
                          title="Mover para cima"
                          aria-label="Mover para cima"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => reorderRouteStop(index, Math.min(routeStops.length - 1, index + 1))}
                          disabled={index === routeStops.length - 1}
                          className="w-9 h-9 min-h-[38px] min-w-[38px] rounded-lg border border-blh-slate-300 flex items-center justify-center text-blh-slate-700 hover:bg-blh-slate-100 hover:text-blh-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xs"
                          title="Mover para baixo"
                          aria-label="Mover para baixo"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>

                        {/* Editar Doadora (redireciona para a aba Cadastro de Doadoras) */}
                        {donorObj && (
                          <button
                            type="button"
                            onClick={() => startEditDonor(donorObj.id)}
                            className="w-9 h-9 min-h-[38px] min-w-[38px] rounded-lg border border-blh-slate-300 flex items-center justify-center text-blh-primary hover:bg-blh-primary-soft transition-all shadow-xs"
                            title="Editar Cadastro da Doadora (Aba Cadastro)"
                            aria-label="Editar Doadora"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Tirar só desta rota */}
                        <button
                          type="button"
                          onClick={() => removeDonorFromRoute(stop.donorId)}
                          className="w-9 h-9 min-h-[38px] min-w-[38px] rounded-lg border border-amber-300 bg-amber-50/50 flex items-center justify-center text-amber-800 hover:bg-amber-100 transition-all shadow-xs"
                          title="Tirar só desta rota (permanece ativa para futuras)"
                          aria-label="Tirar desta rota"
                        >
                          <X className="w-4 h-4" />
                        </button>

                        {/* Inativar Cadastro */}
                        {donorObj && (
                          <button
                            type="button"
                            onClick={() => setInactivatingDonor(donorObj)}
                            className="w-9 h-9 min-h-[38px] min-w-[38px] rounded-lg border border-rose-300 bg-rose-50/50 flex items-center justify-center text-rose-700 hover:bg-rose-100 transition-all shadow-xs"
                            title="Inativar doadora permanentemente"
                            aria-label="Inativar doadora"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
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

      {/* Modal de Confirmação de Inativação */}
      {inactivatingDonor && (
        <Modal
          isOpen={true}
          onClose={() => setInactivatingDonor(null)}
          title="Confirmar Inativação da Doadora"
          subtitle={inactivatingDonor.nome}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-950 text-xs flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-rose-900">Remoção Lógica (Inativação)</p>
                <p className="mt-1 leading-relaxed text-rose-800">
                  A doadora <strong>{inactivatingDonor.nome}</strong> será removida das rotas atuais e futuras.
                </p>
                <p className="mt-2 font-semibold text-emerald-900 bg-emerald-100/60 p-2 rounded border border-emerald-300">
                  ✓ Regra de Ouro da Integridade: Todas as coletas e frascos já coletados por ela permanecerão intactos para sempre no histórico do Banco de Leite e no Dashboard.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-blh-line flex items-center justify-between gap-3">
              <Button type="button" variant="ghost" size="sm" onClick={() => setInactivatingDonor(null)}>
                Cancelar
              </Button>

              <Button
                type="button"
                size="md"
                onClick={handleConfirmInactivate}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
                leftIcon={<UserX className="w-4 h-4" />}
              >
                Inativar Doadora
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
