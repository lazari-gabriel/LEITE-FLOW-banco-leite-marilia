import { RouteMetrics, RouteStop } from '../types/route';
import { LEITE_FLOW } from '../constants/blh';

/**
 * Fórmula de Haversine para cálculo de distância em km entre dois pontos geográficos
 */
export function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Raio da Terra em km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calcula distância total estimada (ida + retorno ao Hospital Materno Infantil) com fator viário 1.35x.
 * Fonte única da verdade usada por RouteFleetManager, RouteDispatcher e InteractiveMapView.
 */
export function calculateTourDistanceKm(points: { lat: number; lng: number }[]): number {
  if (points.length === 0) return 0;

  const waypoints: [number, number][] = [
    LEITE_FLOW.coords,
    ...points.map((p) => [p.lat, p.lng] as [number, number]),
    LEITE_FLOW.coords,
  ];

  let rawDistance = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    rawDistance += calculateHaversineKm(
      waypoints[i][0],
      waypoints[i][1],
      waypoints[i + 1][0],
      waypoints[i + 1][1]
    );
  }
  return Number((rawDistance * 1.35).toFixed(1));
}

/**
 * Calcula métricas logísticas da rota separando concluídas (coletadas) de não realizadas (skipped).
 */
export function calculateRouteMetrics(stops: RouteStop[]): RouteMetrics {
  const completedStops = stops.filter((s) => s.status === 'completed' || s.collected).length;
  const skippedStops = stops.filter((s) => s.status === 'skipped' || s.skipped).length;
  const pendingStops = Math.max(0, stops.length - completedStops - skippedStops);

  if (stops.length === 0) {
    return {
      totalStops: 0,
      completedStops: 0,
      skippedStops: 0,
      pendingStops: 0,
      distanceKm: 0,
      estimatedMinutes: 0,
    };
  }

  const distanceKm = calculateTourDistanceKm(stops);
  const estimatedMinutes = Math.round(distanceKm * 2.2 + stops.length * 10);

  return {
    totalStops: stops.length,
    completedStops,
    skippedStops,
    pendingStops,
    distanceKm,
    estimatedMinutes,
  };
}

/**
 * Algoritmo Nearest Neighbor + Refinamento Local 2-opt (elimina cruzamentos no trajeto urbano).
 * Inicia e retorna na sede do BLH (Hospital Materno Infantil de Marília).
 */
export function optimizeDonorIdsNearestNeighbor(
  donorsList: { id: number; lat: number; lng: number }[],
  startCoords: [number, number] = LEITE_FLOW.coords
): number[] {
  if (donorsList.length <= 1) return donorsList.map((d) => d.id);

  let currentPoint = startCoords;
  const pool = [...donorsList];
  const ordered: { id: number; lat: number; lng: number }[] = [];

  while (pool.length > 0) {
    let closestIndex = 0;
    let minDistance = Infinity;

    for (let i = 0; i < pool.length; i++) {
      const dist = calculateHaversineKm(
        currentPoint[0],
        currentPoint[1],
        pool[i].lat,
        pool[i].lng
      );
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = i;
      }
    }

    const nextDonor = pool.splice(closestIndex, 1)[0];
    ordered.push(nextDonor);
    currentPoint = [nextDonor.lat, nextDonor.lng];
  }

  if (ordered.length <= 2) return ordered.map((d) => d.id);

  // Refinamento 2-opt considerando saída e retorno ao BLH
  const tourDist = (arr: typeof ordered) => {
    let sum = calculateHaversineKm(startCoords[0], startCoords[1], arr[0].lat, arr[0].lng);
    for (let i = 0; i < arr.length - 1; i++) {
      sum += calculateHaversineKm(arr[i].lat, arr[i].lng, arr[i + 1].lat, arr[i + 1].lng);
    }
    sum += calculateHaversineKm(arr[arr.length - 1].lat, arr[arr.length - 1].lng, startCoords[0], startCoords[1]);
    return sum;
  };

  let bestDistance = tourDist(ordered);
  let improved = true;

  while (improved) {
    improved = false;
    for (let i = 0; i < ordered.length - 1; i++) {
      for (let k = i + 1; k < ordered.length; k++) {
        const candidate = [
          ...ordered.slice(0, i),
          ...ordered.slice(i, k + 1).reverse(),
          ...ordered.slice(k + 1),
        ];
        const candDistance = tourDist(candidate);
        if (candDistance + 0.001 < bestDistance) {
          ordered.splice(0, ordered.length, ...candidate);
          bestDistance = candDistance;
          improved = true;
        }
      }
    }
  }

  return ordered.map((d) => d.id);
}

/**
 * Algoritmo de Otimização do Vizinho Mais Próximo (Nearest Neighbor TSP)
 * Inicia no Hospital Materno Infantil e seleciona sequencialmente o ponto mais próximo
 */
export function optimizeStopsNearestNeighbor(stops: RouteStop[], startCoords: [number, number] = LEITE_FLOW.coords): RouteStop[] {
  if (stops.length <= 1) return stops;

  let currentPoint = startCoords;
  const pool = [...stops];
  const ordered: RouteStop[] = [];

  while (pool.length > 0) {
    let closestIndex = 0;
    let minDistance = Infinity;

    for (let i = 0; i < pool.length; i++) {
      const dist = calculateHaversineKm(
        currentPoint[0],
        currentPoint[1],
        pool[i].lat,
        pool[i].lng
      );
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = i;
      }
    }

    const nextStop = pool.splice(closestIndex, 1)[0];
    ordered.push(nextStop);
    currentPoint = [nextStop.lat, nextStop.lng];
  }

  // Renumera as paradas e calcula distância relativa
  let prevCoords = startCoords;
  return ordered.map((s, idx) => {
    const rawDist = calculateHaversineKm(prevCoords[0], prevCoords[1], s.lat, s.lng) * 1.35;
    const distKm = Number(rawDist.toFixed(1));
    const mins = Math.max(3, Math.round(distKm * 2.2));
    prevCoords = [s.lat, s.lng];

    return {
      ...s,
      stopNumber: idx + 1,
      distanceFromPrevKm: distKm,
      estimatedMinutesFromPrev: mins
    };
  });
}

/**
 * Gera URL para navegação turn-by-turn no Google Maps com paradas da rota
 */
export function buildGoogleMapsUrl(stops: RouteStop[]): string {
  const origin = `${LEITE_FLOW.coords[0]},${LEITE_FLOW.coords[1]}`;
  const destination = origin;

  if (stops.length === 0) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(LEITE_FLOW.hospitalName)}`;
  }

  const waypoints = stops.map((s) => `${s.lat},${s.lng}`).join('|');
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${encodeURIComponent(waypoints)}&travelmode=driving`;
}

/**
 * Gera URL para navegar diretamente até uma parada específica.
 * Usa endereço textual como destino quando coordenadas não forem verificadas (evita ponto aproximado).
 */
export function buildGoogleMapsSingleStopUrl(
  lat: number,
  lng: number,
  address: string,
  useVerifiedCoords = false
): string {
  const destination =
    useVerifiedCoords && lat && lng
      ? `${lat},${lng}`
      : encodeURIComponent(`${address}, Marília - SP, Brasil`);
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
}

/**
 * Gera link de WhatsApp direto para a doadora
 */
export function buildWhatsAppUrl(donorName: string, phone: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  const msg = `Olá ${donorName}, a equipe do LEITE FLOW do Hospital Materno Infantil de Marília está a caminho da sua residência para a coleta programada.`;
  return `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(msg)}`;
}

// Cache em memória para geometrias viárias OSRM
const routeGeometryCache = new Map<string, [number, number][]>();

/**
 * Busca a geometria real de condução pelas ruas via OSRM (Open Source Routing Machine).
 * Converte waypoints [lat, lng] em traçado detalhado que segue curvas, avenidas e esquinas reais.
 * Se houver falha de conexão/timeout, faz fallback transparente para os waypoints diretos.
 */
export async function fetchDrivingRouteGeometry(waypoints: [number, number][]): Promise<[number, number][]> {
  if (waypoints.length < 2) return waypoints;

  const cacheKey = waypoints.map(([lat, lng]) => `${lat.toFixed(5)},${lng.toFixed(5)}`).join(';');
  if (routeGeometryCache.has(cacheKey)) {
    return routeGeometryCache.get(cacheKey)!;
  }

  try {
    // OSRM espera {lng},{lat} separados por ponto e vírgula
    const coordinatesQuery = waypoints.map(([lat, lng]) => `${lng},${lat}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coordinatesQuery}?overview=full&geometries=geojson`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`OSRM HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data.code === 'Ok' && data.routes?.[0]?.geometry?.coordinates) {
      // Converte GeoJSON [lng, lat] para formato Leaflet [lat, lng]
      const streetCoords: [number, number][] = data.routes[0].geometry.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng]
      );
      routeGeometryCache.set(cacheKey, streetCoords);
      return streetCoords;
    }
  } catch (err) {
    console.warn('Não foi possível obter traçado viário OSRM, usando rota direta:', err);
  }

  return waypoints;
}

