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

export type RouteShift = 'Manhã' | 'Tarde' | 'Integral';

export type RouteStatus = 'planning' | 'active' | 'completed' | 'canceled';

/** Planejamento e despacho de rota de frota — Gestão Multi-Veículo (CRUD) */
export interface RouteAssignment {
  id: string;                  // ex: "rot-20260929-01"
  code: string;                // ex: "ROT-01", "ROT-02"
  name: string;                // ex: "Van 01 - Rota Norte Principal"
  day: WeekDay;
  zone: ZoneName;
  donorIds: number[];          // ordenados — posição = número da parada
  driverName: string;          // Motorista / Condutor
  collectorName?: string;      // Pessoa que foi coletar
  vehicleName: string;         // Modelo/Identificação do veículo (ex: "Mercedes Sprinter BLH")
  vehiclePlate?: string;       // Placa (ex: "BRA-2E19")
  shift?: RouteShift;          // Manhã / Tarde / Integral
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  status: RouteStatus;
  skippedStops: SkippedStop[];  // paradas não realizadas com motivo
  notes?: string;
}

export interface RouteFormData {
  name: string;
  day: WeekDay;
  zone: ZoneName;
  driverName: string;
  collectorName: string;
  vehicleName: string;
  vehiclePlate: string;
  shift: RouteShift;
  donorIds?: number[];
  autoFillZoneDonors?: boolean;
  notes?: string;
}

