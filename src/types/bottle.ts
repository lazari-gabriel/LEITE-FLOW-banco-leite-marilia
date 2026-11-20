import { MilkClass, ZoneName } from './donor';
export type { MilkClass, ZoneName };

export type PasteurizationStatus = 
  | 'Em Triagem'
  | 'Em Análise'
  | 'Em Quarentena'
  | 'Pasteurizado'
  | 'Dispensado'
  | 'Descartado';

export type LabelType = 'coleta' | 'estocagem' | 'pasteurizacao';
export type LabelFormat = '60x40mm' | '100x50mm' | 'A4_BATCH' | 'ZPL';

export interface LabelPrintLogItem {
  id: string;
  bottleId: number;
  labelType: LabelType;
  copyNumber: number;
  format: LabelFormat;
  reason?: string | null;
  status: 'valid' | 'voided';
  voidReason?: string | null;
  printedByName: string;
  printedAt: string;
}

export interface Bottle {
  id: number;
  codigo: string;
  doadoraId: number;
  visitId?: string;
  doadoraNome: string;
  babyBirthDate?: string;
  zona: ZoneName;
  volume: number; // mL
  temp: number; // °C
  classe: MilkClass;
  extracao: string;
  equipamento: string;
  firstExpressionAt?: string; // ISO date da 1ª ordenha
  dataHoraColeta: string;
  validadeCru: string;
  statusPast: PasteurizationStatus;
  acidez: string | null;
  acidezDornicNum?: number;
  crematocrito: string | null;
  crematocritoKcal?: number;
  microbiologyPassed?: boolean;
  pasteurizedAt?: string;
  pasteurizedExpiresAt?: string;
  destinoUTI: string;
  discardReason?: string;
  responsavel: string;
  frascosEntregues?: number;
  observacao?: string;
}

export interface CollectionFormData {
  doadoraId: number;
  volume: number;
  temp: number;
  classe: MilkClass;
  frascosEntregues: number;
  firstExpressionAt?: string;
  observacao?: string;
}

export interface BatchBottleItem {
  volume: number;
  temp: number;
  classe: MilkClass;
  firstExpressionAt: string;
  observacao?: string;
}

export interface BatchCollectionFormData {
  doadoraId: number;
  frascosEntregues: number;
  observacao?: string;
  items: BatchBottleItem[];
}
