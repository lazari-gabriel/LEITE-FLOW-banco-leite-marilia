import { MilkClass, ZoneName } from './donor';
export type { MilkClass, ZoneName };

export type PasteurizationStatus = 
  | 'Em Triagem'
  | 'Em Análise'
  | 'Em Quarentena'
  | 'Pasteurizado'
  | 'Dispensado';

export type LabelType = 'coleta' | 'estocagem' | 'pasteurizacao';

export interface Bottle {
  id: number;
  codigo: string;
  doadoraId: number;
  doadoraNome: string;
  zona: ZoneName;
  volume: number; // mL
  temp: number; // °C
  classe: MilkClass;
  extracao: string;
  equipamento: string;
  dataHoraColeta: string;
  validadeCru: string;
  statusPast: PasteurizationStatus;
  acidez: string; // Ex: "3.5 °D"
  crematocrito: string; // Ex: "650 Kcal/L"
  destinoUTI: string;
  responsavel: string;
}

export interface CollectionFormData {
  doadoraId: number;
  volume: number;
  temp: number;
  classe: MilkClass;
  frascosEntregues: number;
  observacao?: string;
}
