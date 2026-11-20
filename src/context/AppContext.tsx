import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Donor, DonorFormData, GoNoGoVerdict, WeekDay, ZoneName, StatusCadastro } from '../types/donor';
import { Bottle, CollectionFormData, LabelType } from '../types/bottle';
import { RouteAssignment, RouteMetrics, RouteStop, SkippedStop, StopStatus, RouteFormData, RouteStatus } from '../types/route';
import { ToastMessage, ViewMode } from '../types/common';
import { DAY_BY_ZONE } from '../constants/zones';
import { createDonorFromForm, evaluateGoNoGo, hasSerologyBecameAltered, updateDonorFromForm } from '../services/donorService';
import { createBottleFromCollection } from '../services/bottleService';
import { calculateRouteMetrics, optimizeDonorIdsNearestNeighbor, calculateHaversineKm } from '../services/routeService';
import { LEITE_FLOW } from '../constants/blh';
import { apiFetch, ApiError } from '../services/apiClient';
import { useAuth } from './AuthContext';

export type GuidedFlowStep =
  | 'overview'
  | 'navigating'
  | 'arrived'
  | 'collecting'
  | 'label_preview'
  | 'label_confirmed'
  | 'completed';

const VIEW_TO_PATH: Record<ViewMode, string> = {
  visao: '/dashboard',
  cadastro: '/doadoras',
  roteirizacao: '/rotas',
  mapa: '/mapa',
  etiquetas: '/etiquetas',
  accountability: '/laboratorio',
};

function pathToView(pathname: string): ViewMode {
  if (pathname.startsWith('/dashboard')) return 'visao';
  if (pathname.startsWith('/doadoras')) return 'cadastro';
  if (pathname.startsWith('/mapa')) return 'mapa';
  if (pathname.startsWith('/etiquetas')) return 'etiquetas';
  if (pathname.startsWith('/laboratorio')) return 'accountability';
  return 'roteirizacao';
}

export interface AppContextType {
  donors: Donor[];
  bottles: Bottle[];
  currentView: ViewMode;
  selectedDay: WeekDay;
  selectedBottleId: number | null;
  selectedBottle: Bottle | null;
  activeLabelType: LabelType;
  toasts: ToastMessage[];
  currentZoneStops: RouteStop[];
  routeMetrics: RouteMetrics;
  nextStop: RouteStop | null;
  activeFlowStep: GuidedFlowStep;
  activeStopDonorId: number | null;
  isRouteActive: boolean;
  isDataLoading: boolean;
  stats: {
    totalDonors: number;
    activeDonors: number;
    inactiveDonors: number;
    aptDonors: number;
    inaptDonors: number;
    totalBottles: number;
    totalVolumeMl: number;
    averageTemp: string;
    inventoryStock: number;
    bottlesWithMothers: number;
    returnRate: string;
  };
  setCurrentView: (view: ViewMode) => void;
  setSelectedDay: (day: WeekDay) => void;
  setSelectedBottleId: (id: number | null) => void;
  setActiveLabelType: (type: LabelType) => void;
  setActiveFlowStep: (step: GuidedFlowStep) => void;
  setActiveStopDonorId: (donorId: number | null) => void;
  startRoute: (targetRouteId?: string | unknown) => Promise<boolean>;
  handleArrivalAtStop: (donorId: number) => void;
  finishStopCollectionAndShowLabel: (formData: CollectionFormData) => Bottle;
  confirmLabelAndCompleteStop: (bottleId: number) => void;
  advanceToNextStop: () => void;
  addDonor: (data: DonorFormData) => { donor: Donor; verdict: GoNoGoVerdict };
  updateDonor: (donorId: number, data: DonorFormData) => { donor: Donor; verdict: GoNoGoVerdict } | null;
  deleteDonor: (donorId: number) => void;
  reactivateDonor: (donorId: number) => void;
  editingDonorId: number | null;
  editingDonor: Donor | null;
  startEditDonor: (donorId: number) => void;
  cancelEditDonor: () => void;
  recordCollection: (formData: CollectionFormData) => Bottle;
  optimizeCurrentRoute: (targetRouteId?: string | unknown) => void;
  navigateToDonorRoute: (zone: ZoneName, donorId: number) => void;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  routes: RouteAssignment[];
  activeRouteId: string | null;
  setActiveRouteId: (id: string) => void;
  createRoute: (data: RouteFormData) => RouteAssignment;
  updateRoute: (routeId: string, data: Partial<RouteAssignment>) => void;
  deleteRoute: (routeId: string) => void;
  duplicateRoute: (routeId: string) => RouteAssignment | null;
  getAllAssignedDonorIds: (day: WeekDay, excludeRouteId?: string) => Map<number, string>;
  routeAssignment: RouteAssignment | null;
  addDonorToRoute: (donorId: number, targetRouteId?: string) => void;
  removeDonorFromRoute: (donorId: number, targetRouteId?: string) => void;
  reorderRouteStop: (fromIndex: number, toIndex: number, targetRouteId?: string) => void;
  setDriverInfo: (name: string, vehicle: string, collectorName?: string, vehiclePlate?: string, targetRouteId?: string) => void;
  selectAllZoneDonors: (targetRouteId?: string | unknown) => void;
  clearRouteAssignment: (targetRouteId?: string | unknown) => void;
  activateRoute: (targetRouteId?: string | unknown) => Promise<boolean>;
  reopenEmptyRoute: (targetRouteId?: string | unknown) => Promise<boolean>;
  finishRoute: (targetRouteId?: string | unknown) => void;
  skipStop: (donorId: number, motivo: string, targetRouteId?: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const currentView = useMemo(() => pathToView(location.pathname), [location.pathname]);
  const setCurrentView = useCallback(
    (view: ViewMode) => {
      const targetPath = VIEW_TO_PATH[view] || '/rotas';
      if (location.pathname !== targetPath) {
        navigate(targetPath);
      }
    },
    [location.pathname, navigate]
  );

  // ── Queries reais via TanStack Query ────────────────────────────────────────
  const donorsQuery = useQuery({
    queryKey: ['donors'],
    queryFn: async () => (await apiFetch<{ data: Donor[] }>('/donors')).data,
    enabled: isAuthenticated,
  });

  const routesQuery = useQuery({
    queryKey: ['routes'],
    queryFn: async () => (await apiFetch<{ data: RouteAssignment[] }>('/routes')).data,
    enabled: isAuthenticated,
  });

  const bottlesQuery = useQuery({
    queryKey: ['bottles'],
    queryFn: async () => (await apiFetch<{ data: Bottle[] }>('/bottles')).data,
    enabled: isAuthenticated,
  });

  const summaryQuery = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => (await apiFetch<{ stats: AppContextType['stats'] }>('/dashboard/summary')).stats,
    enabled: isAuthenticated,
  });

  const donors = donorsQuery.data ?? [];
  const routes = routesQuery.data ?? [];
  const bottles = bottlesQuery.data ?? [];
  const isDataLoading = donorsQuery.isLoading || routesQuery.isLoading || bottlesQuery.isLoading;

  const [selectedDay, setSelectedDay] = useState<WeekDay>('Segunda');
  const [selectedBottleId, setSelectedBottleId] = useState<number | null>(null);
  const [activeLabelType, setActiveLabelType] = useState<LabelType>('coleta');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [activeFlowStep, setActiveFlowStep] = useState<GuidedFlowStep>('overview');
  const [activeStopDonorId, setActiveStopDonorId] = useState<number | null>(null);
  const [activeRouteId, setActiveRouteIdState] = useState<string | null>(null);
  const [editingDonorId, setEditingDonorId] = useState<number | null>(null);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const duration = toast.duration ?? 4500;
    setToasts((prev) => [...prev, { ...toast, id, duration }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleApiError = useCallback(
    (err: unknown, fallbackTitle: string) => {
      const msg = err instanceof ApiError ? err.message : 'Não foi possível concluir a operação. Verifique sua conexão e tente novamente.';
      addToast({ type: 'error', title: fallbackTitle, description: msg });
    },
    [addToast]
  );

  const invalidateAll = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['donors'] });
    void queryClient.invalidateQueries({ queryKey: ['routes'] });
    void queryClient.invalidateQueries({ queryKey: ['bottles'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
  }, [queryClient]);

  const editingDonor = useMemo(() => {
    if (!editingDonorId) return null;
    return donors.find((d) => d.id === editingDonorId) || null;
  }, [donors, editingDonorId]);

  const startEditDonor = useCallback(
    (donorId: number) => {
      setEditingDonorId(donorId);
      setCurrentView('cadastro');
    },
    [setCurrentView]
  );

  const cancelEditDonor = useCallback(() => {
    setEditingDonorId(null);
  }, []);

  const selectedBottle = useMemo(() => {
    if (!selectedBottleId) return bottles[0] || null;
    return bottles.find((b) => b.id === selectedBottleId) || bottles[0] || null;
  }, [bottles, selectedBottleId]);

  const routeAssignment = useMemo(() => {
    if (activeRouteId) {
      const match = routes.find((r) => r.id === activeRouteId);
      if (match) return match;
    }
    const dayRoute = routes.find((r) => r.day === selectedDay && r.status !== 'canceled');
    return dayRoute || routes[0] || null;
  }, [routes, activeRouteId, selectedDay]);

  const isRouteActive = routeAssignment?.status === 'active';

  const setActiveRouteId = useCallback(
    (id: string) => {
      setActiveRouteIdState(id);
      const target = routes.find((r) => r.id === id);
      if (target && target.day !== selectedDay) {
        setSelectedDay(target.day);
      }
    },
    [routes, selectedDay]
  );

  useEffect(() => {
    const routesForDay = routes.filter((r) => r.day === selectedDay && r.status !== 'canceled');
    if (routesForDay.length > 0) {
      if (!activeRouteId || !routesForDay.some((r) => r.id === activeRouteId)) {
        setActiveRouteIdState(routesForDay[0].id);
      }
    } else {
      setActiveRouteIdState(null);
    }
  }, [selectedDay, routes, activeRouteId]);

  // Paradas da rota ativa — usa status real da CollectionVisit (suporta coletas recorrentes!)
  const currentZoneStops = useMemo(() => {
    if (!routeAssignment) return [];

    const orderedDonors = (routeAssignment.donorIds || [])
      .map((id) => donors.find((d) => d.id === id && d.aptidao === 'Apta' && d.statusCadastro === 'ativa'))
      .filter(Boolean) as Donor[];

    const skippedIds = new Set(routeAssignment.skippedStops?.map((s) => s.donorId) ?? []);
    const visitsByDonor = new Map((routeAssignment.visits ?? []).map((v) => [v.donorId, v]));

    let prevCoords = LEITE_FLOW.coords;
    let foundNext = false;

    return orderedDonors.map((d, index) => {
      const visit = visitsByDonor.get(d.id);
      const visitBottleIds = visit?.bottleIds ?? [];
      const donorBottles =
        visitBottleIds.length > 0
          ? bottles.filter((b) => visitBottleIds.includes(b.id))
          : [];

      const isSkipped = visit ? visit.status === 'skipped' : skippedIds.has(d.id);
      const isCollected = visit ? visit.status === 'completed' || visitBottleIds.length > 0 : false;

      const rawDist = calculateHaversineKm(prevCoords[0], prevCoords[1], d.lat, d.lng) * 1.35;
      const distKm = Number(rawDist.toFixed(1));
      const mins = Math.max(3, Math.round(distKm * 2.2));
      prevCoords = [d.lat, d.lng];

      let status: StopStatus = 'pending';
      if (isSkipped) {
        status = 'skipped';
      } else if (isCollected) {
        status = 'completed';
      } else if (!foundNext) {
        status = 'next';
        foundNext = true;
      }

      if (activeStopDonorId === d.id && (activeFlowStep === 'arrived' || activeFlowStep === 'collecting')) {
        status = 'arrived';
      }

      const skipEntry = routeAssignment.skippedStops?.find((s) => s.donorId === d.id);
      const dParto = new Date(`${d.parto}T00:00:00`);
      const babyAgeDays = isNaN(dParto.getTime())
        ? 0
        : Math.max(0, Math.floor((Date.now() - dParto.getTime()) / (1000 * 60 * 60 * 24)));

      return {
        stopNumber: index + 1,
        donorId: d.id,
        donorName: d.nome,
        babyName: d.bebe,
        babyAgeDays,
        phone: d.telefone,
        address: d.endereco,
        neighborhood: d.bairro,
        lat: d.lat,
        lng: d.lng,
        equipment: d.equipamento,
        extraction: d.extracao,
        status,
        collected: isCollected,
        skipped: isSkipped,
        skipMotivo: visit?.skipReason || skipEntry?.motivo,
        bottlesCount: donorBottles.length,
        latestBottleId: donorBottles[0]?.id ?? visitBottleIds[visitBottleIds.length - 1],
        distanceFromPrevKm: distKm,
        estimatedMinutesFromPrev: mins,
      };
    });
  }, [donors, bottles, routeAssignment, activeStopDonorId, activeFlowStep]);

  const nextStop = useMemo(() => {
    return currentZoneStops.find((s) => !s.collected && !s.skipped) || null;
  }, [currentZoneStops]);

  const routeMetrics = useMemo(() => calculateRouteMetrics(currentZoneStops), [currentZoneStops]);

  // Estatísticas reais vindas da API (com fallback computado das queries locais)
  const stats = useMemo(() => {
    if (summaryQuery.data) return summaryQuery.data;

    const activeDonors = donors.filter((d) => d.statusCadastro === 'ativa').length;
    const inactiveDonors = donors.filter((d) => d.statusCadastro === 'inativa').length;
    const aptDonors = donors.filter((d) => d.aptidao === 'Apta' && d.statusCadastro === 'ativa').length;
    const inaptDonors = donors.filter(
      (d) => (d.aptidao === 'Inapta' && d.statusCadastro === 'ativa') || d.statusCadastro === 'inativa'
    ).length;
    const totalBottles = bottles.length;
    const totalVolumeMl = bottles.reduce((acc, b) => acc + b.volume, 0);
    const averageTemp =
      totalBottles > 0
        ? (bottles.reduce((acc, b) => acc + b.temp, 0) / totalBottles).toFixed(1)
        : '—';

    return {
      totalDonors: donors.length,
      activeDonors,
      inactiveDonors,
      aptDonors,
      inaptDonors,
      totalBottles,
      totalVolumeMl,
      averageTemp,
      inventoryStock: 0,
      bottlesWithMothers: 0,
      returnRate: '—',
    };
  }, [summaryQuery.data, donors, bottles]);

  const handleArrivalAtStop = useCallback(
    (donorId: number) => {
      setActiveStopDonorId(donorId);
      setActiveFlowStep('arrived');
      const stop = currentZoneStops.find((s) => s.donorId === donorId);
      addToast({
        type: 'success',
        title: 'Você Chegou ao Local!',
        description: `Iniciando atendimento na residência de ${stop?.donorName || 'doadora'}.`,
      });
    },
    [currentZoneStops, addToast]
  );

  // Registro persistente de coleta na API
  const finishStopCollectionAndShowLabel = useCallback(
    (formData: CollectionFormData) => {
      const donor = donors.find((d) => d.id === formData.doadoraId);
      if (!donor) throw new Error('Doadora não encontrada');

      const tempId = bottles.length > 0 ? Math.max(...bottles.map((b) => b.id)) + 1 : 1;
      const responsavel = routeAssignment?.collectorName || routeAssignment?.driverName;
      const optimisticBottle = createBottleFromCollection(formData, donor, tempId, tempId, responsavel);

      queryClient.setQueryData<Bottle[]>(['bottles'], (prev = []) => [optimisticBottle, ...prev]);
      setSelectedBottleId(optimisticBottle.id);
      setActiveFlowStep('label_preview');

      void apiFetch<{ bottle: Bottle }>('/bottles', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          routeId: routeAssignment?.id,
        }),
      })
        .then(({ bottle }) => {
          setSelectedBottleId(bottle.id);
          invalidateAll();
          addToast({
            type: 'success',
            title: 'Coleta Registrada ✓',
            description: `Coleta registrada para o frasco ${bottle.codigo}. Confira a etiqueta antes de confirmar.`,
          });
        })
        .catch((err) => {
          invalidateAll();
          handleApiError(err, 'Erro ao salvar coleta');
        });

      return optimisticBottle;
    },
    [donors, bottles, routeAssignment, queryClient, invalidateAll, addToast, handleApiError]
  );

  const confirmLabelAndCompleteStop = useCallback(
    (bottleId: number) => {
      setActiveFlowStep('completed');
      void apiFetch(`/bottles/${bottleId}/labels`, {
        method: 'POST',
        body: JSON.stringify({ labelType: activeLabelType, format: '60x40mm', reason: 'Conferência de campo' }),
      }).catch(() => {
        // Reimpressões ou validações extras serão exibidas na Fase 3 (Etiquetagem avançada)
      });
      addToast({
        type: 'success',
        title: 'Etiqueta Registrada com Sucesso ✓',
        description: 'Coleta concluída neste ponto da rota.',
      });
    },
    [activeLabelType, addToast]
  );

  // Corrigido: filtra !s.skipped além de !s.collected
  const advanceToNextStop = useCallback(() => {
    const remaining = currentZoneStops.filter(
      (s) => !s.collected && !s.skipped && s.donorId !== activeStopDonorId
    );
    if (remaining.length > 0) {
      setActiveStopDonorId(remaining[0].donorId);
      setActiveFlowStep('navigating');
      addToast({
        type: 'info',
        title: `Próxima Parada: ${remaining[0].donorName}`,
        description: `Distância estimada: ${remaining[0].distanceFromPrevKm} km (~${remaining[0].estimatedMinutesFromPrev} min).`,
      });
    } else {
      setActiveFlowStep('overview');
      setActiveStopDonorId(null);
      addToast({
        type: 'success',
        title: 'Rota Finalizada!',
        description: 'Todas as coletas de hoje foram resolvidas. Retorne ao Hospital Materno Infantil.',
      });
    }
  }, [currentZoneStops, activeStopDonorId, addToast]);

  // ── Doadoras (Persistidas na API) ───────────────────────────────────────────
  const addDonor = useCallback(
    (formData: DonorFormData) => {
      const verdict = evaluateGoNoGo(formData);
      const tempId = donors.length > 0 ? Math.max(...donors.map((d) => d.id)) + 1 : 1;
      const optimisticDonor = createDonorFromForm(formData, tempId);

      queryClient.setQueryData<Donor[]>(['donors'], (prev = []) => [optimisticDonor, ...prev]);

      void apiFetch<{ donor: Donor; verdict: GoNoGoVerdict }>('/donors', {
        method: 'POST',
        body: JSON.stringify(formData),
      })
        .then(({ donor, verdict: serverVerdict }) => {
          invalidateAll();
          if (serverVerdict.aptidao === 'Apta') {
            addToast({
              type: 'success',
              title: 'Doadora apta para doação',
              description: `Cadastro de ${donor.nome} concluído com sucesso.`,
            });
          } else if (serverVerdict.aptidao === 'Pendente') {
            addToast({
              type: 'info',
              title: 'Cadastro salvo — aguardando exames',
              description: `${donor.nome} cadastrada como pendente até o registro dos laudos sorológicos.`,
            });
          } else {
            addToast({
              type: 'warning',
              title: 'Doadora inapta na triagem',
              description: `Triagem indicou contraindicação clínica: ${serverVerdict.reasons[0]}`,
            });
          }
        })
        .catch((err) => {
          invalidateAll();
          handleApiError(err, 'Erro ao cadastrar doadora');
        });

      return { donor: optimisticDonor, verdict };
    },
    [donors, queryClient, invalidateAll, addToast, handleApiError]
  );

  const updateDonor = useCallback(
    (donorId: number, formData: DonorFormData) => {
      const oldDonor = donors.find((d) => d.id === donorId);
      if (!oldDonor) return null;

      const { donor: optimisticUpdated, verdict } = updateDonorFromForm(oldDonor, formData);
      const becameAltered = hasSerologyBecameAltered(oldDonor, formData);

      queryClient.setQueryData<Donor[]>(['donors'], (prev = []) =>
        prev.map((d) => (d.id === donorId ? optimisticUpdated : d))
      );

      void apiFetch<{ donor: Donor; verdict: GoNoGoVerdict }>(`/donors/${donorId}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      })
        .then(({ donor, verdict: serverVerdict }) => {
          invalidateAll();
          if (becameAltered || serverVerdict.aptidao === 'Inapta') {
            addToast({
              type: 'warning',
              title: becameAltered ? 'Sorologia reagente — doadora inapta' : 'Doadora inapta na triagem',
              description: `${donor.nome} foi marcada como inapta e removida da rota ativa.`,
            });
          } else if (donor.aptidao === 'Apta' && oldDonor.aptidao !== 'Apta') {
            addToast({
              type: 'success',
              title: 'Doadora liberada para doação',
              description: `${donor.nome} agora está apta para coleta na Zona ${donor.zona}.`,
            });
          } else {
            addToast({
              type: 'info',
              title: 'Informações atualizadas',
              description: `As informações de ${donor.nome} foram atualizadas com sucesso.`,
            });
          }
        })
        .catch((err) => {
          invalidateAll();
          handleApiError(err, 'Erro ao atualizar doadora');
        });

      return { donor: optimisticUpdated, verdict };
    },
    [donors, queryClient, invalidateAll, addToast, handleApiError]
  );

  const deleteDonor = useCallback(
    (donorId: number) => {
      const donor = donors.find((d) => d.id === donorId);
      if (!donor) return;

      queryClient.setQueryData<Donor[]>(['donors'], (prev = []) =>
        prev.map((d) => (d.id === donorId ? { ...d, statusCadastro: 'inativa' as StatusCadastro } : d))
      );

      void apiFetch(`/donors/${donorId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ statusCadastro: 'inativa' }),
      })
        .then(() => {
          invalidateAll();
          addToast({
            type: 'warning',
            title: 'Doadora Inativada',
            description: `${donor.nome} foi inativada com histórico preservado.`,
          });
        })
        .catch((err) => {
          invalidateAll();
          handleApiError(err, 'Erro ao inativar doadora');
        });
    },
    [donors, queryClient, invalidateAll, addToast, handleApiError]
  );

  const reactivateDonor = useCallback(
    (donorId: number) => {
      const donor = donors.find((d) => d.id === donorId);
      if (!donor) return;

      queryClient.setQueryData<Donor[]>(['donors'], (prev = []) =>
        prev.map((d) => (d.id === donorId ? { ...d, statusCadastro: 'ativa' as StatusCadastro } : d))
      );

      void apiFetch(`/donors/${donorId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ statusCadastro: 'ativa' }),
      })
        .then(() => {
          invalidateAll();
          addToast({
            type: 'success',
            title: 'Doadora Reativada',
            description: `${donor.nome} foi reativada com sucesso.`,
          });
        })
        .catch((err) => {
          invalidateAll();
          handleApiError(err, 'Erro ao reativar doadora');
        });
    },
    [donors, queryClient, invalidateAll, addToast, handleApiError]
  );

  const recordCollection = useCallback(
    (formData: CollectionFormData) => finishStopCollectionAndShowLabel(formData),
    [finishStopCollectionAndShowLabel]
  );

  // ── Rotas & Frota (Persistidas na API) ──────────────────────────────────────
  const persistRouteDonorIds = useCallback(
    (routeId: string, donorIds: number[]) => {
      queryClient.setQueryData<RouteAssignment[]>(['routes'], (prev = []) =>
        prev.map((r) => (r.id === routeId ? { ...r, donorIds } : r))
      );
      void apiFetch(`/routes/${routeId}`, {
        method: 'PATCH',
        body: JSON.stringify({ donorIds }),
      })
        .then(() => invalidateAll())
        .catch((err) => {
          invalidateAll();
          handleApiError(err, 'Erro ao atualizar paradas da rota');
        });
    },
    [queryClient, invalidateAll, handleApiError]
  );

  const optimizeCurrentRoute = useCallback(
    (targetRouteIdParam?: string | unknown) => {
      const targetRouteId = typeof targetRouteIdParam === 'string' ? targetRouteIdParam : routeAssignment?.id;
      const targetRoute = routes.find((r) => r.id === targetRouteId) || routeAssignment;
      if (!targetRoute) return;

      if (targetRoute.donorIds.length <= 1) {
        addToast({
          type: 'info',
          title: 'Rota Já Otimizada',
          description: 'A rota atual já possui o menor número de paradas lineares.',
        });
        return;
      }

      void apiFetch<{ route: RouteAssignment }>(`/routes/${targetRoute.id}/optimize`, {
        method: 'POST',
      })
        .then(({ route }) => {
          invalidateAll();
          addToast({
            type: 'success',
            title: 'Trajeto otimizado',
            description: `As paradas da rota ${route.code} (${route.name}) foram reorganizadas para reduzir o percurso.`,
          });
        })
        .catch(() => {
          const currentStopsDonors = targetRoute.donorIds
            .map((id) => donors.find((d) => d.id === id))
            .filter(Boolean) as Donor[];
          const optimizedIds = optimizeDonorIdsNearestNeighbor(currentStopsDonors);
          persistRouteDonorIds(targetRoute.id, optimizedIds);
          addToast({
            type: 'success',
            title: 'Trajeto otimizado',
            description: `As paradas da rota ${targetRoute.code} (${targetRoute.name}) foram reorganizadas por menor distância.`,
          });
        });
    },
    [routes, routeAssignment, donors, persistRouteDonorIds, invalidateAll, addToast]
  );

  const navigateToDonorRoute = useCallback(
    (zone: ZoneName, donorId: number) => {
      const day = (DAY_BY_ZONE[zone] as WeekDay) || 'Segunda';
      setSelectedDay(day);
      setActiveStopDonorId(donorId);
      setCurrentView('roteirizacao');
    },
    [setCurrentView]
  );

  const getAllAssignedDonorIds = useCallback(
    (day: WeekDay, excludeRouteId?: string) => {
      const map = new Map<number, string>();
      routes
        .filter((r) => r.day === day && r.id !== excludeRouteId && r.status !== 'canceled')
        .forEach((r) => {
          r.donorIds.forEach((id) => map.set(id, r.code));
        });
      return map;
    },
    [routes]
  );

  const createRoute = useCallback(
    (formData: RouteFormData) => {
      const tempId = `tmp-${Date.now()}`;
      const optimistic: RouteAssignment = {
        id: tempId,
        code: `ROT-${String(routes.length + 1).padStart(2, '0')}`,
        name: formData.name.trim() || `Rota Zona ${formData.zone}`,
        day: formData.day,
        zone: formData.zone,
        donorIds: formData.donorIds || [],
        driverName: formData.driverName,
        collectorName: formData.collectorName,
        vehicleName: formData.vehicleName,
        vehiclePlate: formData.vehiclePlate,
        shift: formData.shift,
        createdAt: new Date().toISOString(),
        status: 'planning',
        skippedStops: [],
        notes: formData.notes,
      };

      setSelectedDay(formData.day);

      void apiFetch<{ route: RouteAssignment }>('/routes', {
        method: 'POST',
        body: JSON.stringify(formData),
      })
        .then(({ route }) => {
          setActiveRouteIdState(route.id);
          invalidateAll();
          addToast({
            type: 'success',
            title: 'Rota Criada com Sucesso!',
            description: `${route.code} (${route.name}) salva com ${route.donorIds.length} paradas.`,
          });
        })
        .catch((err) => {
          invalidateAll();
          handleApiError(err, 'Erro ao criar rota');
        });

      return optimistic;
    },
    [routes.length, invalidateAll, addToast, handleApiError]
  );

  const updateRoute = useCallback(
    (routeId: string, updates: Partial<RouteAssignment>) => {
      const target = routes.find((r) => r.id === routeId);
      if (target && target.status !== 'planning') {
        addToast({
          type: 'warning',
          title: 'Edição bloqueada',
          description: 'Só é possível editar uma rota enquanto ela estiver em Planejamento.',
        });
        return;
      }

      queryClient.setQueryData<RouteAssignment[]>(['routes'], (prev = []) =>
        prev.map((r) => (r.id === routeId ? { ...r, ...updates } : r))
      );

      void apiFetch(`/routes/${routeId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      })
        .then(() => {
          invalidateAll();
          addToast({
            type: 'info',
            title: 'Rota Atualizada',
            description: 'As alterações da rota foram salvas com sucesso.',
          });
        })
        .catch((err) => {
          invalidateAll();
          handleApiError(err, 'Erro ao atualizar rota');
        });
    },
    [routes, queryClient, invalidateAll, addToast, handleApiError]
  );

  const deleteRoute = useCallback(
    (routeId: string) => {
      const target = routes.find((r) => r.id === routeId);
      if (target?.status === 'active') {
        addToast({
          type: 'warning',
          title: 'Rota em Trânsito',
          description: 'Não é possível excluir uma rota ativa em trânsito. Finalize-a antes de remover.',
        });
        return;
      }

      void apiFetch(`/routes/${routeId}`, { method: 'DELETE' })
        .then(() => {
          invalidateAll();
          addToast({
            type: 'warning',
            title: 'Rota Removida da Frota',
            description: `${target?.code || 'A rota'} foi excluída com sucesso.`,
          });
        })
        .catch((err) => {
          invalidateAll();
          handleApiError(err, 'Erro ao excluir rota');
        });
    },
    [routes, invalidateAll, addToast, handleApiError]
  );

  const duplicateRoute = useCallback(
    (routeId: string) => {
      const source = routes.find((r) => r.id === routeId);
      if (!source) return null;
      if (source.status !== 'planning') {
        addToast({
          type: 'warning',
          title: 'Duplicação bloqueada',
          description: 'Só é possível duplicar uma rota enquanto ela estiver em Planejamento.',
        });
        return null;
      }

      void apiFetch<{ route: RouteAssignment }>(`/routes/${routeId}/duplicate`, {
        method: 'POST',
      })
        .then(({ route }) => {
          setActiveRouteIdState(route.id);
          invalidateAll();
          addToast({
            type: 'success',
            title: 'Rota Duplicada',
            description: `${route.code} criada a partir de ${source.code} (sem conflito de paradas).`,
          });
        })
        .catch((err) => {
          invalidateAll();
          handleApiError(err, 'Erro ao duplicar rota');
        });

      return source;
    },
    [routes, invalidateAll, addToast, handleApiError]
  );

  const addDonorToRoute = useCallback(
    (donorId: number, targetRouteId?: string) => {
      const route = routes.find((r) => r.id === (targetRouteId || routeAssignment?.id));
      if (!route || route.donorIds.includes(donorId)) return;
      persistRouteDonorIds(route.id, [...route.donorIds, donorId]);
    },
    [routes, routeAssignment, persistRouteDonorIds]
  );

  const removeDonorFromRoute = useCallback(
    (donorId: number, targetRouteId?: string) => {
      const route = routes.find((r) => r.id === (targetRouteId || routeAssignment?.id));
      if (!route) return;
      persistRouteDonorIds(
        route.id,
        route.donorIds.filter((id) => id !== donorId)
      );
    },
    [routes, routeAssignment, persistRouteDonorIds]
  );

  const reorderRouteStop = useCallback(
    (fromIndex: number, toIndex: number, targetRouteId?: string) => {
      const route = routes.find((r) => r.id === (targetRouteId || routeAssignment?.id));
      if (!route) return;
      const ids = [...route.donorIds];
      const [moved] = ids.splice(fromIndex, 1);
      ids.splice(toIndex, 0, moved);
      persistRouteDonorIds(route.id, ids);
    },
    [routes, routeAssignment, persistRouteDonorIds]
  );

  const setDriverInfo = useCallback(
    (name: string, vehicle: string, collectorName?: string, vehiclePlate?: string, targetRouteId?: string) => {
      const routeId = targetRouteId || routeAssignment?.id;
      if (!routeId) return;
      updateRoute(routeId, {
        driverName: name,
        vehicleName: vehicle,
        ...(collectorName !== undefined ? { collectorName } : {}),
        ...(vehiclePlate !== undefined ? { vehiclePlate } : {}),
      });
    },
    [routeAssignment, updateRoute]
  );

  const selectAllZoneDonors = useCallback(
    (targetRouteIdParam?: string | unknown) => {
      const routeId = typeof targetRouteIdParam === 'string' ? targetRouteIdParam : routeAssignment?.id;
      const target = routes.find((r) => r.id === routeId) || routeAssignment;
      if (!target) return;

      const otherAssignedIds = new Set(
        routes
          .filter((r) => r.day === target.day && r.id !== target.id && r.status !== 'canceled')
          .flatMap((r) => r.donorIds)
      );

      const availableZoneIds = donors
        .filter(
          (d) =>
            d.zona === target.zone &&
            d.aptidao === 'Apta' &&
            d.statusCadastro === 'ativa' &&
            !otherAssignedIds.has(d.id)
        )
        .map((d) => d.id);

      persistRouteDonorIds(target.id, availableZoneIds);
      addToast({
        type: 'info',
        title: 'Todas incluídas',
        description: `${availableZoneIds.length} doadoras da Zona ${target.zone} atribuídas à ${target.code}.`,
      });
    },
    [routes, routeAssignment, donors, persistRouteDonorIds, addToast]
  );

  const clearRouteAssignment = useCallback(
    (targetRouteIdParam?: string | unknown) => {
      const routeId = typeof targetRouteIdParam === 'string' ? targetRouteIdParam : routeAssignment?.id;
      if (!routeId) return;
      persistRouteDonorIds(routeId, []);
      addToast({ type: 'info', title: 'Paradas limpas', description: 'As paradas da rota foram removidas.' });
    },
    [routeAssignment, persistRouteDonorIds, addToast]
  );

  const activateRoute = useCallback(
    async (targetRouteIdParam?: string | unknown): Promise<boolean> => {
      const routeId = typeof targetRouteIdParam === 'string' ? targetRouteIdParam : routeAssignment?.id;
      if (!routeId) return false;

      const target = routes.find((r) => r.id === routeId) || routeAssignment;
      if (!target || target.donorIds.length === 0) {
        addToast({
          type: 'warning',
          title: 'Rota sem doadoras',
          description:
            'Adicione pelo menos uma doadora em "Montar Paradas" antes de iniciar ou executar a rota.',
        });
        return false;
      }

      try {
        const { route } = await apiFetch<{ route: RouteAssignment }>(`/routes/${routeId}/start`, {
          method: 'POST',
        });
        setActiveRouteIdState(route.id);
        setActiveFlowStep('navigating');
        if (nextStop) setActiveStopDonorId(nextStop.donorId);
        invalidateAll();
        addToast({
          type: 'success',
          title: 'Rota Iniciada!',
          description: `${route.name} está em trânsito.`,
        });
        return true;
      } catch (err) {
        handleApiError(err, 'Não foi possível iniciar a rota');
        return false;
      }
    },
    [routes, routeAssignment, nextStop, invalidateAll, addToast, handleApiError]
  );

  const reopenEmptyRoute = useCallback(
    async (targetRouteIdParam?: string | unknown): Promise<boolean> => {
      const routeId = typeof targetRouteIdParam === 'string' ? targetRouteIdParam : routeAssignment?.id;
      if (!routeId) return false;

      try {
        const { route } = await apiFetch<{ route: RouteAssignment }>(`/routes/${routeId}/reopen`, {
          method: 'POST',
        });
        setActiveRouteIdState(route.id);
        invalidateAll();
        addToast({
          type: 'info',
          title: 'Rota devolvida ao planejamento',
          description: `${route.code} voltou para planejamento. Adicione ao menos uma doadora antes de iniciar.`,
        });
        return true;
      } catch (err) {
        handleApiError(err, 'Não foi possível retornar a rota ao planejamento');
        return false;
      }
    },
    [routeAssignment, invalidateAll, addToast, handleApiError]
  );

  const skipStop = useCallback(
    (donorId: number, motivo: string, targetRouteId?: string) => {
      const routeId = targetRouteId || routeAssignment?.id;
      if (!routeId) return;

      const skippedEntry: SkippedStop = { donorId, motivo, skippedAt: new Date().toISOString() };
      queryClient.setQueryData<RouteAssignment[]>(['routes'], (prev = []) =>
        prev.map((r) =>
          r.id === routeId
            ? { ...r, skippedStops: [...(r.skippedStops || []).filter((s) => s.donorId !== donorId), skippedEntry] }
            : r
        )
      );

      void apiFetch(`/routes/${routeId}/skip`, {
        method: 'POST',
        body: JSON.stringify({ donorId, motivo }),
      })
        .then(() => {
          invalidateAll();
          const donor = donors.find((d) => d.id === donorId);
          addToast({
            type: 'warning',
            title: 'Parada Não Realizada',
            description: `${donor?.nome || 'Doadora'} marcada como não realizada: "${motivo}"`,
          });
        })
        .catch((err) => {
          invalidateAll();
          handleApiError(err, 'Erro ao registrar parada não realizada');
        });
    },
    [routeAssignment, donors, queryClient, invalidateAll, addToast, handleApiError]
  );

  const finishRoute = useCallback(
    (targetRouteIdParam?: string | unknown) => {
      const routeId = typeof targetRouteIdParam === 'string' ? targetRouteIdParam : routeAssignment?.id;
      if (!routeId) return;

      void apiFetch<{ route: RouteAssignment }>(`/routes/${routeId}/finish`, {
        method: 'POST',
      })
        .then(({ route }) => {
          setActiveFlowStep('completed');
          setActiveStopDonorId(null);
          invalidateAll();
          addToast({
            type: 'success',
            title: 'Rota Finalizada com Sucesso!',
            description: `${route.name} concluída e arquivada permanentemente.`,
          });
        })
        .catch((err) => handleApiError(err, 'Não foi possível finalizar a rota'));
    },
    [routeAssignment, invalidateAll, addToast, handleApiError]
  );

  const value: AppContextType = {
    donors,
    bottles,
    currentView,
    selectedDay,
    selectedBottleId,
    selectedBottle,
    activeLabelType,
    toasts,
    currentZoneStops,
    routeMetrics,
    nextStop,
    activeFlowStep,
    activeStopDonorId,
    isRouteActive,
    isDataLoading,
    stats,
    setCurrentView,
    setSelectedDay,
    setSelectedBottleId,
    setActiveLabelType,
    setActiveFlowStep,
    setActiveStopDonorId,
    startRoute: activateRoute,
    handleArrivalAtStop,
    finishStopCollectionAndShowLabel,
    confirmLabelAndCompleteStop,
    advanceToNextStop,
    addDonor,
    updateDonor,
    deleteDonor,
    reactivateDonor,
    editingDonorId,
    editingDonor,
    startEditDonor,
    cancelEditDonor,
    recordCollection,
    optimizeCurrentRoute,
    navigateToDonorRoute,
    addToast,
    removeToast,
    routes,
    activeRouteId,
    setActiveRouteId,
    createRoute,
    updateRoute,
    deleteRoute,
    duplicateRoute,
    getAllAssignedDonorIds,
    routeAssignment,
    addDonorToRoute,
    removeDonorFromRoute,
    reorderRouteStop,
    setDriverInfo,
    selectAllZoneDonors,
    clearRouteAssignment,
    activateRoute,
    reopenEmptyRoute,
    finishRoute,
    skipStop,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp deve ser utilizado dentro de um AppProvider');
  }
  return context;
};
