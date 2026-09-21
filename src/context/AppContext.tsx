import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { Donor, DonorFormData, GoNoGoVerdict, WeekDay, ZoneName, AptidaoStatus, StatusCadastro } from '../types/donor';
import { Bottle, CollectionFormData, LabelType } from '../types/bottle';
import { RouteAssignment, RouteMetrics, RouteStop, SkippedStop, StopStatus } from '../types/route';
import { ToastMessage, ViewMode } from '../types/common';
import { INITIAL_DONORS } from '../data/initialDonors';
import { INITIAL_BOTTLES } from '../data/initialBottles';
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
  startRoute: () => void;
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
  optimizeCurrentRoute: () => void;
  navigateToDonorRoute: (zone: ZoneName, donorId: number) => void;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  // Route Dispatcher
  routeAssignment: RouteAssignment | null;
  addDonorToRoute: (donorId: number) => void;
  removeDonorFromRoute: (donorId: number) => void;
  reorderRouteStop: (fromIndex: number, toIndex: number) => void;
  setDriverInfo: (name: string, vehicle: string) => void;
  selectAllZoneDonors: () => void;
  clearRouteAssignment: () => void;
  activateRoute: () => void;
  finishRoute: () => void;
  skipStop: (donorId: number, motivo: string) => void;
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
  const [isRouteActive, setIsRouteActive] = useState(false);
  const [activeFlowStep, setActiveFlowStep] = useState<GuidedFlowStep>('overview');
  const [activeStopDonorId, setActiveStopDonorId] = useState<number | null>(null);

  // Estado do Despachante / Planejamento de Rota
  const [routeAssignment, setRouteAssignment] = useState<RouteAssignment | null>(null);

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

  // Pré-população automática da rota ao selecionar dia/zona com ordenação geográfica (Nearest Neighbor)
  useEffect(() => {
    if (!routeAssignment || (routeAssignment.day !== selectedDay && routeAssignment.status !== 'active')) {
      const zone = currentZoneConfig.zona;
      const today = new Date().toISOString().slice(0, 10);
      const zoneDonors = donors.filter(
        (d) => d.zona === zone && d.aptidao === 'Apta' && d.statusCadastro === 'ativa'
      );
      const autoOrderedIds = optimizeDonorIdsNearestNeighbor(zoneDonors);

      setRouteAssignment({
        id: `${today}-${zone}`,
        day: selectedDay,
        zone,
        donorIds: autoOrderedIds,
        driverName: routeAssignment?.driverName || '',
        vehicleName: routeAssignment?.vehicleName || '',
        createdAt: new Date().toISOString(),
        status: 'planning',
        skippedStops: []
      });
    }
  }, [selectedDay, currentZoneConfig.zona, donors]);

  const currentZoneStops = useMemo(() => {
    // All apt + active donors for this zone
    const allZoneDonors = donors.filter(
      (d) => d.zona === currentZoneConfig.zona && d.aptidao === 'Apta' && d.statusCadastro === 'ativa'
    );

    // Use routeAssignment ordering if exists for this day; otherwise natural order
    let orderedDonors: Donor[];
    if (
      routeAssignment &&
      routeAssignment.day === selectedDay &&
      routeAssignment.donorIds.length > 0
    ) {
      // Support cross-zone exception donors by searching in the full active/apt donors list
      orderedDonors = routeAssignment.donorIds
        .map((id) => donors.find((d) => d.id === id && d.aptidao === 'Apta' && d.statusCadastro === 'ativa'))
        .filter(Boolean) as Donor[];
    } else {
      orderedDonors = allZoneDonors;
    }

    const skippedIds = new Set(routeAssignment?.skippedStops?.map((s) => s.donorId) ?? []);

    let prevCoords = LEITE_FLOW.coords;
    let foundNext = false;

    return orderedDonors.map((d, index) => {
      const donorBottles = bottles.filter((b) => b.doadoraId === d.id);
      const isCollected = donorBottles.length > 0;
      const isSkipped = skippedIds.has(d.id);
      const isDone = isCollected || isSkipped;

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
      const skipEntry = routeAssignment?.skippedStops?.find((s) => s.donorId === d.id);

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
  }, [donors, bottles, currentZoneConfig, routeAssignment, activeStopDonorId, activeFlowStep]);

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

  // Iniciar Rota
  const startRoute = useCallback(() => {
    setIsRouteActive(true);
    setActiveFlowStep('navigating');
    if (nextStop) {
      setActiveStopDonorId(nextStop.donorId);
    }
    addToast({
      type: 'info',
      title: 'Rota Iniciada!',
      description: `Siga em direção à Parada 1: ${nextStop?.donorName || 'Primeira doadora'}`
    });
  }, [nextStop, addToast]);

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
  const optimizeCurrentRoute = useCallback(() => {
    if (currentZoneStops.length <= 1) {
      addToast({
        type: 'info',
        title: 'Rota Já Otimizada',
        description: 'A rota atual já possui o melhor trajeto linear.'
      });
      return;
    }

    const optimizedStops = optimizeStopsNearestNeighbor(currentZoneStops);
    const optimizedDonorIds = optimizedStops.map((s) => s.donorId);

    if (routeAssignment) {
      // Se há um RouteAssignment, atualiza a ordem nele
      setRouteAssignment((prev) => prev ? { ...prev, donorIds: optimizedDonorIds } : prev);
    } else {
      // Senão reorganiza os donors diretamente
      setDonors((prev) => {
        const zone = currentZoneConfig.zona;
        const zoneActive = prev.filter(
          (d) => d.zona === zone && d.aptidao === 'Apta' && d.statusCadastro === 'ativa'
        );
        const others = prev.filter(
          (d) => !(d.zona === zone && d.aptidao === 'Apta' && d.statusCadastro === 'ativa')
        );
        const reordered = optimizedDonorIds
          .map((id) => zoneActive.find((d) => d.id === id))
          .filter(Boolean) as Donor[];
        return [...reordered, ...others];
      });
    }

    addToast({
      type: 'success',
      title: 'Rota Melhorada!',
      description: `Paradas da Zona ${currentZoneConfig.zona} reorganizadas por menor distância.`
    });
  }, [currentZoneStops, currentZoneConfig, routeAssignment, addToast]);

  // Navegar direto para a rota da doadora
  const navigateToDonorRoute = useCallback((zone: ZoneName, donorId: number) => {
    const day = (DAY_BY_ZONE[zone] as WeekDay) || 'Segunda';
    setSelectedDay(day);
    setActiveStopDonorId(donorId);
    setCurrentView('roteirizacao');
  }, []);

  // ─── Route Dispatcher Actions ───────────────────────────────────────────────

  const addDonorToRoute = useCallback((donorId: number) => {
    const zone = currentZoneConfig.zona;
    const today = new Date().toISOString().slice(0, 10);
    setRouteAssignment((prev) => {
      const base = prev ?? {
        id: `${today}-${zone}`,
        day: selectedDay,
        zone,
        donorIds: [],
        driverName: '',
        vehicleName: '',
        createdAt: new Date().toISOString(),
        status: 'planning' as const,
        skippedStops: []
      };
      if (base.donorIds.includes(donorId)) return base;
      return { ...base, donorIds: [...base.donorIds, donorId] };
    });
  }, [currentZoneConfig, selectedDay]);

  const removeDonorFromRoute = useCallback((donorId: number) => {
    setRouteAssignment((prev) => {
      if (!prev) return prev;
      return { ...prev, donorIds: prev.donorIds.filter((id) => id !== donorId) };
    });
  }, []);

  const reorderRouteStop = useCallback((fromIndex: number, toIndex: number) => {
    setRouteAssignment((prev) => {
      if (!prev) return prev;
      const ids = [...prev.donorIds];
      const [moved] = ids.splice(fromIndex, 1);
      ids.splice(toIndex, 0, moved);
      return { ...prev, donorIds: ids };
    });
  }, []);

  const setDriverInfo = useCallback((name: string, vehicle: string) => {
    const zone = currentZoneConfig.zona;
    const today = new Date().toISOString().slice(0, 10);
    setRouteAssignment((prev) => {
      const base = prev ?? {
        id: `${today}-${zone}`,
        day: selectedDay,
        zone,
        donorIds: [],
        driverName: '',
        vehicleName: '',
        createdAt: new Date().toISOString(),
        status: 'planning' as const,
        skippedStops: []
      };
      return { ...base, driverName: name, vehicleName: vehicle };
    });
  }, [currentZoneConfig, selectedDay]);

  const selectAllZoneDonors = useCallback(() => {
    const zone = currentZoneConfig.zona;
    const today = new Date().toISOString().slice(0, 10);
    const allIds = donors
      .filter((d) => d.zona === zone && d.aptidao === 'Apta' && d.statusCadastro === 'ativa')
      .map((d) => d.id);
    setRouteAssignment((prev) => {
      const base = prev ?? {
        id: `${today}-${zone}`,
        day: selectedDay,
        zone,
        donorIds: [],
        driverName: '',
        vehicleName: '',
        createdAt: new Date().toISOString(),
        status: 'planning' as const,
        skippedStops: []
      };
      return { ...base, donorIds: allIds };
    });
    addToast({ type: 'info', title: 'Todas incluídas', description: `${allIds.length} doadoras da Zona ${zone} adicionadas.` });
  }, [currentZoneConfig, selectedDay, donors, addToast]);

  const clearRouteAssignment = useCallback(() => {
    setRouteAssignment(null);
    setIsRouteActive(false);
    setActiveFlowStep('overview');
    setActiveStopDonorId(null);
    addToast({ type: 'info', title: 'Rota limpa', description: 'O planejamento foi reiniciado.' });
  }, [addToast]);

  const activateRoute = useCallback(() => {
    setRouteAssignment((prev) => prev ? { ...prev, status: 'active' } : prev);
    setIsRouteActive(true);
    setActiveFlowStep('navigating');
    if (nextStop) setActiveStopDonorId(nextStop.donorId);
    addToast({
      type: 'success',
      title: '🚐 Rota Iniciada!',
      description: `Siga para a Parada 1: ${nextStop?.donorName || 'Primeira doadora'}`
    });
  }, [nextStop, addToast]);

  const skipStop = useCallback((donorId: number, motivo: string) => {
    const zone = currentZoneConfig.zona;
    const today = new Date().toISOString().slice(0, 10);
    const skippedEntry: SkippedStop = {
      donorId,
      motivo,
      skippedAt: new Date().toISOString()
    };

    setRouteAssignment((prev) => {
      const base = prev ?? {
        id: `${today}-${zone}`,
        day: selectedDay,
        zone,
        donorIds: [],
        driverName: '',
        vehicleName: '',
        createdAt: new Date().toISOString(),
        status: 'active' as const,
        skippedStops: []
      };
      return {
        ...base,
        skippedStops: [...(base.skippedStops || []).filter((s) => s.donorId !== donorId), skippedEntry]
      };
    });

    const donor = donors.find((d) => d.id === donorId);
    addToast({
      type: 'warning',
      title: 'Parada Não Realizada',
      description: `${donor?.nome || 'Doadora'} marcada como não realizada: "${motivo}"`
    });
  }, [currentZoneConfig, selectedDay, donors, addToast]);

  const finishRoute = useCallback(() => {
    setRouteAssignment((prev) => prev ? { ...prev, status: 'completed' } : prev);
    setIsRouteActive(false);
    setActiveFlowStep('completed');
    setActiveStopDonorId(null);
    addToast({
      type: 'success',
      title: '🎉 Rota Finalizada com Sucesso!',
      description: 'Todas as paradas foram resolvidas. A rota foi arquivada como registro histórico concluído (somente leitura).'
    });
  }, [addToast]);

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
    startRoute,
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
    // Route Dispatcher
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
