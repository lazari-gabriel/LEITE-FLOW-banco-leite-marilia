import { Donor, DonorFormData, GoNoGoVerdict, MilkClass, ZoneName, AptidaoStatus, StatusCadastro } from '../types/donor';
import { ZONAS_SEMANA } from '../constants/zones';
import { BLH_MARILIA } from '../constants/blh';

/**
 * Calcula a classificação biológica do leite com base nos dias pós-parto:
 * - Até 7 dias: Colostro (C)
 * - 8 a 14 dias: Transição (T)
 * - 15 dias em diante: Maduro (M)
 */
export function calculateMilkClass(partoDateStr: string): MilkClass {
  if (!partoDateStr) return 'M';
  const dataParto = new Date(partoDateStr);
  if (isNaN(dataParto.getTime())) return 'M';
  const diffTime = Math.abs(new Date().getTime() - dataParto.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

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
 * Motor de Triagem Go / No-Go baseado na Regra de Ouro da ANVISA e BLH Marília
 * Retorna aptidao: 'Apta' | 'Inapta' | 'Pendente'
 * Pendente = sorologia ainda não preenchida (todas 'normal' mas pendentes?)
 */
export function evaluateGoNoGo(data: DonorFormData): GoNoGoVerdict {
  const reasons: string[] = [];

  // Regra de Ouro 1: Sorologia (qualquer uma das 3 amostras alterada)
  if (data.soro1Res === 'alterada' || data.soro2Res === 'alterada' || data.soro3Res === 'alterada') {
    reasons.push("Sorologia reagente ou alterada (Violação da Regra de Ouro ANVISA)");
  }

  // Regra 2: Tabagismo ativo regular
  if (data.fumo === 'sim_ativo') {
    reasons.push("Tabagismo ativo regular (> 5 cigarros/dia contraindica a doação)");
  }

  // Regra 3: Álcool ou substâncias frequentes
  if (data.alcool === 'frequente') {
    reasons.push("Consumo frequente de álcool ou substâncias psicoativas");
  }

  // Regra 4: Tatuagem / piercing < 12 meses
  const tat = data.tatuagem.toLowerCase();
  const currentYear = new Date().getFullYear().toString();
  if (tat.includes(currentYear) || tat.includes("mes") || tat.includes("meses") || tat === "sim") {
    reasons.push("Tatuagem / piercing recente (< 12 meses de carência sanitária)");
  }

  // Regra 5: Saneamento básico (água tratada potável encanada)
  if (!data.aguaPotavel) {
    reasons.push("Residência sem abastecimento de água potável tratada encanada");
  }

  // Check if sorologia is pending (not filled yet)
  const sorologiaPending = (data.soro1Res as string) === 'pendente' ||
                           (data.soro2Res as string) === 'pendente' ||
                           (data.soro3Res as string) === 'pendente';

  let aptidao: AptidaoStatus = 'Apta';
  if (reasons.length > 0) {
    aptidao = 'Inapta';
  } else if (sorologiaPending) {
    aptidao = 'Pendente';
  }

  return {
    approved: aptidao === 'Apta',
    aptidao,
    reasons
  };
}

/**
 * Cria a entidade Donor a partir do formulário de cadastro com geolocalização da zona em Marília
 */
export function createDonorFromForm(data: DonorFormData, nextId: number): Donor {
  const verdict = evaluateGoNoGo(data);

  // Calcula coordenadas aproximadas de acordo com a zona em Marília
  const zoneConfig = ZONAS_SEMANA.find(z => z.zona === data.zona);
  const baseCoords = zoneConfig?.approxCoords || BLH_MARILIA.coords;
  const lat = baseCoords[0] + (Math.random() - 0.5) * 0.015;
  const lng = baseCoords[1] + (Math.random() - 0.5) * 0.015;

  return {
    id: nextId,
    nome: data.nome.trim(),
    bebe: data.bebe.trim(),
    sus: data.sus.trim(),
    cpf: data.cpf.trim() || "Não informado",
    nascimento: data.nascimento,
    parto: data.parto,
    telefone: data.telefone.trim(),
    endereco: data.endereco.trim(),
    bairro: "Marília",
    zona: data.zona,
    lat,
    lng,
    vacinaFebre: data.vacinaFebre,
    vacinaDtpa: data.vacinaDtpa,
    transfusao: data.transfusao || "Não",
    tatuagem: data.tatuagem || "Não",
    fumo: data.fumo,
    alcool: data.alcool,
    medicacao: data.medicacao.trim() || "Nenhuma",
    aguaPotavel: data.aguaPotavel,
    redeEsgoto: data.redeEsgoto,
    equipamento: data.equipamento,
    extracao: data.extracao,
    produtosJunto: data.produtosJunto,
    sorologia1: data.soro1Res,
    sorologia2: data.soro2Res,
    sorologia3: data.soro3Res,
    aptidao: verdict.aptidao,
    statusCadastro: data.statusCadastro || 'ativa',
    motivoInapta: verdict.approved ? undefined : verdict.reasons.join(" · "),
    dataCadastro: new Date().toISOString().split("T")[0]
  };
}

/**
 * Verifica se houve alteração na sorologia comparando dados antigos e novos
 */
export function hasSorologiaChanged(oldDonor: Donor, newData: DonorFormData): boolean {
  return oldDonor.sorologia1 !== newData.soro1Res ||
         oldDonor.sorologia2 !== newData.soro2Res ||
         oldDonor.sorologia3 !== newData.soro3Res;
}

/**
 * Atualiza doadora existente com novos dados
 * Regra: qualquer alteração na sorologia → aptidao = 'Inapta' e statusCadastro = 'inativa'
 */
export function updateDonorFromForm(oldDonor: Donor, data: DonorFormData): Donor {
  const sorologiaChanged = hasSorologiaChanged(oldDonor, data);
  const verdict = evaluateGoNoGo(data);

  let aptidao: AptidaoStatus = verdict.aptidao;
  let statusCadastro: StatusCadastro = data.statusCadastro || oldDonor.statusCadastro;
  let motivoInapta = verdict.approved ? undefined : verdict.reasons.join(" · ");

  // Regra de ouro: qualquer alteração na sorologia → inapta + inativa
  if (sorologiaChanged) {
    aptidao = 'Inapta';
    statusCadastro = 'inativa';
    motivoInapta = 'Sorologia alterada (Regra de Ouro: mudança invalida a doadora automaticamente)';
  }

  // Calcula coordenadas aproximadas de acordo com a zona em Marília
  const zoneConfig = ZONAS_SEMANA.find(z => z.zona === data.zona);
  const baseCoords = zoneConfig?.approxCoords || BLH_MARILIA.coords;
  const lat = baseCoords[0] + (Math.random() - 0.5) * 0.015;
  const lng = baseCoords[1] + (Math.random() - 0.5) * 0.015;

  return {
    ...oldDonor,
    nome: data.nome.trim(),
    bebe: data.bebe.trim(),
    sus: data.sus.trim(),
    cpf: data.cpf.trim() || "Não informado",
    nascimento: data.nascimento,
    parto: data.parto,
    telefone: data.telefone.trim(),
    endereco: data.endereco.trim(),
    bairro: "Marília",
    zona: data.zona,
    lat,
    lng,
    vacinaFebre: data.vacinaFebre,
    vacinaDtpa: data.vacinaDtpa,
    transfusao: data.transfusao || "Não",
    tatuagem: data.tatuagem || "Não",
    fumo: data.fumo,
    alcool: data.alcool,
    medicacao: data.medicacao.trim() || "Nenhuma",
    aguaPotavel: data.aguaPotavel,
    redeEsgoto: data.redeEsgoto,
    equipamento: data.equipamento,
    extracao: data.extracao,
    produtosJunto: data.produtosJunto,
    sorologia1: data.soro1Res,
    sorologia2: data.soro2Res,
    sorologia3: data.soro3Res,
    aptidao,
    statusCadastro,
    motivoInapta,
    // dataCadastro permanece a original
  };
}
