import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { Donor, DonorFormData, GoNoGoVerdict, WeekDay, ZoneName, AptidaoStatus, StatusCadastro } from '../types/donor';
import { Bottle, CollectionFormData, LabelType } from '../types/bottle';
import { RouteAssignment, RouteMetrics, RouteStop, SkippedStop, StopStatus, RouteFormData, RouteShift, RouteStatus } from '../types/route';
import { ToastMessage, ViewMode } from '../types/common';
import { INITIAL_DONORS } from '../data/initialDonors';
import { INITIAL_BOTTLES } from '../data/initialBottles';
import { INITIAL_ROUTES, FLEET_VEHICLES, FLEET_DRIVERS, FLEET_COLLECTORS } from '../data/initialRoutes';
import { DAY_BY_ZONE, ZONE_BY_DAY } from '../constants/zones';
import { createDonorFromForm, evaluateGoNoGo, updateDonorFromForm } from '../services/donorService';
import { createBottleFromCollection } from '../services/bottleService';
import { calculateRouteMetrics, optimizeStopsNearestNeighbor, optimizeDonorIdsNearestNeighbor, calculateHaversineKm } from '../services/routeService';
import { LEITE_FLOW } from '../constants/blh';

export type GuidedFlowStep = 
  | 'overview'        // Visualizando rota
  | 'navigating'      // Indo para parada (Google Maps aberto / a caminho)
  | 'arrived'         // Chegou ao local
  | 'collecting'      // Preenchendo ficha de coleta
  | 'label_preview'   // Visualizando etiqueta gerada
  | 'label_confirmed' // Etiqueta conferida
  | 'completed';      // Coleta concluída com sucesso

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
  startRoute: (targetRouteId?: string | unknown) => void;
  handleArrivalAtStop: (donorId: number) => void;
  finishStopCollectionAndShowLabel: (formData: CollectionFormData) => Bottle;
  confirmLabelAndCompleteStop: (bottleId: number) => void;
  advanceToNextStop: () => void;
  addDonor: (data: DonorFormData) => { donor: Donor; verdict: GoNoGoVerdict };
  updateDonor: (donorId: number, data: DonorFormData) => void;
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
  // Route & Fleet Dispatcher (CRUD Multi-Veículo)
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
  activateRoute: (targetRouteId?: string | unknown) => void;
  finishRoute: (targetRouteId?: string | unknown) => void;
  skipStop: (donorId: number, motivo: string, targetRouteId?: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [donors, setDonors] = useState<Donor[]>(INITIAL_DONORS);
  const [bottles, setBottles] = useState<Bottle[]>(INITIAL_BOTTLES);
  const [currentView, setCurrentView] = useState<ViewMode>('roteirizacao'); // Roteirização como foco do coletor
  const [selectedDay, setSelectedDay] = useState<WeekDay>('Segunda');
  const [selectedBottleId, setSelectedBottleId] = useState<number | null>(INITIAL_BOTTLES[0]?.id ?? null);
  const [activeLabelType, setActiveLabelType] = useState<LabelType>('coleta');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Estado do Fluxo Guiado de Coleta em Campo
  const [activeFlowStep, setActiveFlowStep] = useState<GuidedFlowStep>('overview');
  const [activeStopDonorId, setActiveStopDonorId] = useState<number | null>(null);

  // Estado do Despachante / Gestão de Frota Multi-Veículo (CRUD)
  const [routes, setRoutes] = useState<RouteAssignment[]>(INITIAL_ROUTES);
  const [activeRouteId, setActiveRouteIdState] = useState<string | null>(INITIAL_ROUTES[0]?.id || null);

  // Estado de Edição de Doadora Centralizada na Aba Cadastro
  const [editingDonorId, setEditingDonorId] = useState<number | null>(null);

  const editingDonor = useMemo(() => {
    if (!editingDonorId) return null;
    return donors.find((d) => d.id === editingDonorId) || null;
  }, [donors, editingDonorId]);

  const startEditDonor = useCallback((donorId: number) => {
    setEditingDonorId(donorId);
    setCurrentView('cadastro');
  }, []);

  const cancelEditDonor = useCallback(() => {
    setEditingDonorId(null);
  }, []);

  // Toast System
  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const duration = toast.duration ?? 4500;
    const newToast: ToastMessage = { ...toast, id, duration };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Frasco selecionado
  const selectedBottle = useMemo(() => {
    if (!selectedBottleId) return bottles[0] || null;
    return bottles.find((b) => b.id === selectedBottleId) || bottles[0] || null;
  }, [bottles, selectedBottleId]);

  // Paradas da Zona selecionada pelo Dia com cálculo de status
  const currentZoneConfig = useMemo(() => ZONE_BY_DAY[selectedDay] || ZONE_BY_DAY['Segunda'], [selectedDay]);

  // Rota ativa computada
  const routeAssignment = useMemo(() => {
    if (activeRouteId) {
      const match = routes.find((r) => r.id === activeRouteId);
      if (match) return match;
    }
    const dayRoute = routes.find((r) => r.day === selectedDay && r.status !== 'canceled');
    return dayRoute || routes[0] || null;
  }, [routes, activeRouteId, selectedDay]);

  const isRouteActive = routeAssignment?.status === 'active';

  const setActiveRouteId = useCallback((id: string) => {
    setActiveRouteIdState(id);
    const target = routes.find((r) => r.id === id);
    if (target && target.day !== selectedDay) {
      setSelectedDay(target.day);
    }
  }, [routes, selectedDay]);

  // Sincronização inteligente de rotas ao selecionar o dia
  useEffect(() => {
    const routesForDay = routes.filter((r) => r.day === selectedDay && r.status !== 'canceled');
    if (routesForDay.length > 0) {
      if (!activeRouteId || !routesForDay.some((r) => r.id === activeRouteId)) {
        setActiveRouteIdState(routesForDay[0].id);
      }
    } else {
      // Auto-inicializa rota primária ROT-0X para o dia caso ainda não exista nenhuma
      const zone = currentZoneConfig.zona;
      const codeNum = routes.length + 1;
      const code = `ROT-${String(codeNum).padStart(2, '0')}`;
      const defaultVehicle = FLEET_VEHICLES[0] || { name: 'Van 01 - Mercedes-Benz Sprinter BLH', plate: 'BRA-2E19' };
      const defaultDriver = FLEET_DRIVERS[0] || { name: 'Carlos Alberto Silva' };
      const defaultCollector = FLEET_COLLECTORS[0] || { name: 'Enfª Cláudia Guimarães' };

      const zoneDonors = donors.filter(
        (d) => d.zona === zone && d.aptidao === 'Apta' && d.statusCadastro === 'ativa'
      );
      const autoOrderedIds = optimizeDonorIdsNearestNeighbor(zoneDonors);

      const newPrimaryRoute: RouteAssignment = {
        id: `rot-${selectedDay.toLowerCase()}-primary`,
        code,
        name: `Van 01 - Rota ${zone} Principal`,
        day: selectedDay,
        zone,
        donorIds: autoOrderedIds,
        driverName: defaultDriver.name,
        collectorName: defaultCollector.name,
        vehicleName: defaultVehicle.name,
        vehiclePlate: defaultVehicle.plate,
        shift: 'Manhã',
        createdAt: new Date().toISOString(),
        status: 'planning',
        skippedStops: []
      };

      setRoutes((prev) => [...prev, newPrimaryRoute]);
      setActiveRouteIdState(newPrimaryRoute.id);
    }
  }, [selectedDay, currentZoneConfig.zona, donors, routes, activeRouteId]);

  const currentZoneStops = useMemo(() => {
    if (!routeAssignment) return [];

    let orderedDonors: Donor[];
    if (routeAssignment.donorIds && routeAssignment.donorIds.length > 0) {
      orderedDonors = routeAssignment.donorIds
        .map((id) => donors.find((d) => d.id === id && d.aptidao === 'Apta' && d.statusCadastro === 'ativa'))
        .filter(Boolean) as Donor[];
    } else {
      orderedDonors = [];
    }

    const skippedIds = new Set(routeAssignment.skippedStops?.map((s) => s.donorId) ?? []);

    let prevCoords = LEITE_FLOW.coords;
    let foundNext = false;

    return orderedDonors.map((d, index) => {
      const donorBottles = bottles.filter((b) => b.doadoraId === d.id);
      const isCollected = donorBottles.length > 0;
      const isSkipped = skippedIds.has(d.id);

      // Cálculo de distância da parada anterior
      const rawDist = calculateHaversineKm(prevCoords[0], prevCoords[1], d.lat, d.lng) * 1.35;
      const distKm = Number(rawDist.toFixed(1));
      const mins = Math.max(3, Math.round(distKm * 2.2));
      prevCoords = [d.lat, d.lng];

      // Cálculo do status da parada
      let status: StopStatus = 'pending';
      if (isSkipped) {
        status = 'skipped';
      } else if (isCollected) {
        status = 'completed';
      } else if (!foundNext) {
        status = 'next';
        foundNext = true;
      }

      // Se a parada estiver em atendimento ativo
      if (activeStopDonorId === d.id) {
        if (activeFlowStep === 'arrived') status = 'arrived';
        else if (activeFlowStep === 'collecting') status = 'arrived';
      }

      // Motivo do skip se houver
      const skipEntry = routeAssignment.skippedStops?.find((s) => s.donorId === d.id);

      // Idade do bebê em dias
      const dParto = new Date(d.parto);
      const diffTime = Math.abs(new Date().getTime() - dParto.getTime());
      const babyAgeDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

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
        skipMotivo: skipEntry?.motivo,
        bottlesCount: donorBottles.length,
        latestBottleId: donorBottles[donorBottles.length - 1]?.id,
        distanceFromPrevKm: distKm,
        estimatedMinutesFromPrev: mins
      };
    });
  }, [donors, bottles, routeAssignment, activeStopDonorId, activeFlowStep]);

  // Próxima Parada Ativa (a primeira nem concluída nem skipada)
  const nextStop = useMemo(() => {
    return currentZoneStops.find((s) => !s.collected && !s.skipped) || null;
  }, [currentZoneStops]);

  // Métricas da rota atual
  const routeMetrics = useMemo(() => {
    return calculateRouteMetrics(currentZoneStops);
  }, [currentZoneStops]);

  // Estatísticas Globais
  const stats = useMemo(() => {
    const activeDonors = donors.filter((d) => d.statusCadastro === 'ativa').length;
    const inactiveDonors = donors.filter((d) => d.statusCadastro === 'inativa').length;
    const aptDonors = donors.filter((d) => d.aptidao === 'Apta' && d.statusCadastro === 'ativa').length;
    const inaptDonors = donors.filter((d) => (d.aptidao === 'Inapta' && d.statusCadastro === 'ativa') || d.statusCadastro === 'inativa').length;
    const totalBottles = bottles.length;

    let totalVolumeMl = 0;
    let tempSum = 0;

    bottles.forEach((b) => {
      totalVolumeMl += b.volume;
      tempSum += b.temp;
    });

    const averageTemp = totalBottles > 0 ? (tempSum / totalBottles).toFixed(1) : '-17.2';
    const inventoryStock = 142; // Estoque padrão esterilizado BLH
    const bottlesWithMothers = aptDonors * 4;
    const returnRate = '98.4%';

    return {
      totalDonors: donors.length,
      activeDonors,
      inactiveDonors,
      aptDonors,
      inaptDonors,
      totalBottles,
      totalVolumeMl,
      averageTemp,
      inventoryStock,
      bottlesWithMothers,
      returnRate
    };
  }, [donors, bottles]);



  // Registro de Chegada à Parada ("CHEGUEI")
  const handleArrivalAtStop = useCallback((donorId: number) => {
    setActiveStopDonorId(donorId);
    setActiveFlowStep('arrived');
    const stop = currentZoneStops.find((s) => s.donorId === donorId);
    addToast({
      type: 'success',
      title: 'Você Chegou ao Local!',
      description: `Iniciando atendimento na residência de ${stop?.donorName || 'doadora'}.`
    });
  }, [currentZoneStops, addToast]);

  // Finalização da Coleta e Transição Imediata para Etiqueta
  const finishStopCollectionAndShowLabel = useCallback((formData: CollectionFormData) => {
    const donor = donors.find((d) => d.id === formData.doadoraId);
    if (!donor) throw new Error('Doadora não encontrada');

    const nextId = bottles.length > 0 ? Math.max(...bottles.map((b) => b.id)) + 1 : 1;
    const seqIndex = bottles.length + 123;
    const newBottle = createBottleFromCollection(formData, donor, nextId, seqIndex);

    setBottles((prev) => [newBottle, ...prev]);
    setSelectedBottleId(newBottle.id);
    setActiveFlowStep('label_preview');

    addToast({
      type: 'success',
      title: 'Coleta Registrada ✓',
      description: `Frasco ${newBottle.codigo} gerado. Revise e confirme a etiqueta antes de avançar.`
    });

    return newBottle;
  }, [donors, bottles, addToast]);

  // Confirmação da Etiqueta e Avanço para Próxima Parada
  const confirmLabelAndCompleteStop = useCallback((bottleId: number) => {
    setActiveFlowStep('completed');
    addToast({
      type: 'success',
      title: 'Etiqueta Registrada com Sucesso ✓',
      description: 'Coleta concluída neste ponto da rota.'
    });
  }, [addToast]);

  // Avançar para a próxima parada da rota
  const advanceToNextStop = useCallback(() => {
    const remaining = currentZoneStops.filter((s) => !s.collected && s.donorId !== activeStopDonorId);
    if (remaining.length > 0) {
      setActiveStopDonorId(remaining[0].donorId);
      setActiveFlowStep('navigating');
      addToast({
        type: 'info',
        title: `Próxima Parada: ${remaining[0].donorName}`,
        description: `Distância estimada: ${remaining[0].distanceFromPrevKm} km (~${remaining[0].estimatedMinutesFromPrev} min).`
      });
    } else {
      setActiveFlowStep('overview');
      setActiveStopDonorId(null);
      addToast({
        type: 'success',
        title: '🎉 Rota Finalizada!',
        description: 'Todas as coletas de hoje foram realizadas com sucesso. Retorne ao Hospital Materno Infantil.'
      });
    }
  }, [currentZoneStops, activeStopDonorId, addToast]);

  // Cadastro de Doadora com Triagem Go/No-Go
  const addDonor = useCallback((formData: DonorFormData) => {
    const verdict = evaluateGoNoGo(formData);
    const nextId = donors.length > 0 ? Math.max(...donors.map((d) => d.id)) + 1 : 1;
    const newDonor = createDonorFromForm(formData, nextId);

    setDonors((prev) => [newDonor, ...prev]);

    if (verdict.approved) {
      addToast({
        type: 'success',
        title: 'Doadora Aprovada (GO)',
        description: `${newDonor.nome} foi cadastrada com sucesso e liberada para a rota da Zona ${newDonor.zona}.`
      });
    } else {
      addToast({
        type: 'warning',
        title: 'Doadora Bloqueada (NO-GO)',
        description: `Triagem indicou contraindicação sanitária: ${verdict.reasons[0]}`
      });
    }

    return { donor: newDonor, verdict };
  }, [donors, addToast]);

  // Edição de Doadora existente
  const updateDonor = useCallback((donorId: number, formData: DonorFormData) => {
    setDonors((prev) => {
      const oldDonor = prev.find((d) => d.id === donorId);
      if (!oldDonor) return prev;

      const updatedDonor = updateDonorFromForm(oldDonor, formData);

      // Check if sorologia changed for toast message
      const sorologiaChanged = oldDonor.sorologia1 !== formData.soro1Res ||
                               oldDonor.sorologia2 !== formData.soro2Res ||
                               oldDonor.sorologia3 !== formData.soro3Res;

      if (sorologiaChanged) {
        addToast({
          type: 'warning',
          title: 'Sorologia Alterada - Regra de Ouro',
          description: `${updatedDonor.nome} foi marcada como Inapta e removida da rota ativa automaticamente.`
        });
      } else if (updatedDonor.aptidao === 'Apta' && oldDonor.aptidao !== 'Apta') {
        addToast({
          type: 'success',
          title: 'Doadora Reabilitada',
          description: `${updatedDonor.nome} agora está Apta e disponível para a rota da Zona ${updatedDonor.zona}.`
        });
      } else {
        addToast({
          type: 'info',
          title: 'Dados Atualizados',
          description: `${updatedDonor.nome} teve seus dados atualizados com sucesso.`
        });
      }

      return prev.map((d) => (d.id === donorId ? updatedDonor : d));
    });
  }, [addToast]);

  // Soft delete - inativar doadora (preserva histórico de coletas)
  const deleteDonor = useCallback((donorId: number) => {
    setDonors((prev) => {
      const donor = prev.find((d) => d.id === donorId);
      if (!donor) return prev;

      addToast({
        type: 'warning',
        title: 'Doadora Inativada',
        description: `${donor.nome} foi inativada. Coletas anteriores permanecem 100% preservadas no histórico e no Dashboard.`
      });

      return prev.map((d) =>
        d.id === donorId ? { ...d, statusCadastro: 'inativa' as StatusCadastro } : d
      );
    });
  }, [addToast]);

  // Reativar doadora previamente inativada
  const reactivateDonor = useCallback((donorId: number) => {
    setDonors((prev) => {
      const donor = prev.find((d) => d.id === donorId);
      if (!donor) return prev;

      addToast({
        type: 'success',
        title: 'Doadora Reativada',
        description: `${donor.nome} foi reativada com sucesso no cadastro central.`
      });

      return prev.map((d) =>
        d.id === donorId ? { ...d, statusCadastro: 'ativa' as StatusCadastro } : d
      );
    });
  }, [addToast]);

  // Registro de Coleta Avulsa
  const recordCollection = useCallback((formData: CollectionFormData) => {
    return finishStopCollectionAndShowLabel(formData);
  }, [finishStopCollectionAndShowLabel]);

  // Otimização de Rota (TSP Nearest Neighbor)
  const optimizeCurrentRoute = useCallback((targetRouteIdParam?: string | unknown) => {
    const targetRouteId = typeof targetRouteIdParam === 'string' ? targetRouteIdParam : routeAssignment?.id;
    const targetRoute = routes.find((r) => r.id === targetRouteId) || routeAssignment;
    if (!targetRoute) return;

    if (targetRoute.donorIds.length <= 1) {
      addToast({
        type: 'info',
        title: 'Rota Já Otimizada',
        description: 'A rota atual já possui o menor número de paradas lineares.'
      });
      return;
    }

    const currentStopsDonors = targetRoute.donorIds
      .map((id) => donors.find((d) => d.id === id))
      .filter(Boolean) as Donor[];

    const optimizedIds = optimizeDonorIdsNearestNeighbor(currentStopsDonors);

    setRoutes((prev) =>
      prev.map((r) => (r.id === targetRoute.id ? { ...r, donorIds: optimizedIds } : r))
    );

    addToast({
      type: 'success',
      title: 'Rota Otimizada!',
      description: `${targetRoute.code} (${targetRoute.name}) reorganizada por menor distância geodésica urbana.`
    });
  }, [routes, routeAssignment, donors, addToast]);

  // Navegar direto para a rota da doadora
  const navigateToDonorRoute = useCallback((zone: ZoneName, donorId: number) => {
    const day = (DAY_BY_ZONE[zone] as WeekDay) || 'Segunda';
    setSelectedDay(day);
    setActiveStopDonorId(donorId);
    setCurrentView('roteirizacao');
  }, []);

  // ─── CRUD de Frotas & Rotas Multi-Veículo (Fleet Management) ───────────────

  const getAllAssignedDonorIds = useCallback((day: WeekDay, excludeRouteId?: string) => {
    const map = new Map<number, string>();
    routes
      .filter((r) => r.day === day && r.id !== excludeRouteId && r.status !== 'canceled')
      .forEach((r) => {
        r.donorIds.forEach((id) => map.set(id, r.code));
      });
    return map;
  }, [routes]);

  const createRoute = useCallback((formData: RouteFormData) => {
    const codeNumber = routes.length + 1;
    const code = `ROT-${String(codeNumber).padStart(2, '0')}`;
    const newId = `rot-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    let initialDonorIds = formData.donorIds || [];
    if (formData.autoFillZoneDonors && initialDonorIds.length === 0) {
      // Doadoras da zona que não estão alocadas em outras rotas do mesmo dia
      const assigned = new Set(
        routes
          .filter((r) => r.day === formData.day && r.status !== 'canceled')
          .flatMap((r) => r.donorIds)
      );
      const zoneDonors = donors.filter(
        (d) => d.zona === formData.zone && d.aptidao === 'Apta' && d.statusCadastro === 'ativa' && !assigned.has(d.id)
      );
      initialDonorIds = optimizeDonorIdsNearestNeighbor(zoneDonors);
    }

    const newRoute: RouteAssignment = {
      id: newId,
      code,
      name: formData.name.trim() || `${code} - Zona ${formData.zone}`,
      day: formData.day,
      zone: formData.zone,
      donorIds: initialDonorIds,
      driverName: formData.driverName,
      collectorName: formData.collectorName,
      vehicleName: formData.vehicleName,
      vehiclePlate: formData.vehiclePlate,
      shift: formData.shift,
      createdAt: new Date().toISOString(),
      status: 'planning',
      skippedStops: [],
      notes: formData.notes
    };

    setRoutes((prev) => [...prev, newRoute]);
    setActiveRouteIdState(newId);
    setSelectedDay(formData.day);

    addToast({
      type: 'success',
      title: 'Rota Criada com Sucesso!',
      description: `${newRoute.code} (${newRoute.name}) adicionada à frota com ${initialDonorIds.length} paradas programadas.`
    });

    return newRoute;
  }, [routes, donors, addToast]);

  const updateRoute = useCallback((routeId: string, updates: Partial<RouteAssignment>) => {
    setRoutes((prev) =>
      prev.map((r) => (r.id === routeId ? { ...r, ...updates } : r))
    );
    addToast({
      type: 'info',
      title: 'Rota Atualizada',
      description: 'As alterações da rota foram salvas com sucesso.'
    });
  }, [addToast]);

  const deleteRoute = useCallback((routeId: string) => {
    const target = routes.find((r) => r.id === routeId);
    if (target?.status === 'active') {
      addToast({
        type: 'warning',
        title: 'Rota em Trânsito',
        description: 'Não é possível excluir uma rota ativa em trânsito. Finalize-a antes de remover.'
      });
      return;
    }

    setRoutes((prev) => prev.filter((r) => r.id !== routeId));

    if (activeRouteId === routeId) {
      const remainingForDay = routes.filter((r) => r.id !== routeId && r.day === selectedDay);
      setActiveRouteIdState(remainingForDay[0]?.id || null);
    }

    addToast({
      type: 'warning',
      title: 'Rota Removida da Frota',
      description: `${target?.code || 'A rota'} foi excluída. As doadoras retornaram imediatamente para o pool de disponíveis.`
    });
  }, [routes, activeRouteId, selectedDay, addToast]);

  const duplicateRoute = useCallback((routeId: string) => {
    const source = routes.find((r) => r.id === routeId);
    if (!source) return null;

    const codeNum = routes.length + 1;
    const code = `ROT-${String(codeNum).padStart(2, '0')}`;
    const newId = `rot-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    const duplicated: RouteAssignment = {
      ...source,
      id: newId,
      code,
      name: `${source.name} (Cópia)`,
      status: 'planning',
      createdAt: new Date().toISOString(),
      startedAt: undefined,
      completedAt: undefined,
      skippedStops: []
    };

    setRoutes((prev) => [...prev, duplicated]);
    setActiveRouteIdState(newId);

    addToast({
      type: 'success',
      title: 'Rota Duplicada',
      description: `${duplicated.code} criada a partir de ${source.code}.`
    });

    return duplicated;
  }, [routes, addToast]);

  // ─── Dispatcher Stop Management (Scoped to Route) ──────────────────────────

  const addDonorToRoute = useCallback((donorId: number, targetRouteId?: string) => {
    const routeId = targetRouteId || routeAssignment?.id;
    if (!routeId) return;

    setRoutes((prev) =>
      prev.map((r) => {
        if (r.id !== routeId) return r;
        if (r.donorIds.includes(donorId)) return r;
        return { ...r, donorIds: [...r.donorIds, donorId] };
      })
    );
  }, [routeAssignment]);

  const removeDonorFromRoute = useCallback((donorId: number, targetRouteId?: string) => {
    const routeId = targetRouteId || routeAssignment?.id;
    if (!routeId) return;

    setRoutes((prev) =>
      prev.map((r) => {
        if (r.id !== routeId) return r;
        return { ...r, donorIds: r.donorIds.filter((id) => id !== donorId) };
      })
    );
  }, [routeAssignment]);

  const reorderRouteStop = useCallback((fromIndex: number, toIndex: number, targetRouteId?: string) => {
    const routeId = targetRouteId || routeAssignment?.id;
    if (!routeId) return;

    setRoutes((prev) =>
      prev.map((r) => {
        if (r.id !== routeId) return r;
        const ids = [...r.donorIds];
        const [moved] = ids.splice(fromIndex, 1);
        ids.splice(toIndex, 0, moved);
        return { ...r, donorIds: ids };
      })
    );
  }, [routeAssignment]);

  const setDriverInfo = useCallback((name: string, vehicle: string, collectorName?: string, vehiclePlate?: string, targetRouteId?: string) => {
    const routeId = targetRouteId || routeAssignment?.id;
    if (!routeId) return;

    setRoutes((prev) =>
      prev.map((r) => {
        if (r.id !== routeId) return r;
        return {
          ...r,
          driverName: name,
          vehicleName: vehicle,
          ...(collectorName !== undefined ? { collectorName } : {}),
          ...(vehiclePlate !== undefined ? { vehiclePlate } : {})
        };
      })
    );
  }, [routeAssignment]);

  const selectAllZoneDonors = useCallback((targetRouteIdParam?: string | unknown) => {
    const routeId = typeof targetRouteIdParam === 'string' ? targetRouteIdParam : routeAssignment?.id;
    const target = routes.find((r) => r.id === routeId) || routeAssignment;
    if (!target) return;

    const otherAssignedIds = new Set(
      routes
        .filter((r) => r.day === target.day && r.id !== target.id && r.status !== 'canceled')
        .flatMap((r) => r.donorIds)
    );

    const availableZoneIds = donors
      .filter((d) => d.zona === target.zone && d.aptidao === 'Apta' && d.statusCadastro === 'ativa' && !otherAssignedIds.has(d.id))
      .map((d) => d.id);

    setRoutes((prev) =>
      prev.map((r) => (r.id === target.id ? { ...r, donorIds: availableZoneIds } : r))
    );

    addToast({
      type: 'info',
      title: 'Todas incluídas',
      description: `${availableZoneIds.length} doadoras da Zona ${target.zone} atribuídas à rota ${target.code}.`
    });
  }, [routes, routeAssignment, donors, addToast]);

  const clearRouteAssignment = useCallback((targetRouteIdParam?: string | unknown) => {
    const routeId = typeof targetRouteIdParam === 'string' ? targetRouteIdParam : routeAssignment?.id;
    if (!routeId) return;

    setRoutes((prev) =>
      prev.map((r) => (r.id === routeId ? { ...r, donorIds: [], skippedStops: [] } : r))
    );
    addToast({ type: 'info', title: 'Paradas limpas', description: 'As paradas da rota foram desatribuídas.' });
  }, [routeAssignment, addToast]);

  const activateRoute = useCallback((targetRouteIdParam?: string | unknown) => {
    const routeId = typeof targetRouteIdParam === 'string' ? targetRouteIdParam : routeAssignment?.id;
    if (!routeId) return;

    setRoutes((prev) =>
      prev.map((r) =>
        r.id === routeId ? { ...r, status: 'active' as RouteStatus, startedAt: new Date().toISOString() } : r
      )
    );
    setActiveRouteIdState(routeId);
    setActiveFlowStep('navigating');
    if (nextStop) setActiveStopDonorId(nextStop.donorId);

    const currentRoute = routes.find((r) => r.id === routeId);
    addToast({
      type: 'success',
      title: '🚐 Rota Iniciada!',
      description: `${currentRoute?.name || 'A rota'} está em trânsito. Siga para a Parada 1: ${nextStop?.donorName || 'Primeira doadora'}`
    });
  }, [routeAssignment, routes, nextStop, addToast]);

  const skipStop = useCallback((donorId: number, motivo: string, targetRouteId?: string) => {
    const routeId = targetRouteId || routeAssignment?.id;
    if (!routeId) return;

    const skippedEntry: SkippedStop = {
      donorId,
      motivo,
      skippedAt: new Date().toISOString()
    };

    setRoutes((prev) =>
      prev.map((r) => {
        if (r.id !== routeId) return r;
        return {
          ...r,
          skippedStops: [...(r.skippedStops || []).filter((s) => s.donorId !== donorId), skippedEntry]
        };
      })
    );

    const donor = donors.find((d) => d.id === donorId);
    addToast({
      type: 'warning',
      title: 'Parada Não Realizada',
      description: `${donor?.nome || 'Doadora'} marcada como não realizada: "${motivo}"`
    });
  }, [routeAssignment, donors, addToast]);

  const finishRoute = useCallback((targetRouteIdParam?: string | unknown) => {
    const routeId = typeof targetRouteIdParam === 'string' ? targetRouteIdParam : routeAssignment?.id;
    if (!routeId) return;

    setRoutes((prev) =>
      prev.map((r) =>
        r.id === routeId ? { ...r, status: 'completed' as RouteStatus, completedAt: new Date().toISOString() } : r
      )
    );
    setActiveFlowStep('completed');
    setActiveStopDonorId(null);

    const currentRoute = routes.find((r) => r.id === routeId);
    addToast({
      type: 'success',
      title: '🎉 Rota Finalizada com Sucesso!',
      description: `${currentRoute?.name || 'A rota'} foi concluída e arquivada como registro histórico.`
    });
  }, [routeAssignment, routes, addToast]);

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
    // Fleet Multi-Route CRUD
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
    finishRoute,
    skipStop
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
