import { Donor } from '@prisma/client';
import { UserRole } from '../middlewares/auth.js';

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const QUARANTINE_DAYS = 365;

export const ZONE_APPROX_COORDS: Record<string, [number, number]> = {
  Norte: [-22.185, -49.952],
  Sul: [-22.245, -49.945],
  Oeste: [-22.22, -49.97],
  Leste: [-22.226, -49.928],
  Rural: [-22.14, -50.01],
};

export const BLH_COORDS: [number, number] = [-22.21735, -49.94692];

export function normalizeDigits(value: string): string {
  return (value || '').replace(/\D/g, '');
}

export function isValidCPF(cpfRaw: string): boolean {
  const cpf = normalizeDigits(cpfRaw);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(cpf[i]) * (10 - i);
  let rem = (sum * 10) % 11;
  if (rem === 10) rem = 0;
  if (rem !== Number(cpf[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(cpf[i]) * (11 - i);
  rem = (sum * 10) % 11;
  if (rem === 10) rem = 0;
  return rem === Number(cpf[10]);
}

export function isValidCNS(cnsRaw: string): boolean {
  const cns = normalizeDigits(cnsRaw);
  if (cns.length !== 15 || /^(\d)\1{14}$/.test(cns)) return false;
  if (!['1', '2', '7', '8', '9'].includes(cns[0])) return false;

  let sum = 0;
  for (let i = 0; i < 15; i++) sum += Number(cns[i]) * (15 - i);
  return sum % 11 === 0;
}

export function isProcedureWithin12Months(dateStr?: string | null, legacyText?: string | null): boolean {
  const raw = (dateStr || legacyText || '').trim();
  if (!raw || /^(não|nao|nenhuma)$/i.test(raw)) return false;

  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (iso) {
    const d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    const diffDays = Math.floor((Date.now() - d.getTime()) / MS_PER_DAY);
    return diffDays >= 0 && diffDays < QUARANTINE_DAYS;
  }
  return raw.toLowerCase() === 'sim';
}

export interface GoNoGoInput {
  soro1Res: string;
  soro2Res: string;
  soro3Res: string;
  fumo: string;
  alcool: string;
  aguaPotavel: boolean;
  tatuagemData?: string | null;
  tatuagem?: string | null;
  transfusaoData?: string | null;
  transfusao?: string | null;
  intercorrencias?: {
    infeccao?: boolean;
    hipertensao?: boolean;
    diabetes?: boolean;
    hepatite?: boolean;
  };
}

export function evaluateGoNoGo(data: GoNoGoInput): {
  approved: boolean;
  aptidao: 'Apta' | 'Inapta' | 'Pendente';
  reasons: string[];
} {
  const reasons: string[] = [];

  if (data.soro1Res === 'alterada' || data.soro2Res === 'alterada' || data.soro3Res === 'alterada') {
    reasons.push('Sorologia reagente ou alterada (Violação da Regra de Ouro ANVISA)');
  }
  if (data.intercorrencias?.hepatite) {
    reasons.push('Histórico de hepatite pregressa (contraindicação sanitária)');
  }
  if (data.fumo === 'sim_ativo') {
    reasons.push('Tabagismo ativo regular (> 5 cigarros/dia contraindica a doação)');
  }
  if (data.alcool === 'frequente') {
    reasons.push('Consumo frequente de álcool ou substâncias psicoativas');
  }
  if (isProcedureWithin12Months(data.tatuagemData, data.tatuagem)) {
    reasons.push('Tatuagem / piercing recente (< 12 meses de carência sanitária)');
  }
  if (isProcedureWithin12Months(data.transfusaoData, data.transfusao)) {
    reasons.push('Transfusão sanguínea recente (< 12 meses de carência sanitária)');
  }
  if (!data.aguaPotavel) {
    reasons.push('Residência sem abastecimento de água potável tratada encanada');
  }

  const pending =
    data.soro1Res === 'pendente' || data.soro2Res === 'pendente' || data.soro3Res === 'pendente';

  let aptidao: 'Apta' | 'Inapta' | 'Pendente' = 'Apta';
  if (reasons.length > 0) {
    aptidao = 'Inapta';
  } else if (pending) {
    aptidao = 'Pendente';
    reasons.push('Aguardando resultado de exame(s) sorológico(s) pendente(s)');
  }

  return { approved: aptidao === 'Apta', aptidao, reasons };
}

export function extractNeighborhood(endereco: string): string {
  const parts = endereco
    .split(/[—,-]/)
    .map((p) => p.trim())
    .filter(Boolean);

  for (let i = parts.length - 1; i >= 1; i--) {
    const candidate = parts[i];
    if (/^(sp|marília|marilia)$/i.test(candidate)) continue;
    if (/^\d+[a-z]?$/i.test(candidate)) continue;
    return candidate.replace(/^bairro\s+/i, '');
  }
  return 'Marília';
}

export function calculateRawMilkExpiryDate(fromDate: Date): { formatted: string; date: Date } {
  const exp = new Date(fromDate);
  exp.setDate(exp.getDate() + 15);
  return {
    date: exp,
    formatted: exp.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }),
  };
}

export function formatDateTimeBR(date: Date): string {
  const d = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const h = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${d} ${h}`;
}

/**
 * Projeção LGPD: remove dados clínicos e documentos sensíveis (CPF, SUS, sorologias, renda)
 * quando o perfil autenticado é COLETOR_CAMPO.
 */
export function serializeDonorForRole(donor: Donor, role: UserRole) {
  let intercorrencias = {
    infeccao: false,
    hipertensao: false,
    diabetes: false,
    hepatite: false,
  };
  try {
    intercorrencias = JSON.parse(donor.intercorrencias);
  } catch {
    // fallback default
  }

  if (role === 'COLETOR_CAMPO') {
    return {
      id: donor.id,
      code: donor.code,
      nome: donor.nome,
      bebe: donor.bebe,
      sus: 'PROTEGIDO (LGPD)',
      cpf: 'PROTEGIDO (LGPD)',
      nascimento: '',
      parto: donor.parto,
      telefone: donor.telefone,
      endereco: donor.endereco,
      bairro: donor.bairro,
      zona: donor.zona,
      lat: donor.lat,
      lng: donor.lng,
      geocodeStatus: donor.geocodeStatus,
      vacinaFebre: true,
      vacinaDtpa: true,
      transfusao: 'Protegido',
      tatuagem: 'Protegido',
      fumo: 'nao',
      alcool: 'nao',
      medicacao: 'Protegido',
      aguaPotavel: true,
      redeEsgoto: true,
      equipamento: donor.equipamento,
      extracao: donor.extracao,
      produtosJunto: donor.produtosJunto,
      sorologia1: donor.aptidao === 'Apta' ? 'normal' : 'pendente',
      sorologia2: donor.aptidao === 'Apta' ? 'normal' : 'pendente',
      sorologia3: donor.aptidao === 'Apta' ? 'normal' : 'pendente',
      aptidao: donor.aptidao,
      statusCadastro: donor.statusCadastro,
      dataCadastro: donor.dataCadastro,
    };
  }

  return {
    id: donor.id,
    code: donor.code,
    nome: donor.nome,
    bebe: donor.bebe,
    sus: donor.sus,
    cpf: donor.cpf,
    nascimento: donor.nascimento,
    parto: donor.parto,
    telefone: donor.telefone,
    endereco: donor.endereco,
    bairro: donor.bairro,
    zona: donor.zona,
    lat: donor.lat,
    lng: donor.lng,
    vacinaFebre: donor.vacinaFebre,
    vacinaDtpa: donor.vacinaDtpa,
    transfusao: donor.transfusao,
    transfusaoData: donor.transfusaoData ?? undefined,
    tatuagem: donor.tatuagem,
    tatuagemData: donor.tatuagemData ?? undefined,
    fumo: donor.fumo,
    alcool: donor.alcool,
    medicacao: donor.medicacao,
    aguaPotavel: donor.aguaPotavel,
    redeEsgoto: donor.redeEsgoto,
    renda: donor.renda ?? undefined,
    pesoBebe: donor.pesoBebe ?? undefined,
    apgar: donor.apgar ?? undefined,
    malformacao: donor.malformacao,
    intercorrencias,
    equipamento: donor.equipamento,
    extracao: donor.extracao,
    produtosJunto: donor.produtosJunto,
    soro1Data: donor.soro1Data ?? undefined,
    sorologia1: donor.sorologia1,
    soro2Data: donor.soro2Data ?? undefined,
    sorologia2: donor.sorologia2,
    soro3Data: donor.soro3Data ?? undefined,
    sorologia3: donor.sorologia3,
    aptidao: donor.aptidao,
    statusCadastro: donor.statusCadastro,
    motivoInapta: donor.motivoInapta ?? undefined,
    dataCadastro: donor.dataCadastro,
  };
}
