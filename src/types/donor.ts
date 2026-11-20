export type ZoneName = 'Norte' | 'Sul' | 'Oeste' | 'Leste' | 'Rural';
export type WeekDay = 'Segunda' | 'Terça' | 'Quarta' | 'Quinta' | 'Sexta';
export type MilkClass = 'C' | 'T' | 'M'; // Colostro, Transição, Maduro
export type AptidaoStatus = 'Apta' | 'Inapta' | 'Pendente';
export type StatusCadastro = 'ativa' | 'inativa';

export interface DonorIntercorrencias {
  infeccao: boolean;
  hipertensao: boolean;
  diabetes: boolean;
  hepatite: boolean;
}

export interface Donor {
  id: number;
  nome: string;
  bebe: string;
  sus: string;
  cpf: string;
  nascimento: string;
  parto: string; // YYYY-MM-DD
  telefone: string;
  endereco: string;
  bairro: string;
  zona: ZoneName;
  lat: number;
  lng: number;
  geocodeStatus?: 'verified' | 'approximate' | 'failed';
  vacinaFebre: boolean;
  vacinaDtpa: boolean;
  transfusao: string;
  transfusaoData?: string; // YYYY-MM-DD se realizou transfusão
  tatuagem: string;
  tatuagemData?: string; // YYYY-MM-DD se realizou tatuagem/piercing
  fumo: 'nao' | 'sim_pouco' | 'sim_ativo';
  alcool: 'nao' | 'raro' | 'frequente';
  medicacao: string;
  aguaPotavel: boolean;
  redeEsgoto: boolean;
  renda?: string;
  pesoBebe?: string;
  apgar?: string;
  malformacao?: 'nao' | 'sim';
  intercorrencias?: DonorIntercorrencias;
  equipamento: 'Freezer' | 'Duplex' | 'Simples';
  extracao: 'Ordenha Manual' | 'Bomba Elétrica' | 'Bomba Manual';
  produtosJunto: boolean;
  soro1Data?: string;
  sorologia1: 'normal' | 'alterada' | 'pendente';
  soro2Data?: string;
  sorologia2: 'normal' | 'alterada' | 'pendente';
  soro3Data?: string;
  sorologia3: 'normal' | 'alterada' | 'pendente';
  aptidao: AptidaoStatus;
  statusCadastro: StatusCadastro;
  motivoInapta?: string;
  dataCadastro: string;
}

export interface DonorFormData {
  nome: string;
  bebe: string;
  sus: string;
  cpf: string;
  nascimento: string;
  parto: string;
  telefone: string;
  zona: ZoneName;
  endereco: string;
  lat?: number;
  lng?: number;
  geocodeStatus?: 'verified' | 'approximate' | 'failed';
  vacinaFebre: boolean;
  vacinaDtpa: boolean;
  transfusao: string;
  transfusaoData?: string;
  tatuagem: string;
  tatuagemData?: string;
  fumo: 'nao' | 'sim_pouco' | 'sim_ativo';
  alcool: 'nao' | 'raro' | 'frequente';
  medicacao: string;
  aguaPotavel: boolean;
  redeEsgoto: boolean;
  renda: string;
  pesoBebe: string;
  apgar: string;
  malformacao: 'nao' | 'sim';
  intercorrencias: DonorIntercorrencias;
  equipamento: 'Freezer' | 'Duplex' | 'Simples';
  extracao: 'Ordenha Manual' | 'Bomba Elétrica' | 'Bomba Manual';
  produtosJunto: boolean;
  soro1Data: string;
  soro1Res: 'normal' | 'alterada' | 'pendente';
  soro2Data: string;
  soro2Res: 'normal' | 'alterada' | 'pendente';
  soro3Data: string;
  soro3Res: 'normal' | 'alterada' | 'pendente';
  statusCadastro?: StatusCadastro;
}

export interface GoNoGoVerdict {
  approved: boolean;
  aptidao: AptidaoStatus;
  reasons: string[];
}
