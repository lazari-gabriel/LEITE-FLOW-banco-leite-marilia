import { Donor, DonorFormData, GoNoGoVerdict, MilkClass, AptidaoStatus, StatusCadastro } from '../types/donor';
import { ZONAS_SEMANA } from '../constants/zones';
import { BLH_MARILIA } from '../constants/blh';

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const QUARANTINE_DAYS = 365;

export function normalizeDigits(value: string): string {
  return (value || '').replace(/\D/g, '');
}

/**
 * Valida dígitos verificadores de CPF (11 dígitos).
 */
export function isValidCPF(cpfRaw: string): boolean {
  const cpf = normalizeDigits(cpfRaw);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += Number(cpf[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== Number(cpf[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += Number(cpf[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  return remainder === Number(cpf[10]);
}

/**
 * Valida Cartão Nacional de Saúde (CNS / SUS): exatamente 15 dígitos numéricos
 * e regra oficial do Ministério da Saúde (prefixo 1/2 ou 7/8/9 com soma ponderada mod 11 = 0).
 */
export function isValidCNS(cnsRaw: string): boolean {
  const cns = normalizeDigits(cnsRaw);
  if (cns.length !== 15) return false;
  if (/^(\d)\1{14}$/.test(cns)) return false;

  const first = cns[0];
  if (!['1', '2', '7', '8', '9'].includes(first)) return false;

  let sum = 0;
  for (let i = 0; i < 15; i++) {
    sum += Number(cns[i]) * (15 - i);
  }
  return sum % 11 === 0;
}

/**
 * Valida telefone brasileiro com DDD (10 ou 11 dígitos).
 */
export function isValidPhone(phoneRaw: string): boolean {
  const digits = normalizeDigits(phoneRaw);
  return digits.length === 10 || digits.length === 11;
}

/**
 * Valida coerência de datas do cadastro (impede parto futuro e nascimento posterior ao parto).
 */
export function validateDonorDates(
  nascimento: string,
  parto: string,
  referenceDate: Date = new Date()
): string | null {
  const todayEnd = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
    23,
    59,
    59
  );

  if (!parto) return 'Informe a data do parto para classificação biológica do leite.';
  const dParto = new Date(`${parto}T00:00:00`);
  if (isNaN(dParto.getTime())) return 'Data do parto inválida.';
  if (dParto > todayEnd) return 'A data do parto não pode estar no futuro.';

  if (nascimento) {
    const dNasc = new Date(`${nascimento}T00:00:00`);
    if (isNaN(dNasc.getTime())) return 'Data de nascimento da doadora inválida.';
    if (dNasc > todayEnd) return 'A data de nascimento da doadora não pode estar no futuro.';
    if (dNasc >= dParto) return 'A data de nascimento da doadora deve ser anterior à data do parto.';
  }

  return null;
}

/**
 * Detecta duplicidade de cadastro por CPF ou Cartão SUS (ignorando a própria doadora na edição).
 */
export function findDuplicateDonor(
  donors: Donor[],
  susRaw: string,
  cpfRaw: string,
  excludeDonorId?: number | null
): { donor: Donor; field: 'sus' | 'cpf' } | null {
  const sus = normalizeDigits(susRaw);
  const cpf = normalizeDigits(cpfRaw);

  for (const d of donors) {
    if (excludeDonorId && d.id === excludeDonorId) continue;

    if (sus.length === 15 && normalizeDigits(d.sus) === sus) {
      return { donor: d, field: 'sus' };
    }
    if (cpf.length === 11 && normalizeDigits(d.cpf) === cpf) {
      return { donor: d, field: 'cpf' };
    }
  }

  return null;
}

/**
 * Consolida o status das 3 amostras sorológicas segundo o critério mais restritivo:
 * alterada > pendente > normal.
 */
export function getConsolidatedSerologyStatus(
  donor: Pick<Donor, 'sorologia1' | 'sorologia2' | 'sorologia3'>
): 'normal' | 'pendente' | 'alterada' {
  const results = [donor.sorologia1, donor.sorologia2, donor.sorologia3];
  if (results.includes('alterada')) return 'alterada';
  if (results.includes('pendente')) return 'pendente';
  return 'normal';
}

/**
 * Avalia se um procedimento (tatuagem/piercing ou transfusão) ocorreu há menos de 12 meses (365 dias).
 * Prioriza data estruturada (YYYY-MM-DD); suporta fallback MM/YYYY ou DD/MM/YYYY quando legado.
 */
export function isProcedureWithin12Months(
  dateStr?: string,
  legacyText?: string,
  referenceDate: Date = new Date()
): boolean {
  const parsedDate = parseProcedureDate(dateStr) || parseProcedureDate(legacyText);
  if (parsedDate) {
    const diffDays = Math.floor((referenceDate.getTime() - parsedDate.getTime()) / MS_PER_DAY);
    return diffDays >= 0 && diffDays < QUARANTINE_DAYS;
  }

  // Fallback conservador apenas se o texto afirmar explicitamente "sim" sem data
  const normalized = (legacyText || '').trim().toLowerCase();
  if (!normalized || normalized === 'não' || normalized === 'nao' || normalized === 'nenhuma') {
    return false;
  }
  return normalized === 'sim';
}

function parseProcedureDate(raw?: string): Date | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // YYYY-MM-DD
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (isoMatch) {
    const d = new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
    return isNaN(d.getTime()) ? null : d;
  }

  // DD/MM/YYYY
  const brFullMatch = /(\d{2})\/(\d{2})\/(\d{4})/.exec(trimmed);
  if (brFullMatch) {
    const d = new Date(Number(brFullMatch[3]), Number(brFullMatch[2]) - 1, Number(brFullMatch[1]));
    return isNaN(d.getTime()) ? null : d;
  }

  // MM/YYYY (assume dia 1 do mês)
  const brMonthMatch = /(\d{2})\/(\d{4})/.exec(trimmed);
  if (brMonthMatch) {
    const month = Number(brMonthMatch[1]);
    const year = Number(brMonthMatch[2]);
    if (month >= 1 && month <= 12) {
      const d = new Date(year, month - 1, 1);
      return isNaN(d.getTime()) ? null : d;
    }
  }

  return null;
}

/**
 * Calcula a classificação biológica do leite com base nos dias pós-parto:
 * - Até 7 dias: Colostro (C)
 * - 8 a 14 dias: Transição (T)
 * - 15 dias em diante: Maduro (M)
 */
export function calculateMilkClass(partoDateStr: string, referenceDate: Date = new Date()): MilkClass {
  if (!partoDateStr) return 'M';
  const dataParto = new Date(`${partoDateStr}T00:00:00`);
  if (isNaN(dataParto.getTime())) return 'M';
  const diffTime = Math.max(0, referenceDate.getTime() - dataParto.getTime());
  const diffDays = Math.floor(diffTime / MS_PER_DAY);

  if (diffDays <= 7) return 'C';
  if (diffDays <= 14) return 'T';
  return 'M';
}

export function getMilkClassDescription(classe: MilkClass): { name: string; phase: string } {
  switch (classe) {
    case 'C':
      return { name: 'Colostro (C)', phase: '1º ao 7º dia' };
    case 'T':
      return { name: 'Transição (T)', phase: '8º ao 14º dia' };
    case 'M':
    default:
      return { name: 'Maduro (M)', phase: '15º dia em diante' };
  }
}

/**
 * Motor de Triagem Go / No-Go baseado na RDC ANVISA nº 171/2006 e protocolo BLH Marília.
 * Retorna aptidao: 'Apta' | 'Inapta' | 'Pendente'.
 */
export function evaluateGoNoGo(data: DonorFormData, referenceDate: Date = new Date()): GoNoGoVerdict {
  const reasons: string[] = [];

  // Regra de Ouro 1: Sorologia (qualquer uma das 3 amostras alterada)
  if (data.soro1Res === 'alterada' || data.soro2Res === 'alterada' || data.soro3Res === 'alterada') {
    reasons.push('Sorologia reagente ou alterada (Violação da Regra de Ouro ANVISA)');
  }

  // Regra 2: Hepatite pregressa (intercorrência clínica impeditiva)
  if (data.intercorrencias?.hepatite) {
    reasons.push('Histórico de hepatite pregressa (contraindicação sanitária)');
  }

  // Regra 3: Tabagismo ativo regular
  if (data.fumo === 'sim_ativo') {
    reasons.push('Tabagismo ativo regular (> 5 cigarros/dia contraindica a doação)');
  }

  // Regra 4: Álcool ou substâncias frequentes
  if (data.alcool === 'frequente') {
    reasons.push('Consumo frequente de álcool ou substâncias psicoativas');
  }

  // Regra 5: Tatuagem / piercing < 12 meses (365 dias)
  if (isProcedureWithin12Months(data.tatuagemData, data.tatuagem, referenceDate)) {
    reasons.push('Tatuagem / piercing recente (< 12 meses de carência sanitária)');
  }

  // Regra 6: Transfusão de sangue < 12 meses (365 dias)
  if (isProcedureWithin12Months(data.transfusaoData, data.transfusao, referenceDate)) {
    reasons.push('Transfusão sanguínea recente (< 12 meses de carência sanitária)');
  }

  // Regra 7: Saneamento básico (água tratada potável encanada)
  if (!data.aguaPotavel) {
    reasons.push('Residência sem abastecimento de água potável tratada encanada');
  }

  const sorologiaPending =
    data.soro1Res === 'pendente' ||
    data.soro2Res === 'pendente' ||
    data.soro3Res === 'pendente';

  let aptidao: AptidaoStatus = 'Apta';
  if (reasons.length > 0) {
    aptidao = 'Inapta';
  } else if (sorologiaPending) {
    aptidao = 'Pendente';
    reasons.push('Aguardando resultado de exame(s) sorológico(s) pendente(s)');
  }

  return {
    approved: aptidao === 'Apta',
    aptidao,
    reasons,
  };
}

function getZoneApproxCoords(zona: DonorFormData['zona']): [number, number] {
  const zoneConfig = ZONAS_SEMANA.find((z) => z.zona === zona);
  const baseCoords = zoneConfig?.approxCoords || BLH_MARILIA.coords;
  return [
    baseCoords[0] + (Math.random() - 0.5) * 0.015,
    baseCoords[1] + (Math.random() - 0.5) * 0.015,
  ];
}

function extractNeighborhood(endereco: string): string {
  const parts = endereco
    .split(/[—,-]/)
    .map((p) => p.trim())
    .filter(Boolean);

  // Percorre de trás para frente ignorando UF ("SP"), cidade ("Marília") e números puros
  for (let i = parts.length - 1; i >= 1; i--) {
    const candidate = parts[i];
    if (/^(sp|marília|marilia)$/i.test(candidate)) continue;
    if (/^\d+[a-z]?$/i.test(candidate)) continue;
    return candidate.replace(/^bairro\s+/i, '');
  }
  return 'Marília';
}

/**
 * Cria a entidade Donor preservando 100% dos dados clínicos, socioeconômicos e datas de sorologia.
 */
export function createDonorFromForm(data: DonorFormData, nextId: number): Donor {
  const verdict = evaluateGoNoGo(data);
  const [lat, lng] = getZoneApproxCoords(data.zona);

  return {
    id: nextId,
    nome: data.nome.trim(),
    bebe: data.bebe.trim(),
    sus: data.sus.trim(),
    cpf: data.cpf.trim() || 'Não informado',
    nascimento: data.nascimento,
    parto: data.parto,
    telefone: data.telefone.trim(),
    endereco: data.endereco.trim(),
    bairro: extractNeighborhood(data.endereco),
    zona: data.zona,
    lat,
    lng,
    vacinaFebre: data.vacinaFebre,
    vacinaDtpa: data.vacinaDtpa,
    transfusao: data.transfusaoData ? data.transfusaoData : data.transfusao || 'Não',
    transfusaoData: data.transfusaoData || undefined,
    tatuagem: data.tatuagemData ? data.tatuagemData : data.tatuagem || 'Não',
    tatuagemData: data.tatuagemData || undefined,
    fumo: data.fumo,
    alcool: data.alcool,
    medicacao: data.medicacao.trim() || 'Nenhuma',
    aguaPotavel: data.aguaPotavel,
    redeEsgoto: data.redeEsgoto,
    renda: data.renda,
    pesoBebe: data.pesoBebe,
    apgar: data.apgar,
    malformacao: data.malformacao,
    intercorrencias: { ...data.intercorrencias },
    equipamento: data.equipamento,
    extracao: data.extracao,
    produtosJunto: data.produtosJunto,
    soro1Data: data.soro1Data,
    sorologia1: data.soro1Res,
    soro2Data: data.soro2Data,
    sorologia2: data.soro2Res,
    soro3Data: data.soro3Data,
    sorologia3: data.soro3Res,
    aptidao: verdict.aptidao,
    statusCadastro: verdict.aptidao === 'Inapta' ? 'inativa' : data.statusCadastro || 'ativa',
    motivoInapta: verdict.approved ? undefined : verdict.reasons.join(' · '),
    dataCadastro: new Date().toISOString().split('T')[0],
  };
}

/**
 * Verifica se alguma amostra sorológica passou para o estado 'alterada'.
 */
export function hasSerologyBecameAltered(oldDonor: Donor, newData: DonorFormData): boolean {
  return (
    (newData.soro1Res === 'alterada' && oldDonor.sorologia1 !== 'alterada') ||
    (newData.soro2Res === 'alterada' && oldDonor.sorologia2 !== 'alterada') ||
    (newData.soro3Res === 'alterada' && oldDonor.sorologia3 !== 'alterada')
  );
}

/**
 * Atualiza doadora existente preservando histórico, coordenadas (quando zona/endereço não muda)
 * e reavaliando corretamente a triagem Go/No-Go (atualizar 'pendente' -> 'normal' aprova a doadora).
 */
export function updateDonorFromForm(
  oldDonor: Donor,
  data: DonorFormData,
  referenceDate: Date = new Date()
): { donor: Donor; verdict: GoNoGoVerdict } {
  const verdict = evaluateGoNoGo(data, referenceDate);

  let statusCadastro: StatusCadastro = data.statusCadastro || oldDonor.statusCadastro;
  // Se passou a ser Inapta (ex.: sorologia alterada), inativa automaticamente da rota
  if (verdict.aptidao === 'Inapta') {
    statusCadastro = 'inativa';
  }

  // Preserva coordenadas existentes quando endereço e zona permanecem iguais
  const addressChanged =
    oldDonor.zona !== data.zona || oldDonor.endereco.trim() !== data.endereco.trim();
  const [lat, lng] = addressChanged
    ? getZoneApproxCoords(data.zona)
    : [oldDonor.lat, oldDonor.lng];

  const donor: Donor = {
    ...oldDonor,
    nome: data.nome.trim(),
    bebe: data.bebe.trim(),
    sus: data.sus.trim(),
    cpf: data.cpf.trim() || 'Não informado',
    nascimento: data.nascimento,
    parto: data.parto,
    telefone: data.telefone.trim(),
    endereco: data.endereco.trim(),
    bairro: extractNeighborhood(data.endereco),
    zona: data.zona,
    lat,
    lng,
    vacinaFebre: data.vacinaFebre,
    vacinaDtpa: data.vacinaDtpa,
    transfusao: data.transfusaoData ? data.transfusaoData : data.transfusao || 'Não',
    transfusaoData: data.transfusaoData || undefined,
    tatuagem: data.tatuagemData ? data.tatuagemData : data.tatuagem || 'Não',
    tatuagemData: data.tatuagemData || undefined,
    fumo: data.fumo,
    alcool: data.alcool,
    medicacao: data.medicacao.trim() || 'Nenhuma',
    aguaPotavel: data.aguaPotavel,
    redeEsgoto: data.redeEsgoto,
    renda: data.renda,
    pesoBebe: data.pesoBebe,
    apgar: data.apgar,
    malformacao: data.malformacao,
    intercorrencias: { ...data.intercorrencias },
    equipamento: data.equipamento,
    extracao: data.extracao,
    produtosJunto: data.produtosJunto,
    soro1Data: data.soro1Data,
    sorologia1: data.soro1Res,
    soro2Data: data.soro2Data,
    sorologia2: data.soro2Res,
    soro3Data: data.soro3Data,
    sorologia3: data.soro3Res,
    aptidao: verdict.aptidao,
    statusCadastro,
    motivoInapta: verdict.approved ? undefined : verdict.reasons.join(' · '),
  };

  return { donor, verdict };
}
