import { apiFetch, ApiError } from './apiClient';
import { isValidPhone, normalizeDigits } from './donorService';
import { Donor, DonorFormData, GoNoGoVerdict, ZoneName } from '../types/donor';
import {
  ContactChannel,
  ContactOutcome,
  DonorInterest,
  DonorInterestPublicPayload,
  DonorInterestPublicResponse,
  DonorInterestStatus,
  DonorInterestSummary,
  DuplicateDonorMatch,
} from '../types/donorInterest';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function formatPhoneInput(raw: string): string {
  const d = normalizeDigits(raw).slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function formatCepInput(raw: string): string {
  const d = normalizeDigits(raw).slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

export function validatePublicInterestForm(
  data: DonorInterestPublicPayload
): Record<string, string> {
  const errors: Record<string, string> = {};

  const fullName = data.fullName.trim();
  if (!fullName) {
    errors.fullName = 'Informe seu nome completo.';
  } else if (fullName.split(/\s+/).filter(Boolean).length < 2) {
    errors.fullName = 'Informe seu nome e sobrenome.';
  }

  if (data.birthDate) {
    const d = new Date(`${data.birthDate}T00:00:00`);
    if (isNaN(d.getTime()) || d > new Date()) {
      errors.birthDate = 'Informe uma data de nascimento válida.';
    }
  }

  if (!data.city.trim()) {
    errors.city = 'Informe sua cidade.';
  }

  if (!data.neighborhood.trim()) {
    errors.neighborhood = 'Informe seu bairro.';
  }

  if (data.cep && normalizeDigits(data.cep).length !== 8) {
    errors.cep = 'Informe um CEP válido com 8 dígitos ou deixe em branco.';
  }

  if (!data.phone.trim() || !isValidPhone(data.phone)) {
    errors.phone = 'Informe um telefone celular válido com DDD (10 ou 11 dígitos).';
  }

  if (!data.isWhatsappSame && data.whatsapp && !isValidPhone(data.whatsapp)) {
    errors.whatsapp = 'Informe um número de WhatsApp válido com DDD.';
  }

  if (data.email && !EMAIL_REGEX.test(data.email.trim())) {
    errors.email = 'Informe um endereço de e-mail válido.';
  }

  if (data.preferredContact === 'EMAIL' && !data.email?.trim()) {
    errors.email = 'Informe seu e-mail para receber contato por este canal.';
  }

  if (data.questionsText && data.questionsText.trim().length > 500) {
    errors.questionsText = 'Sua dúvida pode ter no máximo 500 caracteres.';
  }

  if (!data.consentAccepted) {
    errors.consentAccepted =
      'É necessário autorizar o uso dos dados para contato conforme a LGPD.';
  }

  return errors;
}

export async function submitPublicDonorInterest(
  payload: DonorInterestPublicPayload
): Promise<DonorInterestPublicResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);

  try {
    return await apiFetch<DonorInterestPublicResponse>('/public/donor-interests', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuthRetry: true,
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError(504, {
        title: 'Tempo esgotado',
        detail:
          'O servidor demorou para responder. Aguarde alguns segundos e clique novamente em enviar (seus dados foram preservados).',
      });
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchDonorInterestsSummary(): Promise<DonorInterestSummary> {
  const res = await apiFetch<{ summary: DonorInterestSummary }>('/donor-interests/summary');
  return res.summary;
}

export interface FetchInterestsParams {
  status?: string;
  search?: string;
  city?: string;
  zone?: string;
  unreviewedOnly?: boolean;
  page?: number;
  pageSize?: number;
}

export interface FetchInterestsResponse {
  data: DonorInterest[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    countsByStatus: Record<DonorInterestStatus, number>;
  };
}

export async function fetchDonorInterests(
  params: FetchInterestsParams = {}
): Promise<FetchInterestsResponse> {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  if (params.search) qs.set('search', params.search);
  if (params.city) qs.set('city', params.city);
  if (params.zone) qs.set('zone', params.zone);
  if (params.unreviewedOnly) qs.set('unreviewedOnly', 'true');
  if (params.page) qs.set('page', String(params.page));
  if (params.pageSize) qs.set('pageSize', String(params.pageSize));

  const query = qs.toString();
  return apiFetch<FetchInterestsResponse>(`/donor-interests${query ? `?${query}` : ''}`);
}

export async function fetchDonorInterestDetail(id: string): Promise<{
  interest: DonorInterest;
  possibleDuplicates: DuplicateDonorMatch[];
}> {
  return apiFetch<{ interest: DonorInterest; possibleDuplicates: DuplicateDonorMatch[] }>(
    `/donor-interests/${id}`
  );
}

export async function checkInterestDuplicates(id: string): Promise<DuplicateDonorMatch[]> {
  const res = await apiFetch<{ matches: DuplicateDonorMatch[] }>(
    `/donor-interests/${id}/duplicate-check`
  );
  return res.matches;
}

export async function updateInterestStatus(
  id: string,
  payload: {
    status: Exclude<DonorInterestStatus, 'ENCAMINHADA_CADASTRO'>;
    closureReason?: string;
    notes?: string;
    nextFollowUpAt?: string | null;
  }
): Promise<DonorInterest> {
  const res = await apiFetch<{ interest: DonorInterest }>(`/donor-interests/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return res.interest;
}

export async function updateInterestNotes(
  id: string,
  payload: {
    adminNotes?: string | null;
    suggestedZone?: ZoneName | null;
    nextFollowUpAt?: string | null;
  }
): Promise<DonorInterest> {
  const res = await apiFetch<{ interest: DonorInterest }>(`/donor-interests/${id}/notes`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return res.interest;
}

export async function logInterestContact(
  id: string,
  payload: {
    channel: ContactChannel;
    outcome: ContactOutcome;
    notes?: string;
    nextFollowUpAt?: string | null;
    nextStatus?: Exclude<DonorInterestStatus, 'ENCAMINHADA_CADASTRO'>;
  }
): Promise<DonorInterest> {
  const res = await apiFetch<{ interest: DonorInterest }>(`/donor-interests/${id}/contacts`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.interest;
}

export async function convertInterestToDonor(
  id: string,
  donorFormData: DonorFormData
): Promise<{ donor: Donor; verdict: GoNoGoVerdict; interest: DonorInterest }> {
  return apiFetch<{ donor: Donor; verdict: GoNoGoVerdict; interest: DonorInterest }>(
    `/donor-interests/${id}/convert`,
    {
      method: 'POST',
      body: JSON.stringify(donorFormData),
    }
  );
}

export async function anonymizeInterest(id: string): Promise<DonorInterest> {
  const res = await apiFetch<{ interest: DonorInterest }>(`/donor-interests/${id}/anonymize`, {
    method: 'POST',
  });
  return res.interest;
}

export function buildInterestWhatsAppUrl(interest: Pick<DonorInterest, 'fullName' | 'phone' | 'whatsapp' | 'protocol'>): string {
  const raw = interest.whatsapp || interest.phone;
  const digits = normalizeDigits(raw);
  const fullNumber = digits.startsWith('55') ? digits : `55${digits}`;
  const firstName = interest.fullName.split(' ')[0] || 'mãe';
  const msg = encodeURIComponent(
    `Olá, ${firstName}! Tudo bem? Somos da equipe do Banco de Leite Humano de Marília (HCFAMEMA). Recebemos seu interesse em doar leite materno (protocolo ${interest.protocol}) e gostaríamos de conversar com você para explicar os próximos passos com todo carinho.`
  );
  return `https://wa.me/${fullNumber}?text=${msg}`;
}
