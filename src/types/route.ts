import { WeekDay, ZoneName } from './donor';

export type StopStatus = 
  | 'pending'    // ⚪ Pendente
  | 'next'       // 🔵 Próxima
  | 'arrived'    // 📍 No local (Cheguei)
  | 'collected'  // 🧪 Coleta realizada (aguardando etiqueta)
  | 'completed'  // 🟢 Concluída
  | 'skipped'    // 🔴 Não realizada (com motivo)
  | 'problem';   // 🔴 Problema / Impedimento

export interface SkippedStop {
  donorId: number;
  motivo: string;
  skippedAt: string; // ISO date string
}

export interface ZoneConfig {
  dia: WeekDay;
  zona: ZoneName;
  desc: string;
  cor: string;
  approxCoords: [number, number];
}

export interface RouteStop {
  stopNumber: number;
  donorId: number;
  donorName: string;
  babyName: string;
  babyAgeDays: number;
  phone: string;
  address: string;
  neighborhood: string;
  lat: number;
  lng: number;
  equipment: string;
  extraction: string;
  status: StopStatus;
  collected: boolean;
  skipped?: boolean;
  skipMotivo?: string;
  bottlesCount: number;
  latestBottleId?: number;
  distanceFromPrevKm?: number;
  estimatedMinutesFromPrev?: number;
  arrivedAt?: string;
  collectedAt?: string;
}

export interface RouteMetrics {
  totalStops: number;
  completedStops: number;
  pendingStops: number;
  distanceKm: number;
  estimatedMinutes: number;
}

/** Planejamento de rota do dia — escolha manual pelo despachante */
export interface RouteAssignment {
  id: string;          // ex: "2026-09-12-Norte"
  day: WeekDay;
  zone: ZoneName;
  donorIds: number[];  // ordenados — posição = número da parada
  driverName: string;
  vehicleName: string;
  createdAt: string;
  status: 'planning' | 'active' | 'completed';
  skippedStops: SkippedStop[];  // paradas não realizadas com motivo
}
