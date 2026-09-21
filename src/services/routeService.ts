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
 * Calcula métricas logísticas da rota (distância urbana com fator viário de Marília 1.35x e tempo estimado)
 */
export function calculateRouteMetrics(stops: RouteStop[]): RouteMetrics {
  const completedStops = stops.filter((s) => s.status === 'completed' || s.collected || s.status === 'skipped' || s.skipped).length;
  const pendingStops = stops.length - completedStops;

  if (stops.length === 0) {
    return {
      totalStops: 0,
      completedStops: 0,
      pendingStops: 0,
      distanceKm: 0,
      estimatedMinutes: 0
    };
  }

  const waypoints: [number, number][] = [
    LEITE_FLOW.coords,
    ...stops.map((s) => [s.lat, s.lng] as [number, number]),
    LEITE_FLOW.coords
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

  // Fator viário urbano de Marília (1.35x da distância euclidiana/geodésica)
  const distanceKm = Number((rawDistance * 1.35).toFixed(1));
  // 2.2 minutos por km em trânsito urbano + 10 minutos de atendimento em cada parada
  const estimatedMinutes = Math.round(distanceKm * 2.2 + stops.length * 10);

  return {
    totalStops: stops.length,
    completedStops,
    pendingStops,
    distanceKm,
    estimatedMinutes
  };
}

/**
 * Algoritmo de Otimização do Vizinho Mais Próximo para IDs de doadoras
 * Inicia na sede do BLH (Hospital Materno Infantil) e ordena por proximidade geográfica
 */
export function optimizeDonorIdsNearestNeighbor(
  donorsList: { id: number; lat: number; lng: number }[],
  startCoords: [number, number] = LEITE_FLOW.coords
): number[] {
  if (donorsList.length <= 1) return donorsList.map((d) => d.id);

  let currentPoint = startCoords;
  const pool = [...donorsList];
  const orderedIds: number[] = [];

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
    orderedIds.push(nextDonor.id);
    currentPoint = [nextDonor.lat, nextDonor.lng];
  }

  return orderedIds;
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
 * Gera URL para navegar diretamente até uma parada específica
 */
export function buildGoogleMapsSingleStopUrl(lat: number, lng: number, address: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=&travelmode=driving`;
}

/**
 * Gera link de WhatsApp direto para a doadora
 */
export function buildWhatsAppUrl(donorName: string, phone: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  const msg = `Olá ${donorName}, a equipe do LEITE FLOW do Hospital Materno Infantil de Marília está a caminho da sua residência para a coleta programada.`;
  return `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(msg)}`;
}
