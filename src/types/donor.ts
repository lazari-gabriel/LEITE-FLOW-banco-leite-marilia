export type ZoneName = 'Norte' | 'Sul' | 'Oeste' | 'Leste' | 'Rural';
export type WeekDay = 'Segunda' | 'Terça' | 'Quarta' | 'Quinta' | 'Sexta';
export type MilkClass = 'C' | 'T' | 'M'; // Colostro, Transição, Maduro
export type AptidaoStatus = 'Apta' | 'Inapta' | 'Pendente';
export type StatusCadastro = 'ativa' | 'inativa';

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
  vacinaFebre: boolean;
  vacinaDtpa: boolean;
  transfusao: string;
  tatuagem: string;
  fumo: 'nao' | 'sim_pouco' | 'sim_ativo';
  alcool: 'nao' | 'raro' | 'frequente';
  medicacao: string;
  aguaPotavel: boolean;
  redeEsgoto: boolean;
  equipamento: 'Freezer' | 'Duplex' | 'Simples';
  extracao: 'Ordenha Manual' | 'Bomba Elétrica' | 'Bomba Manual';
  produtosJunto: boolean;
  sorologia1: 'normal' | 'alterada' | 'pendente';
  sorologia2: 'normal' | 'alterada' | 'pendente';
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
  vacinaFebre: boolean;
  vacinaDtpa: boolean;
  transfusao: string;
  tatuagem: string;
  fumo: 'nao' | 'sim_pouco' | 'sim_ativo';
  alcool: 'nao' | 'raro' | 'frequente';
  medicacao: string;
  aguaPotavel: boolean;
  redeEsgoto: boolean;
  renda: string;
  pesoBebe: string;
  apgar: string;
  malformacao: 'nao' | 'sim';
  intercorrencias: {
    infeccao: boolean;
    hipertensao: boolean;
    diabetes: boolean;
    hepatite: boolean;
  };
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
