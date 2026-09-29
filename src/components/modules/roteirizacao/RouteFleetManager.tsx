import React, { useState, useMemo } from 'react';
import { 
  Truck, 
  Plus, 
  Play, 
  MapPin, 
  Navigation, 
  CheckCircle2, 
  Clock, 
  User, 
  HeartHandshake, 
  Edit, 
  Trash2, 
  Copy, 
  Search, 
  Filter, 
  AlertCircle,
  Sparkles,
  Shield,
  Gauge,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../../../hooks/useApp';
import { RouteAssignment, RouteStatus } from '../../../types/route';
import { calculateHaversineKm } from '../../../services/routeService';
import { LEITE_FLOW } from '../../../constants/blh';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import { CreateRouteModal } from './CreateRouteModal';
import { EditRouteModal } from './EditRouteModal';
import { DeleteRouteConfirmModal } from './DeleteRouteConfirmModal';

interface RouteFleetManagerProps {
  onSelectRouteForEditing: (routeId: string) => void;
  onSelectRouteForExecution: (routeId: string) => void;
}

export const RouteFleetManager: React.FC<RouteFleetManagerProps> = ({
  onSelectRouteForEditing,
  onSelectRouteForExecution
}) => {
  const {
    routes,
    selectedDay,
    activeRouteId,
    setActiveRouteId,
    activateRoute,
    duplicateRoute,
    donors,
    bottles
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<'all' | RouteStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<RouteAssignment | null>(null);
  const [deletingRoute, setDeletingRoute] = useState<RouteAssignment | null>(null);

  // Rotas do dia selecionado
  const dayRoutes = useMemo(() => {
    return routes.filter((r) => r.day === selectedDay && r.status !== 'canceled');
  }, [routes, selectedDay]);

  // Rotas filtradas por busca e status
  const filteredRoutes = useMemo(() => {
    return dayRoutes.filter((r) => {
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      if (!matchStatus) return false;

      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        r.vehicleName.toLowerCase().includes(q) ||
        (r.vehiclePlate && r.vehiclePlate.toLowerCase().includes(q)) ||
        r.driverName.toLowerCase().includes(q) ||
        (r.collectorName && r.collectorName.toLowerCase().includes(q)) ||
        r.zone.toLowerCase().includes(q)
      );
    });
  }, [dayRoutes, statusFilter, searchTerm]);

  // Métricas Consolidadas da Frota do Dia
  const fleetMetrics = useMemo(() => {
    let totalStops = 0;
    let completedStops = 0;
    let totalKm = 0;
    let activeVehicles = 0;

    dayRoutes.forEach((route) => {
      if (route.status === 'active') activeVehicles++;
      const donorIds = route.donorIds || [];
      totalStops += donorIds.length;

      // Paradas concluídas
      donorIds.forEach((id) => {
        const hasBottle = bottles.some((b) => b.doadoraId === id);
        const isSkipped = route.skippedStops?.some((s) => s.donorId === id);
        if (hasBottle || isSkipped) {
          completedStops++;
        }
      });

      // Cálculo aproximado de Km por rota
      const routeDonors = donorIds
        .map((id) => donors.find((d) => d.id === id))
        .filter(Boolean);

      let prevCoords = LEITE_FLOW.coords;
      let rKm = 0;
      routeDonors.forEach((d) => {
        if (d) {
          rKm += calculateHaversineKm(prevCoords[0], prevCoords[1], d.lat, d.lng) * 1.35;
          prevCoords = [d.lat, d.lng];
        }
      });
      totalKm += rKm;
    });

    return {
      totalRoutes: dayRoutes.length,
      activeVehicles,
      totalStops,
      completedStops,
      totalKm: Number(totalKm.toFixed(1)),
      estimatedBottles: totalStops * 2
    };
  }, [dayRoutes, donors, bottles]);

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* ── 1. Painel de Métricas da Frota (Fleet KPIs) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Veículos / Rotas */}
        <div className="p-4 rounded-xl bg-white border border-blh-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blh-primary/10 text-blh-primary flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-blh-slate-500 uppercase tracking-wider">
              Frota no Dia
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-blh-slate-900">
                {fleetMetrics.totalRoutes}
              </span>
              <span className="text-xs text-blh-slate-500">
                ({fleetMetrics.activeVehicles} em rota)
              </span>
            </div>
          </div>
        </div>

        {/* Paradas Programadas */}
        <div className="p-4 rounded-xl bg-white border border-blh-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-blh-slate-500 uppercase tracking-wider">
              Paradas da Frota
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-emerald-700">
                {fleetMetrics.completedStops}/{fleetMetrics.totalStops}
              </span>
              <span className="text-xs text-blh-slate-500">concluídas</span>
            </div>
          </div>
        </div>

        {/* Quilometragem Estimada Total */}
        <div className="p-4 rounded-xl bg-white border border-blh-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-blh-slate-500 uppercase tracking-wider">
              Distância Estimada
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-blh-slate-900">
                {fleetMetrics.totalKm}
              </span>
              <span className="text-xs text-blh-slate-500 font-semibold">km totais</span>
            </div>
          </div>
        </div>

        {/* Frascos Previstos */}
        <div className="p-4 rounded-xl bg-white border border-blh-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-blh-slate-500 uppercase tracking-wider">
              Volume Estimado
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-blh-slate-900">
                ~{fleetMetrics.estimatedBottles}
              </span>
              <span className="text-xs text-blh-slate-500 font-semibold">frascos</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Barra de Filtros, Busca e Ações da Frota ── */}
      <div className="p-3.5 bg-white rounded-xl border border-blh-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Filtros em Pílula */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-blh-primary text-white shadow-sm'
                : 'bg-blh-slate-100 text-blh-slate-600 hover:bg-blh-slate-200'
            }`}
          >
            Todas ({dayRoutes.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
              statusFilter === 'active'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Em Trânsito ({dayRoutes.filter((r) => r.status === 'active').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('planning')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              statusFilter === 'planning'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            Planejamento ({dayRoutes.filter((r) => r.status === 'planning').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              statusFilter === 'completed'
                ? 'bg-blh-slate-800 text-white shadow-sm'
                : 'bg-blh-slate-100 text-blh-slate-700 hover:bg-blh-slate-200'
            }`}
          >
            Concluídas ({dayRoutes.filter((r) => r.status === 'completed').length})
          </button>
        </div>

        {/* Busca & Botão Nova Rota */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-56">
            <Search className="w-3.5 h-3.5 text-blh-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar rota, motorista..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-blh-slate-200 outline-none focus:ring-1 focus:ring-blh-primary"
            />
          </div>

          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="bg-blh-primary hover:bg-blh-primary-dark text-white font-bold whitespace-nowrap shadow-sm"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Nova Rota
          </Button>
        </div>
      </div>

      {/* ── 3. Grade de Cards de Rotas da Frota (CRUD) ── */}
      {filteredRoutes.length === 0 ? (
        <EmptyState
          icon={<Truck className="w-10 h-10 text-blh-slate-400" />}
          title="Nenhuma rota encontrada para este dia"
          description="Você pode criar uma nova rota de coleta para qualquer veículo da frota ou ajustar os filtros acima."
          actionLabel="Criar Primeira Rota"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRoutes.map((route, idx) => {
            const isSelected = activeRouteId === route.id;
            const donorIds = route.donorIds || [];
            const completedCount = donorIds.filter((id) =>
              bottles.some((b) => b.doadoraId === id) ||
              route.skippedStops?.some((s) => s.donorId === id)
            ).length;
            const totalCount = donorIds.length;
            const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
            const isActive = route.status === 'active';
            const isCompleted = route.status === 'completed';

            return (
              <div
                key={route.id}
                className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-elevation ${
                  isSelected
                    ? 'border-blh-primary ring-2 ring-blh-primary/20'
                    : 'border-blh-slate-200 hover:border-blh-slate-300'
                }`}
              >
                {/* Cabeçalho do Card */}
                <div className="p-4 border-b border-blh-slate-100 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-blh-slate-900 text-white font-mono text-xs font-black tracking-wide">
                        {route.code}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blh-slate-100 text-blh-slate-700">
                        {route.shift || 'Manhã'}
                      </span>
                    </div>

                    {/* Status Badge */}
                    {isActive ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-[11px] font-bold flex items-center gap-1.5 animate-pulseGlow">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        Em Trânsito
                      </span>
                    ) : isCompleted ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-blh-slate-100 text-blh-slate-700 text-[11px] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Concluída
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold">
                        Planejamento
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-blh-slate-900 line-clamp-1">
                      {route.name}
                    </h4>
                    <p className="text-xs text-blh-slate-500">
                      Zona {route.zone} • {route.day}-feira
                    </p>
                  </div>
                </div>

                {/* Corpo do Card: Veículo & Tripulação */}
                <div className="p-4 space-y-3 flex-1 bg-blh-slate-50/50 text-left">
                  {/* Veículo & Placa */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blh-slate-100 flex items-center justify-center shrink-0 text-blh-slate-700">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-blh-slate-800 truncate">
                        {route.vehicleName}
                      </p>
                      {route.vehiclePlate && (
                        <span className="inline-block font-mono text-[10px] font-bold px-1.5 py-0.2 bg-white rounded border border-blh-slate-300 text-blh-slate-600 uppercase">
                          {route.vehiclePlate}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tripulação (Rótulos Obrigatórios) */}
                  <div className="space-y-1.5 pt-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-blh-slate-500 w-28 shrink-0">
                        Motorista / Condutor:
                      </span>
                      <span className="font-semibold text-blh-slate-900 truncate">
                        {route.driverName || 'Não atribuído'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-blh-slate-500 w-28 shrink-0">
                        Pessoa que foi coletar:
                      </span>
                      <span className="font-semibold text-blh-slate-900 truncate">
                        {route.collectorName || 'Equipe BLH'}
                      </span>
                    </div>
                  </div>

                  {/* Barra de Progresso de Paradas */}
                  <div className="pt-2 border-t border-blh-slate-200/80 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-blh-slate-600 font-medium">Progresso da Rota:</span>
                      <span className="font-bold text-blh-slate-900">
                        {completedCount}/{totalCount} paradas ({percent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-blh-slate-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isCompleted
                            ? 'bg-blh-slate-700'
                            : isActive
                            ? 'bg-emerald-500'
                            : 'bg-blh-primary'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Rodapé de Ações do Card (CRUD Completo) */}
                <div className="p-3 bg-white border-t border-blh-slate-100 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1">
                    {/* Editar Metadados */}
                    <button
                      type="button"
                      onClick={() => setEditingRoute(route)}
                      title="Editar dados da rota (veículo/equipe)"
                      className="p-1.5 rounded-lg text-blh-slate-500 hover:text-blh-primary hover:bg-blh-slate-100 transition"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    {/* Duplicar Rota */}
                    <button
                      type="button"
                      onClick={() => duplicateRoute(route.id)}
                      title="Duplicar esta rota"
                      className="p-1.5 rounded-lg text-blh-slate-500 hover:text-blh-primary hover:bg-blh-slate-100 transition"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {/* Excluir Rota (desabilitada se ativa) */}
                    <button
                      type="button"
                      disabled={isActive}
                      onClick={() => setDeletingRoute(route)}
                      title={isActive ? 'Finalize a rota antes de excluir' : 'Excluir esta rota'}
                      className={`p-1.5 rounded-lg transition ${
                        isActive
                          ? 'text-blh-slate-300 cursor-not-allowed'
                          : 'text-blh-slate-400 hover:text-rose-600 hover:bg-rose-50'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Botão Configurar Paradas */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setActiveRouteId(route.id);
                        onSelectRouteForEditing(route.id);
                      }}
                      className="text-xs px-2.5 py-1.5 border-blh-slate-300 text-blh-slate-700 hover:bg-blh-slate-100"
                    >
                      Paradas ({totalCount})
                    </Button>

                    {/* Botão Iniciar / Executar */}
                    {isActive ? (
                      <Button
                        size="sm"
                        onClick={() => {
                          setActiveRouteId(route.id);
                          onSelectRouteForExecution(route.id);
                        }}
                        className="text-xs px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                        rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                      >
                        Executar
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => {
                          activateRoute(route.id);
                          onSelectRouteForExecution(route.id);
                        }}
                        className="text-xs px-2.5 py-1.5 bg-blh-primary hover:bg-blh-primary-dark text-white font-bold"
                        leftIcon={<Play className="w-3 h-3 fill-white" />}
                      >
                        Iniciar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modais de CRUD da Frota ── */}
      <CreateRouteModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        defaultDay={selectedDay}
        onCreated={(routeId) => onSelectRouteForEditing(routeId)}
      />

      <EditRouteModal
        isOpen={!!editingRoute}
        onClose={() => setEditingRoute(null)}
        route={editingRoute}
      />

      <DeleteRouteConfirmModal
        isOpen={!!deletingRoute}
        onClose={() => setDeletingRoute(null)}
        route={deletingRoute}
      />
    </div>
  );
};
