import { ZoneName } from './donor';

export type DonorInterestStatus =
  | 'NOVA'
  | 'AGUARDANDO_ANALISE'
  | 'AGUARDANDO_CONTATO'
  | 'EM_CONTATO'
  | 'AGUARDANDO_RETORNO'
  | 'ENCAMINHADA_CADASTRO'
  | 'NAO_PROSSEGUIU'
  | 'ENCERRADA';

export type PreferredContact = 'WHATSAPP' | 'LIGACAO' | 'EMAIL';
export type BestContactTime = 'MANHA' | 'TARDE' | 'COMERCIAL' | 'QUALQUER_HORARIO';
export type KnowsProcess = 'SIM' | 'PARCIALMENTE' | 'NAO';
export type DiscoveryChannel =
  | 'SITE'
  | 'REDES_SOCIAIS'
  | 'MATERNIDADE_HOSPITAL'
  | 'UBS_POSTO_SAUDE'
  | 'INDICACAO'
  | 'CAMPANHA'
  | 'OUTRO';

export type ContactChannel = 'WHATSAPP' | 'LIGACAO' | 'EMAIL' | 'PRESENCIAL';
export type ContactOutcome =
  | 'ATENDEU'
  | 'SEM_RESPOSTA'
  | 'CAIXA_POSTAL'
  | 'RETORNO_AGENDADO'
  | 'NUMERO_INVALIDO';

export interface DonorInterestEvent {
  id: string;
  interestId: string;
  eventType:
    | 'CREATED'
    | 'STATUS_CHANGED'
    | 'CONTACT_ATTEMPT'
    | 'NOTE_ADDED'
    | 'CONVERTED'
    | 'ANONYMIZED';
  fromStatus?: string | null;
  toStatus?: string | null;
  channel?: ContactChannel | null;
  outcome?: ContactOutcome | null;
  notes?: string | null;
  user?: { id: string; name: string; role?: string } | null;
  createdAt: string;
}

export interface DuplicateDonorMatch {
  donorId: number;
  code: string;
  nome: string;
  zona: string;
  bairro: string;
  aptidao: string;
  statusCadastro: string;
  matchReason: 'TELEFONE' | 'NOME' | 'TELEFONE_E_NOME';
}

export interface DonorInterest {
  id: string;
  protocol: string;
  fullName: string;
  birthDate?: string | null;
  city: string;
  neighborhood: string;
  cep?: string | null;
  suggestedZone?: ZoneName | null;
  phone: string;
  phoneNormalized: string;
  isWhatsappSame: boolean;
  whatsapp?: string | null;
  email?: string | null;
  preferredContact: PreferredContact;
  bestContactTime: BestContactTime;
  donatedBefore: boolean;
  knowsProcess: KnowsProcess;
  hasQuestions: boolean;
  questionsText?: string | null;
  discoveryChannel: DiscoveryChannel;
  sourceOrigin: string;
  consentAccepted: boolean;
  consentAcceptedAt: string;
  consentVersion: string;
  status: DonorInterestStatus;
  assignedTo?: { id: string; name: string } | null;
  contactAttemptsCount: number;
  lastContactAt?: string | null;
  nextFollowUpAt?: string | null;
  adminNotes?: string | null;
  closureReason?: string | null;
  convertedDonorId?: number | null;
  convertedDonor?: {
    id: number;
    code: string;
    nome: string;
    aptidao: string;
    statusCadastro: string;
  } | null;
  convertedAt?: string | null;
  convertedBy?: { id: string; name: string } | null;
  retentionExpiresAt?: string | null;
  anonymizedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  events?: DonorInterestEvent[];
}

export interface DonorInterestSummary {
  totalAll: number;
  totalNew: number;
  totalPending: number;
  totalInProgress: number;
  totalConverted: number;
  countsByStatus: Record<DonorInterestStatus, number>;
  lastSubmissionAt: string | null;
}

export interface DonorInterestPublicPayload {
  fullName: string;
  birthDate?: string;
  city: string;
  neighborhood: string;
  cep?: string;
  suggestedZone?: ZoneName | '';
  phone: string;
  isWhatsappSame: boolean;
  whatsapp?: string;
  email?: string;
  preferredContact: PreferredContact;
  bestContactTime: BestContactTime;
  donatedBefore: boolean;
  knowsProcess: KnowsProcess;
  hasQuestions: boolean;
  questionsText?: string;
  discoveryChannel: DiscoveryChannel;
  sourceOrigin?: string;
  consentAccepted: boolean;
  website?: string;
  elapsedMs?: number;
}

export interface DonorInterestPublicResponse {
  protocol: string;
  submittedAt: string;
  message: string;
}

export const INTEREST_STATUS_META: Record<
  DonorInterestStatus,
  {
    label: string;
    badgeVariant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'zone';
  }
> = {
  NOVA: { label: 'Nova solicitação', badgeVariant: 'warning' },
  AGUARDANDO_ANALISE: { label: 'Aguardando análise', badgeVariant: 'info' },
  AGUARDANDO_CONTATO: { label: 'Aguardando contato', badgeVariant: 'info' },
  EM_CONTATO: { label: 'Em contato', badgeVariant: 'zone' },
  AGUARDANDO_RETORNO: { label: 'Aguardando retorno', badgeVariant: 'warning' },
  ENCAMINHADA_CADASTRO: { label: 'Convertida em cadastro', badgeVariant: 'success' },
  NAO_PROSSEGUIU: { label: 'Não prosseguiu', badgeVariant: 'neutral' },
  ENCERRADA: { label: 'Encerrada', badgeVariant: 'danger' },
};

export const PREFERRED_CONTACT_LABELS: Record<PreferredContact, string> = {
  WHATSAPP: 'WhatsApp',
  LIGACAO: 'Ligação telefônica',
  EMAIL: 'E-mail',
};

export const BEST_TIME_LABELS: Record<BestContactTime, string> = {
  MANHA: 'Manhã (08h às 12h)',
  TARDE: 'Tarde (13h às 17h)',
  COMERCIAL: 'Horário comercial',
  QUALQUER_HORARIO: 'Qualquer horário',
};

export const KNOWS_PROCESS_LABELS: Record<KnowsProcess, string> = {
  SIM: 'Sim, já conhece',
  PARCIALMENTE: 'Conhece parcialmente',
  NAO: 'Ainda não conhece',
};

export const DISCOVERY_CHANNEL_LABELS: Record<DiscoveryChannel, string> = {
  SITE: 'Site / Busca na internet',
  REDES_SOCIAIS: 'Redes sociais',
  MATERNIDADE_HOSPITAL: 'Maternidade / Hospital',
  UBS_POSTO_SAUDE: 'UBS / Posto de saúde',
  INDICACAO: 'Indicação de amiga ou familiar',
  CAMPANHA: 'Campanha / Reportagem',
  OUTRO: 'Outro canal',
};

export const CONTACT_CHANNEL_LABELS: Record<ContactChannel, string> = {
  WHATSAPP: 'WhatsApp',
  LIGACAO: 'Ligação telefônica',
  EMAIL: 'E-mail',
  PRESENCIAL: 'Atendimento presencial',
};

export const CONTACT_OUTCOME_LABELS: Record<ContactOutcome, string> = {
  ATENDEU: 'Atendeu / Respondeu',
  SEM_RESPOSTA: 'Sem resposta',
  CAIXA_POSTAL: 'Caixa postal / Não completou',
  RETORNO_AGENDADO: 'Solicitou retorno em outro horário',
  NUMERO_INVALIDO: 'Número inválido / Inexistente',
};
