import { describe, it, expect } from 'vitest';
import {
  calculateRouteMetrics,
  calculateTourDistanceKm,
  optimizeDonorIdsNearestNeighbor,
  buildGoogleMapsSingleStopUrl,
} from '../routeService';
import { RouteStop } from '../../types/route';

function makeStop(id: number, lat: number, lng: number, status: RouteStop['status']): RouteStop {
  return {
    stopNumber: id,
    donorId: id,
    donorName: `Doadora ${id}`,
    babyName: `Bebê ${id}`,
    babyAgeDays: 10,
    phone: '14999990000',
    address: `Rua ${id}, 100`,
    neighborhood: 'Centro',
    lat,
    lng,
    equipment: 'Freezer',
    extraction: 'Ordenha Manual',
    status,
    collected: status === 'completed',
    skipped: status === 'skipped',
    bottlesCount: status === 'completed' ? 1 : 0,
  };
}

describe('routeService — Métricas Reais e Otimização 2-opt (M006/M009)', () => {
  it('separa paradas concluídas (completed) de paradas não realizadas (skipped)', () => {
    const stops: RouteStop[] = [
      makeStop(1, -22.21, -49.94, 'completed'),
      makeStop(2, -22.20, -49.95, 'skipped'),
      makeStop(3, -22.19, -49.96, 'pending'),
    ];
    const metrics = calculateRouteMetrics(stops);
    expect(metrics.totalStops).toBe(3);
    expect(metrics.completedStops).toBe(1);
    expect(metrics.skippedStops).toBe(1);
    expect(metrics.pendingStops).toBe(1);
    expect(metrics.distanceKm).toBe(calculateTourDistanceKm(stops));
  });

  it('otimização Nearest Neighbor + 2-opt nunca piora a distância do trajeto', () => {
    const points = [
      { id: 1, lat: -22.17, lng: -49.97 },
      { id: 2, lat: -22.25, lng: -49.92 },
      { id: 3, lat: -22.18, lng: -49.93 },
      { id: 4, lat: -22.24, lng: -49.97 },
      { id: 5, lat: -22.20, lng: -49.95 },
    ];
    const originalDist = calculateTourDistanceKm(points);
    const optimizedIds = optimizeDonorIdsNearestNeighbor(points);
    const optimizedPoints = optimizedIds.map((id) => points.find((p) => p.id === id)!);
    const optimizedDist = calculateTourDistanceKm(optimizedPoints);

    expect(optimizedIds).toHaveLength(points.length);
    expect(optimizedDist).toBeLessThanOrEqual(originalDist);
  });

  it('usa endereço no Google Maps por padrão quando coordenadas não são verificadas', () => {
    const urlApprox = buildGoogleMapsSingleStopUrl(-22.2, -49.9, 'Rua São Luiz, 375', false);
    expect(urlApprox).toContain(encodeURIComponent('Rua São Luiz, 375, Marília - SP, Brasil'));

    const urlVerified = buildGoogleMapsSingleStopUrl(-22.2, -49.9, 'Rua São Luiz, 375', true);
    expect(urlVerified).toContain('destination=-22.2,-49.9');
  });
});
